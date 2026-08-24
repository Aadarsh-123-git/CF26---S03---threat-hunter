import {
  InfrastructureNode,
  DependencyEdge,
  CriticalNodeAnalysis,
  NodeState,
} from '@/types/urbanpulse';

export class UrbanGraph {
  nodes: Map<string, InfrastructureNode> = new Map();
  edges: Map<string, DependencyEdge> = new Map();
  // adjacency lists
  outEdges: Map<string, DependencyEdge[]> = new Map(); // source -> target edges (downstream)
  inEdges: Map<string, DependencyEdge[]> = new Map(); // target <- source edges (upstream)

  constructor(nodes: InfrastructureNode[] = [], edges: DependencyEdge[] = []) {
    this.init(nodes, edges);
  }

  init(nodes: InfrastructureNode[], edges: DependencyEdge[]) {
    this.nodes.clear();
    this.edges.clear();
    this.outEdges.clear();
    this.inEdges.clear();

    for (const node of nodes) {
      this.nodes.set(node.id, { ...node });
      this.outEdges.set(node.id, []);
      this.inEdges.set(node.id, []);
    }

    for (const edge of edges) {
      this.edges.set(edge.id, { ...edge });
      if (this.nodes.has(edge.source) && this.nodes.has(edge.target)) {
        this.outEdges.get(edge.source)!.push(edge);
        this.inEdges.get(edge.target)!.push(edge);
      }
    }
  }

  getNode(id: string): InfrastructureNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): InfrastructureNode[] {
    return Array.from(this.nodes.values());
  }

  getAllEdges(): DependencyEdge[] {
    return Array.from(this.edges.values());
  }

  getDownstreamEdges(nodeId: string): DependencyEdge[] {
    return this.outEdges.get(nodeId) || [];
  }

  getUpstreamEdges(nodeId: string): DependencyEdge[] {
    return this.inEdges.get(nodeId) || [];
  }

  /**
   * Calculates BFS Transitive Downstream Reach
   * Returns a map of reachable node IDs to their minimum hop distance from the root.
   */
  getDownstreamReach(rootId: string): Map<string, number> {
    const distances = new Map<string, number>();
    const queue: { id: string; dist: number }[] = [{ id: rootId, dist: 0 }];
    const visited = new Set<string>([rootId]);

    while (queue.length > 0) {
      const { id, dist } = queue.shift()!;
      if (id !== rootId) {
        distances.set(id, dist);
      }

      const downstream = this.getDownstreamEdges(id);
      for (const edge of downstream) {
        if (!visited.has(edge.target)) {
          visited.add(edge.target);
          queue.push({ id: edge.target, dist: dist + 1 });
        }
      }
    }

    return distances;
  }

  /**
   * Computes Betweenness Centrality for all nodes in the directed graph
   * using Brandes' Algorithm (O(V*E)).
   */
  computeBetweennessCentrality(): Map<string, number> {
    const CB = new Map<string, number>();
    const nodeIds = Array.from(this.nodes.keys());
    const n = nodeIds.length;

    for (const v of nodeIds) {
      CB.set(v, 0);
    }

    if (n <= 2) return CB;

    for (const s of nodeIds) {
      const S: string[] = [];
      const P = new Map<string, string[]>();
      const sigma = new Map<string, number>();
      const d = new Map<string, number>();

      for (const w of nodeIds) {
        P.set(w, []);
        sigma.set(w, 0);
        d.set(w, -1);
      }

      sigma.set(s, 1);
      d.set(s, 0);

      const Q: string[] = [s];

      while (Q.length > 0) {
        const v = Q.shift()!;
        S.push(v);

        const currentDist = d.get(v)!;
        const edges = this.getDownstreamEdges(v);

        for (const edge of edges) {
          const w = edge.target;
          if (d.get(w)! < 0) {
            d.set(w, currentDist + 1);
            Q.push(w);
          }
          if (d.get(w) === currentDist + 1) {
            sigma.set(w, sigma.get(w)! + sigma.get(v)!);
            P.get(w)!.push(v);
          }
        }
      }

      const delta = new Map<string, number>();
      for (const w of nodeIds) {
        delta.set(w, 0);
      }

      while (S.length > 0) {
        const w = S.pop()!;
        const sigmaW = sigma.get(w)!;
        for (const v of P.get(w)!) {
          const coeff = (sigma.get(v)! / (sigmaW === 0 ? 1 : sigmaW)) * (1 + delta.get(w)!);
          delta.set(v, delta.get(v)! + coeff);
        }
        if (w !== s) {
          CB.set(w, CB.get(w)! + delta.get(w)!);
        }
      }
    }

    // Normalize betweenness centrality by (N-1)*(N-2)
    const normFactor = (n - 1) * (n - 2);
    if (normFactor > 0) {
      for (const [k, v] of CB.entries()) {
        CB.set(k, v / normFactor);
      }
    }

    return CB;
  }

  /**
   * Computes Criticality Score (0-100) for all nodes using the formula:
   * Score = 0.25 * DownstreamReachNorm +
   *         0.20 * BetweennessNorm +
   *         0.20 * ImportanceNorm +
   *         0.15 * PopulationExposureNorm +
   *         0.10 * FailureProbNorm +
   *         0.10 * RepairTimeNorm
   */
  analyzeCriticalNodes(): CriticalNodeAnalysis[] {
    const allNodes = this.getAllNodes();
    const totalNodes = allNodes.length;
    if (totalNodes === 0) return [];

    const betweenness = this.computeBetweennessCentrality();

    let maxReach = 1;
    let maxPop = 1;
    let maxRepairTime = 1;

    const reachMap = new Map<string, number>();

    for (const node of allNodes) {
      const reach = this.getDownstreamReach(node.id).size;
      reachMap.set(node.id, reach);
      if (reach > maxReach) maxReach = reach;
      if (node.populationServed > maxPop) maxPop = node.populationServed;
      if (node.repairTimeMinutes > maxRepairTime) maxRepairTime = node.repairTimeMinutes;
    }

    let maxBetweenness = 0.0001;
    for (const b of betweenness.values()) {
      if (b > maxBetweenness) maxBetweenness = b;
    }

    const analyses: CriticalNodeAnalysis[] = allNodes.map((node) => {
      const reach = reachMap.get(node.id) || 0;
      const bc = betweenness.get(node.id) || 0;
      const deg = (this.getDownstreamEdges(node.id).length + this.getUpstreamEdges(node.id).length) / Math.max(1, totalNodes - 1);

      const normReach = reach / maxReach;
      const normBetweenness = bc / maxBetweenness;
      const normImportance = (node.importance - 1) / 4; // 1-5 scale -> 0-1
      const normPop = Math.log10(Math.max(10, node.populationServed)) / Math.log10(Math.max(10, maxPop));
      const normFailProb = node.failureProbability;
      const normRepair = node.repairTimeMinutes / maxRepairTime;

      // Weighted Multi-Factor Criticality formula
      const rawCriticality =
        0.25 * normReach +
        0.20 * normBetweenness +
        0.20 * normImportance +
        0.15 * normPop +
        0.10 * normFailProb +
        0.10 * normRepair;

      const criticalityScore = Math.min(100, Math.max(0, Math.round(rawCriticality * 100)));

      // Cascade Risk Score considers Current Health too
      const healthPenalty = (1 - (node.healthScore ?? 1.0));
      const rawRisk = 0.5 * rawCriticality + 0.3 * normFailProb + 0.2 * healthPenalty;
      const cascadeRiskScore = Math.min(100, Math.max(0, Math.round(rawRisk * 100)));

      // Update node's internal properties
      node.criticalityScore = criticalityScore;
      node.cascadeRiskScore = cascadeRiskScore;

      // Explainability reasons
      const reasons: string[] = [];
      if (normReach >= 0.4) reasons.push(`High downstream reach (${reach} dependent services)`);
      if (normBetweenness >= 0.35) reasons.push(`High betweenness centrality (critical topology bridge)`);
      if (node.importance >= 4) reasons.push(`Tier-${node.importance} high operational importance`);
      if (node.populationServed >= 50000) reasons.push(`Direct population exposure (${node.populationServed.toLocaleString()} residents)`);
      if (node.repairTimeMinutes >= 90) reasons.push(`Prolonged estimated restoration (${node.repairTimeMinutes} min recovery)`);
      if (reasons.length === 0) reasons.push('Standard localized infrastructure dependency profile');

      return {
        nodeId: node.id,
        nodeName: node.name,
        category: node.category,
        criticalityScore,
        downstreamReachCount: reach,
        betweennessCentrality: Number(bc.toFixed(4)),
        degreeCentrality: Number(deg.toFixed(3)),
        populationExposure: node.populationServed,
        serviceImportance: node.importance,
        failureProbability: node.failureProbability,
        repairTimeMinutes: node.repairTimeMinutes,
        reasons,
      };
    });

    analyses.sort((a, b) => b.criticalityScore - a.criticalityScore);
    return analyses;
  }

  /**
   * Computes City Resilience Score (0 to 100)
   * R = 100 * (sum(importance_i * health_i) / sum(importance_i)) * (1 - cascade_penalty)
   */
  computeResilienceScore(nodeHealthMap: Record<string, number>): number {
    let weightedHealthSum = 0;
    let totalWeight = 0;
    let degradedCriticalCount = 0;

    for (const node of this.getAllNodes()) {
      const health = nodeHealthMap[node.id] !== undefined ? nodeHealthMap[node.id] : (node.healthScore ?? 1.0);
      const weight = node.importance;

      weightedHealthSum += health * weight;
      totalWeight += weight;

      if (node.importance >= 4 && health < 0.5) {
        degradedCriticalCount++;
      }
    }

    if (totalWeight === 0) return 100;
    const baseScore = (weightedHealthSum / totalWeight) * 100;
    // Penalty for critical system collapse
    const penaltyFactor = Math.min(0.25, degradedCriticalCount * 0.05);
    const finalScore = Math.max(0, Math.min(100, Math.round(baseScore * (1 - penaltyFactor))));
    return finalScore;
  }
}
