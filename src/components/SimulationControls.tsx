import React from 'react';
import { 
  Wifi, 
  Smartphone, 
  Plane, 
  Moon, 
  Sun, 
  Zap, 
  Radio, 
  ShieldAlert, 
  Activity, 
  RotateCcw 
} from 'lucide-react';
import { FirewallConfig } from '../types/firewall';

interface SimulationControlsProps {
  config: FirewallConfig;
  onUpdateConfig: (patch: Partial<FirewallConfig>) => void;
  onSimulateInboundAttack: () => void;
  onSimulateBackgroundLeak: () => void;
  onSimulateVideoBurst: () => void;
  onResetStats: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  config,
  onUpdateConfig,
  onSimulateInboundAttack,
  onSimulateBackgroundLeak,
  onSimulateVideoBurst,
  onResetStats,
}) => {
  return (
    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Android Network Environment Simulator
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          State: {config.currentInterface.toUpperCase()} · {config.isRoaming ? 'ROAMING' : 'DOMESTIC'} · {config.isScreenOff ? 'SCREEN OFF' : 'FOREGROUND'}
        </span>
      </div>

      {/* Grid of Interactive Environment Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Network Interface: Wi-Fi vs Cellular */}
        <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            {config.currentInterface === 'wifi' ? (
              <Wifi className="w-4 h-4 text-sky-400" />
            ) : (
              <Smartphone className="w-4 h-4 text-emerald-400" />
            )}
            <span className="font-medium">
              {config.currentInterface === 'wifi' ? 'Wi-Fi (WLAN)' : 'Cellular (5G)'}
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdateConfig({
                currentInterface: config.currentInterface === 'wifi' ? 'cellular' : 'wifi',
              })
            }
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono font-medium transition-colors"
          >
            Switch to {config.currentInterface === 'wifi' ? '5G' : 'Wi-Fi'}
          </button>
        </div>

        {/* Roaming Mode Toggle */}
        <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Plane className={`w-4 h-4 ${config.isRoaming ? 'text-amber-400' : 'text-slate-500'}`} />
            <span className="font-medium">
              {config.isRoaming ? 'Roaming Abroad' : 'Home Carrier'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onUpdateConfig({ isRoaming: !config.isRoaming })}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
              config.isRoaming
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {config.isRoaming ? 'Disable' : 'Simulate Roam'}
          </button>
        </div>

        {/* Screen / Sleep State Toggle */}
        <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            {config.isScreenOff ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
            <span className="font-medium">
              {config.isScreenOff ? 'Screen OFF (Standby)' : 'Screen ON (Active)'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onUpdateConfig({ isScreenOff: !config.isScreenOff })}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
              config.isScreenOff
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {config.isScreenOff ? 'Turn ON' : 'Turn OFF'}
          </button>
        </div>
      </div>

      {/* Traffic & Attack Verification Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
        <span className="text-[11px] text-slate-400 font-medium">Verify Rule Enforcement:</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onSimulateInboundAttack}
            className="px-2.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Simulate external inbound port scan (Port 5555, 8080, 22)"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Simulate Port Scan</span>
          </button>

          <button
            type="button"
            onClick={onSimulateBackgroundLeak}
            className="px-2.5 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Simulate background tracker beacon trying to leak analytics"
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Simulate Background Leak</span>
          </button>

          <button
            type="button"
            onClick={onSimulateVideoBurst}
            className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Simulate high 4K video bandwidth stream in YouTube"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Stream 4K Video</span>
          </button>

          <button
            type="button"
            onClick={onResetStats}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl text-xs transition-colors"
            title="Reset bandwidth counters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
