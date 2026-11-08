import React from 'react';
import { 
  Key, 
  Wifi, 
  Smartphone, 
  Battery, 
  ShieldCheck, 
  ShieldAlert, 
  Power, 
  Settings, 
  Layers, 
  Shield, 
  Activity, 
  Terminal, 
  AlertOctagon, 
  Maximize2, 
  Minimize2 
} from 'lucide-react';
import { FirewallConfig } from '../types/firewall';

interface DeviceFrameProps {
  config: FirewallConfig;
  activeTab: 'apps' | 'inbound' | 'traffic' | 'logs';
  isWideMode: boolean;
  onTabChange: (tab: 'apps' | 'inbound' | 'traffic' | 'logs') => void;
  onToggleFirewall: () => void;
  onToggleLockdown: () => void;
  onOpenSettings: () => void;
  onToggleWideMode: () => void;
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  config,
  activeTab,
  isWideMode,
  onTabChange,
  onToggleFirewall,
  onToggleLockdown,
  onOpenSettings,
  onToggleWideMode,
  children,
}) => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  // In Wide Workstation Mode, we render a desktop layout
  if (isWideMode) {
    return (
      <div className="w-full min-h-[750px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Desktop Header */}
        <header className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100 tracking-tight">
                  DroidWall NetShield
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-slate-800 text-slate-300">
                  Android 15 {config.engineMode === 'vpn' ? 'VpnService' : 'iptables root'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {config.isLockdown
                  ? 'PANIC LOCKDOWN: All network communication severed'
                  : config.isEnabled
                  ? 'Firewall ACTIVE: Monitoring & blocking raw process sockets'
                  : 'Firewall DISABLED: Traffic permitted unfiltered'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'apps', label: 'App Firewall', icon: Layers },
              { id: 'inbound', label: 'Inbound Shield', icon: Shield },
              { id: 'traffic', label: 'Process Telemetry', icon: Activity },
              { id: 'logs', label: 'Packet Logs', icon: Terminal },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Lockdown Button */}
            <button
              onClick={onToggleLockdown}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                config.isLockdown
                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-rose-400'
              }`}
              title="Panic Lockdown: Instantly drops all external traffic"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>{config.isLockdown ? 'Unlockdown' : 'Panic Lock'}</span>
            </button>

            {/* Master Switch */}
            <button
              onClick={onToggleFirewall}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                config.isEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{config.isEnabled ? 'Firewall ON' : 'Firewall OFF'}</span>
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Switch to Phone Mockup */}
            <button
              onClick={onToggleWideMode}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors"
              title="Switch to Android Device Frame"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto">{children}</div>
      </div>
    );
  }

  // Mobile Android Phone Frame (Pixel 9 Pro aesthetic)
  return (
    <div className="relative mx-auto w-full max-w-[430px] rounded-[48px] bg-slate-950 p-3 ring-1 ring-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border-4 border-slate-800/80 overflow-hidden">
      {/* Front camera punch hole */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 rounded-full z-40 border border-slate-800/60" />

      {/* Screen Container */}
      <div className="w-full h-[780px] bg-slate-950 rounded-[38px] flex flex-col overflow-hidden relative">
        {/* Android 15 Status Bar */}
        <div className="pt-3 px-6 pb-1.5 flex items-center justify-between text-[11px] text-slate-300 font-mono z-30 select-none">
          {/* Time */}
          <span className="font-semibold tracking-tight">{currentTime}</span>

          {/* System Notification & Radios */}
          <div className="flex items-center gap-2">
            {/* Signature Android VPN Key Icon */}
            {config.isEnabled && (
              <span
                className="flex items-center gap-0.5 text-emerald-400 font-sans text-[10px] bg-emerald-950/60 px-1.5 py-0.5 rounded-full border border-emerald-800/60"
                title="Android VpnService active"
              >
                <Key className="w-3 h-3" />
                <span>VPN</span>
              </span>
            )}

            {/* Network Radio */}
            {config.currentInterface === 'wifi' ? (
              <Wifi className="w-3.5 h-3.5 text-sky-400" />
            ) : (
              <div className="flex items-center gap-0.5 text-emerald-400 font-sans font-bold text-[10px]">
                <Smartphone className="w-3.5 h-3.5" />
                <span>5G</span>
              </div>
            )}

            {/* Battery */}
            <div className="flex items-center gap-1">
              <span className="text-[10px]">88%</span>
              <Battery className="w-3.5 h-3.5 text-slate-300" />
            </div>
          </div>
        </div>

        {/* Android App Header */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                config.isLockdown
                  ? 'bg-rose-500 text-white'
                  : config.isEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-100 tracking-tight leading-none">
                DroidWall NetShield
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                {config.isLockdown ? 'LOCKDOWN' : config.isEnabled ? 'PROTECTED' : 'PAUSED'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Panic Lockdown */}
            <button
              onClick={onToggleLockdown}
              className={`p-1.5 rounded-lg transition-colors ${
                config.isLockdown
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-800 text-slate-400 hover:text-rose-400'
              }`}
              title="Panic Lockdown"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
            </button>

            {/* Master Firewall Toggle */}
            <button
              onClick={onToggleFirewall}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors ${
                config.isEnabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Power className="w-3 h-3" />
              <span>{config.isEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {/* Expand to Desktop */}
            <button
              onClick={onToggleWideMode}
              className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
              title="Switch to Desktop Studio Mode"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Screen Content */}
        <div className="flex-1 overflow-y-auto p-3">{children}</div>

        {/* Android Material You Bottom Navigation Bar */}
        <div className="px-2 py-1.5 bg-slate-900/95 border-t border-slate-800/90 grid grid-cols-4 gap-1 z-30">
          {[
            { id: 'apps', label: 'Apps', icon: Layers },
            { id: 'inbound', label: 'Shield', icon: Shield },
            { id: 'traffic', label: 'Traffic', icon: Activity },
            { id: 'logs', label: 'Logs', icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as any)}
                className={`py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
                  isActive
                    ? 'text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`px-3 py-1 rounded-full transition-colors ${
                    isActive ? 'bg-emerald-500/20' : 'bg-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Android 15 Gesture Bar */}
        <div className="pb-2 pt-1 flex justify-center bg-slate-900/95">
          <div className="w-32 h-1 bg-slate-700 rounded-full" />
        </div>
      </div>
    </div>
  );
};
