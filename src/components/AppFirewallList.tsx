import React, { useState, useMemo } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Smartphone, 
  Search, 
  Moon, 
  Plane, 
  Info, 
  Check, 
  Filter, 
  ShieldAlert, 
  Ban, 
  Radio 
} from 'lucide-react';
import { AppRule, ProcessTelemetry } from '../types/firewall';
import { AppIcon } from './AppIcon';
import { formatBytes } from '../services/trafficEngine';

interface AppFirewallListProps {
  apps: AppRule[];
  processes: ProcessTelemetry[];
  onUpdateAppRule: (packageName: string, patch: Partial<AppRule>) => void;
  onSelectApp: (app: AppRule) => void;
  onBatchUpdate: (patch: Partial<AppRule>, target: 'all' | 'user' | 'system') => void;
}

export const AppFirewallList: React.FC<AppFirewallListProps> = ({
  apps,
  processes,
  onUpdateAppRule,
  onSelectApp,
  onBatchUpdate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'user' | 'system' | 'blocked' | 'active'>('all');
  const [showBatchMenu, setShowBatchMenu] = useState(false);

  // Map package name to live process traffic
  const processMap = useMemo(() => {
    const map = new Map<string, ProcessTelemetry>();
    processes.forEach((p) => map.set(p.packageName, p));
    return map;
  }, [processes]);

  // Filtered apps
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      // Search matching
      const matchesSearch =
        app.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.uid.toString().includes(searchQuery);

      if (!matchesSearch) return false;

      // Category / state filter
      if (activeFilter === 'user') return !app.isSystemApp;
      if (activeFilter === 'system') return app.isSystemApp;
      if (activeFilter === 'blocked') {
        return app.blockWifi || app.blockCellular || app.blockRoaming || app.blockBackground;
      }
      if (activeFilter === 'active') {
        const proc = processMap.get(app.packageName);
        return proc && (proc.currentDownKbps > 0 || proc.currentUpKbps > 0 || proc.activeSockets > 0);
      }

      return true;
    });
  }, [apps, searchQuery, activeFilter, processMap]);

  const blockedCount = useMemo(() => {
    return apps.filter((a) => a.blockWifi || a.blockCellular || a.blockRoaming || a.blockBackground).length;
  }, [apps]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Controls: Search + Filter Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search apps by name, package ID, UID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Bulk rules menu */}
          <div className="relative">
            <button
              onClick={() => setShowBatchMenu(!showBatchMenu)}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              title="Batch rule actions"
            >
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Batch</span> Rules
            </button>

            {showBatchMenu && (
              <div className="absolute right-0 mt-1 w-56 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-1 backdrop-blur-md">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Bulk Actions
                </div>
                <button
                  onClick={() => {
                    onBatchUpdate({ blockCellular: true }, 'all');
                    setShowBatchMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg flex items-center justify-between"
                >
                  <span>Block Cellular (All)</span>
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                </button>
                <button
                  onClick={() => {
                    onBatchUpdate({ blockBackground: true }, 'user');
                    setShowBatchMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg flex items-center justify-between"
                >
                  <span>Block User Apps Background</span>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                </button>
                <button
                  onClick={() => {
                    onBatchUpdate({ blockRoaming: true }, 'all');
                    setShowBatchMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg flex items-center justify-between"
                >
                  <span>Block Roaming (All)</span>
                  <Plane className="w-3.5 h-3.5 text-amber-400" />
                </button>
                <div className="border-t border-slate-800 my-1" />
                <button
                  onClick={() => {
                    onBatchUpdate({ blockWifi: false, blockCellular: false, blockRoaming: false, blockBackground: false }, 'all');
                    setShowBatchMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-950/40 text-emerald-400 rounded-lg flex items-center justify-between"
                >
                  <span>Allow All Network Access</span>
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter Pills / Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeFilter === 'all'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            All Apps ({apps.length})
          </button>
          <button
            onClick={() => setActiveFilter('user')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeFilter === 'user'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            User Installed
          </button>
          <button
            onClick={() => setActiveFilter('system')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeFilter === 'system'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            System Framework
          </button>
          <button
            onClick={() => setActiveFilter('blocked')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
              activeFilter === 'blocked'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            Blocked ({blockedCount})
          </button>
          <button
            onClick={() => setActiveFilter('active')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
              activeFilter === 'active'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            <Radio className="w-3 h-3" />
            Active Traffic
          </button>
        </div>

        {/* Legend strip */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1 border-t border-slate-900">
          <span>Tap icons to toggle network permissions:</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Wifi className="w-3 h-3 text-sky-400" /> Wi-Fi
            </span>
            <span className="flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-emerald-400" /> Cell
            </span>
            <span className="flex items-center gap-1">
              <Plane className="w-3 h-3 text-amber-400" /> Roam
            </span>
            <span className="flex items-center gap-1">
              <Moon className="w-3 h-3 text-indigo-400" /> Backgr
            </span>
          </div>
        </div>
      </div>

      {/* App Rules List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[350px]">
        {filteredApps.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800/60 text-slate-400">
            <Ban className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="font-medium text-sm">No applications match your filter</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search query or switching tabs.</p>
          </div>
        ) : (
          filteredApps.map((app) => {
            const proc = processMap.get(app.packageName);
            const isFullyBlocked = app.blockWifi && app.blockCellular;

            return (
              <div
                key={app.packageName}
                className={`p-3 rounded-2xl border transition-all ${
                  isFullyBlocked
                    ? 'bg-rose-950/10 border-rose-900/30 hover:border-rose-800/50'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: App Icon & Details */}
                  <div
                    onClick={() => onSelectApp(app)}
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group"
                  >
                    <AppIcon name={app.icon} size={18} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors truncate">
                          {app.appName}
                        </span>
                        {app.isSystemApp && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            UID {app.uid}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate">
                        <span className="font-mono text-slate-400 truncate">{app.packageName}</span>
                        {proc && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-emerald-400 tabular-nums">
                              {formatBytes(proc.totalDownBytes + proc.totalUpBytes)}
                            </span>
                            {proc.currentDownKbps > 0 && (
                              <span className="text-sky-400 font-mono">
                                ↓ {Math.round(proc.currentDownKbps)}k
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Firewall Toggle Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Wi-Fi Toggle */}
                    <button
                      type="button"
                      onClick={() => onUpdateAppRule(app.packageName, { blockWifi: !app.blockWifi })}
                      className={`min-w-[36px] min-h-[36px] p-2 rounded-xl border flex items-center justify-center transition-all ${
                        app.blockWifi
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 hover:bg-rose-500/25'
                          : 'bg-slate-800/70 border-slate-700/60 text-sky-400 hover:bg-slate-700/80'
                      }`}
                      title={app.blockWifi ? 'Wi-Fi Blocked (Tap to allow)' : 'Wi-Fi Allowed (Tap to block)'}
                      aria-label="Toggle Wi-Fi"
                    >
                      {app.blockWifi ? <WifiOff size={16} /> : <Wifi size={16} />}
                    </button>

                    {/* Cellular Toggle */}
                    <button
                      type="button"
                      onClick={() => onUpdateAppRule(app.packageName, { blockCellular: !app.blockCellular })}
                      className={`min-w-[36px] min-h-[36px] p-2 rounded-xl border flex items-center justify-center transition-all ${
                        app.blockCellular
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 hover:bg-rose-500/25'
                          : 'bg-slate-800/70 border-slate-700/60 text-emerald-400 hover:bg-slate-700/80'
                      }`}
                      title={app.blockCellular ? 'Cellular Blocked (Tap to allow)' : 'Cellular Allowed (Tap to block)'}
                      aria-label="Toggle Cellular"
                    >
                      <Smartphone size={16} />
                    </button>

                    {/* Roaming Toggle */}
                    <button
                      type="button"
                      onClick={() => onUpdateAppRule(app.packageName, { blockRoaming: !app.blockRoaming })}
                      className={`min-w-[36px] min-h-[36px] p-2 rounded-xl border flex items-center justify-center transition-all ${
                        app.blockRoaming
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25'
                          : 'bg-slate-800/70 border-slate-700/60 text-slate-400 hover:bg-slate-700/80'
                      }`}
                      title={app.blockRoaming ? 'Roaming Blocked (Tap to allow)' : 'Roaming Allowed (Tap to block)'}
                      aria-label="Toggle Roaming"
                    >
                      <Plane size={16} />
                    </button>

                    {/* Background Data Toggle */}
                    <button
                      type="button"
                      onClick={() => onUpdateAppRule(app.packageName, { blockBackground: !app.blockBackground })}
                      className={`min-w-[36px] min-h-[36px] p-2 rounded-xl border flex items-center justify-center transition-all ${
                        app.blockBackground
                          ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/25'
                          : 'bg-slate-800/70 border-slate-700/60 text-slate-400 hover:bg-slate-700/80'
                      }`}
                      title={app.blockBackground ? 'Background Blocked (Tap to allow)' : 'Background Allowed (Tap to block)'}
                      aria-label="Toggle Background Data"
                    >
                      <Moon size={16} />
                    </button>

                    {/* Info / inspect */}
                    <button
                      type="button"
                      onClick={() => onSelectApp(app)}
                      className="min-w-[36px] min-h-[36px] p-2 text-slate-500 hover:text-slate-300 rounded-xl hover:bg-slate-800/50 transition-colors"
                      title="Inspect sockets & traffic details"
                      aria-label="App info"
                    >
                      <Info size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
