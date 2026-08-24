'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  Zap,
  Flame,
  Wand2,
  CheckCircle2,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { CityProfile, ScenarioDefinition, TimestepState } from '@/types/urbanpulse';
import { OptimizationResult } from '@/lib/engine/optimizer';

interface CommandCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: CityProfile;
  scenario: ScenarioDefinition;
  timeline: TimestepState[];
  optResult: OptimizationResult | null;
  onJumpToMinute: (minute: number) => void;
  onTriggerOptimization: () => void;
}

export const CommandCenterModal: React.FC<CommandCenterModalProps> = ({
  isOpen,
  onClose,
  city,
  scenario,
  timeline,
  optResult,
  onJumpToMinute,
  onTriggerOptimization,
}) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);

  const stages = React.useMemo(() => [
    {
      title: 'Stage 1: Baseline City Operations (Normal Grid)',
      timeMinute: 0,
      description:
        'All municipal power feeders, water pumps, traffic signals, and hospital emergency trauma units operate at 100% rated capacity. City resilience score is baseline 100/100.',
      icon: Activity,
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    },
    {
      title: 'Stage 2: Initial Disruption Event (Root Cause Trigger)',
      timeMinute: 5,
      description:
        'Catastrophic storm surge and localized transformer ground fault disables PG&E Potrero Substation (115kV infeed). Telecom conduit at SF-IX experiences severe optical attenuation.',
      icon: Zap,
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
    },
    {
      title: 'Stage 3: Transitive Multi-Sector Cascade (Peak Strain)',
      timeMinute: 30,
      description:
        'Blackout cascades across 4 dependency hops: Muni Metro traction power fails, 380 intersection signal controllers blackout, ambulance transit times spike +180%, and UCSF/ZSFG trauma emergency triage becomes bottlenecked.',
      icon: Flame,
      badgeColor: 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse',
    },
    {
      title: 'Stage 4: AI & Graph Multi-Objective Optimization',
      timeMinute: 45,
      description:
        'URBANPULSE solver calculates optimal intervention sequence: Restores upstream root-cause substation (Priority 1), dispatches auxiliary generators to trauma hospitals (Priority 2), and deploys traffic controllers.',
      icon: Wand2,
      badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800',
    },
    {
      title: 'Stage 5: Coordinated Recovery (Before vs. After Delta)',
      timeMinute: 60,
      description:
        'Simulated outcome: City resilience improves by +25 points, saving 285,000 citizens from prolonged outage and recovering the entire metropolitan grid 38% faster.',
      icon: CheckCircle2,
      badgeColor: 'bg-purple-950 text-purple-300 border-purple-800',
    },
  ], []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoAdvancing && isOpen) {
      timer = setInterval(() => {
        setCurrentStage((prev) => {
          const next = (prev + 1) % stages.length;
          onJumpToMinute(stages[next].timeMinute);
          if (next === 3) {
            onTriggerOptimization();
          }
          return next;
        });
      }, 5000);
    }
    return () => clearInterval(timer);
  }, [isAutoAdvancing, isOpen, stages, onJumpToMinute, onTriggerOptimization]);

  if (!isOpen) return null;

  const activeStage = stages[currentStage];
  const Icon = activeStage.icon;

  const handleSelectStage = (idx: number) => {
    setCurrentStage(idx);
    onJumpToMinute(stages[idx].timeMinute);
    if (idx === 3 || idx === 4) {
      onTriggerOptimization();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-rose-900/60 bg-slate-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-slate-950 shadow-md shadow-rose-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-100 uppercase tracking-wider">
                Judge Demo Walkthrough &bull; 5-Stage Cascade Lifecycle
              </h2>
              <p className="text-xs text-slate-400">
                Automated Incident Walkthrough for Hackathon Evaluation & Scenario Presentation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAutoAdvancing(!isAutoAdvancing)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                isAutoAdvancing
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {isAutoAdvancing ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
              <span>{isAutoAdvancing ? 'PAUSE STORY' : 'AUTO-PLAY'}</span>
            </button>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stage Timeline Stepper */}
        <div className="grid grid-cols-5 border-b border-slate-800 bg-slate-900/60 p-2">
          {stages.map((stg, i) => (
            <button
              key={i}
              onClick={() => handleSelectStage(i)}
              className={`flex flex-col items-center rounded-lg p-2 transition-all ${
                currentStage === i
                  ? 'bg-slate-800/90 text-cyan-300 shadow-sm border border-cyan-500/30'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="text-[10px] font-mono font-bold">STAGE {i + 1}</span>
              <span className="text-[11px] font-semibold truncate max-w-full">
                {stg.title.split(':')[0]}
              </span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className={`rounded-full border px-3 py-1 text-xs font-bold font-mono ${activeStage.badgeColor}`}>
                t = {activeStage.timeMinute} minutes
              </span>
              <span className="text-xs font-mono text-slate-400">
                City: <strong className="text-slate-200">{city.cityName}</strong>
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-cyan-400">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">{activeStage.title}</h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">{activeStage.description}</p>
              </div>
            </div>
          </div>

          {/* If Stage 5: Show Before vs After quick preview */}
          {currentStage === 4 && optResult && (
            <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-4">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2">
                Demonstrated Optimization Metrics
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
                <div className="rounded bg-slate-950/70 p-2 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Resilience Delta</span>
                  <span className="font-mono font-bold text-emerald-400 text-base">
                    +{optResult.comparisonMetrics.resilienceDelta} pts
                  </span>
                </div>
                <div className="rounded bg-slate-950/70 p-2 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Facilities Saved</span>
                  <span className="font-mono font-bold text-emerald-400 text-base">
                    +{optResult.comparisonMetrics.affectedServicesDelta}
                  </span>
                </div>
                <div className="rounded bg-slate-950/70 p-2 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Recovery Acceleration</span>
                  <span className="font-mono font-bold text-emerald-400 text-base">
                    {optResult.comparisonMetrics.recoveryTimeImprovementPercent}% Faster
                  </span>
                </div>
                <div className="rounded bg-slate-950/70 p-2 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Citizens Protected</span>
                  <span className="font-mono font-bold text-emerald-400 text-base">
                    {optResult.comparisonMetrics.populationSaved.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/80 px-6 py-3">
          <button
            onClick={() => handleSelectStage(Math.max(0, currentStage - 1))}
            disabled={currentStage === 0}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 disabled:opacity-30 hover:bg-slate-800"
          >
            &larr; Previous Stage
          </button>

          <span className="text-xs font-mono text-slate-500">
            Stage {currentStage + 1} of {stages.length}
          </span>

          <button
            onClick={() => {
              if (currentStage < stages.length - 1) {
                handleSelectStage(currentStage + 1);
              } else {
                onClose();
              }
            }}
            className="flex items-center gap-1 rounded-lg bg-cyan-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400"
          >
            <span>{currentStage < stages.length - 1 ? 'Next Stage' : 'Close Presentation'}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
