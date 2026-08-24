'use client';

import React from 'react';
import {
  ShieldAlert,
  GitCommit,
  Users,
  Clock,
  CloudRain,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { TimestepState, WeatherData, ScenarioDefinition } from '@/types/urbanpulse';

interface LiveTelemetryProps {
  currentStep: TimestepState;
  scenario: ScenarioDefinition;
  weather: WeatherData | null;
  totalServices: number;
  maxCascadeDepth: number;
  estimatedRecoveryTime: number;
}

export const LiveTelemetry: React.FC<LiveTelemetryProps> = ({
  currentStep,
  scenario,
  weather,
  totalServices,
  maxCascadeDepth,
  estimatedRecoveryTime,
}) => {
  const resilience = currentStep.cityResilienceScore;
  const affectedCount = currentStep.affectedServicesCount;
  const affectedPercent = currentStep.affectedServicesPercent;
  const popAtRisk = currentStep.populationAtRisk;

  const getResilienceColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 65) return 'text-amber-400';
    if (score >= 45) return 'text-orange-400';
    return 'text-rose-400';
  };

  const getRiskStatus = (res: number) => {
    if (res >= 90) return { label: 'OPTIMAL / STABLE', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
    if (res >= 70) return { label: 'ELEVATED STRAIN', color: 'bg-amber-950 text-amber-300 border-amber-800' };
    if (res >= 50) return { label: 'HIGH CASCADE RISK', color: 'bg-orange-950 text-orange-300 border-orange-800' };
    return { label: 'CRITICAL MULTI-SYSTEM COLLAPSE', color: 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse' };
  };

  const status = getRiskStatus(resilience);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {/* Metric 1: City Resilience */}
      <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#141518] p-3.5 hover:bg-[#1A1B1E] transition-all">
        <div>
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/50">01/RESILIENCE</span>
            <Activity className="h-3.5 w-3.5 text-white/40" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-[1px] bg-white/20"></div>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-white/70">Grid Stability</span>
          </div>
        </div>
        <div className="my-1 flex items-baseline gap-1.5">
          <span className={`font-display text-3xl font-black ${getResilienceColor(resilience)}`}>{resilience}</span>
          <span className="text-xs text-white/40 font-mono">/100</span>
        </div>
        <div className="text-[10px] text-white/40 flex items-center justify-between mt-1 pt-2 border-t border-white/5">
          <span className="font-mono">Target: &ge; 90</span>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${status.color}`}>
            {resilience >= 85 ? 'STABLE' : 'DEGRADED'}
          </span>
        </div>
      </div>

      {/* Metric 2: Affected Services */}
      <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#141518] p-3.5 hover:bg-[#1A1B1E] transition-all">
        <div>
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/50">02/DISRUPTED</span>
            <ShieldAlert className="h-3.5 w-3.5 text-white/40" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-[1px] bg-white/20"></div>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-white/70">Node Outages</span>
          </div>
        </div>
        <div className="my-1 flex items-baseline gap-1.5">
          <span className={`font-display text-3xl font-black ${affectedCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {affectedCount}
          </span>
          <span className="text-xs text-white/40 font-mono">/ {totalServices}</span>
        </div>
        <div className="text-[10px] text-white/40 flex items-center justify-between mt-1 pt-2 border-t border-white/5 font-mono">
          <span>{affectedPercent}% of grid</span>
          <span className="text-white/70">t={currentStep.timeMinute}m</span>
        </div>
      </div>

      {/* Metric 3: Cascade Depth */}
      <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#141518] p-3.5 hover:bg-[#1A1B1E] transition-all">
        <div>
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/50">03/CASCADE</span>
            <GitCommit className="h-3.5 w-3.5 text-white/40" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-[1px] bg-white/20"></div>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-white/70">Hop Depth</span>
          </div>
        </div>
        <div className="my-1 flex items-baseline gap-1.5">
          <span className="font-display text-3xl font-black text-amber-400">{currentStep.cascadeDepth}</span>
          <span className="text-xs text-white/40 font-mono">hops (max {maxCascadeDepth})</span>
        </div>
        <div className="text-[10px] text-white/40 mt-1 pt-2 border-t border-white/5 font-mono">
          {currentStep.cascadeDepth === 0 ? 'Root isolation' : `Multi-hop reach`}
        </div>
      </div>

      {/* Metric 4: Population at Risk */}
      <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#141518] p-3.5 hover:bg-[#1A1B1E] transition-all">
        <div>
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/50">04/POPULATION</span>
            <Users className="h-3.5 w-3.5 text-white/40" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-[1px] bg-white/20"></div>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-white/70">At-Risk Count</span>
          </div>
        </div>
        <div className="my-1 flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-black text-orange-400 font-mono">
            {popAtRisk > 0 ? popAtRisk.toLocaleString() : '0'}
          </span>
        </div>
        <div className="text-[10px] text-white/40 truncate mt-1 pt-2 border-t border-white/5 font-mono" title="Geospatial service intersection estimate">
          Catchment estimate
        </div>
      </div>

      {/* Metric 5: Estimated Recovery Time */}
      <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#141518] p-3.5 hover:bg-[#1A1B1E] transition-all">
        <div>
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/50">05/RECOVERY</span>
            <Clock className="h-3.5 w-3.5 text-white/40" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-[1px] bg-white/20"></div>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-white/70">Est. Duration</span>
          </div>
        </div>
        <div className="my-1 flex items-baseline gap-1">
          <span className="font-display text-3xl font-black text-white">{estimatedRecoveryTime}</span>
          <span className="text-xs text-white/40 font-mono">min</span>
        </div>
        <div className="text-[10px] text-white/40 truncate mt-1 pt-2 border-t border-white/5 font-mono" title="Simulated time to return >= 90% resilience">
          Return &ge; 90%
        </div>
      </div>

      {/* Metric 6: Weather & Environmental Conditions */}
      <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#141518] p-3.5 hover:bg-[#1A1B1E] transition-all">
        <div>
          <div className="flex items-center justify-between text-white/40 mb-1">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/50">06/ATMOSPHERE</span>
            <CloudRain className="h-3.5 w-3.5 text-white/40" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-[1px] bg-white/20"></div>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-white/70">Open-Meteo</span>
          </div>
        </div>
        <div className="my-1 flex items-baseline justify-between">
          <span className="text-lg font-bold font-mono text-white">
            {weather ? `${weather.temperatureC}°C` : '17.0°C'}
          </span>
          <span className="text-xs font-mono text-white/60">
            {weather ? `${weather.precipitationMm} mm` : '0 mm'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-white/40 truncate mt-1 pt-2 border-t border-white/5 font-mono">
          {weather?.isFloodRisk ? (
            <span className="text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Flood Alert
            </span>
          ) : (
            <span className="truncate text-white/60">{weather?.weatherDescription || 'Telemetry Synced'}</span>
          )}
        </div>
      </div>
    </div>
  );
};
