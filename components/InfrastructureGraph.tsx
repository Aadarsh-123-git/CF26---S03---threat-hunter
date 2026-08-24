'use client';

import React, { useState, useMemo } from 'react';
import {
  Layers,
  Zap,
  Activity,
  Droplets,
  Train,
  Radio,
  Shield,
  Building2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  GitBranch,
  ArrowDownRight,
  Sliders,
  Filter,
} from 'lucide-react';
import {
  InfrastructureNode,
  DependencyEdge,
  TimestepState,
  InfrastructureCategory,
  NodeState,
  DependencyType,
} from '@/types/urbanpulse';
import { UrbanGraph } from '@/lib/engine/graph';

interface InfrastructureGraphProps {
  nodes: InfrastructureNode[];
  edges: DependencyEdge[];
  currentStep: TimestepState;
  onSelectNode: (node: InfrastructureNode) => void;
  selectedNode: InfrastructureNode | null;
  graph: UrbanGraph;
}

export const InfrastructureGraph: React.FC<InfrastructureGraphProps> = ({
  nodes,
  edges,
  currentStep,
  onSelectNode,
  selectedNode,
  graph,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeLayerFilter, setActiveLayerFilter] = useState<string>('ALL');
  const [highlightBlastRadius, setHighlightBlastRadius] = useState(true);

  // Compute Downstream Reach of selected node
  const blastRadiusMap = useMemo(() => {
    if (!selectedNode || !highlightBlastRadius) return new Map<string, number>();
    return graph.getDownstreamReach(selectedNode.id);
  }, [selectedNode, highlightBlastRadius, graph]);

  // Layered Topological Layout mapping (Layer 0 = Power, Layer 1 = Transport/Water/Telecom, Layer 2 = Emergency/Health/Finance)
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const layers: Record<number, InfrastructureNode[]> = { 0: [], 1: [], 2: [], 3: [] };

    for (const node of nodes) {
      if (node.category === 'POWER_GRID') {
        layers[0].push(node);
      } else if (node.category === 'WATER_SYSTEM' || node.category === 'TELECOMMUNICATIONS') {
        layers[1].push(node);
      } else if (node.category === 'TRANSPORTATION') {
        layers[2].push(node);
      } else {
        layers[3].push(node); // Healthcare, Emergency, Finance
      }
    }

    const yOffsets = [70, 210, 360, 500];

    Object.entries(layers).forEach(([layerIdxStr, layerNodes]) => {
      const layerIdx = parseInt(layerIdxStr);
      const y = yOffsets[layerIdx] || 250;
      const count = layerNodes.length;
      const step = 900 / Math.max(1, count + 1);

      layerNodes.forEach((node, i) => {
        positions[node.id] = {
          x: 50 + (i + 1) * step,
          y,
        };
      });
    });

    return positions;
  }, [nodes]);

  const getNodeState = (nodeId: string): { state: NodeState; health: number } => {
    const health = currentStep.nodeHealthMap[nodeId] ?? 1.0;
    const state = currentStep.nodeStateMap[nodeId] ?? 'NORMAL';
    return { state, health };
  };

  const getNodeColor = (health: number, state: NodeState) => {
    if (state === 'RECOVERING') return '#06b6d4';
    if (health >= 0.85) return '#10b981';
    if (health >= 0.60) return '#f59e0b';
    if (health >= 0.25) return '#f97316';
    return '#f43f5e';
  };

  const getEdgeColor = (type: DependencyType) => {
    switch (type) {
      case 'POWER':
        return '#eab308'; // yellow
      case 'WATER':
        return '#06b6d4'; // cyan
      case 'TRANSPORT':
        return '#3b82f6'; // blue
      case 'TELECOM':
      case 'COMMUNICATION':
      case 'DIGITAL':
        return '#a855f7'; // purple
      case 'EMERGENCY':
        return '#f43f5e'; // red
      default:
        return '#64748b'; // slate
    }
  };

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

  return (
    <div className="relative flex flex-col h-[580px] w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl select-none">
      {/* Graph Header Overlay */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 shadow-md">
          <GitBranch className="h-4 w-4 text-cyan-400" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100">Dynamic Dependency Graph</span>
              <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300 font-mono">
                {nodes.length} Nodes &bull; {edges.length} Edges
              </span>
            </div>
            <span className="text-[10px] text-slate-400">Directed Cascade Propagation Architecture</span>
          </div>
        </div>

        {/* Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {selectedNode && (
            <div className="flex items-center gap-1.5 rounded-lg border border-cyan-800/60 bg-cyan-950/70 px-2.5 py-1 text-xs text-cyan-300">
              <span className="text-[10px] font-mono">Blast Radius:</span>
              <span className="font-bold">{blastRadiusMap.size} dependent nodes</span>
            </div>
          )}

          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/90 backdrop-blur-md p-1">
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
              className="flex h-7 w-7 items-center justify-center rounded text-slate-300 hover:bg-slate-800"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
              className="flex h-7 w-7 items-center justify-center rounded text-slate-300 hover:bg-slate-800"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setZoomLevel(1);
                setPanOffset({ x: 0, y: 0 });
              }}
              className="flex h-7 w-7 items-center justify-center rounded text-slate-300 hover:bg-slate-800"
              title="Reset View"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Dependency Graph Canvas */}
      <div
        className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing bg-slate-950"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          viewBox="0 0 1000 580"
          className="w-full h-full"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
            <marker
              id="arrow-fail"
              viewBox="0 0 10 10"
              refX="22"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
            </marker>
          </defs>

          {/* Layer Boundary Guidelines */}
          <g opacity="0.15" stroke="#475569" strokeDasharray="4 4">
            <line x1="20" y1="140" x2="980" y2="140" />
            <line x1="20" y1="285" x2="980" y2="285" />
            <line x1="20" y1="430" x2="980" y2="430" />
          </g>

          {/* Layer Labels */}
          <g fill="#475569" fontSize="10" fontWeight="700" letterSpacing="1.5">
            <text x="30" y="40">TIER 1: POWER & GENERATION FEEDERS</text>
            <text x="30" y="175">TIER 2: WATER PUMPS & TELECOM INFRASTRUCTURE</text>
            <text x="30" y="325">TIER 3: TRAFFIC & TRANSPORTATION NETWORKS</text>
            <text x="30" y="470">TIER 4: HEALTHCARE, EMERGENCY & FINANCIAL CORES</text>
          </g>

          {/* Dependency Edges */}
          {edges.map((edge) => {
            const p1 = nodePositions[edge.source];
            const p2 = nodePositions[edge.target];
            if (!p1 || !p2) return null;

            const sourceHealth = currentStep.nodeHealthMap[edge.source] ?? 1.0;
            const isCascading = sourceHealth < edge.failureThreshold;
            const isInBlastRadius = blastRadiusMap.has(edge.target);

            // Compute bezier curve path for smooth aesthetic flow
            const midY = (p1.y + p2.y) / 2;
            const pathData = `M ${p1.x} ${p1.y} C ${p1.x} ${midY}, ${p2.x} ${midY}, ${p2.x} ${p2.y}`;

            const baseColor = getEdgeColor(edge.dependencyType);
            const edgeColor = isCascading ? '#f43f5e' : isInBlastRadius ? '#38bdf8' : baseColor;
            const strokeWidth = isCascading ? 2.5 : isInBlastRadius ? 2.0 : 1.3;
            const opacity = isCascading || isInBlastRadius ? 0.95 : 0.45;

            return (
              <g key={edge.id}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={edgeColor}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  markerEnd={isCascading ? 'url(#arrow-fail)' : 'url(#arrow)'}
                  className={isCascading ? 'animate-cascade-flow' : ''}
                />
                {/* Edge Dependency Label on Hover or Active Cascade */}
                {isCascading && (
                  <text
                    x={(p1.x + p2.x) / 2}
                    y={(p1.y + p2.y) / 2 - 4}
                    fill="#f43f5e"
                    fontSize="9"
                    fontWeight="700"
                    textAnchor="middle"
                    className="drop-shadow-[0_1px_2px_rgba(0,0,0,1)]"
                  >
                    CASCADE ({edge.dependencyType})
                  </text>
                )}
              </g>
            );
          })}

          {/* Infrastructure Graph Nodes */}
          {nodes.map((node) => {
            const pos = nodePositions[node.id];
            if (!pos) return null;

            const { health, state } = getNodeState(node.id);
            const isSelected = selectedNode?.id === node.id;
            const nodeColor = getNodeColor(health, state);
            const hopDist = blastRadiusMap.get(node.id);

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(node);
                }}
                className="cursor-pointer group"
              >
                {/* Selection / Blast Radius Ring */}
                {isSelected && (
                  <circle r="26" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 2" />
                )}

                {hopDist !== undefined && !isSelected && (
                  <circle r="22" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.8" />
                )}

                {/* Node Box */}
                <rect
                  x="-75"
                  y="-18"
                  width="150"
                  height="36"
                  rx="8"
                  fill="#090d16"
                  stroke={nodeColor}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  className="transition-all duration-200 group-hover:stroke-cyan-400 drop-shadow-md"
                />

                {/* Status Indicator Pip */}
                <circle cx="-60" cy="0" r="5" fill={nodeColor} />

                {/* Node Title */}
                <text
                  x="-48"
                  y="-3"
                  fill="#f1f5f9"
                  fontSize="10"
                  fontWeight="600"
                  className="pointer-events-none"
                >
                  {node.name.length > 17 ? `${node.name.substring(0, 15)}...` : node.name}
                </text>

                {/* Node Metrics & State */}
                <text
                  x="-48"
                  y="9"
                  fill="#94a3b8"
                  fontSize="8.5"
                  fontFamily="monospace"
                  className="pointer-events-none"
                >
                  {Math.round(health * 100)}% &bull; {state}
                </text>

                {/* Criticality Score Pill */}
                <rect x="36" y="-12" width="30" height="24" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <text
                  x="51"
                  y="3"
                  textAnchor="middle"
                  fill="#38bdf8"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {node.criticalityScore}
                </text>

                {/* Hop Distance Badge if in blast radius */}
                {hopDist !== undefined && (
                  <g transform="translate(68, -14)">
                    <circle r="8" fill="#0284c7" />
                    <text
                      y="3"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="8"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      +{hopDist}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Dependency Type Legend */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 text-[11px] text-slate-300">
          <span className="text-slate-400 font-semibold">Dependencies:</span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-yellow-500"></span> Power
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-cyan-400"></span> Water
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-500"></span> Transport
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-purple-500"></span> Telecom
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500"></span> Emergency
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/90 backdrop-blur-md px-3 py-1 text-xs text-slate-400">
          <span>Click node to reveal downstream blast radius</span>
        </div>
      </div>
    </div>
  );
};
