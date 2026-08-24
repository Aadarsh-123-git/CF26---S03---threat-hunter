import { ScenarioDefinition } from '@/types/urbanpulse';

export const SCENARIOS_LIBRARY: ScenarioDefinition[] = [
  {
    scenarioId: 'sc_sf_heavy_rain_power_telecom',
    name: 'Hackathon Master: Heavy Rain + Substation Failure + Telecom Degradation',
    category: 'Multi-Vector',
    description: 'Catastrophic atmospheric river storm causes severe flooding at PG&E Potrero Substation and fiber severances at SF-IX, triggering a 4-tier cascading breakdown across traffic, hospitals, and emergency dispatch.',
    cityId: 'san_francisco',
    initialFailures: [
      {
        nodeId: 'sf_pwr_potrero',
        degradedHealth: 0.0,
        reason: 'Storm surge inundation and transformer ground-fault at 115kV bay',
      },
      {
        nodeId: 'sf_tel_sfixp',
        degradedHealth: 0.25,
        reason: 'Subsurface fiber conduit flooding and optical amplifier degradation',
      },
    ],
    environmentalConditions: {
      rainfallMm: 85.4,
      windKmh: 68.0,
      temperatureC: 13.5,
      floodAlert: true,
    },
    simulationSeed: 4207,
    durationMinutes: 120,
    timeStepMinutes: 5,
    recoveryRules: {
      autoRecoveryStartMinute: 50,
      recoveryRatePerStep: 0.08,
    },
    createdAt: '2026-08-24T00:00:00Z',
  },
  {
    scenarioId: 'sc_sf_power_grid_cascade',
    name: 'Power Substation Trip & Rapid Transit Cascade',
    category: 'Power Failure',
    description: 'Sudden electrical busbar failure at Potrero Substation shuts down Muni Metro traction power and blackouts central traffic signal controllers.',
    cityId: 'san_francisco',
    initialFailures: [
      {
        nodeId: 'sf_pwr_potrero',
        degradedHealth: 0.0,
        reason: 'High-voltage busbar trip and oil circuit breaker lockout',
      },
    ],
    environmentalConditions: {
      rainfallMm: 2.0,
      windKmh: 18.0,
      temperatureC: 17.0,
      floodAlert: false,
    },
    simulationSeed: 1089,
    durationMinutes: 90,
    timeStepMinutes: 5,
    recoveryRules: {
      autoRecoveryStartMinute: 40,
      recoveryRatePerStep: 0.10,
    },
    createdAt: '2026-08-20T00:00:00Z',
  },
  {
    scenarioId: 'sc_sf_atmospheric_flood',
    name: 'Severe Flash Flood & Water Pumping Infrastructure Breakdown',
    category: 'Natural Disaster',
    description: 'Unprecedented rainfall inundates SFPUC Mission booster pumps, causing high-pressure hydrant pressure loss and urban traffic stagnation.',
    cityId: 'san_francisco',
    initialFailures: [
      {
        nodeId: 'sf_wtr_pulgas_pump',
        degradedHealth: 0.0,
        reason: 'Stormwater overflow pump chamber flooding and electrical motor short',
      },
      {
        nodeId: 'sf_trn_traffic_signals',
        degradedHealth: 0.20,
        reason: 'Submerged intersection controller cabinets across low-lying districts',
      },
    ],
    environmentalConditions: {
      rainfallMm: 110.0,
      windKmh: 55.0,
      temperatureC: 12.0,
      floodAlert: true,
    },
    simulationSeed: 3341,
    durationMinutes: 120,
    timeStepMinutes: 5,
    recoveryRules: {
      autoRecoveryStartMinute: 60,
      recoveryRatePerStep: 0.06,
    },
    createdAt: '2026-08-15T00:00:00Z',
  },
  {
    scenarioId: 'sc_sf_telecom_blackout',
    name: 'Metropolitan Optical Backbone & CAD Emergency Dispatch Failure',
    category: 'Cyber-Physical',
    description: 'Physical fiber severance at 365 Main and radio repeater outage at Twin Peaks degrades police/fire computer-aided dispatch and banking settlement.',
    cityId: 'san_francisco',
    initialFailures: [
      {
        nodeId: 'sf_tel_sfixp',
        degradedHealth: 0.0,
        reason: 'Main optical trunk physical severance during unauthorized excavation',
      },
      {
        nodeId: 'sf_tel_twin_peaks',
        degradedHealth: 0.30,
        reason: 'Microwave relay dish alignment failure during high wind shear',
      },
    ],
    environmentalConditions: {
      rainfallMm: 0.0,
      windKmh: 42.0,
      temperatureC: 15.0,
      floodAlert: false,
    },
    simulationSeed: 7782,
    durationMinutes: 90,
    timeStepMinutes: 5,
    recoveryRules: {
      autoRecoveryStartMinute: 35,
      recoveryRatePerStep: 0.12,
    },
    createdAt: '2026-08-18T00:00:00Z',
  },
  {
    scenarioId: 'sc_ldn_bankside_flood',
    name: 'London: Bankside Substation Grid Outage & Tube Stagnation',
    category: 'Power Failure',
    description: 'National Grid Bankside transformer trip halts Bank-Monument underground lines and cascades to St Thomas Hospital emergency trauma unit.',
    cityId: 'london',
    initialFailures: [
      {
        nodeId: 'ldn_pwr_bankside',
        degradedHealth: 0.0,
        reason: '132kV underground feeder thermal overload and transformer lockout',
      },
    ],
    environmentalConditions: {
      rainfallMm: 35.0,
      windKmh: 45.0,
      temperatureC: 11.0,
      floodAlert: false,
    },
    simulationSeed: 5521,
    durationMinutes: 100,
    timeStepMinutes: 5,
    recoveryRules: {
      autoRecoveryStartMinute: 45,
      recoveryRatePerStep: 0.09,
    },
    createdAt: '2026-08-22T00:00:00Z',
  },
  {
    scenarioId: 'sc_sg_tuas_blackout',
    name: 'Singapore: Tuas Infeed Trip & Marina Stormwater Pump Outage',
    category: 'Multi-Vector',
    description: 'High-voltage feeder trip at Tuas Power coupled with torrential tropical downpour strains SGH emergency department and expressway traffic.',
    cityId: 'singapore',
    initialFailures: [
      {
        nodeId: 'sg_pwr_tuas',
        degradedHealth: 0.0,
        reason: 'Underground gas turbine trip and 230kV busbar protection activation',
      },
    ],
    environmentalConditions: {
      rainfallMm: 95.0,
      windKmh: 35.0,
      temperatureC: 28.0,
      floodAlert: true,
    },
    simulationSeed: 9912,
    durationMinutes: 100,
    timeStepMinutes: 5,
    recoveryRules: {
      autoRecoveryStartMinute: 40,
      recoveryRatePerStep: 0.10,
    },
    createdAt: '2026-08-23T00:00:00Z',
  },
  {
    scenarioId: 'sc_mum_monsoon_surge',
    name: 'Mumbai: Monsoon Surge, Dharavi Substation Trip & Railway Inundation',
    category: 'Natural Disaster',
    description: 'Severe monsoon high tide and Dharavi 220kV infeed trip halts Churchgate Western Railway signals and disables Love Grove flood pump outfall.',
    cityId: 'mumbai',
    initialFailures: [
      {
        nodeId: 'mum_pwr_dharavi',
        degradedHealth: 0.0,
        reason: 'Waterlogged switchyard and high-voltage feeder trip during extreme rainfall',
      },
      {
        nodeId: 'mum_wtr_lovegrove',
        degradedHealth: 0.20,
        reason: 'Trash rack blockage and electrical drive failure during tidal surge',
      },
    ],
    environmentalConditions: {
      rainfallMm: 145.0,
      windKmh: 75.0,
      temperatureC: 26.0,
      floodAlert: true,
    },
    simulationSeed: 8834,
    durationMinutes: 120,
    timeStepMinutes: 5,
    recoveryRules: {
      autoRecoveryStartMinute: 55,
      recoveryRatePerStep: 0.07,
    },
    createdAt: '2026-08-24T00:00:00Z',
  },
];

export function getScenariosForCity(cityId: string): ScenarioDefinition[] {
  const list = SCENARIOS_LIBRARY.filter((s) => s.cityId === cityId);
  if (list.length > 0) return list;
  return SCENARIOS_LIBRARY;
}
