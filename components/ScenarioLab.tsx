'use client';

import React, { useState } from 'react';
import {
  Shield,
  Zap,
  Play,
  Layers,
  Plus,
  ArrowRight,
  TrendingDown,
  CloudRain,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { ScenarioDefinition, InfrastructureNode } from '@/types/urbanpulse';
import { SCENARIOS_LIBRARY } from '@/lib/data/scenarios';

interface ScenarioLabProps {
  currentScenario: ScenarioDefinition;
  onSelectScenario: (scenarioId: string) => void;
  nodes: InfrastructureNode[];
  cityId: string;
  onAddCustomScenario: (sc: ScenarioDefinition) => void;
}

export const ScenarioLab: React.FC<ScenarioLabProps> = ({
  currentScenario,
  onSelectScenario,
  nodes,
  cityId,
  onAddCustomScenario,
}) => {
  const [showBuilder, setShowBuilder] = useState(false);
  const [customName, setCustomName] = useState('Custom Multi-Sector Stress Test');
  const [customCategory, setCustomCategory] = useState<ScenarioDefinition['category']>('Multi-Vector');
  const [customDesc, setCustomDesc] = useState('Simulated compounding failure event.');
  const [customNode1, setCustomNode1] = useState(nodes[0]?.id || '');
  const [customRain, setCustomRain] = useState(65);
  const [customWind, setCustomWind] = useState(45);
  const [customDuration, setCustomDuration] = useState(120);

  const handleCreateScenario = () => {
    const newSc: ScenarioDefinition = {
      scenarioId: `sc_custom_${Date.now()}`,
      name: customName,
      category: customCategory,
      description: customDesc,
      cityId,
      initialFailures: [
        {
          nodeId: customNode1,
          degradedHealth: 0.0,
          reason: 'Custom Operator Disruption Injection',
        },
      ],
      environmentalConditions: {
        rainfallMm: customRain,
        windKmh: customWind,
        temperatureC: 18.0,
        floodAlert: customRain > 30,
      },
      simulationSeed: Math.floor(Math.random() * 9000) + 1000,
      durationMinutes: customDuration,
      timeStepMinutes: 5,
      recoveryRules: {
        autoRecoveryStartMinute: 45,
        recoveryRatePerStep: 0.08,
      },
      createdAt: new Date().toISOString(),
    };

    onAddCustomScenario(newSc);
    onSelectScenario(newSc.scenarioId);
    setShowBuilder(false);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Reproducible Scenario Library & Stress Lab</h3>
            <p className="text-xs text-slate-400">
              Deterministic Multi-Vector Simulation Scenarios & Custom Vector Modeling
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowBuilder(!showBuilder)}
          className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>BUILD CUSTOM SCENARIO</span>
        </button>
      </div>

      {/* Custom Scenario Builder Drawer */}
      {showBuilder && (
        <div className="rounded-xl border border-cyan-800 bg-slate-900/95 p-4 shadow-lg animate-fadeIn">
          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-3">
            Custom Scenario Parameter Configuration
          </h4>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Scenario Name</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-950 p-1.5 text-xs text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Vector Category</label>
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value as any)}
                className="w-full rounded border border-slate-700 bg-slate-950 p-1.5 text-xs text-slate-100 outline-none"
              >
                <option value="Multi-Vector">Multi-Vector Compound</option>
                <option value="Power Failure">Power Grid Blackout</option>
                <option value="Natural Disaster">Natural Disaster / Flood</option>
                <option value="Cyber-Physical">Cyber-Physical / Optical Failure</option>
                <option value="Heatwave">Severe Heatwave / Overload</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Initial Tripped Facility (Root Cause)</label>
              <select
                value={customNode1}
                onChange={(e) => setCustomNode1(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-950 p-1.5 text-xs text-slate-100 outline-none"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id} className="bg-slate-900">
                    [{n.category.split('_')[0]}] {n.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Rainfall Intensity ({customRain} mm)</label>
              <input
                type="range"
                min={0}
                max={150}
                value={customRain}
                onChange={(e) => setCustomRain(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Wind Speed ({customWind} km/h)</label>
              <input
                type="range"
                min={0}
                max={120}
                value={customWind}
                onChange={(e) => setCustomWind(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Duration ({customDuration} min)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(parseInt(e.target.value) || 90)}
                  className="w-full rounded border border-slate-700 bg-slate-950 p-1.5 text-xs text-slate-100 outline-none"
                />
                <button
                  onClick={handleCreateScenario}
                  className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 whitespace-nowrap"
                >
                  Save & Load
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SCENARIOS_LIBRARY.map((sc) => {
          const isSelected = currentScenario.scenarioId === sc.scenarioId;

          return (
            <div
              key={sc.scenarioId}
              onClick={() => onSelectScenario(sc.scenarioId)}
              className={`flex flex-col justify-between rounded-xl border p-4 transition-all cursor-pointer ${
                isSelected
                  ? 'border-cyan-500 bg-gradient-to-br from-slate-900 to-cyan-950/40 shadow-lg shadow-cyan-500/10'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-cyan-300 uppercase tracking-wider font-mono">
                    {sc.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    City: <strong className="text-slate-200 capitalize">{sc.cityId.replace('_', ' ')}</strong>
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-100 leading-snug">{sc.name}</h4>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-3">{sc.description}</p>
              </div>

              <div className="mt-4 border-t border-slate-800/80 pt-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-1">
                    <CloudRain className="h-3.5 w-3.5 text-sky-400" />
                    <span>{sc.environmentalConditions.rainfallMm} mm</span>
                  </div>
                  <div>
                    Duration: <strong className="text-slate-200">{sc.durationMinutes}m</strong>
                  </div>
                  <div className="flex items-center gap-1 text-cyan-400 font-bold">
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> ACTIVE
                      </span>
                    ) : (
                      <span>LOAD &rarr;</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
