import {
  InfrastructureNode,
  ScenarioDefinition,
  InterventionCandidate,
  ResourceConstraints,
  SimulationRun,
} from '@/types/urbanpulse';
import { UrbanGraph } from './graph';
import { runCascadeSimulation } from './cascade';

export interface OptimizationResult {
  baselineRun: SimulationRun;
  optimizedRun: SimulationRun;
  recommendedInterventions: InterventionCandidate[];
  totalCostINR: number;
  totalTeamsUsed: number;
  comparisonMetrics: {
    affectedServicesBefore: number;
    affectedServicesAfter: number;
    affectedServicesDelta: number;
    resilienceBefore: number;
    resilienceAfter: number;
    resilienceDelta: number;
    recoveryTimeBeforeMin: number;
    recoveryTimeAfterMin: number;
    recoveryTimeImprovementPercent: number;
    populationAtRiskBefore: number;
    populationAtRiskAfter: number;
    populationSaved: number;
    cascadeDepthBefore: number;
    cascadeDepthAfter: number;
  };
  executiveSummary: string;
}

export function optimizeInterventions(
  graph: UrbanGraph,
  scenario: ScenarioDefinition,
  constraints: ResourceConstraints = {
    budgetINR: 1500000,
    repairTeams: 4,
    mobileGenerators: 2,
    trafficControllers: 3,
    emergencyCrews: 4,
  }
): OptimizationResult {
  // 1. Run Baseline Simulation (no intervention)
  const baselineRun = runCascadeSimulation({
    graph,
    scenario,
  });

  const baseSummary = baselineRun.metricsSummary;
  const allNodes = graph.getAllNodes();
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

  // 2. Identify Disrupted or Highly Degraded Nodes in Baseline Peak
  const peakStep = baselineRun.timeline.reduce((prev, curr) =>
    curr.affectedServicesCount > prev.affectedServicesCount ? curr : prev
  );

  const affectedNodeIds = [...peakStep.activeFailedNodes, ...peakStep.activeDegradedNodes];

  // 3. Generate Candidate Interventions
  const candidates: InterventionCandidate[] = [];

  for (const nodeId of affectedNodeIds) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;

    const downstreamReach = graph.getDownstreamReach(node.id).size;
    let actionType: InterventionCandidate['actionType'] = 'RESTORE_SUBSTATION';
    let baseCost = 400000;
    let teamsRequired = 2;

    if (node.category === 'POWER_GRID') {
      actionType = 'RESTORE_SUBSTATION';
      baseCost = 500000;
      teamsRequired = 2;
    } else if (node.category === 'HEALTHCARE') {
      actionType = 'PRIORITIZE_HOSPITAL_POWER';
      baseCost = 250000;
      teamsRequired = 1;
    } else if (node.category === 'WATER_SYSTEM') {
      actionType = 'ACTIVATE_BACKUP_WATER_PUMP';
      baseCost = 300000;
      teamsRequired = 1;
    } else if (node.category === 'TRANSPORTATION') {
      actionType = 'ACTIVATE_EMERGENCY_TRAFFIC_SYSTEM';
      baseCost = 150000;
      teamsRequired = 1;
    } else if (node.category === 'TELECOMMUNICATIONS') {
      actionType = 'RESTORE_TELECOM_TOWER';
      baseCost = 200000;
      teamsRequired = 1;
    } else {
      actionType = 'ISOLATE_FAULT_DEPENDENCY';
      baseCost = 180000;
      teamsRequired = 1;
    }

    // Evaluate differential test run with this candidate applied early (t = 15m)
    const testRun = runCascadeSimulation({
      graph,
      scenario,
      appliedInterventions: [
        {
          interventionId: `cand_${node.id}`,
          appliedAtMinute: 15,
          targetNodeId: node.id,
          actionType,
          costINR: baseCost,
          status: 'APPLIED',
        },
      ],
    });

    const testSummary = testRun.metricsSummary;
    const servicesRestored = Math.max(0, baseSummary.maxAffectedServices - testSummary.maxAffectedServices);
    const popBenefited = Math.max(0, baseSummary.maxPopulationAtRisk - testSummary.maxPopulationAtRisk);
    const resImprovement = Math.max(0, testSummary.minResilience - baseSummary.minResilience);
    const recoveryReduction = Math.max(0, baseSummary.estimatedRecoveryTimeMinutes - testSummary.estimatedRecoveryTimeMinutes);
    const depthReduction = Math.max(0, baseSummary.maxCascadeDepth - testSummary.maxCascadeDepth);

    // Multi-criteria optimization score (Higher is better)
    const costFactor = Math.max(1, baseCost / 100000);
    const roiScore = Number(
      (
        (0.35 * resImprovement * 2 +
          0.30 * servicesRestored * 12 +
          0.20 * recoveryReduction * 0.8 +
          0.15 * (popBenefited / 15000) * 10 +
          downstreamReach * 8) /
        costFactor
      ).toFixed(2)
    );

    let rationale = '';
    if (downstreamReach >= 3) {
      rationale = `Root-cause upstream intervention. Restoring ${node.name} severs cascade propagation to ${downstreamReach} dependent downstream facilities.`;
    } else if (node.importance >= 4) {
      rationale = `Vital lifeline protection. Stabilizes high-criticality facility serving ${node.populationServed.toLocaleString()} citizens directly.`;
    } else {
      rationale = `Localized stabilization action. Mitigates operational strain and reduces recovery window.`;
    }

    candidates.push({
      id: `cand_${node.id}`,
      name: `${actionType.replace(/_/g, ' ')}: ${node.name}`,
      targetNodeId: node.id,
      actionType,
      costINR: baseCost,
      repairTimeMinutes: Math.round(node.repairTimeMinutes * 0.6),
      requiredTeams: teamsRequired,
      servicesRestoredCount: servicesRestored,
      populationBenefited: popBenefited,
      resilienceImprovement: resImprovement,
      recoveryTimeReductionMinutes: recoveryReduction,
      cascadeDepthReduction: depthReduction,
      roiScore,
      confidence: 0.88,
      priorityRank: 0,
      rationale,
    });
  }

  // Sort candidates by ROI score descending
  candidates.sort((a, b) => b.roiScore - a.roiScore);

  // Knapsack/Greedy selection within resource constraints
  let remainingBudget = constraints.budgetINR;
  let remainingTeams = constraints.repairTeams;
  const selectedInterventions: InterventionCandidate[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[i];
    if (cand.costINR <= remainingBudget && cand.requiredTeams <= remainingTeams) {
      cand.priorityRank = selectedInterventions.length + 1;
      selectedInterventions.push(cand);
      remainingBudget -= cand.costINR;
      remainingTeams -= cand.requiredTeams;
    }
    if (selectedInterventions.length >= 3) break; // select top 3 strategic actions
  }

  // 4. Run Full Optimized Simulation with selected interventions applied
  const appliedActions = selectedInterventions.map((cand, idx) => ({
    interventionId: cand.id,
    appliedAtMinute: 15 + idx * 5, // staged rapid dispatch
    targetNodeId: cand.targetNodeId,
    actionType: cand.actionType,
    costINR: cand.costINR,
    status: 'APPLIED' as const,
  }));

  const optimizedRun = runCascadeSimulation({
    graph,
    scenario,
    appliedInterventions: appliedActions,
  });

  const optSummary = optimizedRun.metricsSummary;
  const totalCost = selectedInterventions.reduce((sum, c) => sum + c.costINR, 0);
  const totalTeams = selectedInterventions.reduce((sum, c) => sum + c.requiredTeams, 0);

  const recoveryImprovementPercent =
    baseSummary.estimatedRecoveryTimeMinutes > 0
      ? Number(
          (
            ((baseSummary.estimatedRecoveryTimeMinutes - optSummary.estimatedRecoveryTimeMinutes) /
              baseSummary.estimatedRecoveryTimeMinutes) *
            100
          ).toFixed(1)
        )
      : 0;

  const comparison = {
    affectedServicesBefore: baseSummary.maxAffectedServices,
    affectedServicesAfter: optSummary.maxAffectedServices,
    affectedServicesDelta: baseSummary.maxAffectedServices - optSummary.maxAffectedServices,
    resilienceBefore: baseSummary.minResilience,
    resilienceAfter: optSummary.minResilience,
    resilienceDelta: optSummary.minResilience - baseSummary.minResilience,
    recoveryTimeBeforeMin: baseSummary.estimatedRecoveryTimeMinutes,
    recoveryTimeAfterMin: optSummary.estimatedRecoveryTimeMinutes,
    recoveryTimeImprovementPercent: Math.max(0, recoveryImprovementPercent),
    populationAtRiskBefore: baseSummary.maxPopulationAtRisk,
    populationAtRiskAfter: optSummary.maxPopulationAtRisk,
    populationSaved: Math.max(0, baseSummary.maxPopulationAtRisk - optSummary.maxPopulationAtRisk),
    cascadeDepthBefore: baseSummary.maxCascadeDepth,
    cascadeDepthAfter: optSummary.maxCascadeDepth,
  };

  const topAction = selectedInterventions[0];
  const summaryText = topAction
    ? `URBANPULSE Optimizer identified ${selectedInterventions.length} coordinated actions. Prioritizing upstream root-cause restoration (${topAction.name}) prevents cascading collapse across ${comparison.affectedServicesDelta} facilities, yielding +${comparison.resilienceDelta} resilience score increase and ${comparison.recoveryTimeImprovementPercent}% faster city recovery within budget (₹${totalCost.toLocaleString()}).`
    : 'No feasible interventions found within specified constraints.';

  return {
    baselineRun,
    optimizedRun,
    recommendedInterventions: selectedInterventions,
    totalCostINR: totalCost,
    totalTeamsUsed: totalTeams,
    comparisonMetrics: comparison,
    executiveSummary: summaryText,
  };
}
