'use client';

import React from 'react';
import {
  X,
  Cpu,
  GitBranch,
  ShieldCheck,
  BookOpen,
  Layers,
} from 'lucide-react';

interface AlgorithmExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlgorithmExplainerModal: React.FC<AlgorithmExplainerModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Mathematical & Algorithmic Transparency</h2>
              <p className="text-xs text-slate-400">
                Mathematical Formulations Behind Cascade Simulation, Centrality & Optimization
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 text-slate-300 text-xs leading-relaxed font-sans">
          {/* Section 1: Cascade Propagation */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2 text-cyan-300 font-bold uppercase tracking-wider text-xs mb-2">
              <Cpu className="h-4 w-4" />
              <span>1. Dynamic Cascade Propagation Equation</span>
            </div>
            <p className="mb-2">
              At discrete timestep t + &Delta;t, the health H<sub>i</sub>(t + &Delta;t) &isin; [0, 1] of infrastructure node i
              is computed from its upstream dependencies P(i) and coupling weights W<sub>j &rarr; i</sub>:
            </p>
            <div className="rounded-lg bg-slate-950 p-3 font-mono text-cyan-200 border border-slate-800 my-2 text-xs">
              H<sub>i</sub>(t + &Delta;t) = min(1.0, H<sub>i</sub>(t) - &sum;<sub>j &isin; P(i)</sub> [W<sub>j &rarr; i</sub> &times; max(0, &theta;<sub>ji</sub> - H<sub>j</sub>(t))] + R<sub>i</sub>(t))
            </div>
            <p className="text-slate-400 text-[11px]">
              Where &theta;<sub>ji</sub> is the failure propagation threshold, W<sub>j &rarr; i</sub> is dependency coupling strength, and R<sub>i</sub>(t) is the auto-recovery rate.
            </p>
          </div>

          {/* Section 2: Criticality Score Formulation */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2 text-amber-300 font-bold uppercase tracking-wider text-xs mb-2">
              <GitBranch className="h-4 w-4" />
              <span>2. Multi-Factor Criticality Index Formula</span>
            </div>
            <p className="mb-2">
              Every facility receives a deterministic criticality rating C(v) &isin; [0, 100] synthesized across 6 physical dimensions:
            </p>
            <div className="rounded-lg bg-slate-950 p-3 font-mono text-amber-200 border border-slate-800 my-2 text-xs">
              C(v) = 0.25 &times; R&#770;(v) + 0.20 &times; B&#770;(v) + 0.15 &times; P&#770;(v) + 0.15 &times; I(v) + 0.15 &times; F(v) + 0.10 &times; T&#770;(v)
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
              <li>R&#770;(v): Normalized Transitive Downstream Reach (total facilities dependent on v).</li>
              <li>B&#770;(v): Brandes Betweenness Centrality on directed infrastructure paths.</li>
              <li>P&#770;(v): Geospatial population exposure within service radius.</li>
              <li>I(v): Life-safety importance weight (Trauma ICU = 1.0, Substation = 0.95).</li>
              <li>F(v): Environmental baseline failure probability.</li>
              <li>T&#770;(v): Normalized time complexity of mechanical restoration.</li>
            </ul>
          </div>

          {/* Section 3: Brandes Centrality */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2 text-purple-300 font-bold uppercase tracking-wider text-xs mb-2">
              <Layers className="h-4 w-4" />
              <span>3. Brandes Betweenness Centrality Algorithm</span>
            </div>
            <p>
              Calculates how often facility v falls on the shortest dependency path between any pair of upstream and downstream infrastructure assets:
            </p>
            <div className="rounded-lg bg-slate-950 p-3 font-mono text-purple-200 border border-slate-800 my-2 text-xs">
              B(v) = &sum;<sub>s &ne; v &ne; t</sub> [&sigma;<sub>st</sub>(v) / &sigma;<sub>st</sub>]
            </div>
            <p className="text-slate-400 text-[11px]">
              Executed in O(|V| &times; |E|) time for rapid sub-millisecond graph updates.
            </p>
          </div>

          {/* Section 4: Multi-Objective Knapsack Optimization */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2 text-emerald-300 font-bold uppercase tracking-wider text-xs mb-2">
              <ShieldCheck className="h-4 w-4" />
              <span>4. Multi-Objective Resource Knapsack Optimization</span>
            </div>
            <p>
              Identifies the highest ROI intervention subset S* &sube; A under strict budget B and crew limits K:
            </p>
            <div className="rounded-lg bg-slate-950 p-3 font-mono text-emerald-200 border border-slate-800 my-2 text-xs">
              max<sub>S</sub> &sum;<sub>a &isin; S</sub> ROI(a) &nbsp; subject to &nbsp; &sum;<sub>a &isin; S</sub> Cost(a) &le; B, &nbsp; &sum;<sub>a &isin; S</sub> Crews(a) &le; K
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/80 px-6 py-3 text-xs text-slate-400">
          <span>Fully Transparent & Explainable Architecture</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-cyan-500 px-3 py-1 font-bold text-slate-950 hover:bg-cyan-400"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
