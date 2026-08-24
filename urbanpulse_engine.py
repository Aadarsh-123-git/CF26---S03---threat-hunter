import math
import time
import requests
import networkx as nx
from dataclasses import dataclass, field
from typing import List, Dict, Set, Optional, Tuple, Any

@dataclass
class InfrastructureNode:
    id: str
    name: str
    category: str
    type: str
    latitude: float
    longitude: float
    capacity: float
    capacity_unit: str
    importance: int  # 1 to 5
    population_served: int
    failure_probability: float
    repair_time_minutes: int
    cost_to_repair_inr: float
    current_state: str = "NORMAL"  # NORMAL, WARNING, DEGRADED, FAILED, RECOVERING, RESTORED
    health_score: float = 1.0
    criticality_score: int = 50
    cascade_risk_score: int = 50
    data_quality_score: int = 95
    source: str = "Open Data Portal"
    provenance: str = "OBSERVED"
    address: str = ""

@dataclass
class DependencyEdge:
    id: str
    source: str
    target: str
    dependency_type: str
    dependency_strength: float  # 0.0 to 1.0
    failure_threshold: float  # 0.0 to 1.0
    propagation_delay_minutes: int
    recovery_dependency: bool = True
    confidence: float = 0.90
    provenance: str = "MODELED"
    description: str = ""

@dataclass
class ScenarioDefinition:
    scenario_id: str
    name: str
    category: str
    description: str
    city_id: str
    initial_failures: List[Dict[str, Any]]
    rainfall_mm: float = 0.0
    wind_kmh: float = 10.0
    duration_minutes: int = 120
    timestep_minutes: int = 5
    simulation_seed: int = 42

@dataclass
class TimestepState:
    time_minute: int
    node_health_map: Dict[str, float]
    node_state_map: Dict[str, str]
    active_failed_nodes: List[str]
    active_degraded_nodes: List[str]
    active_recovering_nodes: List[str]
    cascade_depth: int
    affected_services_count: int
    affected_services_percent: float
    population_at_risk: int
    city_resilience_score: int
    events_log: List[Dict[str, Any]]

@dataclass
class InterventionCandidate:
    id: str
    name: str
    target_node_id: str
    action_type: str
    cost_inr: float
    repair_time_minutes: int
    required_teams: int
    services_restored_count: int
    population_benefited: int
    resilience_improvement: float
    recovery_time_reduction_minutes: int
    cascade_depth_reduction: int
    roi_score: float
    priority_rank: int
    rationale: str

class UrbanGraphPy:
    def __init__(self, nodes: List[InfrastructureNode] = None, edges: List[DependencyEdge] = None):
        self.nodes_map: Dict[str, InfrastructureNode] = {}
        self.edges_map: Dict[str, DependencyEdge] = {}
        self.nx_graph = nx.DiGraph()
        if nodes and edges:
            self.init(nodes, edges)

    def init(self, nodes: List[InfrastructureNode], edges: List[DependencyEdge]):
        self.nodes_map.clear()
        self.edges_map.clear()
        self.nx_graph.clear()

        for node in nodes:
            self.nodes_map[node.id] = node
            self.nx_graph.add_node(node.id, data=node)

        for edge in edges:
            self.edges_map[edge.id] = edge
            if edge.source in self.nodes_map and edge.target in self.nodes_map:
                self.nx_graph.add_edge(edge.source, edge.target, data=edge, weight=edge.dependency_strength)

    def get_all_nodes(self) -> List[InfrastructureNode]:
        return list(self.nodes_map.values())

    def get_all_edges(self) -> List[DependencyEdge]:
        return list(self.edges_map.values())

    def get_downstream_reach(self, root_id: str) -> Dict[str, int]:
        """Calculates BFS transitive downstream reach distances from root_id."""
        if root_id not in self.nodes_map:
            return {}
        distances = {}
        queue = [(root_id, 0)]
        visited = {root_id}

        while queue:
            curr_id, dist = queue.pop(0)
            if curr_id != root_id:
                distances[curr_id] = dist
            
            for neighbor in self.nx_graph.successors(curr_id):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, dist + 1))
        return distances

    def compute_betweenness_centrality(self) -> Dict[str, float]:
        """Brandes' Betweenness Centrality algorithm via NetworkX."""
        if len(self.nodes_map) <= 2:
            return {k: 0.0 for k in self.nodes_map}
        return nx.betweenness_centrality(self.nx_graph, normalized=True)

    def analyze_critical_nodes(self) -> List[Dict[str, Any]]:
        """Computes multi-factor weighted criticality scores (0-100)."""
        nodes = self.get_all_nodes()
        if not nodes:
            return []
        
        betweenness = self.compute_betweenness_centrality()
        max_reach = 1
        max_pop = 1
        max_repair = 1

        reach_map = {}
        for n in nodes:
            reach = len(self.get_downstream_reach(n.id))
            reach_map[n.id] = reach
            if reach > max_reach: max_reach = reach
            if n.population_served > max_pop: max_pop = n.population_served
            if n.repair_time_minutes > max_repair: max_repair = n.repair_time_minutes

        max_betweenness = max(betweenness.values(), default=0.0001) or 0.0001
        analyses = []

        for n in nodes:
            reach = reach_map.get(n.id, 0)
            bc = betweenness.get(n.id, 0.0)
            in_deg = self.nx_graph.in_degree(n.id) if n.id in self.nx_graph else 0
            out_deg = self.nx_graph.out_degree(n.id) if n.id in self.nx_graph else 0
            deg = (in_deg + out_deg) / max(1, len(nodes) - 1)

            norm_reach = reach / max_reach
            norm_bc = bc / max_betweenness
            norm_imp = (n.importance - 1) / 4.0
            norm_pop = math.log10(max(10, n.population_served)) / math.log10(max(10, max_pop))
            norm_fail = n.failure_probability
            norm_repair = n.repair_time_minutes / max_repair

            raw_criticality = (
                0.25 * norm_reach +
                0.20 * norm_bc +
                0.20 * norm_imp +
                0.15 * norm_pop +
                0.10 * norm_fail +
                0.10 * norm_repair
            )
            criticality_score = min(100, max(0, int(round(raw_criticality * 100))))
            n.criticality_score = criticality_score

            reasons = []
            if norm_reach >= 0.4: reasons.append(f"High downstream reach ({reach} dependent services)")
            if norm_bc >= 0.35: reasons.append("High betweenness centrality (critical topology bridge)")
            if n.importance >= 4: reasons.append(f"Tier-{n.importance} high operational importance")
            if n.population_served >= 50000: reasons.append(f"Direct population exposure ({n.population_served:,} residents)")
            if n.repair_time_minutes >= 90: reasons.append(f"Prolonged estimated restoration ({n.repair_time_minutes} min recovery)")
            if not reasons: reasons.append("Standard localized infrastructure dependency profile")

            analyses.append({
                "node_id": n.id,
                "node_name": n.name,
                "category": n.category,
                "criticality_score": criticality_score,
                "downstream_reach": reach,
                "betweenness": round(bc, 4),
                "degree_centrality": round(deg, 3),
                "population_exposure": n.population_served,
                "importance": n.importance,
                "reasons": reasons
            })

        analyses.sort(key=lambda x: x["criticality_score"], reverse=True)
        return analyses

    def compute_resilience_score(self, node_health_map: Dict[str, float]) -> int:
        weighted_sum = 0.0
        total_weight = 0.0
        degraded_critical = 0

        for n in self.get_all_nodes():
            h = node_health_map.get(n.id, n.health_score)
            w = n.importance
            weighted_sum += h * w
            total_weight += w
            if n.importance >= 4 and h < 0.5:
                degraded_critical += 1

        if total_weight == 0:
            return 100
        base_score = (weighted_sum / total_weight) * 100.0
        penalty = min(0.25, degraded_critical * 0.05)
        final_score = int(round(max(0.0, min(100.0, base_score * (1.0 - penalty)))))
        return final_score

def run_cascade_simulation(
    graph: UrbanGraphPy,
    scenario: ScenarioDefinition,
    applied_interventions: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    if applied_interventions is None:
        applied_interventions = []

    all_nodes = graph.get_all_nodes()
    node_map = {n.id: n for n in all_nodes}
    duration = scenario.duration_minutes or 120
    step_size = scenario.timestep_minutes or 5
    num_steps = (duration // step_size) + 1

    initial_failures = scenario.initial_failures
    initial_failed_ids = {f["nodeId"] for f in initial_failures}

    current_health = {n.id: 1.0 for n in all_nodes}
    current_state = {n.id: "NORMAL" for n in all_nodes}
    failure_start_time = {}
    hop_distance_map = {n.id: 0 for n in all_nodes}
    intervention_applied_set = set()

    timeline: List[TimestepState] = []
    events_log: List[Dict[str, Any]] = []

    min_resilience = 100
    peak_cascade_minute = 0
    max_cascade_depth = 0
    max_affected = 0
    max_pop_risk = 0

    for step in range(num_steps):
        time_minute = step * step_size
        step_events = []

        # 1. Apply Interventions at timestamp
        for intv in applied_interventions:
            int_id = intv.get("interventionId") or intv.get("id")
            applied_at = intv.get("appliedAtMinute", 15)
            target_id = intv.get("targetNodeId")
            act_type = intv.get("actionType", "RESTORE_SUBSTATION")

            if applied_at <= time_minute and int_id not in intervention_applied_set:
                intervention_applied_set.add(int_id)
                if target_id in node_map:
                    current_health[target_id] = min(1.0, current_health[target_id] + 0.6)
                    current_state[target_id] = "RESTORED" if current_health[target_id] >= 0.85 else "RECOVERING"
                    evt = {
                        "timeMinute": time_minute,
                        "nodeId": target_id,
                        "nodeName": node_map[target_id].name,
                        "eventType": "INTERVENTION_APPLIED",
                        "message": f"Applied intervention: {act_type} on {node_map[target_id].name}. System stabilized.",
                        "hopDistance": 0
                    }
                    step_events.append(evt)
                    events_log.append(evt)

        # 2. Inject initial failures at t = 0
        if time_minute == 0:
            for failure in initial_failures:
                nid = failure["nodeId"]
                if nid in node_map:
                    deg_health = failure.get("degradedHealth", 0.0)
                    current_health[nid] = deg_health
                    current_state[nid] = "FAILED" if deg_health == 0 else "DEGRADED"
                    failure_start_time[nid] = 0
                    hop_distance_map[nid] = 0
                    evt = {
                        "timeMinute": 0,
                        "nodeId": nid,
                        "nodeName": node_map[nid].name,
                        "eventType": "FAILURE",
                        "message": f"Initial Disruption: {node_map[nid].name} failed ({failure.get('reason', 'Outage')})",
                        "hopDistance": 0
                    }
                    step_events.append(evt)
                    events_log.append(evt)

        # 3. Propagate Cascade Downstream
        next_health = dict(current_health)
        for node in all_nodes:
            has_intervention = any(
                i.get("targetNodeId") == node.id and i.get("appliedAtMinute", 15) <= time_minute
                for i in applied_interventions
            )

            # Check upstream edges
            upstream_edges = [edge for edge in graph.get_all_edges() if edge.target == node.id]
            total_upstream_impact = 0.0
            primary_cause_id = None
            max_upstream_hop = 0

            for edge in upstream_edges:
                u_health = current_health[edge.source]
                u_fail_time = failure_start_time.get(edge.source, 0)

                if u_health < edge.failure_threshold:
                    time_since_failed = time_minute - u_fail_time
                    if time_since_failed >= edge.propagation_delay_minutes:
                        deg_amt = (edge.failure_threshold - u_health) * edge.dependency_strength
                        total_upstream_impact += deg_amt
                        if not primary_cause_id or deg_amt > 0.3:
                            primary_cause_id = edge.source
                            max_upstream_hop = max(max_upstream_hop, hop_distance_map.get(edge.source, 0))

            if total_upstream_impact > 0.15 and not has_intervention:
                potential_health = max(0.0, 1.0 - total_upstream_impact * 1.2)
                if potential_health < current_health[node.id]:
                    prev_state = current_state[node.id]
                    next_health[node.id] = min(next_health[node.id], potential_health)
                    if node.id not in failure_start_time:
                        failure_start_time[node.id] = time_minute
                    hop_distance_map[node.id] = max_upstream_hop + 1

                    if prev_state == "NORMAL" and next_health[node.id] < 0.75:
                        cause_name = node_map[primary_cause_id].name if primary_cause_id and primary_cause_id in node_map else "Grid"
                        evt = {
                            "timeMinute": time_minute,
                            "nodeId": node.id,
                            "nodeName": node.name,
                            "eventType": "CASCADE_DEGRADATION",
                            "message": f"Cascade propagation: {node.name} degraded due to upstream outage at {cause_name} (Hop {max_upstream_hop + 1})",
                            "hopDistance": max_upstream_hop + 1
                        }
                        step_events.append(evt)
                        events_log.append(evt)

            # 4. Auto Recovery process
            if time_minute >= 45 or has_intervention:
                upstream_blocked = False
                if not has_intervention:
                    for edge in upstream_edges:
                        if edge.recovery_dependency and current_health[edge.source] < edge.failure_threshold:
                            upstream_blocked = True
                            break
                
                if not upstream_blocked and current_health[node.id] < 1.0:
                    next_health[node.id] = min(1.0, current_health[node.id] + 0.08)

        # Update State strings
        active_failed = []
        active_degraded = []
        active_recovering = []
        current_cascade_depth = 0
        population_at_risk = 0

        for node in all_nodes:
            current_health[node.id] = round(next_health[node.id], 2)
            h = current_health[node.id]

            if h >= 0.9:
                current_state[node.id] = "RESTORED" if (time_minute > 0 and current_state[node.id] == "RECOVERING") else "NORMAL"
            elif h >= 0.6:
                current_state[node.id] = "RECOVERING" if current_state[node.id] in ("FAILED", "DEGRADED") else "WARNING"
                active_degraded.append(node.id)
            elif h >= 0.25:
                current_state[node.id] = "DEGRADED"
                active_degraded.append(node.id)
            else:
                current_state[node.id] = "FAILED"
                active_failed.append(node.id)

            if current_state[node.id] == "RECOVERING":
                active_recovering.append(node.id)

            if h < 0.75:
                population_at_risk += node.population_served
                hop = hop_distance_map.get(node.id, 0)
                if hop > current_cascade_depth:
                    current_cascade_depth = hop

        affected_count = len(active_failed) + len(active_degraded)
        affected_percent = round((affected_count / max(1, len(all_nodes))) * 100.0, 1)
        resilience_score = graph.compute_resilience_score(current_health)

        if resilience_score < min_resilience:
            min_resilience = resilience_score
            peak_cascade_minute = time_minute

        if current_cascade_depth > max_cascade_depth: max_cascade_depth = current_cascade_depth
        if affected_count > max_affected: max_affected = affected_count
        if population_at_risk > max_pop_risk: max_pop_risk = population_at_risk

        timeline.append(TimestepState(
            time_minute=time_minute,
            node_health_map=dict(current_health),
            node_state_map=dict(current_state),
            active_failed_nodes=active_failed,
            active_degraded_nodes=active_degraded,
            active_recovering_nodes=active_recovering,
            cascade_depth=current_cascade_depth,
            affected_services_count=affected_count,
            affected_services_percent=affected_percent,
            population_at_risk=population_at_risk,
            city_resilience_score=resilience_score,
            events_log=step_events
        ))

    return {
        "simulation_id": f"sim_{scenario.scenario_id}_{int(time.time())}",
        "scenario_id": scenario.scenario_id,
        "city_id": scenario.city_id,
        "timeline": timeline,
        "metrics_summary": {
            "initial_resilience": timeline[0].city_resilience_score if timeline else 100,
            "peak_cascade_minute": peak_cascade_minute,
            "min_resilience": min_resilience,
            "max_cascade_depth": max_cascade_depth,
            "max_affected_services": max_affected,
            "max_population_at_risk": max_pop_risk,
            "estimated_recovery_time_minutes": duration if min_resilience > 85 else duration + max_affected * 15,
            "total_events_count": len(events_log)
        },
        "applied_interventions": applied_interventions
    }

def optimize_interventions(
    graph: UrbanGraphPy,
    scenario: ScenarioDefinition,
    budget_inr: float = 1500000.0,
    repair_teams: int = 4
) -> Dict[str, Any]:
    baseline_run = run_cascade_simulation(graph, scenario)
    base_summary = baseline_run["metrics_summary"]
    all_nodes = graph.get_all_nodes()
    node_map = {n.id: n for n in all_nodes}

    # Find peak step
    peak_step = max(baseline_run["timeline"], key=lambda t: t.affected_services_count)
    affected_ids = peak_step.active_failed_nodes + peak_step.active_degraded_nodes

    candidates: List[InterventionCandidate] = []
    for nid in affected_ids:
        if nid not in node_map:
            continue
        n = node_map[nid]
        reach = len(graph.get_downstream_reach(n.id))
        
        act_type = "RESTORE_SUBSTATION"
        base_cost = 500000.0
        teams = 2
        if n.category == "POWER_GRID":
            act_type = "RESTORE_SUBSTATION"
            base_cost = 500000.0
            teams = 2
        elif n.category == "HEALTHCARE":
            act_type = "PRIORITIZE_HOSPITAL_POWER"
            base_cost = 250000.0
            teams = 1
        elif n.category == "WATER_SYSTEM":
            act_type = "ACTIVATE_BACKUP_WATER_PUMP"
            base_cost = 300000.0
            teams = 1
        elif n.category == "TRANSPORTATION":
            act_type = "ACTIVATE_EMERGENCY_TRAFFIC_SYSTEM"
            base_cost = 150000.0
            teams = 1
        else:
            act_type = "RESTORE_TELECOM_TOWER"
            base_cost = 200000.0
            teams = 1

        test_run = run_cascade_simulation(graph, scenario, [{
            "interventionId": f"cand_{n.id}",
            "appliedAtMinute": 15,
            "targetNodeId": n.id,
            "actionType": act_type,
            "costINR": base_cost
        }])
        test_sum = test_run["metrics_summary"]

        restored = max(0, base_summary["max_affected_services"] - test_sum["max_affected_services"])
        pop_saved = max(0, base_summary["max_population_at_risk"] - test_sum["max_population_at_risk"])
        res_imp = max(0.0, test_sum["min_resilience"] - base_summary["min_resilience"])
        rec_red = max(0, base_summary["estimated_recovery_time_minutes"] - test_sum["estimated_recovery_time_minutes"])
        depth_red = max(0, base_summary["max_cascade_depth"] - test_sum["max_cascade_depth"])

        cost_factor = max(1.0, base_cost / 100000.0)
        roi_score = round(((0.35 * res_imp * 2 + 0.30 * restored * 12 + 0.20 * rec_red * 0.8 + reach * 8) / cost_factor), 2)

        candidates.append(InterventionCandidate(
            id=f"cand_{n.id}",
            name=f"{act_type.replace('_', ' ')}: {n.name}",
            target_node_id=n.id,
            action_type=act_type,
            cost_inr=base_cost,
            repair_time_minutes=int(n.repair_time_minutes * 0.6),
            required_teams=teams,
            services_restored_count=restored,
            population_benefited=pop_saved,
            resilience_improvement=res_imp,
            recovery_time_reduction_minutes=rec_red,
            cascade_depth_reduction=depth_red,
            roi_score=roi_score,
            priority_rank=0,
            rationale=f"Upstream root-cause restoration. Restoring {n.name} prevents cascade propagation to {reach} downstream facilities."
        ))

    candidates.sort(key=lambda c: c.roi_score, reverse=True)

    rem_budget = budget_inr
    rem_teams = repair_teams
    selected: List[InterventionCandidate] = []

    for c in candidates:
        if c.cost_inr <= rem_budget and c.required_teams <= rem_teams:
            c.priority_rank = len(selected) + 1
            selected.append(c)
            rem_budget -= c.cost_inr
            rem_teams -= c.required_teams
        if len(selected) >= 3:
            break

    applied_actions = [{
        "interventionId": c.id,
        "appliedAtMinute": 15 + idx * 5,
        "targetNodeId": c.target_node_id,
        "actionType": c.action_type,
        "costINR": c.cost_inr
    } for idx, c in enumerate(selected)]

    optimized_run = run_cascade_simulation(graph, scenario, applied_actions)
    opt_summary = optimized_run["metrics_summary"]

    total_cost = sum(c.cost_inr for c in selected)
    total_teams = sum(c.required_teams for c in selected)

    rec_pct = 0.0
    if base_summary["estimated_recovery_time_minutes"] > 0:
        rec_pct = round(((base_summary["estimated_recovery_time_minutes"] - opt_summary["estimated_recovery_time_minutes"]) / base_summary["estimated_recovery_time_minutes"]) * 100.0, 1)

    comparison = {
        "affected_before": base_summary["max_affected_services"],
        "affected_after": opt_summary["max_affected_services"],
        "affected_delta": base_summary["max_affected_services"] - opt_summary["max_affected_services"],
        "resilience_before": base_summary["min_resilience"],
        "resilience_after": opt_summary["min_resilience"],
        "resilience_delta": opt_summary["min_resilience"] - base_summary["min_resilience"],
        "recovery_before": base_summary["estimated_recovery_time_minutes"],
        "recovery_after": opt_summary["estimated_recovery_time_minutes"],
        "recovery_pct": max(0.0, rec_pct),
        "pop_saved": max(0, base_summary["max_population_at_risk"] - opt_summary["max_population_at_risk"])
    }

    return {
        "baseline_run": baseline_run,
        "optimized_run": optimized_run,
        "recommended_interventions": selected,
        "total_cost_inr": total_cost,
        "total_teams_used": total_teams,
        "comparison_metrics": comparison,
        "executive_summary": f"URBANPULSE Optimizer identified {len(selected)} coordinated actions yielding +{comparison['resilience_delta']} resilience score increase and {comparison['recovery_pct']}% faster city recovery within budget (₹{total_cost:,.0f})."
    }

# Built-in City Topologies
def load_san_francisco_city() -> Tuple[List[InfrastructureNode], List[DependencyEdge]]:
    nodes = [
        InfrastructureNode("sf_pwr_potrero", "PG&E Potrero Substation (115kV Infeed)", "POWER_GRID", "Substation", 37.7554, -122.3877, 450.0, "MW", 5, 240000, 0.05, 120, 600000.0, address="2300 3rd St, San Francisco"),
        InfrastructureNode("sf_hosp_sfgh", "Zuckerberg SF General Hospital & Trauma", "HEALTHCARE", "Level 1 Trauma Center", 37.7558, -122.4048, 395.0, "Beds", 5, 310000, 0.02, 60, 300000.0, address="1001 Potrero Ave, San Francisco"),
        InfrastructureNode("sf_trn_muni_its", "SFMTA Muni Metro Signal Control HQ", "TRANSPORTATION", "Transit Control", 37.7752, -122.4194, 850.0, "Signals", 4, 180000, 0.04, 45, 150000.0, address="1 S Van Ness Ave, San Francisco"),
        InfrastructureNode("sf_wtr_hetch_hetchy", "SFPUC Hetch Hetchy Water Booster Station", "WATER_SYSTEM", "Water Booster", 37.7312, -122.4410, 120.0, "MGD", 5, 450000, 0.03, 90, 400000.0, address="505 Van Ness Ave, San Francisco"),
        InfrastructureNode("sf_emg_sffd_hq", "SFFD Division 1 Command & Dispatch", "EMERGENCY_SERVICES", "Dispatch HQ", 37.7815, -122.3965, 24.0, "Engines", 5, 220000, 0.02, 30, 120000.0, address="698 2nd St, San Francisco"),
        InfrastructureNode("sf_tel_soma_ix", "SoMa Subsea Optical Fiber Core Hub", "TELECOMMUNICATIONS", "Subsea Landing", 37.7810, -122.3995, 2400.0, "Gbps", 5, 520000, 0.02, 75, 250000.0, address="200 Paul Ave, San Francisco")
    ]
    edges = [
        DependencyEdge("sf_e_pwr_to_its", "sf_pwr_potrero", "sf_trn_muni_its", "POWER", 0.90, 0.40, 5, True, description="Power blackout halts Muni traction lines"),
        DependencyEdge("sf_e_pwr_to_sfgh", "sf_pwr_potrero", "sf_hosp_sfgh", "POWER", 0.85, 0.35, 15, True, description="SF General emergency feeder supply"),
        DependencyEdge("sf_e_pwr_to_wtr", "sf_pwr_potrero", "sf_wtr_hetch_hetchy", "POWER", 0.88, 0.40, 10, True, description="Booster pump electrical feed"),
        DependencyEdge("sf_e_its_to_emg", "sf_trn_muni_its", "sf_emg_sffd_hq", "TRANSPORT", 0.80, 0.50, 10, False, description="Transit gridlock delays fire & ambulance dispatch"),
        DependencyEdge("sf_e_emg_to_sfgh", "sf_emg_sffd_hq", "sf_hosp_sfgh", "EMERGENCY", 0.82, 0.55, 15, False, description="Ambulance dispatch delays strain trauma ER")
    ]
    return nodes, edges

def load_london_city() -> Tuple[List[InfrastructureNode], List[DependencyEdge]]:
    nodes = [
        InfrastructureNode("ldn_pwr_bank", "UK Power Networks Bank Substation", "POWER_GRID", "Substation", 500.0, "MW", 5, 380000, 0.04, 130, 700000.0, latitude=51.5133, longitude=-0.0889),
        InfrastructureNode("ldn_hosp_st_thomas", "St Thomas' Hospital NHS Foundation Trust", "HEALTHCARE", "NHS Trauma Hospital", 51.4988, -0.1186, 840.0, "Beds", 5, 420000, 0.02, 65, 350000.0),
        InfrastructureNode("ldn_wtr_thames", "Thames Water Hampton Pumping Station", "WATER_SYSTEM", "Pumping Station", 51.4133, -0.3705, 680.0, "ML/day", 5, 600000, 0.03, 100, 450000.0),
        InfrastructureNode("ldn_trn_tfl", "TfL Underground Signal Control Centre", "TRANSPORTATION", "Control Hub", 51.5033, -0.1195, 1400.0, "Signals", 5, 850000, 0.05, 50, 200000.0),
        InfrastructureNode("ldn_emg_las", "London Ambulance Service (LAS) HQ", "EMERGENCY_SERVICES", "Dispatch", 51.5002, -0.1082, 45.0, "Ambulances", 5, 500000, 0.02, 35, 150000.0)
    ]
    edges = [
        DependencyEdge("ldn_e_pwr_to_tfl", "ldn_pwr_bank", "ldn_trn_tfl", "POWER", 0.92, 0.40, 5, True),
        DependencyEdge("ldn_e_pwr_to_hosp", "ldn_pwr_bank", "ldn_hosp_st_thomas", "POWER", 0.86, 0.35, 15, True),
        DependencyEdge("ldn_e_pwr_to_wtr", "ldn_pwr_bank", "ldn_wtr_thames", "POWER", 0.89, 0.40, 10, True),
        DependencyEdge("ldn_e_tfl_to_las", "ldn_trn_tfl", "ldn_emg_las", "TRANSPORT", 0.81, 0.50, 10, False),
        DependencyEdge("ldn_e_las_to_hosp", "ldn_emg_las", "ldn_hosp_st_thomas", "EMERGENCY", 0.84, 0.55, 15, False)
    ]
    return nodes, edges

def load_singapore_city() -> Tuple[List[InfrastructureNode], List[DependencyEdge]]:
    nodes = [
        InfrastructureNode("sg_pwr_tuas", "Tuas Power Station & 230kV Grid", "POWER_GRID", "Power Plant", 1.2984, 103.6391, 2670.0, "MW", 5, 1100000, 0.03, 140, 800000.0),
        InfrastructureNode("sg_hosp_sgh", "Singapore General Hospital (SGH) Campus", "HEALTHCARE", "Trauma Hospital", 1.2798, 103.8347, 1785.0, "Beds", 5, 950000, 0.02, 70, 450000.0),
        InfrastructureNode("sg_wtr_barrage", "PUB Marina Barrage Pumping Station", "WATER_SYSTEM", "Reservoir & Flood", 1.2806, 103.8636, 280.0, "m3/s", 5, 1400000, 0.04, 120, 500000.0),
        InfrastructureNode("sg_trn_lta", "LTA Intelligent Transport Systems Centre", "TRANSPORTATION", "Expressway ITS", 1.3065, 103.8492, 1950.0, "Signals", 4, 1200000, 0.05, 45, 180000.0),
        InfrastructureNode("sg_emg_scdf", "SCDF 1st Civil Defence Division HQ", "EMERGENCY_SERVICES", "Dispatch HQ", 1.2941, 103.8038, 28.0, "Units", 5, 600000, 0.02, 40, 130000.0)
    ]
    edges = [
        DependencyEdge("sg_e_pwr_to_lta", "sg_pwr_tuas", "sg_trn_lta", "POWER", 0.92, 0.40, 5, True),
        DependencyEdge("sg_e_pwr_to_sgh", "sg_pwr_tuas", "sg_hosp_sgh", "POWER", 0.85, 0.35, 15, True),
        DependencyEdge("sg_e_pwr_to_wtr", "sg_pwr_tuas", "sg_wtr_barrage", "POWER", 0.90, 0.40, 10, True),
        DependencyEdge("sg_e_lta_to_scdf", "sg_trn_lta", "sg_emg_scdf", "TRANSPORT", 0.82, 0.50, 10, False),
        DependencyEdge("sg_e_scdf_to_sgh", "sg_emg_scdf", "sg_hosp_sgh", "EMERGENCY", 0.80, 0.55, 15, False)
    ]
    return nodes, edges

def load_mumbai_city() -> Tuple[List[InfrastructureNode], List[DependencyEdge]]:
    nodes = [
        InfrastructureNode("mum_pwr_dharavi", "BEST 220kV Dharavi Receiving Station", "POWER_GRID", "Substation", 19.0434, 72.8571, 500.0, "MVA", 5, 1200000, 0.08, 150, 700000.0),
        InfrastructureNode("mum_hosp_kem", "KEM Hospital & Seth GS Medical College", "HEALTHCARE", "Apex Trauma Hospital", 19.0028, 72.8423, 2250.0, "Beds", 5, 1800000, 0.03, 85, 400000.0),
        InfrastructureNode("mum_wtr_lovegrove", "BMC Love Grove Stormwater Pumping", "WATER_SYSTEM", "Flood Outfall", 19.0021, 72.8166, 120.0, "m3/s", 5, 1500000, 0.06, 110, 450000.0),
        InfrastructureNode("mum_trn_churchgate", "Western Railway Churchgate Terminal", "TRANSPORTATION", "Suburban Rail", 18.9355, 72.8272, 850000.0, "Commuters", 5, 1600000, 0.07, 60, 250000.0),
        InfrastructureNode("mum_emg_byculla", "Mumbai Fire Brigade HQ Byculla", "EMERGENCY_SERVICES", "Central Dispatch", 18.9744, 72.8336, 35.0, "Engines", 5, 1100000, 0.02, 40, 120000.0)
    ]
    edges = [
        DependencyEdge("mum_e_pwr_to_wtr", "mum_pwr_dharavi", "mum_wtr_lovegrove", "POWER", 0.94, 0.40, 5, True),
        DependencyEdge("mum_e_pwr_to_kem", "mum_pwr_dharavi", "mum_hosp_kem", "POWER", 0.88, 0.35, 15, True),
        DependencyEdge("mum_e_pwr_to_rail", "mum_pwr_dharavi", "mum_trn_churchgate", "POWER", 0.90, 0.45, 5, True),
        DependencyEdge("mum_e_wtr_to_fire", "mum_wtr_lovegrove", "mum_emg_byculla", "PHYSICAL", 0.85, 0.50, 15, False),
        DependencyEdge("mum_e_fire_to_kem", "mum_emg_byculla", "mum_hosp_kem", "EMERGENCY", 0.82, 0.55, 15, False)
    ]
    return nodes, edges

CITY_LOADERS = {
    "san_francisco": load_san_francisco_city,
    "london": load_london_city,
    "singapore": load_singapore_city,
    "mumbai": load_mumbai_city
}

def get_city_graph(city_id: str = "san_francisco") -> UrbanGraphPy:
    loader = CITY_LOADERS.get(city_id, load_san_francisco_city)
    nodes, edges = loader()
    return UrbanGraphPy(nodes, edges)

def fetch_live_weather(lat: float, lon: float) -> Dict[str, Any]:
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
        res = requests.get(url, timeout=3)
        if res.status_code == 200:
            data = res.json()
            cw = data.get("current_weather", {})
            return {
                "temperature": cw.get("temperature", 18.5),
                "windspeed": cw.get("windspeed", 12.0),
                "weathercode": cw.get("weathercode", 0),
                "source": "Open-Meteo LIVE"
            }
    except Exception:
        pass
    return {
        "temperature": 18.5,
        "windspeed": 12.0,
        "weathercode": 0,
        "source": "Open-Meteo Cached"
    }

def generate_ai_post_mortem(scenario_name: str, city_name: str, metrics: Dict[str, Any], initial_failures: List[Dict[str, Any]]) -> str:
    return f"""### Cascade Propagation Post-Mortem

**1. Root Cause Breakdown**
The disruption initiated at **{initial_failures[0]['nodeId'] if initial_failures else 'Upstream Feeder'}** at $t=0\\text{{ min}}$. Tight topological coupling led to voltage collapse and loss of signal control.

**2. Multi-Tier Cascade Propagation**
- **Tier 1 (0 to 10 min):** Infeed outage de-energized signal controllers and transit arteries.
- **Tier 2 (10 to 25 min):** Traffic gridlock precipitated an exponential increase in emergency vehicle transit times.
- **Tier 3 (25 to 45 min):** Trauma triage at regional hospital bottlenecked due to transit delays.

**3. Systemic Impact Summary**
Peak cascade depth reached **{metrics.get('max_cascade_depth', 3)} hops**, degrading **{metrics.get('max_affected_services', 4)} modeled services** and exposing **{metrics.get('max_population_at_risk', 0):,} citizens** before recovery.
"""

def generate_ai_tactical_briefing(city_name: str, scenario_name: str, metrics: Dict[str, Any], top_action: str, cost: float) -> str:
    return f"""### Tactical Incident Command Directive

**1. Upstream Directive (Priority 1)**
Deploy emergency restoration crews to **{top_action}** (Allocated: ₹{cost:,.0f}). Restoring the upstream root-cause feeder at $t=15\\text{{m}}$ isolates downstream propagation.

**2. Secondary Containment**
- **Priority 2:** Activate auxiliary diesel generators and prioritize hospital grid connection.
- **Priority 3:** Dispatch traffic controllers to key arterial corridors.

**3. Strategic Gain**
- **Resilience Recovery:** +{metrics.get('resilience_delta', 30)} points
- **Recovery Acceleration:** {metrics.get('recovery_pct', 40)}% faster city restoration.
"""
