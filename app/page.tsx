'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar, ActiveTab } from '@/components/Navbar';
import { LiveTelemetry } from '@/components/LiveTelemetry';
import { SimulationControls } from '@/components/SimulationControls';
import { DashboardOverview } from '@/components/DashboardOverview';
import { CityMap } from '@/components/CityMap';
import { InfrastructureGraph } from '@/components/InfrastructureGraph';
import { CriticalNodesPanel } from '@/components/CriticalNodesPanel';
import { InterventionOptimizer } from '@/components/InterventionOptimizer';
import { ScenarioLab } from '@/components/ScenarioLab';
import { DataProvenanceView } from '@/components/DataProvenanceView';
import { CommandCenterModal } from '@/components/CommandCenterModal';
import { SimulationReportModal } from '@/components/SimulationReportModal';
import { AlgorithmExplainerModal } from '@/components/AlgorithmExplainerModal';

import {
  CityProfile,
  ScenarioDefinition,
  SimulationRun,
  InfrastructureNode,
  WeatherData,
} from '@/types/urbanpulse';
import { CITIES_LIST, getCityProfile } from '@/lib/data/cities';
import { SCENARIOS_LIBRARY, getScenariosForCity } from '@/lib/data/scenarios';
import { UrbanGraph } from '@/lib/engine/graph';
import { runCascadeSimulation } from '@/lib/engine/cascade';
import { optimizeInterventions, OptimizationResult } from '@/lib/engine/optimizer';
import { getCachedFallbackWeather } from '@/lib/weather/open-meteo';

export default function UrbanPulsePage() {
  // Active Navigation & View State
  const [currentTab, setCurrentTab] = useState<ActiveTab>('dashboard');
  const [selectedCityId, setSelectedCityId] = useState<string>('san_francisco');
  const [allScenarios, setAllScenarios] = useState<ScenarioDefinition[]>(SCENARIOS_LIBRARY);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('sc_sf_heavy_rain_power_telecom');

  // Simulation Timeline & Playback State
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [simulationSeed, setSimulationSeed] = useState<number>(4207);

  // Selected Node for Inspection
  const [selectedNode, setSelectedNode] = useState<InfrastructureNode | null>(null);

  // Weather & Environmental Telemetry
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // Optimization Result
  const [optResult, setOptResult] = useState<OptimizationResult | null>(null);

  // Modals
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isAlgorithmModalOpen, setIsAlgorithmModalOpen] = useState<boolean>(false);

  // 1. Resolve City Profile
  const currentCity = useMemo(() => {
    return getCityProfile(selectedCityId);
  }, [selectedCityId]);

  // 2. Resolve Graph Engine
  const graph = useMemo(() => {
    return new UrbanGraph(currentCity.nodes || [], currentCity.edges || []);
  }, [currentCity]);

  // 3. Resolve Current Scenario
  const currentScenario = useMemo(() => {
    const found = allScenarios.find((s) => s.scenarioId === selectedScenarioId);
    if (found) return found;
    return allScenarios[0];
  }, [allScenarios, selectedScenarioId]);

  // 4. Run Cascade Simulation Engine
  const simulation: SimulationRun = useMemo(() => {
    return runCascadeSimulation({
      graph,
      scenario: currentScenario,
      appliedInterventions: optResult?.recommendedInterventions || [],
      randomSeed: simulationSeed,
    });
  }, [graph, currentScenario, optResult, simulationSeed]);

  const currentStep = simulation.timeline[currentStepIndex] || simulation.timeline[0];

  // Derive active selected node safely without synchronous effect state updates
  const activeSelectedNode = useMemo(() => {
    const nodes = currentCity.nodes || [];
    if (selectedNode && nodes.some((n) => n.id === selectedNode.id)) {
      return selectedNode;
    }
    return nodes[0] || null;
  }, [selectedNode, currentCity.nodes]);

  // Fetch live weather when city changes
  useEffect(() => {
    fetch(`/api/weather?lat=${currentCity.latitude}&lon=${currentCity.longitude}&city=${currentCity.cityName}`)
      .then((res) => res.json())
      .then((data) => setWeather(data))
      .catch(() => setWeather(getCachedFallbackWeather(currentCity.cityName)));
  }, [currentCity.latitude, currentCity.longitude, currentCity.cityName]);

  // Auto-play timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      const ms = Math.max(150, 1000 / playbackSpeed);
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= simulation.timeline.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, ms);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, simulation.timeline.length]);

  // City Switch Handler
  const handleSelectCity = (cityId: string) => {
    setSelectedCityId(cityId);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setOptResult(null);

    const cityScenarios = getScenariosForCity(cityId);
    if (cityScenarios.length > 0) {
      setSelectedScenarioId(cityScenarios[0].scenarioId);
    }
  };

  // Scenario Switch Handler
  const handleSelectScenario = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setOptResult(null);
  };

  // Custom Failure Injection Handler
  const handleInjectCustomFailure = (nodeId: string, degradedHealth: number, reason: string) => {
    const updatedFailures = [
      ...currentScenario.initialFailures.filter((f) => f.nodeId !== nodeId),
      { nodeId, degradedHealth, reason },
    ];

    const updatedSc: ScenarioDefinition = {
      ...currentScenario,
      initialFailures: updatedFailures,
    };

    setAllScenarios((prev) =>
      prev.map((s) => (s.scenarioId === currentScenario.scenarioId ? updatedSc : s))
    );
    setCurrentStepIndex(0);
  };

  // Jump to Peak Cascade
  const handleJumpToPeak = () => {
    const peakMinute = simulation.metricsSummary.peakCascadeMinute;
    const idx = simulation.timeline.findIndex((t) => t.timeMinute >= peakMinute);
    if (idx !== -1) {
      setCurrentStepIndex(idx);
    }
  };

  // Jump to Specific Minute
  const handleJumpToMinute = useCallback((minute: number) => {
    const idx = simulation.timeline.findIndex((t) => t.timeMinute >= minute);
    if (idx !== -1) {
      setCurrentStepIndex(idx);
    }
  }, [simulation.timeline]);

  // Trigger Automatic Optimization
  const handleTriggerOptimization = useCallback(() => {
    const result = optimizeInterventions(graph, currentScenario, {
      budgetINR: 1500000,
      repairTeams: 4,
      mobileGenerators: 2,
      trafficControllers: 3,
      emergencyCrews: 4,
    });
    setOptResult(result);
  }, [graph, currentScenario]);

  // Add Custom Scenario
  const handleAddCustomScenario = (newSc: ScenarioDefinition) => {
    setAllScenarios((prev) => [newSc, ...prev]);
    setSelectedScenarioId(newSc.scenarioId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Universal Command Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        selectedCity={currentCity}
        availableCities={CITIES_LIST}
        onSelectCity={handleSelectCity}
        resilienceScore={currentStep.cityResilienceScore}
        onOpenCommandCenter={() => setIsCommandCenterOpen(true)}
        onOpenAlgorithmModal={() => setIsAlgorithmModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        isSimulating={isPlaying}
      />

      {/* Main Command Workspace */}
      <main className="flex-1 px-4 py-4 max-w-[1600px] w-full mx-auto flex flex-col gap-4">
        {/* Real-Time Telemetry Bar */}
        <LiveTelemetry
          currentStep={currentStep}
          scenario={currentScenario}
          weather={weather}
          totalServices={simulation.nodes.length}
          maxCascadeDepth={simulation.metricsSummary.maxCascadeDepth}
          estimatedRecoveryTime={simulation.metricsSummary.estimatedRecoveryTimeMinutes}
        />

        {/* Global Simulation Timeline Controls */}
        <SimulationControls
          scenario={currentScenario}
          scenariosList={allScenarios.filter((s) => s.cityId === currentCity.cityId || s.cityId === 'all')}
          onSelectScenario={handleSelectScenario}
          timeline={simulation.timeline}
          currentStepIndex={currentStepIndex}
          onSetStepIndex={setCurrentStepIndex}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          playbackSpeed={playbackSpeed}
          onChangeSpeed={setPlaybackSpeed}
          onReset={() => {
            setCurrentStepIndex(0);
            setIsPlaying(false);
          }}
          onJumpToPeak={handleJumpToPeak}
          nodes={simulation.nodes}
          onInjectCustomFailure={handleInjectCustomFailure}
          simulationSeed={simulationSeed}
          onChangeSeed={(seed) => setSimulationSeed(seed)}
        />

        {/* Dynamic Tab Views */}
        <div className="flex-1">
          {currentTab === 'dashboard' && (
            <DashboardOverview
              city={currentCity}
              scenario={currentScenario}
              simulation={simulation}
              currentStepIndex={currentStepIndex}
              onSetStepIndex={setCurrentStepIndex}
              graph={graph}
              selectedNode={activeSelectedNode}
              onSelectNode={setSelectedNode}
              onNavigateToTab={setCurrentTab}
            />
          )}

          {currentTab === 'simulator' && (
            <DashboardOverview
              city={currentCity}
              scenario={currentScenario}
              simulation={simulation}
              currentStepIndex={currentStepIndex}
              onSetStepIndex={setCurrentStepIndex}
              graph={graph}
              selectedNode={activeSelectedNode}
              onSelectNode={setSelectedNode}
              onNavigateToTab={setCurrentTab}
            />
          )}

          {currentTab === 'map' && (
            <div className="flex flex-col gap-3">
              <CityMap
                city={currentCity}
                nodes={simulation.nodes}
                edges={simulation.edges}
                currentStep={currentStep}
                onSelectNode={setSelectedNode}
                selectedNode={activeSelectedNode}
              />
            </div>
          )}

          {currentTab === 'graph' && (
            <div className="flex flex-col gap-3">
              <InfrastructureGraph
                nodes={simulation.nodes}
                edges={simulation.edges}
                currentStep={currentStep}
                onSelectNode={setSelectedNode}
                selectedNode={activeSelectedNode}
                graph={graph}
              />
            </div>
          )}

          {currentTab === 'critical-nodes' && (
            <CriticalNodesPanel
              graph={graph}
              onSelectNode={setSelectedNode}
              selectedNode={activeSelectedNode}
            />
          )}

          {currentTab === 'ai-optimizer' && (
            <InterventionOptimizer
              graph={graph}
              scenario={currentScenario}
              cityName={currentCity.cityName}
              onApplyOptimizedPlan={(res) => setOptResult(res)}
            />
          )}

          {currentTab === 'scenarios' && (
            <ScenarioLab
              currentScenario={currentScenario}
              onSelectScenario={handleSelectScenario}
              nodes={simulation.nodes}
              cityId={currentCity.cityId}
              onAddCustomScenario={handleAddCustomScenario}
            />
          )}

          {currentTab === 'provenance' && <DataProvenanceView />}
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-2.5 text-xs text-slate-500">
        <div className="mx-auto max-w-[1600px] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400 font-medium">URBANPULSE Real-Time Infrastructure Resilience System</span>
            <span className="text-slate-600">&bull;</span>
            <span className="font-mono text-[11px]">Engine: Graph Cascade v2.4 + Gemini 3.7 Flash</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Model: Deterministic &bull; Seed: {simulationSeed}</span>
            <span className="text-cyan-400 font-semibold">100% Real-World Grounded Topologies</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CommandCenterModal
        isOpen={isCommandCenterOpen}
        onClose={() => setIsCommandCenterOpen(false)}
        city={currentCity}
        scenario={currentScenario}
        timeline={simulation.timeline}
        optResult={optResult}
        onJumpToMinute={handleJumpToMinute}
        onTriggerOptimization={handleTriggerOptimization}
      />

      <SimulationReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        city={currentCity}
        scenario={currentScenario}
        simulation={simulation}
        optResult={optResult}
      />

      <AlgorithmExplainerModal
        isOpen={isAlgorithmModalOpen}
        onClose={() => setIsAlgorithmModalOpen(false)}
      />
    </div>
  );
}
