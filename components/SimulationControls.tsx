'use client';

import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  FastForward,
  Zap,
  Flame,
  CloudRain,
  Radio,
  PlusCircle,
  Hash,
  AlertOctagon,
} from 'lucide-react';
import { ScenarioDefinition, InfrastructureNode, TimestepState } from '@/types/urbanpulse';

interface SimulationControlsProps {
  scenario: ScenarioDefinition;
  scenariosList: ScenarioDefinition[];
  onSelectScenario: (scenarioId: string) => void;
  timeline: TimestepState[];
  currentStepIndex: number;
  onSetStepIndex: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  onReset: () => void;
  onJumpToPeak: () => void;
  nodes: InfrastructureNode[];
  onInjectCustomFailure: (nodeId: string, degradedHealth: number, reason: string) => void;
  simulationSeed: number;
  onChangeSeed: (seed: number) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  scenario,
  scenariosList,
  onSelectScenario,
  timeline,
  currentStepIndex,
  onSetStepIndex,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onChangeSpeed,
  onReset,
  onJumpToPeak,
  nodes,
  onInjectCustomFailure,
  simulationSeed,
  onChangeSeed,
}) => {
  const [showInjectModal, setShowInjectModal] = useState(false);
  const [selectedInjectNode, setSelectedInjectNode] = useState(nodes[0]?.id || '');
  const [injectSeverity, setInjectSeverity] = useState(0.0);
  const [injectReason, setInjectReason] = useState('Manual Operator Injection');

  const currentStep = timeline[currentStepIndex] || timeline[0];
  const maxSteps = timeline.length - 1;

  const handleInject = () => {
    if (selectedInjectNode) {
      onInjectCustomFailure(selectedInjectNode, injectSeverity, injectReason);
      setShowInjectModal(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#141518] p-4">
      {/* Top Bar: Scenario Selector & Quick Disruption Triggers */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-[1px] bg-white/40"></div>
            <span className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-[0.25em] flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-white" />
              SCENARIO
            </span>
          </div>
          <select
            id="scenario-selector-dropdown"
            value={scenario.scenarioId}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="rounded-full border border-white/20 bg-[#1A1B1E] px-3.5 py-1.5 text-xs font-bold text-white outline-none hover:border-white/40 max-w-[280px] sm:max-w-md truncate cursor-pointer"
          >
            {scenariosList.map((sc) => (
              <option key={sc.scenarioId} value={sc.scenarioId} className="bg-[#141518] text-white">
                {sc.name} ({sc.category})
              </option>
            ))}
          </select>
        </div>

        {/* Quick Disruption Injection Triggers */}
        <div className="flex items-center gap-2">
          <button
            id="btn-inject-modal-trigger"
            onClick={() => setShowInjectModal(!showInjectModal)}
            className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-300 hover:bg-rose-500/20 transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>INJECT FAILURE</span>
          </button>

          <button
            id="btn-jump-to-peak"
            onClick={onJumpToPeak}
            className="rounded-full border border-white/20 bg-[#1A1B1E] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black transition-all"
            title="Jump immediately to peak cascade timestamp"
          >
            PEAK IMPACT
          </button>

          {/* Seed Input */}
          <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-[#1A1B1E] px-3 py-1 text-xs text-white/50">
            <Hash className="h-3 w-3 text-white/40" />
            <span className="text-[10px] font-mono tracking-widest uppercase">SEED:</span>
            <input
              type="number"
              value={simulationSeed}
              onChange={(e) => onChangeSeed(parseInt(e.target.value) || 42)}
              className="w-12 bg-transparent text-xs font-mono font-bold text-white outline-none text-right"
              title="Deterministic random seed for reproducibility"
            />
          </div>
        </div>
      </div>

      {/* Disruption Injection Drawer */}
      {showInjectModal && (
        <div className="rounded-xl border border-rose-500/30 bg-[#1A1B1E] p-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-2.5 border-b border-rose-500/20">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-300">
              <AlertOctagon className="h-4 w-4 text-rose-400" />
              <span>Simulate Custom Infrastructure Failure</span>
            </div>
            <button
              onClick={() => setShowInjectModal(false)}
              className="text-xs uppercase font-mono tracking-widest text-white/40 hover:text-white"
            >
              [CANCEL]
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-[10px] font-mono tracking-widest uppercase text-white/50 block mb-1">Target Node</label>
              <select
                value={selectedInjectNode}
                onChange={(e) => setSelectedInjectNode(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-[#141518] p-2 text-xs font-bold text-white outline-none"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id} className="bg-[#141518]">
                    [{n.category.split('_')[0]}] {n.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono tracking-widest uppercase text-white/50 block mb-1">Severity / Health State</label>
              <select
                value={injectSeverity}
                onChange={(e) => setInjectSeverity(parseFloat(e.target.value))}
                className="w-full rounded-lg border border-white/20 bg-[#141518] p-2 text-xs font-bold text-white outline-none"
              >
                <option value={0.0}>0% — Complete Blackout / Failure</option>
                <option value={0.25}>25% — Severe Degradation / Brownout</option>
                <option value={0.50}>50% — Moderate Operational Strain</option>
                <option value={0.75}>75% — Warning / Partial Redundancy Loss</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono tracking-widest uppercase text-white/50 block mb-1">Incident Vector</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={injectReason}
                  onChange={(e) => setInjectReason(e.target.value)}
                  placeholder="e.g. Substation Transformer Fire"
                  className="w-full rounded-lg border border-white/20 bg-[#141518] p-2 text-xs text-white outline-none font-medium"
                />
                <button
                  id="btn-apply-injection"
                  onClick={handleInject}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-rose-500 whitespace-nowrap"
                >
                  INJECT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Controls & Scrubber */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Playback Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-reset-sim"
            onClick={onReset}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-[#1A1B1E] text-white/70 hover:bg-white hover:text-black transition-all"
            title="Reset to t=0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            id="btn-step-backward"
            onClick={() => onSetStepIndex(Math.max(0, currentStepIndex - 1))}
            disabled={currentStepIndex <= 0}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-[#1A1B1E] text-white/70 disabled:opacity-20 hover:bg-white hover:text-black transition-all"
            title="Step back 5 minutes"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>
          <button
            id="btn-toggle-play"
            onClick={onTogglePlay}
            className={`flex h-9 px-4 items-center gap-2 rounded-full text-xs font-black uppercase tracking-[0.15em] transition-all shadow-md ${
              isPlaying
                ? 'bg-amber-400 text-black hover:bg-amber-300'
                : 'bg-white text-black hover:bg-white/90'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-current" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>SIMULATE</span>
              </>
            )}
          </button>
          <button
            id="btn-step-forward"
            onClick={() => onSetStepIndex(Math.min(maxSteps, currentStepIndex + 1))}
            disabled={currentStepIndex >= maxSteps}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-[#1A1B1E] text-white/70 disabled:opacity-20 hover:bg-white hover:text-black transition-all"
            title="Step forward 5 minutes"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>

          {/* Speed Selector */}
          <div className="ml-1 flex items-center rounded-full border border-white/20 bg-[#1A1B1E] p-0.5 text-[11px] font-mono">
            {[1, 2, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`rounded-full px-2 py-0.5 transition-colors ${
                  playbackSpeed === s
                    ? 'bg-white text-black font-extrabold'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Slider with Minute Marks */}
        <div className="flex flex-1 items-center gap-3 px-2">
          <div className="min-w-[68px]">
            <span className="font-display font-black text-sm tracking-wider text-white">
              T+{String(currentStep?.timeMinute ?? 0).padStart(3, '0')}M
            </span>
          </div>
          <div className="relative flex-1">
            <input
              id="timeline-scrubber-slider"
              type="range"
              min={0}
              max={maxSteps}
              value={currentStepIndex}
              onChange={(e) => onSetStepIndex(parseInt(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
            />
            {/* Markers */}
            <div className="flex justify-between text-[9px] text-white/40 font-mono tracking-widest uppercase mt-1.5">
              <span>0M (INITIAL)</span>
              <span>30M (CASCADE)</span>
              <span>60M (MITIGATION)</span>
              <span>90M</span>
              <span>120M (STABLE)</span>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-white/50 min-w-[56px] text-right">
            {scenario.durationMinutes}M MAX
          </span>
        </div>
      </div>
    </div>
  );
};
