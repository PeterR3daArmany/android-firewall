import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  AppRule, 
  BandwidthHistoryPoint, 
  ConnectionLog, 
  FirewallConfig, 
  InboundRule, 
  ProcessTelemetry 
} from './types/firewall';
import { 
  INITIAL_APPS, 
  INITIAL_INBOUND_RULES, 
  INITIAL_PROCESSES 
} from './data/initialData';
import { 
  evaluateConnection, 
  generateRandomPacket 
} from './services/trafficEngine';
import { DeviceFrame } from './components/DeviceFrame';
import { AppFirewallList } from './components/AppFirewallList';
import { InboundShield } from './components/InboundShield';
import { ProcessTelemetryView } from './components/ProcessTelemetry';
import { ConnectionLogView } from './components/ConnectionLog';
import { SimulationControls } from './components/SimulationControls';
import { AppDetailModal } from './components/AppDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { 
  ShieldCheck, 
  Smartphone, 
  Monitor, 
  AlertOctagon, 
  Power, 
  Settings, 
  Radio 
} from 'lucide-react';

export default function App() {
  // Firewall Core Configuration
  const [config, setConfig] = useState<FirewallConfig>({
    isEnabled: true,
    isLockdown: false,
    engineMode: 'vpn',
    inboundPolicy: 'ALLOW_ESTABLISHED',
    stealthMode: true,
    blockUnsolicitedInbound: true,
    tetheringProtection: true,
    dnsProvider: 'quad9_doh',
    currentInterface: 'wifi',
    isRoaming: false,
    isScreenOff: false,
  });

  // App Rules
  const [apps, setApps] = useState<AppRule[]>(() => {
    const saved = localStorage.getItem('droidwall_apps');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_APPS;
  });

  // Inbound Rules
  const [inboundRules, setInboundRules] = useState<InboundRule[]>(() => {
    const saved = localStorage.getItem('droidwall_inbound');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_INBOUND_RULES;
  });

  // Process Telemetry State
  const [processes, setProcesses] = useState<ProcessTelemetry[]>(INITIAL_PROCESSES);

  // Bandwidth Time-Series History (30 points)
  const [bandwidthHistory, setBandwidthHistory] = useState<BandwidthHistoryPoint[]>(() =>
    Array.from({ length: 25 }, (_, i) => ({
      time: `${i}s`,
      downKbps: Math.floor(800 + Math.random() * 400),
      upKbps: Math.floor(40 + Math.random() * 60),
    }))
  );

  // Connection Packet Logs
  const [logs, setLogs] = useState<ConnectionLog[]>([]);
  const [isPausedLogs, setIsPausedLogs] = useState(false);

  // UI Navigation & View State
  const [activeTab, setActiveTab] = useState<'apps' | 'inbound' | 'traffic' | 'logs'>('apps');
  const [isWideMode, setIsWideMode] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AppRule | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Persist rules in local storage
  useEffect(() => {
    localStorage.setItem('droidwall_apps', JSON.stringify(apps));
  }, [apps]);

  useEffect(() => {
    localStorage.setItem('droidwall_inbound', JSON.stringify(inboundRules));
  }, [inboundRules]);

  // Lookup map for fast evaluation
  const appRulesMap = useMemo(() => {
    const map: Record<string, AppRule> = {};
    apps.forEach((a) => {
      map[a.packageName] = a;
    });
    return map;
  }, [apps]);

  // Update a single app's firewall rules
  const handleUpdateAppRule = useCallback((packageName: string, patch: Partial<AppRule>) => {
    setApps((prev) =>
      prev.map((app) => (app.packageName === packageName ? { ...app, ...patch } : app))
    );
  }, []);

  // Batch update rules
  const handleBatchUpdate = useCallback(
    (patch: Partial<AppRule>, target: 'all' | 'user' | 'system') => {
      setApps((prev) =>
        prev.map((app) => {
          if (target === 'user' && app.isSystemApp) return app;
          if (target === 'system' && !app.isSystemApp) return app;
          return { ...app, ...patch };
        })
      );
    },
    []
  );

  // Update Inbound Rule
  const handleUpdateInboundRule = useCallback((id: string, patch: Partial<InboundRule>) => {
    setInboundRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  }, []);

  const handleAddInboundRule = useCallback((rule: Omit<InboundRule, 'id' | 'hits'>) => {
    const newRule: InboundRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      hits: 0,
    };
    setInboundRules((prev) => [newRule, ...prev]);
  }, []);

  const handleDeleteInboundRule = useCallback((id: string) => {
    setInboundRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Master Switch & Lockdown Toggles
  const handleToggleFirewall = useCallback(() => {
    setConfig((prev) => ({ ...prev, isEnabled: !prev.isEnabled }));
  }, []);

  const handleToggleLockdown = useCallback(() => {
    setConfig((prev) => ({ ...prev, isLockdown: !prev.isLockdown }));
  }, []);

  // Reset to initial defaults
  const handleResetDefaults = useCallback(() => {
    setApps(INITIAL_APPS);
    setInboundRules(INITIAL_INBOUND_RULES);
    setProcesses(INITIAL_PROCESSES);
    setLogs([]);
    setConfig({
      isEnabled: true,
      isLockdown: false,
      engineMode: 'vpn',
      inboundPolicy: 'ALLOW_ESTABLISHED',
      stealthMode: true,
      blockUnsolicitedInbound: true,
      tetheringProtection: true,
      dnsProvider: 'quad9_doh',
      currentInterface: 'wifi',
      isRoaming: false,
      isScreenOff: false,
    });
  }, []);

  // Import rules JSON
  const handleImportRules = useCallback((importedApps: AppRule[], importedInbound: InboundRule[]) => {
    setApps(importedApps);
    if (importedInbound.length > 0) {
      setInboundRules(importedInbound);
    }
  }, []);

  // Periodic Network Traffic Simulation Ticker (1 second heartbeat)
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Generate live packet
      const { log } = generateRandomPacket(processes, config, appRulesMap, inboundRules);

      if (!isPausedLogs) {
        setLogs((prev) => [log, ...prev.slice(0, 79)]);
      }

      // 2. Recalculate bandwidth per process based on active rules & environment
      let totalDown = 0;
      let totalUp = 0;

      setProcesses((prevProcesses) => {
        return prevProcesses.map((proc) => {
          const evalResult = evaluateConnection(
            'OUTBOUND',
            proc.packageName,
            443,
            45000,
            config,
            appRulesMap,
            inboundRules
          );

          if (!evalResult.allowed) {
            // Traffic is blocked by firewall! Speed drops to 0
            return {
              ...proc,
              currentDownKbps: 0,
              currentUpKbps: 0,
            };
          }

          // Otherwise normal simulated traffic variance
          let newDown = proc.currentDownKbps;
          let newUp = proc.currentUpKbps;

          if (proc.packageName.includes('youtube')) {
            newDown = Math.floor(650 + Math.random() * 600);
            newUp = Math.floor(10 + Math.random() * 25);
          } else if (proc.packageName.includes('chrome')) {
            newDown = Math.floor(250 + Math.random() * 250);
            newUp = Math.floor(20 + Math.random() * 30);
          } else if (proc.packageName.includes('spotify')) {
            newDown = Math.floor(160 + Math.random() * 80);
            newUp = Math.floor(8 + Math.random() * 10);
          } else if (proc.packageName.includes('whatsapp')) {
            newDown = Math.floor(5 + Math.random() * 25);
            newUp = Math.floor(3 + Math.random() * 10);
          } else if (proc.packageName.includes('gms') || proc.packageName.includes('system')) {
            newDown = Math.floor(8 + Math.random() * 15);
            newUp = Math.floor(4 + Math.random() * 8);
          } else {
            newDown = Math.floor(Math.random() * 15);
            newUp = Math.floor(Math.random() * 5);
          }

          totalDown += newDown;
          totalUp += newUp;

          return {
            ...proc,
            currentDownKbps: newDown,
            currentUpKbps: newUp,
            totalDownBytes: proc.totalDownBytes + newDown * 128,
            totalUpBytes: proc.totalUpBytes + newUp * 128,
          };
        });
      });

      // 3. Push to time-series chart
      setBandwidthHistory((prev) => {
        const next = [...prev.slice(1), { time: `${Date.now()}`, downKbps: totalDown, upKbps: totalUp }];
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [processes, config, appRulesMap, inboundRules, isPausedLogs]);

  // Simulation Triggers
  const handleSimulateInboundAttack = useCallback(() => {
    // Generate 4 rapid inbound scan probes on protected ports
    const scanPorts = [5555, 8080, 22, 1900];
    const newLogs: ConnectionLog[] = scanPorts.map((port, idx) => {
      const evalResult = evaluateConnection(
        'INBOUND',
        'netd',
        54210 + idx,
        port,
        config,
        appRulesMap,
        inboundRules
      );

      return {
        id: `attack-${Date.now()}-${idx}`,
        timestamp: Date.now() + idx * 50,
        pid: 1050,
        packageName: 'netd',
        appName: 'Network Daemon',
        direction: 'INBOUND',
        protocol: port === 1900 ? 'UDP' : 'TCP',
        remoteIp: `198.51.100.${40 + idx}`,
        remoteHost: `bot-scanner-${idx}.darknet-probe.org`,
        remotePort: 54210 + idx,
        localPort: port,
        country: 'RU',
        bytes: 128,
        status: evalResult.status,
        blockedReason: evalResult.reason,
      };
    });

    setLogs((prev) => [...newLogs, ...prev]);
    setActiveTab('logs');
  }, [config, appRulesMap, inboundRules]);

  const handleSimulateBackgroundLeak = useCallback(() => {
    const leakLog: ConnectionLog = {
      id: `leak-${Date.now()}`,
      timestamp: Date.now(),
      pid: 17290,
      packageName: 'com.instagram.android',
      appName: 'Instagram',
      direction: 'OUTBOUND',
      protocol: 'HTTPS',
      remoteIp: '157.240.241.63',
      remoteHost: 'graph.instagram.com',
      remotePort: 443,
      localPort: 49812,
      country: 'US',
      bytes: 1420,
      status: config.isScreenOff && appRulesMap['com.instagram.android']?.blockBackground
        ? 'BLOCKED_BACKGROUND'
        : 'ALLOWED',
      blockedReason: config.isScreenOff && appRulesMap['com.instagram.android']?.blockBackground
        ? 'Background Restriction: Prevented analytics beacon'
        : undefined,
    };

    setLogs((prev) => [leakLog, ...prev]);
    setActiveTab('logs');
  }, [config, appRulesMap]);

  const handleSimulateVideoBurst = useCallback(() => {
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.packageName.includes('youtube')) {
          return {
            ...p,
            currentDownKbps: 3400, // Spike to 3.4 MB/s
            currentUpKbps: 80,
            totalDownBytes: p.totalDownBytes + 15000000,
          };
        }
        return p;
      })
    );
    setActiveTab('traffic');
  }, []);

  const handleResetStats = useCallback(() => {
    setProcesses((prev) =>
      prev.map((p) => ({
        ...p,
        totalDownBytes: 0,
        totalUpBytes: 0,
        currentDownKbps: 0,
        currentUpKbps: 0,
      }))
    );
    setLogs([]);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Bar Contract (§2) */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950 border-b border-slate-900 sticky top-0 z-40 backdrop-blur-md">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-100">
            DroidWall NetShield
          </span>
        </div>

        {/* Zone 2: 4-5 Clean single-line text nav links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
          <button
            onClick={() => setActiveTab('apps')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'apps' ? 'text-emerald-400' : 'hover:text-slate-200'
            }`}
          >
            Application Rules
          </button>
          <button
            onClick={() => setActiveTab('inbound')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'inbound' ? 'text-emerald-400' : 'hover:text-slate-200'
            }`}
          >
            Inbound Shield
          </button>
          <button
            onClick={() => setActiveTab('traffic')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'traffic' ? 'text-emerald-400' : 'hover:text-slate-200'
            }`}
          >
            Real-Time Telemetry
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'logs' ? 'text-emerald-400' : 'hover:text-slate-200'
            }`}
          >
            Packet Inspector
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action + Quick Switch */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsWideMode(!isWideMode)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            title="Toggle between Phone Frame & Expanded Workstation"
          >
            {isWideMode ? <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> : <Monitor className="w-3.5 h-3.5 text-sky-400" />}
            <span className="hidden sm:inline">{isWideMode ? 'Phone Frame' : 'Expanded Studio'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleLockdown}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              config.isLockdown
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/60 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>{config.isLockdown ? 'Locked Down' : 'Panic Kill'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Simulation Environment Control Bar */}
        <SimulationControls
          config={config}
          onUpdateConfig={(patch) => setConfig((prev) => ({ ...prev, ...patch }))}
          onSimulateInboundAttack={handleSimulateInboundAttack}
          onSimulateBackgroundLeak={handleSimulateBackgroundLeak}
          onSimulateVideoBurst={handleSimulateVideoBurst}
          onResetStats={handleResetStats}
        />

        {/* Main Firewall View Container */}
        <div className="w-full flex justify-center">
          <DeviceFrame
            config={config}
            activeTab={activeTab}
            isWideMode={isWideMode}
            onTabChange={setActiveTab}
            onToggleFirewall={handleToggleFirewall}
            onToggleLockdown={handleToggleLockdown}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onToggleWideMode={() => setIsWideMode(!isWideMode)}
          >
            {/* View Switching */}
            {activeTab === 'apps' && (
              <AppFirewallList
                apps={apps}
                processes={processes}
                onUpdateAppRule={handleUpdateAppRule}
                onSelectApp={(app) => setSelectedApp(app)}
                onBatchUpdate={handleBatchUpdate}
              />
            )}

            {activeTab === 'inbound' && (
              <InboundShield
                config={config}
                inboundRules={inboundRules}
                onUpdateConfig={(patch) => setConfig((prev) => ({ ...prev, ...patch }))}
                onUpdateRule={handleUpdateInboundRule}
                onAddRule={handleAddInboundRule}
                onDeleteRule={handleDeleteInboundRule}
                onSimulateInboundProbe={handleSimulateInboundAttack}
              />
            )}

            {activeTab === 'traffic' && (
              <ProcessTelemetryView
                processes={processes}
                bandwidthHistory={bandwidthHistory}
                appRules={appRulesMap}
                onToggleAppNetwork={(pkg) => {
                  const rule = appRulesMap[pkg];
                  if (rule) {
                    const block = !rule.blockWifi && !rule.blockCellular;
                    handleUpdateAppRule(pkg, { blockWifi: block, blockCellular: block });
                  }
                }}
                onSimulateSpike={(pkg) => {
                  setProcesses((prev) =>
                    prev.map((p) =>
                      p.packageName === pkg
                        ? { ...p, currentDownKbps: 2800, currentUpKbps: 120 }
                        : p
                    )
                  );
                }}
              />
            )}

            {activeTab === 'logs' && (
              <ConnectionLogView
                logs={logs}
                isPaused={isPausedLogs}
                onTogglePause={() => setIsPausedLogs(!isPausedLogs)}
                onClearLogs={() => setLogs([])}
                onBlockApp={(pkg) => {
                  handleUpdateAppRule(pkg, { blockWifi: true, blockCellular: true });
                }}
              />
            )}
          </DeviceFrame>
        </div>
      </main>

      {/* App Details Inspection Modal */}
      <AppDetailModal
        app={selectedApp}
        process={selectedApp ? processes.find((p) => p.packageName === selectedApp.packageName) : undefined}
        onClose={() => setSelectedApp(null)}
        onUpdateRule={handleUpdateAppRule}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        appRules={appRulesMap}
        inboundRules={inboundRules}
        onUpdateConfig={(patch) => setConfig((prev) => ({ ...prev, ...patch }))}
        onImportRules={handleImportRules}
        onResetDefaults={handleResetDefaults}
      />
    </div>
  );
}
