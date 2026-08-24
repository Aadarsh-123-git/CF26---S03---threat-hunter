'use client';

import React, { useState, useMemo } from 'react';
import {
  Flame,
  ShieldAlert,
  GitBranch,
  Users,
  Clock,
  ArrowUpRight,
  Info,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { CriticalNodeAnalysis, InfrastructureNode } from '@/types/urbanpulse';
import { UrbanGraph } from '@/lib/engine/graph';

interface CriticalNodesPanelProps {
  graph: UrbanGraph;
  onSelectNode: (node: InfrastructureNode) => void;
  selectedNode: InfrastructureNode | null;
}

export const CriticalNodesPanel: React.FC<CriticalNodesPanelProps> = ({
  graph,
  onSelectNode,
  selectedNode,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedAnalysis, setSelectedAnalysis] = useState<CriticalNodeAnalysis | null>(null);

  const analyses: CriticalNodeAnalysis[] = useMemo(() => {
    return graph.analyzeCriticalNodes();
  }, [graph]);

  const filteredAnalyses = useMemo(() => {
    if (categoryFilter === 'ALL') return analyses;
    return analyses.filter((a) => a.category === categoryFilter);
  }, [analyses, categoryFilter]);

  const activeDetail = selectedAnalysis || analyses[0];

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-rose-950/80 text-rose-300 border-rose-800';
    if (score >= 80) return 'bg-orange-950/80 text-orange-300 border-orange-800';
    if (score >= 70) return 'bg-amber-950/80 text-amber-300 border-amber-800';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Left 2 Cols: Ranked Critical Nodes List */}
      <div className="lg:col-span-2 flex flex-col rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Systemic Vulnerability & Critical Nodes</h3>
              <p className="text-xs text-slate-400">Multi-Factor Criticality & Downstream Reach Analysis</p>
            </div>
          </div>

          {/* Filter Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 outline-none cursor-pointer"
          >
            <option value="ALL">All Sectors</option>
            <option value="POWER_GRID">Power Grid</option>
            <option value="HEALTHCARE">Healthcare</option>
            <option value="WATER_SYSTEM">Water Systems</option>
            <option value="TRANSPORTATION">Transportation</option>
            <option value="TELECOMMUNICATIONS">Telecom</option>
          </select>
        </div>

        {/* Dense Table */}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="pb-2 pl-2">Rank</th>
                <th className="pb-2">Infrastructure Node</th>
                <th className="pb-2">Sector</th>
                <th className="pb-2 text-center">Downstream Reach</th>
                <th className="pb-2 text-center">Betweenness</th>
                <th className="pb-2 text-center">Pop. Exposure</th>
                <th className="pb-2 text-right pr-2">Criticality Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAnalyses.map((item, idx) => {
                const isSelected = activeDetail?.nodeId === item.nodeId;
                const nodeObj = graph.getNode(item.nodeId);

                return (
                  <tr
                    key={item.nodeId}
                    onClick={() => {
                      setSelectedAnalysis(item);
                      if (nodeObj) onSelectNode(nodeObj);
                    }}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-cyan-500/10 text-cyan-200' : 'hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <td className="py-2.5 pl-2 font-mono font-bold text-slate-500">#{idx + 1}</td>
                    <td className="py-2.5 font-semibold text-slate-100 flex items-center gap-1.5">
                      <span>{item.nodeName}</span>
                    </td>
                    <td className="py-2.5 text-slate-400 text-[11px]">
                      <span className="rounded bg-slate-800 px-1.5 py-0.5">{item.category.replace('_', ' ')}</span>
                    </td>
                    <td className="py-2.5 text-center font-mono font-semibold text-amber-400">
                      {item.downstreamReachCount} facilities
                    </td>
                    <td className="py-2.5 text-center font-mono text-slate-400">{item.betweennessCentrality}</td>
                    <td className="py-2.5 text-center font-mono text-slate-300">
                      {item.populationExposure.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right pr-2">
                      <span
                        className={`inline-block rounded-md border px-2 py-0.5 font-mono font-bold text-xs ${getScoreBadge(
                          item.criticalityScore
                        )}`}
                      >
                        {item.criticalityScore}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right 1 Col: Transparent Mathematical Breakdown Inspector */}
      <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-md">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Info className="h-4 w-4 text-cyan-400" />
          <h4 className="text-sm font-bold text-slate-100">Criticality Breakdown & Explainability</h4>
        </div>

        {activeDetail ? (
          <div className="mt-3 flex flex-col gap-3.5">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                Selected Facility
              </span>
              <h5 className="text-base font-bold text-slate-100 leading-snug">{activeDetail.nodeName}</h5>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-cyan-300 font-mono">
                  {activeDetail.category}
                </span>
                <span
                  className={`rounded border px-2 py-0.5 text-[10px] font-bold font-mono ${getScoreBadge(
                    activeDetail.criticalityScore
                  )}`}
                >
                  Score: {activeDetail.criticalityScore}/100
                </span>
              </div>
            </div>

            {/* Metric Component Bars */}
            <div className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Formula Factor Weights
              </span>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Downstream Reach (25% weight)</span>
                  <span className="font-mono text-cyan-400 font-bold">{activeDetail.downstreamReachCount} nodes</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${Math.min(100, (activeDetail.downstreamReachCount / 8) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Betweenness Centrality (20% weight)</span>
                  <span className="font-mono text-amber-400 font-bold">{activeDetail.betweennessCentrality}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${Math.min(100, activeDetail.betweennessCentrality * 400)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Population Exposure (15% weight)</span>
                  <span className="font-mono text-orange-400 font-bold">
                    {activeDetail.populationExposure.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${Math.min(100, (activeDetail.populationExposure / 400000) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Restoration Complexity (10% weight)</span>
                  <span className="font-mono text-slate-300 font-bold">{activeDetail.repairTimeMinutes} min</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 rounded-full"
                    style={{ width: `${Math.min(100, (activeDetail.repairTimeMinutes / 180) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Reasons / Justification list */}
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
                Why is this facility critical?
              </span>
              <ul className="flex flex-col gap-1.5">
                {activeDetail.reasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-800/80">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-xs text-slate-500">Select a node from the list to view breakdown.</p>
        )}
      </div>
    </div>
  );
};
