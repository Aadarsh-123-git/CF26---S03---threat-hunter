'use client';

import React from 'react';
import {
  Database,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  FileCode2,
} from 'lucide-react';
import { DATA_PROVENANCE_REGISTRY } from '@/lib/data/cities';

export const DataProvenanceView: React.FC = () => {
  return (
    <div className="flex flex-col gap-5">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Data Provenance & Real-World Grounding Registry</h3>
            <p className="text-xs text-slate-400">
              Open Data Citations, Public Municipal APIs, Licensing & Data Quality Index
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg border border-emerald-800/80 bg-emerald-950/70 px-3 py-1.5 text-xs font-semibold text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            <span>100% Real-World Grounded Topologies</span>
          </span>
        </div>
      </div>

      {/* Distinction Explanation Card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-4">
          <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider mb-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>OBSERVED REAL-WORLD OPEN DATA</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            All GIS coordinates, transformer ratings (MVA/MW), substation capacities, hospital bed counts, emergency trauma designations, and transit traction lines are calibrated directly from public municipal open data portals and OpenStreetMap under open licensing.
          </p>
        </div>

        <div className="rounded-xl border border-cyan-900/60 bg-cyan-950/20 p-4">
          <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider mb-2">
            <Sparkles className="h-4 w-4" />
            <span>SIMULATED CASCADE COUPLING</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Failure propagation curves, dynamic dependency health degradation, auto-recovery ramps, and resource knapsack optimizations are deterministically computed by URBANPULSE&apos;s graph engine based on empirical disaster resilience literature.
          </p>
        </div>
      </div>

      {/* Provenance Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-md">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
          Registered Data Sources & Attribution Matrix
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="pb-2 pl-2">Dataset Name</th>
                <th className="pb-2">Publisher & Authority</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">License</th>
                <th className="pb-2">Retrieval Date</th>
                <th className="pb-2 text-center">Quality Score</th>
                <th className="pb-2 text-right pr-2">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {DATA_PROVENANCE_REGISTRY.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 text-slate-300">
                  <td className="py-3 pl-2 font-semibold text-slate-100">{item.datasetName}</td>
                  <td className="py-3 text-slate-400">{item.publisher}</td>
                  <td className="py-3">
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-cyan-300 font-mono">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-[11px] text-emerald-400">{item.license}</td>
                  <td className="py-3 font-mono text-[11px] text-slate-400">{item.retrievalDate}</td>
                  <td className="py-3 text-center">
                    <span className="font-mono font-bold text-cyan-300">{item.dataQualityScore}/100</span>
                  </td>
                  <td className="py-3 text-right pr-2">
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[10px] font-medium text-cyan-400 hover:bg-slate-700"
                    >
                      <span>Portal</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
