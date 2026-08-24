'use client';

import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Shield,
  Layers,
  Zap,
  Activity,
  Droplets,
  Train,
  Radio,
  Building2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
} from 'lucide-react';
import {
  CityProfile,
  InfrastructureNode,
  DependencyEdge,
  TimestepState,
  InfrastructureCategory,
  NodeState,
} from '@/types/urbanpulse';

interface CityMapProps {
  city: CityProfile;
  nodes: InfrastructureNode[];
  edges: DependencyEdge[];
  currentStep: TimestepState;
  onSelectNode: (node: InfrastructureNode) => void;
  selectedNode: InfrastructureNode | null;
}

export const CityMap: React.FC<CityMapProps> = ({
  city,
  nodes,
  edges,
  currentStep,
  onSelectNode,
  selectedNode,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [showEdges, setShowEdges] = useState(true);
  const [showHeatZones, setShowHeatZones] = useState(true);

  // Compute Lat/Lon Bounds
  const bounds = useMemo(() => {
    if (nodes.length === 0) return { minLat: 37.7, maxLat: 37.8, minLon: -122.5, maxLon: -122.3 };
    let minLat = Infinity,
      maxLat = -Infinity,
      minLon = Infinity,
      maxLon = -Infinity;

    for (const node of nodes) {
      if (node.latitude < minLat) minLat = node.latitude;
      if (node.latitude > maxLat) maxLat = node.latitude;
      if (node.longitude < minLon) minLon = node.longitude;
      if (node.longitude > maxLon) maxLon = node.longitude;
    }

    // Add 15% margin padding
    const latSpan = Math.max(0.04, maxLat - minLat);
    const lonSpan = Math.max(0.04, maxLon - minLon);

    return {
      minLat: minLat - latSpan * 0.15,
      maxLat: maxLat + latSpan * 0.15,
      minLon: minLon - lonSpan * 0.15,
      maxLon: maxLon + lonSpan * 0.15,
    };
  }, [nodes]);

  // Project lat/lon to SVG 0-1000 coordinate space
  const projectCoords = (lat: number, lon: number) => {
    const latRatio = (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat);
    const lonRatio = (lon - bounds.minLon) / (bounds.maxLon - bounds.minLon);
    // Invert Y for screen coordinates (north is up)
    const x = lonRatio * 900 + 50;
    const y = (1 - latRatio) * 520 + 40;
    return { x, y };
  };

  const getNodeState = (nodeId: string): { state: NodeState; health: number } => {
    const health = currentStep.nodeHealthMap[nodeId] ?? 1.0;
    const state = currentStep.nodeStateMap[nodeId] ?? 'NORMAL';
    return { state, health };
  };

  const getNodeColor = (health: number, state: NodeState) => {
    if (state === 'RECOVERING') return '#06b6d4'; // cyan
    if (health >= 0.85) return '#10b981'; // emerald
    if (health >= 0.60) return '#f59e0b'; // amber
    if (health >= 0.25) return '#f97316'; // orange
    return '#f43f5e'; // rose
  };

  const getCategoryIcon = (category: InfrastructureCategory) => {
    switch (category) {
      case 'POWER_GRID':
        return Zap;
      case 'HEALTHCARE':
        return Activity;
      case 'WATER_SYSTEM':
        return Droplets;
      case 'TRANSPORTATION':
        return Train;
      case 'TELECOMMUNICATIONS':
        return Radio;
      case 'EMERGENCY_SERVICES':
      case 'PUBLIC_SAFETY':
        return Shield;
      default:
        return Building2;
    }
  };

  const filteredNodes = useMemo(() => {
    if (activeCategoryFilter === 'ALL') return nodes;
    return nodes.filter((n) => n.category === activeCategoryFilter);
  }, [nodes, activeCategoryFilter]);

  // Pan & Zoom handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const categories = [
    { id: 'ALL', label: 'All Layers' },
    { id: 'POWER_GRID', label: 'Power Grid' },
    { id: 'HEALTHCARE', label: 'Healthcare' },
    { id: 'WATER_SYSTEM', label: 'Water' },
    { id: 'TRANSPORTATION', label: 'Transit' },
    { id: 'TELECOMMUNICATIONS', label: 'Telecom' },
    { id: 'EMERGENCY_SERVICES', label: 'Emergency' },
  ];

  return (
    <div className="relative flex flex-col h-[580px] w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl select-none">
      {/* Top Map Header & Controls Overlay */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* City Info Badge */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 shadow-md">
          <MapPin className="h-4 w-4 text-cyan-400" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100">{city.cityName}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {city.latitude.toFixed(3)}°N, {city.longitude.toFixed(3)}°W
              </span>
            </div>
            <span className="text-[10px] text-slate-400">OpenStreetMap Geospatial Layer</span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/90 backdrop-blur-md p-1 overflow-x-auto max-w-[420px] scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryFilter(cat.id)}
              className={`rounded px-2 py-1 text-[10px] font-medium transition-colors whitespace-nowrap ${
                activeCategoryFilter === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Zoom & View Controls */}
        <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/90 backdrop-blur-md p-1">
          <button
            onClick={() => setZoomLevel((z) => Math.min(3.0, z + 0.3))}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-300 hover:bg-slate-800"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.3))}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-300 hover:bg-slate-800"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={resetView}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-300 hover:bg-slate-800"
            title="Reset Map View"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Map SVG Canvas */}
      <div
        className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing bg-slate-950"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          viewBox="0 0 1000 600"
          className="w-full h-full"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <defs>
            {/* Grid pattern for high-tech spatial feel */}
            <pattern id="city-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(30, 41, 59, 0.4)" strokeWidth="1" />
            </pattern>
            {/* Radial glow filter */}
            <radialGradient id="failGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="warnGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Map Base Grid & Waterways backdrop representation */}
          <rect width="1000" height="600" fill="url(#city-grid)" />

          {/* Road Network Grid Lines (Derivation from OSM) */}
          <g opacity="0.25" stroke="#334155" strokeWidth="1.5">
            <line x1="120" y1="80" x2="880" y2="520" />
            <line x1="80" y1="300" x2="920" y2="280" />
            <line x1="250" y1="60" x2="350" y2="560" />
            <line x1="600" y1="40" x2="580" y2="560" />
            <line x1="750" y1="120" x2="200" y2="520" />
            <circle cx="500" cy="300" r="220" fill="none" stroke="#1e293b" strokeWidth="2" />
          </g>

          {/* Simulated Risk Heat Zones */}
          {showHeatZones &&
            nodes.map((node) => {
              const { health, state } = getNodeState(node.id);
              if (health >= 0.85) return null;
              const { x, y } = projectCoords(node.latitude, node.longitude);
              const radius = state === 'FAILED' ? 75 : 50;

              return (
                <circle
                  key={`heat_${node.id}`}
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={state === 'FAILED' ? 'url(#failGlow)' : 'url(#warnGlow)'}
                  className="animate-pulse"
                />
              );
            })}

          {/* Dependency Links / Active Cascade Rays */}
          {showEdges &&
            edges.map((edge) => {
              const sourceNode = nodes.find((n) => n.id === edge.source);
              const targetNode = nodes.find((n) => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              const p1 = projectCoords(sourceNode.latitude, sourceNode.longitude);
              const p2 = projectCoords(targetNode.latitude, targetNode.longitude);

              const sourceHealth = currentStep.nodeHealthMap[edge.source] ?? 1.0;
              const isCascading = sourceHealth < edge.failureThreshold;

              const strokeColor = isCascading ? '#f43f5e' : 'rgba(71, 85, 105, 0.4)';
              const strokeWidth = isCascading ? 2.5 : 1.2;

              return (
                <g key={edge.id}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    className={isCascading ? 'animate-cascade-flow' : ''}
                  />
                  {isCascading && (
                    <circle
                      cx={(p1.x + p2.x) / 2}
                      cy={(p1.y + p2.y) / 2}
                      r="3"
                      fill="#f43f5e"
                      className="animate-ping"
                    />
                  )}
                </g>
              );
            })}

          {/* Infrastructure Node Pins */}
          {filteredNodes.map((node) => {
            const { x, y } = projectCoords(node.latitude, node.longitude);
            const { health, state } = getNodeState(node.id);
            const isSelected = selectedNode?.id === node.id;
            const nodeColor = getNodeColor(health, state);
            const Icon = getCategoryIcon(node.category);

            return (
              <g
                key={node.id}
                transform={`translate(${x}, ${y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(node);
                }}
                className="cursor-pointer group"
              >
                {/* Outer Selection Highlight */}
                {isSelected && (
                  <circle r="22" fill="none" stroke="#38bdf8" strokeWidth="2.5" className="animate-spin" />
                )}

                {/* Animated Pulsing Ring for Failed or Degraded Nodes */}
                {(state === 'FAILED' || state === 'DEGRADED') && (
                  <circle
                    r="18"
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth="1.5"
                    opacity="0.75"
                    className="animate-ping"
                  />
                )}

                {/* Node Pin Circle */}
                <circle
                  r="14"
                  fill="#0b0f17"
                  stroke={nodeColor}
                  strokeWidth="2.5"
                  className="transition-transform duration-200 group-hover:scale-125"
                />

                {/* Health Center Indicator */}
                <circle r="4" fill={nodeColor} />

                {/* Node Label (shown on hover or selection) */}
                <text
                  y="-18"
                  textAnchor="middle"
                  fill="#f1f5f9"
                  fontSize="11"
                  fontWeight="600"
                  className="pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] opacity-90 group-hover:opacity-100"
                >
                  {node.name.length > 20 ? `${node.name.substring(0, 18)}...` : node.name}
                </text>

                {/* Health State Mini Badge */}
                <text
                  y="26"
                  textAnchor="middle"
                  fill={nodeColor}
                  fontSize="9"
                  fontWeight="700"
                  fontFamily="monospace"
                  className="pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                >
                  {Math.round(health * 100)}% ({state})
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Map Legend & Toggles */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Legend */}
        <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
            <span>Normal (100%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
            <span>Warning (75%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-400"></span>
            <span>Degraded (50%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span>Failed (0%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400"></span>
            <span>Recovering</span>
          </div>
        </div>

        {/* Edge / Heatmap Layer Toggles */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/90 backdrop-blur-md px-2.5 py-1 text-xs">
          <label className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer text-[11px]">
            <input
              type="checkbox"
              checked={showEdges}
              onChange={(e) => setShowEdges(e.target.checked)}
              className="rounded accent-cyan-400"
            />
            <span>Cascade Arcs</span>
          </label>
          <label className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer text-[11px]">
            <input
              type="checkbox"
              checked={showHeatZones}
              onChange={(e) => setShowHeatZones(e.target.checked)}
              className="rounded accent-cyan-400"
            />
            <span>Risk Zones</span>
          </label>
        </div>
      </div>
    </div>
  );
};
