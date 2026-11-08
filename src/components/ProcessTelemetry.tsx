import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  ArrowDown, 
  ArrowUp, 
  Cpu, 
  Layers, 
  Network, 
  Ban, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Sparkles 
} from 'lucide-react';
import { AppRule, BandwidthHistoryPoint, ProcessTelemetry } from '../types/firewall';
import { AppIcon } from './AppIcon';
import { formatBytes, formatSpeed } from '../services/trafficEngine';

interface ProcessTelemetryProps {
  processes: ProcessTelemetry[];
  bandwidthHistory: BandwidthHistoryPoint[];
  appRules: Record<string, AppRule>;
  onToggleAppNetwork: (packageName: string) => void;
  onSimulateSpike: (packageName: string) => void;
}

export const ProcessTelemetryView: React.FC<ProcessTelemetryProps> = ({
  processes,
  bandwidthHistory,
  appRules,
  onToggleAppNetwork,
  onSimulateSpike,
}) => {
  const [sortBy, setSortBy] = useState<'speed' | 'totalDown' | 'totalUp' | 'sockets' | 'name'>('speed');
  const [expandedPid, setExpandedPid] = useState<number | null>(null);
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);

  // Aggregate device stats
  const totalDownKbps = processes.reduce((acc, p) => acc + p.currentDownKbps, 0);
  const totalUpKbps = processes.reduce((acc, p) => acc + p.currentUpKbps, 0);
  const totalDownSession = processes.reduce((acc, p) => acc + p.totalDownBytes, 0);
  const totalUpSession = processes.reduce((acc, p) => acc + p.totalUpBytes, 0);
  const totalActiveSockets = processes.reduce((acc, p) => acc + p.activeSockets, 0);

  // Sorted processes
  const sortedProcesses = useMemo(() => {
    let list = [...processes];
    if (filterActiveOnly) {
      list = list.filter((p) => p.currentDownKbps > 0 || p.currentUpKbps > 0 || p.activeSockets > 0);
    }

    return list.sort((a, b) => {
      if (sortBy === 'speed') {
        const speedA = a.currentDownKbps + a.currentUpKbps;
        const speedB = b.currentDownKbps + b.currentUpKbps;
        return speedB - speedA;
      }
      if (sortBy === 'totalDown') return b.totalDownBytes - a.totalDownBytes;
      if (sortBy === 'totalUp') return b.totalUpBytes - a.totalUpBytes;
      if (sortBy === 'sockets') return b.activeSockets - a.activeSockets;
      return a.appName.localeCompare(b.appName);
    });
  }, [processes, sortBy, filterActiveOnly]);

  // SVG Chart points calculation
  const maxHistoryDown = Math.max(100, ...bandwidthHistory.map((h) => h.downKbps));
  const svgWidth = 400;
  const svgHeight = 90;

  const pointsDown = useMemo(() => {
    if (bandwidthHistory.length === 0) return '';
    return bandwidthHistory
      .map((pt, idx) => {
        const x = (idx / (bandwidthHistory.length - 1)) * svgWidth;
        const y = svgHeight - (pt.downKbps / maxHistoryDown) * (svgHeight - 10) - 5;
        return `${x},${y}`;
      })
      .join(' ');
  }, [bandwidthHistory, maxHistoryDown]);

  const areaPointsDown = useMemo(() => {
    if (bandwidthHistory.length === 0) return '';
    const firstX = 0;
    const lastX = svgWidth;
    return `0,${svgHeight} ${pointsDown} ${lastX},${svgHeight}`;
  }, [pointsDown, bandwidthHistory]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Device Throughput Cockpit */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Download Speedometer */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>Downlink</span>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-emerald-400">
              {formatSpeed(totalDownKbps)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Total {formatBytes(totalDownSession)}
            </span>
          </div>

          {/* Upload Speedometer */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <ArrowUp className="w-3.5 h-3.5 text-sky-400" />
              <span>Uplink</span>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-sky-400">
              {formatSpeed(totalUpKbps)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Total {formatBytes(totalUpSession)}
            </span>
          </div>

          {/* Active Sockets */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Network className="w-3.5 h-3.5 text-amber-400" />
              <span>Open Sockets</span>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-amber-400">
              {totalActiveSockets}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              TCP / UDP / QUIC
            </span>
          </div>

          {/* Monitored Processes */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span>Processes</span>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-purple-400">
              {processes.length}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Per-PID Isolated
            </span>
          </div>
        </div>

        {/* Live Bandwidth Waveform Graph */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="flex items-center gap-1 font-medium">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Live Device Throughput History (30s Window)
            </span>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Down: {formatSpeed(totalDownKbps)}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                Peak: {formatSpeed(maxHistoryDown)}
              </span>
            </div>
          </div>

          <div className="w-full h-24 bg-slate-950/80 rounded-xl border border-slate-800/80 relative overflow-hidden flex items-end">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-full preserve-3d"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="gradDown" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="0" y1="22" x2={svgWidth} y2="22" stroke="#1e293b" strokeDasharray="3,3" />
              <line x1="0" y1="45" x2={svgWidth} y2="45" stroke="#1e293b" strokeDasharray="3,3" />
              <line x1="0" y1="68" x2={svgWidth} y2="68" stroke="#1e293b" strokeDasharray="3,3" />

              {/* Downlink Gradient Area */}
              {areaPointsDown && (
                <polygon points={areaPointsDown} fill="url(#gradDown)" />
              )}

              {/* Downlink Line */}
              {pointsDown && (
                <polyline
                  points={pointsDown}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Process Table Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Per-Process Network Activity
          </span>
          <button
            type="button"
            onClick={() => setFilterActiveOnly(!filterActiveOnly)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
              filterActiveOnly
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {filterActiveOnly ? 'Showing Active Only' : 'Show All PIDs'}
          </button>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">Sort:</span>
          {(
            [
              { id: 'speed', label: 'Speed' },
              { id: 'totalDown', label: 'Total Recv' },
              { id: 'sockets', label: 'Sockets' },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              onClick={() => setSortBy(s.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                sortBy === s.id
                  ? 'bg-slate-800 text-slate-100 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Process List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[350px]">
        {sortedProcesses.map((proc) => {
          const rule = appRules[proc.packageName];
          const isBlocked = rule && (rule.blockWifi || rule.blockCellular);
          const isExpanded = expandedPid === proc.pid;
          const totalProcSpeed = proc.currentDownKbps + proc.currentUpKbps;
          const speedBarPercent = Math.min(100, Math.round((totalProcSpeed / (maxHistoryDown || 1)) * 100));

          return (
            <div
              key={proc.pid}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isBlocked
                  ? 'bg-rose-950/10 border-rose-900/30'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
              }`}
            >
              <div className="p-3 flex items-center justify-between gap-3">
                {/* Left: App icon & process info */}
                <div
                  onClick={() => setExpandedPid(isExpanded ? null : proc.pid)}
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                >
                  <AppIcon name={rule?.icon || 'android_os'} size={18} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-100 truncate">
                        {proc.appName}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        PID {proc.pid}
                      </span>
                      {proc.activeSockets > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {proc.activeSockets} sock
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono truncate">
                      <span className="truncate">{proc.processName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-400">{proc.memoryMb} MB</span>
                    </div>

                    {/* Miniature live activity bar */}
                    <div className="w-36 h-1 bg-slate-950 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 transition-all duration-300"
                        style={{ width: `${Math.max(3, speedBarPercent)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Middle: Live speeds & Session Totals */}
                <div className="text-right shrink-0">
                  <div className="flex items-center justify-end gap-2 font-mono tabular-nums text-xs font-semibold">
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      ↓ {formatSpeed(proc.currentDownKbps)}
                    </span>
                    <span className="text-sky-400 flex items-center gap-0.5">
                      ↑ {formatSpeed(proc.currentUpKbps)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Total: {formatBytes(proc.totalDownBytes + proc.totalUpBytes)}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Simulate Spike Button */}
                  <button
                    type="button"
                    onClick={() => onSimulateSpike(proc.packageName)}
                    className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 rounded-xl transition-colors"
                    title="Simulate bandwidth traffic burst"
                  >
                    <Zap size={16} />
                  </button>

                  {/* Cut / Allow Network access */}
                  <button
                    type="button"
                    onClick={() => onToggleAppNetwork(proc.packageName)}
                    className={`min-w-[36px] min-h-[36px] p-2 rounded-xl border flex items-center justify-center transition-all ${
                      isBlocked
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 hover:bg-rose-500/25'
                        : 'bg-slate-800/70 border-slate-700/60 text-slate-400 hover:text-slate-200'
                    }`}
                    title={isBlocked ? 'Internet Severed (Click to permit)' : 'Internet Allowed (Click to block)'}
                  >
                    {isBlocked ? <Ban size={16} /> : <ShieldCheck size={16} />}
                  </button>

                  {/* Expand socket details toggle */}
                  <button
                    type="button"
                    onClick={() => setExpandedPid(isExpanded ? null : proc.pid)}
                    className="p-2 text-slate-500 hover:text-slate-300 rounded-xl"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expanded Socket Inspection Drawer */}
              {isExpanded && (
                <div className="p-3 bg-slate-950/70 border-t border-slate-800/70 text-xs space-y-2">
                  <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
                    <span>Active Network Sockets ({proc.openConnections.length})</span>
                    <span>State / Geolocation</span>
                  </div>

                  {proc.openConnections.length === 0 ? (
                    <p className="text-slate-500 text-xs italic py-1">
                      No active open sockets currently held by this process.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {proc.openConnections.map((sock) => (
                        <div
                          key={sock.id}
                          className="p-2 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-[11px]"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 font-bold text-[10px]">
                              {sock.protocol}
                            </span>
                            <span className="text-slate-300 truncate">{sock.remoteHost}</span>
                            <span className="text-slate-500">
                              ({sock.remoteAddress}:{sock.remotePort})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-slate-400">[{sock.country}]</span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold text-[10px]">
                              {sock.state}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
