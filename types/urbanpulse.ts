export type ProvenanceType =
  | 'OBSERVED'
  | 'OPEN_DATA'
  | 'API_DATA'
  | 'DERIVED'
  | 'SIMULATED'
  | 'ASSUMED'
  | 'DOMAIN_MODEL';

export type NodeState =
  | 'NORMAL'
  | 'WARNING'
  | 'DEGRADED'
  | 'FAILED'
  | 'RECOVERING'
  | 'RESTORED';

export type DependencyType =
  | 'POWER'
  | 'WATER'
  | 'TELECOM'
  | 'TRANSPORT'
  | 'COMMUNICATION'
  | 'EMERGENCY'
  | 'LOGISTICS'
  | 'DIGITAL'
  | 'PHYSICAL'
  | 'OPERATIONAL';

export type InfrastructureCategory =
  | 'POWER_GRID'
  | 'WATER_SYSTEM'
  | 'HEALTHCARE'
  | 'EMERGENCY_SERVICES'
  | 'TRANSPORTATION'
  | 'TELECOMMUNICATIONS'
  | 'FINANCE_BANKING'
  | 'PUBLIC_SAFETY'
  | 'WASTE_MANAGEMENT';

export interface InfrastructureNode {
  id: string;
  name: string;
  category: InfrastructureCategory;
  type: string;
  latitude: number;
  longitude: number;
  capacity: number; // e.g. MWh, Liters/sec, Beds, Vehicles
  capacityUnit: string;
  importance: number; // 1 to 5 (5 is critical)
  populationServed: number;
  failureProbability: number; // 0.0 to 1.0
  repairTimeMinutes: number; // typical time to restore manually
  costToRepairINR?: number; // monetary estimate (labeled assumed)
  currentState: NodeState;
  healthScore: number; // 0.00 to 1.00
  criticalityScore: number; // 0 to 100 (computed)
  cascadeRiskScore: number; // 0 to 100 (computed)
  dataQualityScore: number; // 0 to 100
  source: string;
  sourceUrl?: string;
  publisher?: string;
  provenance: ProvenanceType;
  lastUpdated: string;
  address?: string;
  notes?: string;
}

export interface DependencyEdge {
  id: string;
  source: string; // Upstream node id (e.g. Substation)
  target: string; // Downstream node id (e.g. Hospital)
  dependencyType: DependencyType;
  dependencyStrength: number; // 0.0 to 1.0 (weight of dependency)
  failureThreshold: number; // Upstream health below this triggers cascade (e.g. 0.4)
  propagationDelayMinutes: number; // time delay before downstream is impacted
  recoveryDependency: boolean; // Does downstream require upstream to be restored first?
  confidence: number; // 0.0 to 1.0
  provenance: ProvenanceType;
  description?: string;
}

export interface CityProfile {
  cityId: string;
  cityName: string;
  country: string;
  latitude: number;
  longitude: number;
  zoom: number;
  boundaryName: string;
  population: number;
  areaSqKm: number;
  description: string;
  dataSources: DataSourceInfo[];
  nodes?: InfrastructureNode[];
  edges?: DependencyEdge[];
}

export interface DataSourceInfo {
  id: string;
  name: string;
  type: 'OpenStreetMap' | 'Weather API' | 'Municipal Open Data' | 'Environmental / NOAA' | 'Domain Expert Model';
  publisher: string;
  url: string;
  retrievalDate: string;
  license: string;
  recordCount: number;
  freshness: 'LIVE' | 'HOURLY' | 'STATIC_SNAPSHOT' | 'HOURLY_SYNCED';
  provenance: ProvenanceType;
  status: 'CONNECTED' | 'CACHED' | 'FALLBACK';
}

export interface WeatherData {
  temperatureC: number;
  precipitationMm: number;
  windSpeedKmh: number;
  weatherCode: number;
  weatherDescription: string;
  isFloodRisk: boolean;
  isStormRisk: boolean;
  isHeatwaveRisk: boolean;
  source: 'Open-Meteo LIVE' | 'Open-Meteo Cached' | 'Synthetic Scenario';
  timestamp: string;
}

export interface ScenarioDefinition {
  scenarioId: string;
  name: string;
  category: 'Natural Disaster' | 'Power Failure' | 'Cyber-Physical' | 'Multi-Vector' | 'Transit Failure';
  description: string;
  cityId: string;
  initialFailures: {
    nodeId: string;
    degradedHealth: number; // e.g. 0.0 for failed
    reason: string;
  }[];
  environmentalConditions: {
    rainfallMm: number;
    windKmh: number;
    temperatureC: number;
    floodAlert: boolean;
  };
  simulationSeed: number;
  durationMinutes: number;
  timeStepMinutes: number;
  recoveryRules: {
    autoRecoveryStartMinute: number;
    recoveryRatePerStep: number;
  };
  createdAt: string;
}

export interface TimestepState {
  timeMinute: number;
  nodeHealthMap: Record<string, number>;
  nodeStateMap: Record<string, NodeState>;
  activeFailedNodes: string[];
  activeDegradedNodes: string[];
  activeRecoveringNodes: string[];
  cascadeDepth: number;
  affectedServicesCount: number;
  affectedServicesPercent: number;
  populationAtRisk: number;
  cityResilienceScore: number;
  eventsLog: SimulationEvent[];
}

export interface SimulationEvent {
  timeMinute: number;
  nodeId: string;
  nodeName: string;
  eventType: 'FAILURE' | 'CASCADE_DEGRADATION' | 'RECOVERY_STARTED' | 'RECOVERY_COMPLETED' | 'INTERVENTION_APPLIED';
  message: string;
  upstreamCauseNodeId?: string;
  hopDistance: number;
}

export interface MetricsSummary {
  initialResilience: number;
  peakCascadeMinute: number;
  minResilience: number;
  maxCascadeDepth: number;
  maxAffectedServices: number;
  maxPopulationAtRisk: number;
  estimatedRecoveryTimeMinutes: number;
  totalEventsCount: number;
}

export interface SimulationRun {
  simulationId: string;
  scenarioId: string;
  cityId: string;
  randomSeed: number;
  startedAt: string;
  durationMinutes: number;
  timeStepMinutes: number;
  nodes: InfrastructureNode[];
  edges: DependencyEdge[];
  timeline: TimestepState[];
  metricsSummary: MetricsSummary;
  appliedInterventions: (InterventionAction | InterventionCandidate)[];
}

export interface InterventionCandidate {
  id: string;
  name: string;
  targetNodeId: string;
  actionType:
    | 'RESTORE_SUBSTATION'
    | 'DEPLOY_MOBILE_GENERATOR'
    | 'REROUTE_EMERGENCY_TRAFFIC'
    | 'ACTIVATE_EMERGENCY_TRAFFIC_SYSTEM'
    | 'ISOLATE_FAULT_DEPENDENCY'
    | 'RESTORE_TELECOM_TOWER'
    | 'ACTIVATE_BACKUP_WATER_PUMP'
    | 'PRIORITIZE_HOSPITAL_POWER'
    | 'ESTABLISH_ALTERNATE_TRANSIT';
  costINR: number;
  repairTimeMinutes: number;
  requiredTeams: number;
  servicesRestoredCount: number;
  populationBenefited: number;
  resilienceImprovement: number;
  recoveryTimeReductionMinutes: number;
  cascadeDepthReduction: number;
  roiScore: number; // computed optimization ranking score
  confidence: number;
  priorityRank: number;
  rationale: string;
}

export interface InterventionAction {
  interventionId: string;
  appliedAtMinute: number;
  targetNodeId: string;
  actionType: string;
  costINR: number;
  status: 'APPLIED' | 'PENDING';
}

export interface ResourceConstraints {
  budgetINR: number;
  repairTeams: number;
  mobileGenerators: number;
  trafficControllers: number;
  emergencyCrews: number;
}

export interface CriticalNodeAnalysis {
  nodeId: string;
  nodeName: string;
  category: InfrastructureCategory;
  criticalityScore: number;
  downstreamReachCount: number;
  betweennessCentrality: number;
  degreeCentrality: number;
  populationExposure: number;
  serviceImportance: number;
  failureProbability: number;
  repairTimeMinutes: number;
  reasons: string[];
}
