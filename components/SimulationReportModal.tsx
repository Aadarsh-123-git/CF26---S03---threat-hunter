'use client';

import React from 'react';
import {
  FileText,
  X,
  Download,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Users,
  Activity,
} from 'lucide-react';
import {
  CityProfile,
  ScenarioDefinition,
  SimulationRun,
  MetricsSummary,
} from '@/types/urbanpulse';
import { OptimizationResult } from '@/lib/engine/optimizer';

interface SimulationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: CityProfile;
  scenario: ScenarioDefinition;
  simulation: SimulationRun;
  optResult: OptimizationResult | null;
}

export const SimulationReportModal: React.FC<SimulationReportModalProps> = ({
  isOpen,
  onClose,
  city,
  scenario,
  simulation,
  optResult,
}) => {
  if (!isOpen) return null;

  const m = simulation.metricsSummary;
  const comp = optResult?.comparisonMetrics;

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(simulation, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `URBANPULSE_REPORT_${city.cityId}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Executive Incident Post-Mortem Report</h2>
              <p className="text-xs text-slate-400 font-mono">
                URBANPULSE ID: {simulation.simulationId} &bull; {city.cityName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 text-slate-300 text-xs leading-relaxed font-sans">
          {/* Executive Summary */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-2">1. Incident Overview</h3>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div>
                Location: <strong className="text-slate-100">{city.cityName} ({city.country})</strong>
              </div>
              <div>
                Scenario: <strong className="text-slate-100">{scenario.name}</strong>
              </div>
              <div>
                Disruption Vector: <strong className="text-slate-100">{scenario.category}</strong>
              </div>
              <div>
                Simulation Duration: <strong className="text-slate-100">{scenario.durationMinutes} Minutes</strong>
              </div>
            </div>
          </div>

          {/* Key Incident Metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 text-center">
              <span className="text-[10px] text-slate-400 block mb-1">Peak Resilience Drop</span>
              <span className="font-mono text-xl font-bold text-rose-400">{m.minResilience} / 100</span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 text-center">
              <span className="text-[10px] text-slate-400 block mb-1">Peak Affected Facilities</span>
              <span className="font-mono text-xl font-bold text-rose-400">{m.maxAffectedServices} Nodes</span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 text-center">
              <span className="text-[10px] text-slate-400 block mb-1">Max Cascade Depth</span>
              <span className="font-mono text-xl font-bold text-amber-400">{m.maxCascadeDepth} Hops</span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 text-center">
              <span className="text-[10px] text-slate-400 block mb-1">Population Exposed</span>
              <span className="font-mono text-xl font-bold text-orange-400">
                {m.maxPopulationAtRisk.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Root Cause vs Cascade Progression */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-2">
              2. Root Cause & Cascade Sequence
            </h3>
            <p className="mb-2">
              The failure initiated at timestamp t = 0m at{' '}
              <strong>{scenario.initialFailures[0]?.nodeId}</strong>, leading to subsequent cross-sector propagation
              reaching peak degradation at minute t = {m.peakCascadeMinute}m.
            </p>
            <p>
              Estimated baseline time to restoration without active optimization:{' '}
              <strong className="font-mono text-amber-300">{m.estimatedRecoveryTimeMinutes} minutes</strong>.
            </p>
          </div>

          {/* Optimization Outcomes if available */}
          {comp && (
            <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2">
                3. Algorithmic Optimization Outcomes
              </h3>
              <p className="mb-2">
                Deploying the prioritized multi-objective response sequence achieved:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li>
                  Resilience Score increased from <strong>{comp.resilienceBefore}</strong> to{' '}
                  <strong>{comp.resilienceAfter}</strong> (+{comp.resilienceDelta} points).
                </li>
                <li>
                  Recovery timeline shortened by{' '}
                  <strong>{comp.recoveryTimeImprovementPercent}%</strong> ({comp.recoveryTimeBeforeMin}m &rarr; {comp.recoveryTimeAfterMin}m).
                </li>
                <li>
                  Protected <strong>{comp.populationSaved.toLocaleString()} citizens</strong> from secondary blackout exposure.
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/80 px-6 py-3 text-xs text-slate-400">
          <span>URBANPULSE Incident Intelligence Engine</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-3 py-1 text-slate-200 hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
