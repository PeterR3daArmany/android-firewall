import React from 'react';
import { 
  X, 
  Wifi, 
  Smartphone, 
  Plane, 
  Moon, 
  Home, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Cpu, 
  Layers 
} from 'lucide-react';
import { AppRule, ProcessTelemetry } from '../types/firewall';
import { AppIcon } from './AppIcon';
import { formatBytes, formatSpeed } from '../services/trafficEngine';

interface AppDetailModalProps {
  app: AppRule | null;
  process?: ProcessTelemetry;
  onClose: () => void;
  onUpdateRule: (packageName: string, patch: Partial<AppRule>) => void;
}

export const AppDetailModal: React.FC<AppDetailModalProps> = ({
  app,
  process,
  onClose,
  onUpdateRule,
}) => {
  if (!app) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <AppIcon name={app.icon} size={22} />
            <div>
              <h3 className="text-base font-semibold text-slate-100">{app.appName}</h3>
              <p className="text-xs text-slate-400 font-mono">{app.packageName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Identity & Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-mono">UID</span>
            <span className="text-sm font-semibold text-slate-200 font-mono">{app.uid}</span>
          </div>
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-mono">CATEGORY</span>
            <span className="text-sm font-semibold text-slate-200 capitalize">{app.category}</span>
          </div>
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-mono">PID (ACTIVE)</span>
            <span className="text-sm font-semibold text-emerald-400 font-mono">
              {process ? process.pid : 'Offline'}
            </span>
          </div>
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-mono">TOTAL TRAFFIC</span>
            <span className="text-sm font-semibold text-sky-400 font-mono">
              {process ? formatBytes(process.totalDownBytes + process.totalUpBytes) : '0 B'}
            </span>
          </div>
        </div>

        {/* Granular Network Permission Switches */}
        <div className="space-y-2 pt-1">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Network Access Permissions
          </h4>

          <div className="space-y-1.5">
            {/* Wi-Fi Switch */}
            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-lg ${
                    app.blockWifi ? 'bg-rose-500/10 text-rose-400' : 'bg-sky-500/10 text-sky-400'
                  }`}
                >
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Wi-Fi Connection</span>
                  <span className="text-[11px] text-slate-400">
                    {app.blockWifi ? 'Blocked on all WLAN networks' : 'Permitted on all Wi-Fi networks'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateRule(app.packageName, { blockWifi: !app.blockWifi })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  !app.blockWifi ? 'bg-emerald-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    !app.blockWifi ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Cellular Data Switch */}
            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-lg ${
                    app.blockCellular ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Cellular / Mobile Data (4G/5G)</span>
                  <span className="text-[11px] text-slate-400">
                    {app.blockCellular ? 'Restricted (Preserves data plan)' : 'Permitted on SIM data'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateRule(app.packageName, { blockCellular: !app.blockCellular })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  !app.blockCellular ? 'bg-emerald-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    !app.blockCellular ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Roaming Switch */}
            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-lg ${
                    app.blockRoaming ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Plane className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">International Roaming</span>
                  <span className="text-[11px] text-slate-400">
                    {app.blockRoaming ? 'Blocked abroad to stop roaming fees' : 'Allowed when roaming abroad'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateRule(app.packageName, { blockRoaming: !app.blockRoaming })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  !app.blockRoaming ? 'bg-emerald-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    !app.blockRoaming ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Background Data Switch */}
            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-lg ${
                    app.blockBackground ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Background Network Access</span>
                  <span className="text-[11px] text-slate-400">
                    {app.blockBackground ? 'Cut off when app is minimized or screen off' : 'Background synchronization allowed'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateRule(app.packageName, { blockBackground: !app.blockBackground })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  !app.blockBackground ? 'bg-emerald-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    !app.blockBackground ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* LAN Access Switch */}
            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-lg ${
                    app.blockLan ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Local LAN / Intranet Access</span>
                  <span className="text-[11px] text-slate-400">
                    {app.blockLan ? 'Isolated from other devices on home network' : 'Can communicate with LAN devices'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUpdateRule(app.packageName, { blockLan: !app.blockLan })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  !app.blockLan ? 'bg-emerald-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    !app.blockLan ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Active Sockets Section */}
        {process && process.openConnections.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Active Sockets Held by Process
            </h4>
            <div className="space-y-1.5 font-mono text-xs">
              {process.openConnections.map((sock) => (
                <div
                  key={sock.id}
                  className="p-2 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between text-[11px]"
                >
                  <div className="truncate">
                    <span className="text-sky-400 mr-1.5 font-bold">{sock.protocol}</span>
                    <span className="text-slate-300">{sock.remoteHost}</span>
                    <span className="text-slate-500">:{sock.remotePort}</span>
                  </div>
                  <span className="text-emerald-400 font-semibold">{sock.state}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
