'use client';

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Zap,
  Flame,
  Shield,
  Layers,
  Sparkles,
  MapPin,
  GitBranch,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  CityProfile,
  ScenarioDefinition,
  SimulationRun,
  TimestepState,
  InfrastructureNode,
  DependencyEdge,
} from '@/types/urbanpulse';
import { UrbanGraph } from '@/lib/engine/graph';
import { CityMap } from './CityMap';
import { InfrastructureGraph } from './InfrastructureGraph';

interface DashboardOverviewProps {
  city: CityProfile;
  scenario: ScenarioDefinition;
  simulation: SimulationRun;
  currentStepIndex: number;
  onSetStepIndex: (idx: number) => void;
  graph: UrbanGraph;
  selectedNode: InfrastructureNode | null;
  onSelectNode: (node: InfrastructureNode) => void;
  onNavigateToTab: (tab: any) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  city,
  scenario,
  simulation,
  currentStepIndex,
  onSetStepIndex,
  graph,
  selectedNode,
  onSelectNode,
  onNavigateToTab,
}) => {
  const [viewMode, setViewMode] = useState<'map' | 'graph'>('map');
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const currentStep = simulation.timeline[currentStepIndex] || simulation.timeline[0];
  const chartData = simulation.timeline.map((step) => ({
    minute: step.timeMinute,
    resilience: step.cityResilienceScore,
    affectedCount: step.affectedServicesCount,
    populationAtRisk: Math.round(step.populationAtRisk / 1000), // in thousands
  }));

  const handleGenerateAiPostMortem = async () => {
    setIsGeneratingAi(true);
    try {
      const peakStep = simulation.timeline.find(
        (t) => t.timeMinute === simulation.metricsSummary.peakCascadeMinute
      ) || simulation.timeline[0];

      const res = await fetch('/api/gemini/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cityName: city.cityName,
          scenarioName: scenario.name,
          metricsSummary: simulation.metricsSummary,
          peakAffectedNodes: [...peakStep.activeFailedNodes, ...peakStep.activeDegradedNodes],
          initialFailures: scenario.initialFailures,
        }),
      });

      const data = await res.json();
      setAiExplanation(data.explanation || data.error);
    } catch (err) {
      console.error('Error fetching AI post-mortem:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top Split Layout: Interactive Visualizer (Map / Graph) + Right Incident Status Panel */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left 8 Cols: Dual View (Map / Graph) */}
        <div className="lg:col-span-8 flex flex-col gap-2.5">
          {/* View Toggle Bar */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-[#141518] p-1">
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] transition-all ${
                  viewMode === 'map'
                    ? 'bg-white text-black font-extrabold shadow-sm'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>GEOSPATIAL MAP</span>
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] transition-all ${
                  viewMode === 'graph'
                    ? 'bg-white text-black font-extrabold shadow-sm'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <GitBranch className="h-3.5 w-3.5" />
                <span>CASCADE GRAPH</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/50 font-mono">
              <span className="uppercase tracking-widest text-[10px]">TIMESTEP:</span>
              <span className="font-display font-black text-sm text-white">T+{String(currentStep.timeMinute).padStart(3, '0')}M</span>
            </div>
          </div>

          {/* Visualizer Frame */}
          {viewMode === 'map' ? (
            <CityMap
              city={city}
              nodes={simulation.nodes}
              edges={simulation.edges}
              currentStep={currentStep}
              onSelectNode={onSelectNode}
              selectedNode={selectedNode}
            />
          ) : (
            <InfrastructureGraph
              nodes={simulation.nodes}
              edges={simulation.edges}
              currentStep={currentStep}
              onSelectNode={onSelectNode}
              selectedNode={selectedNode}
              graph={graph}
            />
          )}
        </div>

        {/* Right 4 Cols: Active Node Status & Inspector Panel */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Node Inspector Card */}
          <div className="rounded-xl border border-white/10 bg-[#141518] p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-[1px] bg-white/40"></div>
                  <span className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-[0.25em] flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-white" />
                    NODE INSPECTOR
                  </span>
                </div>
                {selectedNode && (
                  <span className="rounded-full bg-white/10 border border-white/20 px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-white">
                    {selectedNode.category.split('_')[0]}
                  </span>
                )}
              </div>

              {selectedNode ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <h4 className="font-display text-base font-black tracking-tight text-white">{selectedNode.name}</h4>
                    <p className="text-xs text-white/50 mt-0.5 font-mono uppercase tracking-wider">{selectedNode.type} &bull; {selectedNode.address || selectedNode.category}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-[#1A1B1E] p-3 rounded-lg border border-white/10">
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase tracking-widest">Health:</span>
                      <span
                        className={`font-display font-black text-base ${
                          (currentStep.nodeHealthMap[selectedNode.id] ?? 1.0) < 0.5
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {Math.round((currentStep.nodeHealthMap[selectedNode.id] ?? 1.0) * 100)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase tracking-widest">Status:</span>
                      <span className="font-bold text-white">
                        {currentStep.nodeStateMap[selectedNode.id] ?? 'NORMAL'}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase tracking-widest">Criticality:</span>
                      <span className="font-bold text-white">{selectedNode.criticalityScore} / 100</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase tracking-widest">Pop. Served:</span>
                      <span className="font-bold text-white">
                        {selectedNode.populationServed.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase tracking-widest">Capacity:</span>
                      <span className="font-bold text-white/90">
                        {selectedNode.capacity.toLocaleString()} {selectedNode.capacityUnit}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[10px] uppercase tracking-widest">Repair Time:</span>
                      <span className="font-bold text-white/90">{selectedNode.repairTimeMinutes} min</span>
                    </div>
                  </div>

                  {/* Provenance Citation Badge */}
                  <div className="rounded-lg border border-white/10 bg-[#1A1B1E] p-2.5 text-[10px] text-white/70 font-mono">
                    <span className="text-white/40 uppercase tracking-widest block text-[9px] mb-0.5">GROUNDING SOURCE:</span>
                    {selectedNode.source} ({selectedNode.provenance})
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs font-mono uppercase tracking-wider text-white/40">
                  Select any node on map or graph to inspect operational parameters.
                </div>
              )}
            </div>

            {/* Quick Action to Optimizer */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <button
                onClick={() => onNavigateToTab('ai-optimizer')}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-white text-black p-2.5 text-xs font-black uppercase tracking-[0.15em] hover:bg-white/90 transition-all cursor-pointer shadow-md"
              >
                <Sparkles className="h-3.5 w-3.5 fill-black" />
                <span>LAUNCH AI RESPONSE OPTIMIZER &rarr;</span>
              </button>
            </div>
          </div>

          {/* Active Degraded Nodes List */}
          <div className="rounded-xl border border-white/10 bg-[#141518] p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-[1px] bg-white/40"></div>
                <span className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-[0.25em] flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  DISRUPTED NODES ({currentStep.affectedServicesCount})
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-white/40">T={currentStep.timeMinute}M</span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[160px] space-y-2 pr-1">
              {simulation.nodes
                .filter((n) => (currentStep.nodeHealthMap[n.id] ?? 1.0) < 0.95)
                .map((node) => {
                  const health = currentStep.nodeHealthMap[node.id] ?? 1.0;
                  const state = currentStep.nodeStateMap[node.id] ?? 'NORMAL';

                  return (
                    <div
                      key={node.id}
                      onClick={() => onSelectNode(node)}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-[#1A1B1E] p-2.5 text-xs hover:border-white/30 cursor-pointer transition-colors"
                    >
                      <div className="truncate mr-2">
                        <span className="font-bold text-white block truncate">{node.name}</span>
                        <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider">{node.category}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`font-display font-black text-xs ${
                            health < 0.3 ? 'text-rose-400' : 'text-amber-400'
                          }`}
                        >
                          {Math.round(health * 100)}%
                        </span>
                        <span className="block text-[9px] font-mono uppercase tracking-wider text-white/40">{state}</span>
                      </div>
                    </div>
                  );
                })}
              {currentStep.affectedServicesCount === 0 && (
                <div className="py-6 text-center text-xs text-white/60 font-mono uppercase tracking-wider">
                  &check; All infrastructure nodes operating at 100% capacity.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Dynamic Resilience Progression Chart + Gemini AI Post-Mortem Card */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left 7 Cols: Time-Series Resilience & Cascade Area Chart */}
        <div className="lg:col-span-7 rounded-xl border border-white/10 bg-[#141518] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-[1px] bg-white/40"></div>
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-white/50">
                01/TIME-SERIES RESILIENCE CURVE
              </h4>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-white">
                <span className="h-2 w-2 rounded-full bg-white"></span> Resilience (/100)
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="h-2 w-2 rounded-full bg-rose-500"></span> Disrupted Nodes
              </span>
            </div>
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="resilienceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="affectedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="minute"
                  tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={(val) => `t=${val}m`}
                />
                <YAxis tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'JetBrains Mono' }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F1012',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#FFFFFF',
                    fontFamily: 'JetBrains Mono',
                  }}
                  formatter={(value: any, name: any) => [
                    value,
                    name === 'resilience' ? 'Resilience Score' : 'Disrupted Nodes',
                  ]}
                  labelFormatter={(label) => `Timestamp: T+${label} Minutes`}
                />
                <ReferenceLine x={currentStep.timeMinute} stroke="#FFFFFF" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="resilience"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#resilienceGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="affectedCount"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#affectedGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 5 Cols: Gemini AI Incident Post-Mortem Box */}
        <div className="lg:col-span-5 rounded-xl border border-white/15 bg-[#141518] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-[1px] bg-white/40"></div>
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-white/50">
                  02/GEMINI 3.7 FLASH POST-MORTEM
                </h4>
              </div>

              <button
                onClick={handleGenerateAiPostMortem}
                disabled={isGeneratingAi}
                className="rounded-full bg-white text-black px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] hover:bg-white/90 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isGeneratingAi ? 'ANALYZING...' : 'EXPLAIN CASCADE'}
              </button>
            </div>

            <div className="text-xs text-white/80 leading-relaxed max-h-[160px] overflow-y-auto pr-1">
              {aiExplanation ? (
                <div className="whitespace-pre-line bg-[#1A1B1E] p-3 rounded-lg border border-white/10 font-sans">
                  {aiExplanation}
                </div>
              ) : (
                <div className="text-white/60 bg-[#1A1B1E] p-3 rounded-lg border border-white/10">
                  <p className="font-bold text-white mb-1 uppercase tracking-wider text-[11px]">Systemic Cascade Attribution</p>
                  <p>
                    PG&E Potrero Substation (115kV infeed) failure at t=0m precipitated multi-hop power loss
                    to traffic signals and Muni transit. Click &ldquo;EXPLAIN CASCADE&rdquo; to trigger server-side Gemini 3.7 Flash AI analysis.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40 font-mono">
            <span>@google/genai &bull; Gemini 3.7 Flash</span>
            <span className="text-white/80 uppercase tracking-widest text-[9px] font-bold">Server Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
