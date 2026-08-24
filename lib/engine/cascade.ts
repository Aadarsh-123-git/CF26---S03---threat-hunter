import {
  InfrastructureNode,
  DependencyEdge,
  NodeState,
  ScenarioDefinition,
  TimestepState,
  SimulationEvent,
  SimulationRun,
  InterventionAction,
  InterventionCandidate,
} from '@/types/urbanpulse';
import { UrbanGraph } from './graph';

export interface CascadeSimulationOptions {
  graph: UrbanGraph;
  scenario: ScenarioDefinition;
  customFailures?: { nodeId: string; degradedHealth: number; reason: string }[];
  appliedInterventions?: (InterventionAction | InterventionCandidate)[];
  randomSeed?: number;
}

export function runCascadeSimulation(options: CascadeSimulationOptions): SimulationRun {
  const { graph, scenario, customFailures = [], appliedInterventions = [], randomSeed = 42 } = options;

  const allNodes = graph.getAllNodes();
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
  const totalNodes = allNodes.length;

  const duration = scenario.durationMinutes || 120;
  const stepSize = scenario.timeStepMinutes || 5;
  const numSteps = Math.floor(duration / stepSize) + 1;

  // Active failures config
  const initialFailures = customFailures.length > 0 ? customFailures : scenario.initialFailures;
  const initialFailedNodeIds = new Set(initialFailures.map((f) => f.nodeId));

  // Current simulation state
  const currentHealth: Record<string, number> = {};
  const currentState: Record<string, NodeState> = {};
  const failureStartTime: Record<string, number> = {}; // when did this node fail/degrade
  const hopDistanceMap: Record<string, number> = {}; // distance from initial failure
  const causeNodeMap: Record<string, string> = {}; // upstream cause node id
  const interventionAppliedSet = new Set<string>();

  // Initialize all nodes to NORMAL (1.0)
  for (const node of allNodes) {
    currentHealth[node.id] = 1.0;
    currentState[node.id] = 'NORMAL';
    hopDistanceMap[node.id] = 0;
  }

  const timeline: TimestepState[] = [];
  const eventsLog: SimulationEvent[] = [];

  let minResilience = 100;
  let peakCascadeMinute = 0;
  let maxCascadeDepth = 0;
  let maxAffectedServices = 0;
  let maxPopulationAtRisk = 0;
  let estimatedRecoveryTimeMinutes = duration;
  let systemRecovered = false;

  // Step through time
  for (let step = 0; step < numSteps; step++) {
    const timeMinute = step * stepSize;
    const stepEvents: SimulationEvent[] = [];

    // 1. Check for newly applied interventions at this timestamp
    for (const intervention of appliedInterventions) {
      const intId = 'interventionId' in intervention ? intervention.interventionId : intervention.id;
      const appliedAt = 'appliedAtMinute' in intervention ? intervention.appliedAtMinute : 15;
      const targetId = intervention.targetNodeId;
      const actType = intervention.actionType;

      if (appliedAt <= timeMinute && !interventionAppliedSet.has(intId)) {
        interventionAppliedSet.add(intId);
        const targetNode = nodeMap.get(targetId);
        if (targetNode) {
          // Boost health immediately and kickstart recovery
          currentHealth[targetNode.id] = Math.min(1.0, currentHealth[targetNode.id] + 0.6);
          currentState[targetNode.id] = currentHealth[targetNode.id] >= 0.85 ? 'RESTORED' : 'RECOVERING';
          const evt: SimulationEvent = {
            timeMinute,
            nodeId: targetNode.id,
            nodeName: targetNode.name,
            eventType: 'INTERVENTION_APPLIED',
            message: `Applied intervention: ${actType} on ${targetNode.name}. System stabilized.`,
            hopDistance: 0,
          };
          stepEvents.push(evt);
          eventsLog.push(evt);
        }
      }
    }

    // 2. Inject initial failures at t = 0
    if (timeMinute === 0) {
      for (const failure of initialFailures) {
        const node = nodeMap.get(failure.nodeId);
        if (node) {
          currentHealth[node.id] = failure.degradedHealth;
          currentState[node.id] = failure.degradedHealth === 0 ? 'FAILED' : 'DEGRADED';
          failureStartTime[node.id] = 0;
          hopDistanceMap[node.id] = 0;

          const evt: SimulationEvent = {
            timeMinute: 0,
            nodeId: node.id,
            nodeName: node.name,
            eventType: 'FAILURE',
            message: `Initial Disruption: ${node.name} failed (${failure.reason})`,
            hopDistance: 0,
          };
          stepEvents.push(evt);
          eventsLog.push(evt);
        }
      }
    }

    // 3. Propagate Cascade Downstream
    const nextHealth = { ...currentHealth };

    for (const node of allNodes) {
      // If node is an initial failure and hasn't been fixed by intervention yet, maintain its disrupted state until auto-recovery
      const isInitial = initialFailedNodeIds.has(node.id);
      const hasIntervention = appliedInterventions.some((i) => {
        const targetId = 'targetNodeId' in i ? i.targetNodeId : (i as any).targetNodeId;
        const appliedAt = 'appliedAtMinute' in i ? (i as any).appliedAtMinute : 15;
        return targetId === node.id && appliedAt <= timeMinute;
      });

      // Check all upstream dependencies feeding into this node
      const upstreamEdges = graph.getUpstreamEdges(node.id);
      let totalUpstreamImpact = 0;
      let primaryCauseId: string | undefined = undefined;
      let maxUpstreamHop = 0;

      for (const edge of upstreamEdges) {
        const upstreamHealth = currentHealth[edge.source];
        const upstreamFailTime = failureStartTime[edge.source];

        // Is upstream degraded below the threshold?
        if (upstreamHealth < edge.failureThreshold) {
          const timeSinceUpstreamFailed = upstreamFailTime !== undefined ? timeMinute - upstreamFailTime : 0;

          // Check if propagation delay has elapsed
          if (timeSinceUpstreamFailed >= edge.propagationDelayMinutes) {
            const degradationAmount = (edge.failureThreshold - upstreamHealth) * edge.dependencyStrength;
            totalUpstreamImpact += degradationAmount;

            if (!primaryCauseId || degradationAmount > 0.3) {
              primaryCauseId = edge.source;
              maxUpstreamHop = Math.max(maxUpstreamHop, hopDistanceMap[edge.source] || 0);
            }
          }
        }
      }

      // If upstream impact is significant, degrade this node
      if (totalUpstreamImpact > 0.15 && !hasIntervention) {
        const potentialHealth = Math.max(0.0, 1.0 - totalUpstreamImpact * 1.2);
        if (potentialHealth < currentHealth[node.id]) {
          const previousState = currentState[node.id];
          nextHealth[node.id] = Math.min(nextHealth[node.id], potentialHealth);
          failureStartTime[node.id] = failureStartTime[node.id] ?? timeMinute;
          hopDistanceMap[node.id] = maxUpstreamHop + 1;
          if (primaryCauseId) {
            causeNodeMap[node.id] = primaryCauseId;
          }

          // Log newly triggered cascade degradation
          if (previousState === 'NORMAL' && nextHealth[node.id] < 0.75) {
            const causeNode = primaryCauseId ? nodeMap.get(primaryCauseId) : undefined;
            const evt: SimulationEvent = {
              timeMinute,
              nodeId: node.id,
              nodeName: node.name,
              eventType: 'CASCADE_DEGRADATION',
              message: `Cascade propagation: ${node.name} degraded due to upstream outage at ${causeNode ? causeNode.name : 'grid'} (Hop ${maxUpstreamHop + 1})`,
              upstreamCauseNodeId: primaryCauseId,
              hopDistance: maxUpstreamHop + 1,
            };
            stepEvents.push(evt);
            eventsLog.push(evt);
          }
        }
      }

      // 4. Auto-Recovery or Natural Restoration Process
      const autoRecoveryStart = scenario.recoveryRules?.autoRecoveryStartMinute ?? 45;
      const recoveryRate = scenario.recoveryRules?.recoveryRatePerStep ?? 0.08;

      if (timeMinute >= autoRecoveryStart || hasIntervention) {
        // Can only recover if upstream dependencies are now healthy or intervention provided backup
        let upstreamBlocked = false;
        if (!hasIntervention) {
          for (const edge of upstreamEdges) {
            if (edge.recoveryDependency && currentHealth[edge.source] < edge.failureThreshold) {
              upstreamBlocked = true;
              break;
            }
          }
        }

        if (!upstreamBlocked && currentHealth[node.id] < 1.0) {
          const previousState = currentState[node.id];
          nextHealth[node.id] = Math.min(1.0, currentHealth[node.id] + recoveryRate);

          if (previousState !== 'RECOVERING' && nextHealth[node.id] < 0.95) {
            const evt: SimulationEvent = {
              timeMinute,
              nodeId: node.id,
              nodeName: node.name,
              eventType: 'RECOVERY_STARTED',
              message: `Restoration teams deployed to ${node.name}. Recovery in progress.`,
              hopDistance: hopDistanceMap[node.id] || 0,
            };
            stepEvents.push(evt);
            eventsLog.push(evt);
          } else if (nextHealth[node.id] >= 0.95 && previousState !== 'RESTORED' && previousState !== 'NORMAL') {
            const evt: SimulationEvent = {
              timeMinute,
              nodeId: node.id,
              nodeName: node.name,
              eventType: 'RECOVERY_COMPLETED',
              message: `${node.name} successfully restored to full operational capacity (100%).`,
              hopDistance: 0,
            };
            stepEvents.push(evt);
            eventsLog.push(evt);
          }
        }
      }
    }

    // Apply updated health and update state strings
    const activeFailed: string[] = [];
    const activeDegraded: string[] = [];
    const activeRecovering: string[] = [];
    let currentCascadeDepth = 0;
    let populationAtRisk = 0;

    for (const node of allNodes) {
      currentHealth[node.id] = Number(nextHealth[node.id].toFixed(2));
      const h = currentHealth[node.id];

      if (h >= 0.9) {
        currentState[node.id] = (timeMinute > 0 && currentState[node.id] === 'RECOVERING') ? 'RESTORED' : 'NORMAL';
      } else if (h >= 0.6) {
        currentState[node.id] = (currentState[node.id] === 'FAILED' || currentState[node.id] === 'DEGRADED') ? 'RECOVERING' : 'WARNING';
        activeDegraded.push(node.id);
      } else if (h >= 0.25) {
        currentState[node.id] = 'DEGRADED';
        activeDegraded.push(node.id);
      } else {
        currentState[node.id] = 'FAILED';
        activeFailed.push(node.id);
      }

      if (currentState[node.id] === 'RECOVERING') {
        activeRecovering.push(node.id);
      }

      // Count affected services & cascade depth
      if (h < 0.75) {
        populationAtRisk += node.populationServed;
        const hop = hopDistanceMap[node.id] || 0;
        if (hop > currentCascadeDepth) {
          currentCascadeDepth = hop;
        }
      }
    }

    const affectedCount = activeFailed.length + activeDegraded.length;
    const affectedPercent = Number(((affectedCount / Math.max(1, totalNodes)) * 100).toFixed(1));
    const resilienceScore = graph.computeResilienceScore(currentHealth);

    // Track peak stats
    if (resilienceScore < minResilience) {
      minResilience = resilienceScore;
      peakCascadeMinute = timeMinute;
    }
    if (currentCascadeDepth > maxCascadeDepth) maxCascadeDepth = currentCascadeDepth;
    if (affectedCount > maxAffectedServices) maxAffectedServices = affectedCount;
    if (populationAtRisk > maxPopulationAtRisk) maxPopulationAtRisk = populationAtRisk;

    if (!systemRecovered && timeMinute > 15 && resilienceScore >= 92 && affectedCount === 0) {
      estimatedRecoveryTimeMinutes = timeMinute;
      systemRecovered = true;
    }

    timeline.push({
      timeMinute,
      nodeHealthMap: { ...currentHealth },
      nodeStateMap: { ...currentState },
      activeFailedNodes: [...activeFailed],
      activeDegradedNodes: [...activeDegraded],
      activeRecoveringNodes: [...activeRecovering],
      cascadeDepth: currentCascadeDepth,
      affectedServicesCount: affectedCount,
      affectedServicesPercent: affectedPercent,
      populationAtRisk,
      cityResilienceScore: resilienceScore,
      eventsLog: stepEvents,
    });
  }

  if (!systemRecovered) {
    // If not fully recovered within duration, compute extrapolated recovery estimate
    const finalAffected = timeline[timeline.length - 1].affectedServicesCount;
    estimatedRecoveryTimeMinutes = duration + finalAffected * 15;
  }

  return {
    simulationId: `sim_${scenario.scenarioId}_${Date.now()}`,
    scenarioId: scenario.scenarioId,
    cityId: scenario.cityId,
    randomSeed,
    startedAt: new Date().toISOString(),
    durationMinutes: duration,
    timeStepMinutes: stepSize,
    nodes: allNodes,
    edges: graph.getAllEdges(),
    timeline,
    metricsSummary: {
      initialResilience: timeline[0]?.cityResilienceScore ?? 100,
      peakCascadeMinute,
      minResilience,
      maxCascadeDepth,
      maxAffectedServices,
      maxPopulationAtRisk,
      estimatedRecoveryTimeMinutes,
      totalEventsCount: eventsLog.length,
    },
    appliedInterventions,
  };
}
