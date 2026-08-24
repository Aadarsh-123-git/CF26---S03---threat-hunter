'use client';

import React, { useState } from 'react';
import {
  Wand2,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Cpu,
  Layers,
  FileCheck,
} from 'lucide-react';
import {
  ScenarioDefinition,
  ResourceConstraints,
  InterventionCandidate,
} from '@/types/urbanpulse';
import { UrbanGraph } from '@/lib/engine/graph';
import { optimizeInterventions, OptimizationResult } from '@/lib/engine/optimizer';

interface InterventionOptimizerProps {
  graph: UrbanGraph;
  scenario: ScenarioDefinition;
  cityName: string;
  onApplyOptimizedPlan: (result: OptimizationResult) => void;
}

export const InterventionOptimizer: React.FC<InterventionOptimizerProps> = ({
  graph,
  scenario,
  cityName,
  onApplyOptimizedPlan,
}) => {
  const [budget, setBudget] = useState(1500000);
  const [repairTeams, setRepairTeams] = useState(4);
  const [mobileGenerators, setMobileGenerators] = useState(2);
  const [trafficControllers, setTrafficControllers] = useState(3);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optResult, setOptResult] = useState<OptimizationResult | null>(null);
  const [aiBriefing, setAiBriefing] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const handleRunOptimizer = () => {
    setIsOptimizing(true);
    setAiBriefing(null);

    setTimeout(() => {
      const constraints: ResourceConstraints = {
        budgetINR: budget,
        repairTeams,
        mobileGenerators,
        trafficControllers,
        emergencyCrews: repairTeams,
      };

      const result = optimizeInterventions(graph, scenario, constraints);
      setOptResult(result);
      setIsOptimizing(false);
      onApplyOptimizedPlan(result);
    }, 400);
  };

  const handleGenerateAiBriefing = async () => {
    if (!optResult) return;
    setIsGeneratingAi(true);

    try {
      const res = await fetch('/api/gemini/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cityName,
          scenarioName: scenario.name,
          comparisonMetrics: optResult.comparisonMetrics,
          recommendedInterventions: optResult.recommendedInterventions,
          totalCostINR: optResult.totalCostINR,
        }),
      });

      const data = await res.json();
      setAiBriefing(data.strategy);
    } catch (err) {
      console.error('Failed to generate AI briefing:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const comp = optResult?.comparisonMetrics;

  return (
    <div className="flex flex-col gap-5">
      {/* Top Header & Resource Constraints Form */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 font-bold">
              <Wand2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">AI & Algorithmic Response Optimizer</h3>
              <p className="text-xs text-slate-400">
                Multi-Objective Knapsack & Graph Reach Optimization under Emergency Resource Constraints
              </p>
            </div>
          </div>

          <button
            id="btn-run-optimizer"
            onClick={handleRunOptimizer}
            disabled={isOptimizing}
            className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Cpu className="h-4 w-4" />
            <span>{isOptimizing ? 'SOLVING GRAPH EQUATIONS...' : 'OPTIMIZE RESPONSE SEQUENCE'}</span>
          </button>
        </div>

        {/* Resource Sliders */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Emergency Budget</span>
              <span className="font-mono font-bold text-emerald-400">₹{budget.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={200000}
              max={3000000}
              step={100000}
              value={budget}
              onChange={(e) => setBudget(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Repair Teams</span>
              <span className="font-mono font-bold text-cyan-400">{repairTeams} Crews</span>
            </div>
            <input
              type="range"
              min={1}
              max={8}
              value={repairTeams}
              onChange={(e) => setRepairTeams(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Mobile Generators</span>
              <span className="font-mono font-bold text-amber-400">{mobileGenerators} Units</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={mobileGenerators}
              onChange={(e) => setMobileGenerators(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Traffic Patrols</span>
              <span className="font-mono font-bold text-purple-400">{trafficControllers} Squads</span>
            </div>
            <input
              type="range"
              min={1}
              max={6}
              value={trafficControllers}
              onChange={(e) => setTrafficControllers(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
          </div>
        </div>
      </div>

      {/* Main Results Container */}
      {optResult && comp && (
        <div className="flex flex-col gap-5">
          {/* Side-by-side BEFORE vs AFTER Comparison Card */}
          <div className="rounded-xl border border-cyan-800/60 bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/40 p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-cyan-400" />
                <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                  URBANPULSE Simulated Impact: Before vs. After Intervention
                </h4>
              </div>
              <span className="text-xs font-mono text-cyan-300 font-semibold bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-800">
                Total Allocated: ₹{optResult.totalCostINR.toLocaleString()} &bull; {optResult.totalTeamsUsed} Crews
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {/* Metric 1: Affected Services */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Affected Services
                </span>
                <div className="flex items-center justify-center gap-2 font-mono">
                  <span className="text-lg font-bold text-rose-400">{comp.affectedServicesBefore}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xl font-extrabold text-emerald-400">{comp.affectedServicesAfter}</span>
                </div>
                <span className="mt-1 inline-block text-[10px] font-bold text-emerald-400 font-mono">
                  -{comp.affectedServicesDelta} facilities
                </span>
              </div>

              {/* Metric 2: City Resilience */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  City Resilience
                </span>
                <div className="flex items-center justify-center gap-2 font-mono">
                  <span className="text-lg font-bold text-rose-400">{comp.resilienceBefore}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xl font-extrabold text-emerald-400">{comp.resilienceAfter}</span>
                </div>
                <span className="mt-1 inline-block text-[10px] font-bold text-emerald-400 font-mono">
                  +{comp.resilienceDelta} points
                </span>
              </div>

              {/* Metric 3: Time to Recovery */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Est. Recovery Time
                </span>
                <div className="flex items-center justify-center gap-2 font-mono">
                  <span className="text-lg font-bold text-rose-400">{comp.recoveryTimeBeforeMin}m</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xl font-extrabold text-emerald-400">{comp.recoveryTimeAfterMin}m</span>
                </div>
                <span className="mt-1 inline-block text-[10px] font-bold text-emerald-400 font-mono">
                  {comp.recoveryTimeImprovementPercent}% faster
                </span>
              </div>

              {/* Metric 4: Population Saved */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Population Saved
                </span>
                <div className="flex items-center justify-center gap-1 font-mono">
                  <span className="text-xl font-extrabold text-emerald-400">
                    {comp.populationSaved.toLocaleString()}
                  </span>
                </div>
                <span className="mt-1 inline-block text-[10px] text-slate-400 font-mono">
                  citizens protected
                </span>
              </div>

              {/* Metric 5: Cascade Depth */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Cascade Depth
                </span>
                <div className="flex items-center justify-center gap-2 font-mono">
                  <span className="text-lg font-bold text-amber-400">{comp.cascadeDepthBefore} hops</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xl font-extrabold text-cyan-400">{comp.cascadeDepthAfter} hops</span>
                </div>
                <span className="mt-1 inline-block text-[10px] font-bold text-cyan-400 font-mono">
                  Severs propagation
                </span>
              </div>
            </div>
          </div>

          {/* Recommended Interventions Priority Cards */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {optResult.recommendedInterventions.map((cand, idx) => (
              <div
                key={cand.id}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded bg-cyan-950 px-2 py-0.5 text-xs font-black text-cyan-300 border border-cyan-800 font-mono">
                      PRIORITY #{idx + 1}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      ₹{cand.costINR.toLocaleString()}
                    </span>
                  </div>

                  <h5 className="text-sm font-bold text-slate-100 leading-snug">{cand.name}</h5>
                  <p className="mt-1.5 text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                    {cand.rationale}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-2.5 text-[11px] font-mono">
                  <div className="text-slate-400">
                    Restores: <span className="text-emerald-400 font-bold">+{cand.servicesRestoredCount} services</span>
                  </div>
                  <div className="text-slate-400">
                    Teams: <span className="text-cyan-300 font-bold">{cand.requiredTeams} crews</span>
                  </div>
                  <div className="text-slate-400">
                    Speedup: <span className="text-amber-300 font-bold">-{cand.recoveryTimeReductionMinutes}m</span>
                  </div>
                  <div className="text-slate-400">
                    ROI Score: <span className="text-purple-300 font-bold">{cand.roiScore}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Decision Support Briefing Card */}
          <div className="rounded-xl border border-purple-800/60 bg-gradient-to-br from-slate-900 via-slate-900/90 to-purple-950/30 p-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-900/50 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h4 className="text-sm font-bold text-slate-100">
                  Gemini 3.7 Flash AI Tactical Incident Directive
                </h4>
              </div>

              <button
                id="btn-generate-ai-briefing"
                onClick={handleGenerateAiBriefing}
                disabled={isGeneratingAi}
                className="flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500 transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isGeneratingAi ? 'GENERATING AI BRIEFING...' : 'GENERATE AI BRIEFING'}</span>
              </button>
            </div>

            <div className="mt-3 text-xs text-slate-200 leading-relaxed font-sans prose prose-invert max-w-none">
              {aiBriefing ? (
                <div className="whitespace-pre-line bg-slate-950/70 p-4 rounded-lg border border-purple-900/40">
                  {aiBriefing}
                </div>
              ) : (
                <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800 text-slate-400">
                  {optResult.executiveSummary}
                  <p className="mt-2 text-purple-300 font-medium text-[11px]">
                    Click &ldquo;Generate AI Briefing&rdquo; above to query Gemini 3.7 Flash for deep multi-phase incident command reasoning.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
