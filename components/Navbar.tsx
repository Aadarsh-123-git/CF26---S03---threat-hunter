'use client';

import React from 'react';
import {
  Activity,
  Shield,
  Layers,
  MapPin,
  Flame,
  Wand2,
  Database,
  FileText,
  PlaySquare,
  HelpCircle,
  Radio,
  Sparkles,
  Globe2,
} from 'lucide-react';
import { CityProfile } from '@/types/urbanpulse';

export type ActiveTab =
  | 'dashboard'
  | 'simulator'
  | 'graph'
  | 'map'
  | 'critical-nodes'
  | 'ai-optimizer'
  | 'scenarios'
  | 'provenance'
  | 'report';

interface NavbarProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  selectedCity: CityProfile;
  availableCities: CityProfile[];
  onSelectCity: (cityId: string) => void;
  resilienceScore: number;
  onOpenCommandCenter: () => void;
  onOpenAlgorithmModal: () => void;
  onOpenReportModal: () => void;
  isSimulating: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  selectedCity,
  availableCities,
  onSelectCity,
  resilienceScore,
  onOpenCommandCenter,
  onOpenAlgorithmModal,
  onOpenReportModal,
  isSimulating,
}) => {
  const getResilienceBadgeColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-950/70 border-emerald-700/60';
    if (score >= 65) return 'text-amber-400 bg-amber-950/70 border-amber-700/60';
    if (score >= 45) return 'text-orange-400 bg-orange-950/70 border-orange-700/60';
    return 'text-rose-400 bg-rose-950/70 border-rose-700/60 animate-pulse';
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Command Hub', icon: Activity },
    { id: 'simulator', label: 'Live Simulator', icon: PlaySquare },
    { id: 'graph', label: 'Cascade Graph', icon: Layers },
    { id: 'map', label: 'Geospatial Map', icon: MapPin },
    { id: 'critical-nodes', label: 'Critical Nodes', icon: Flame },
    { id: 'ai-optimizer', label: 'AI Response Optimizer', icon: Wand2 },
    { id: 'scenarios', label: 'Scenario Lab', icon: Shield },
    { id: 'provenance', label: 'Data Provenance', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0F1012]/95 backdrop-blur-md px-4 py-3">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left Branding & City Selector */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-white text-black shadow-md">
              <Radio className="h-5 w-5 stroke-[2.5]" />
              {isSimulating && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-display text-xl font-black tracking-tighter text-white uppercase">
                  URBANPULSE
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[9px] font-mono font-bold tracking-[0.25em] text-white/90 border border-white/20 uppercase">
                  SIMULATOR
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-4 h-[1px] bg-white/30"></div>
                <p className="text-[10px] uppercase font-mono tracking-[0.25em] text-white/50">
                  Infrastructure Intelligence
                </p>
              </div>
            </div>
          </div>

          {/* City Dropdown */}
          <div className="relative flex items-center gap-2 rounded-full border border-white/20 bg-[#141518] px-3.5 py-1.5 hover:border-white/40 transition-colors">
            <Globe2 className="h-3.5 w-3.5 text-white/70 shrink-0" />
            <select
              id="city-selector-dropdown"
              value={selectedCity.cityId}
              onChange={(e) => onSelectCity(e.target.value)}
              className="bg-transparent text-xs font-bold uppercase tracking-wider text-white outline-none cursor-pointer pr-1"
            >
              {availableCities.map((city) => (
                <option key={city.cityId} value={city.cityId} className="bg-[#141518] text-white">
                  {city.cityName} — {city.country}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.15em] transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-black font-black shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-black' : 'text-white/40'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Resilience & Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Resilience Badge */}
          <div
            className={`flex items-center gap-2 rounded-full border border-white/20 bg-[#141518] px-3.5 py-1.5 text-xs font-mono font-bold tracking-wider ${getResilienceBadgeColor(
              resilienceScore
            )}`}
          >
            <Shield className="h-3.5 w-3.5 opacity-80" />
            <span className="text-[10px] tracking-[0.2em] text-white/60 uppercase">RESILIENCE</span>
            <span className="font-display font-black text-sm text-white">{resilienceScore}</span>
            <span className="text-[10px] text-white/40">/100</span>
          </div>

          {/* Report Button */}
          <button
            id="btn-open-report"
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 rounded-full border border-white/20 bg-[#141518] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black transition-all"
            title="View Executive Incident Report"
          >
            <FileText className="h-3.5 w-3.5 opacity-70" />
            <span className="hidden sm:inline">REPORT</span>
          </button>

          {/* Mathematical Explanation */}
          <button
            id="btn-open-algorithm-modal"
            onClick={onOpenAlgorithmModal}
            className="flex items-center justify-center h-8 w-8 rounded-full border border-white/20 bg-[#141518] text-white/70 hover:bg-white hover:text-black transition-all"
            title="Algorithm & Mathematical Transparency"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>

          {/* Judge Demo Mode */}
          <button
            id="btn-open-command-center"
            onClick={onOpenCommandCenter}
            className="flex items-center gap-1.5 rounded-full bg-white text-black hover:bg-white/90 px-4 py-1.5 text-xs font-black uppercase tracking-[0.15em] transition-all shadow-md cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 fill-black" />
            <span>JUDGE DEMO</span>
          </button>
        </div>
      </div>
    </header>
  );
};
