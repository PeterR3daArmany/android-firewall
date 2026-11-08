import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Terminal, 
  Globe, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  FileCode, 
  AlertCircle 
} from 'lucide-react';
import { AppRule, DnsProvider, FirewallConfig, FirewallEngineMode, InboundRule } from '../types/firewall';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FirewallConfig;
  appRules: Record<string, AppRule>;
  inboundRules: InboundRule[];
  onUpdateConfig: (patch: Partial<FirewallConfig>) => void;
  onImportRules: (apps: AppRule[], inbound: InboundRule[]) => void;
  onResetDefaults: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  appRules,
  inboundRules,
  onUpdateConfig,
  onImportRules,
  onResetDefaults,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJson = () => {
    const payload = {
      version: '1.2.0',
      exportedAt: new Date().toISOString(),
      config,
      appRules: Object.values(appRules),
      inboundRules,
    };
    const jsonStr = JSON.stringify(payload, null, 2);

    // Download as file
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `droidwall-rules-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    // Also copy to clipboard
    navigator.clipboard.writeText(jsonStr);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleExecuteImport = () => {
    try {
      setImportError(null);
      const parsed = JSON.parse(importJsonText);
      if (!parsed.appRules || !Array.isArray(parsed.appRules)) {
        throw new Error('Invalid rules format: missing appRules array');
      }
      onImportRules(parsed.appRules, parsed.inboundRules || []);
      setShowImportArea(false);
      setImportJsonText('');
      alert('Firewall rules imported successfully!');
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse JSON');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Firewall Engine Settings</h3>
            <p className="text-xs text-slate-400">Android kernel filtering & security architecture</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Engine Mode Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Android Packet Interception Engine
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              {
                id: 'vpn' as FirewallEngineMode,
                name: 'Android VpnService',
                desc: 'No Root Required. Creates local tun0 loopback proxy to intercept raw packets.',
                icon: ShieldCheck,
              },
              {
                id: 'root' as FirewallEngineMode,
                name: 'iptables / nftables',
                desc: 'Root Superuser mode. Directly programs Linux kernel netfilter chains.',
                icon: Terminal,
              },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = config.engineMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onUpdateConfig({ engineMode: m.id })}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium text-xs mb-1">
                    <Icon className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span className="font-semibold text-slate-100">{m.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">{m.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Encrypted DNS (DoH) Provider */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            DNS-over-HTTPS (DoH) Resolver
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { id: 'quad9_doh' as DnsProvider, name: 'Quad9 Privacy DNS', desc: '9.9.9.9 (Malware blocking)' },
              { id: 'cloudflare_doh' as DnsProvider, name: 'Cloudflare 1.1.1.1', desc: 'Fastest global Anycast DoH' },
              { id: 'adguard_doh' as DnsProvider, name: 'AdGuard DNS', desc: 'Built-in telemetry & tracker sinkhole' },
              { id: 'system' as DnsProvider, name: 'System ISP Default', desc: 'Unencrypted DHCP resolver' },
            ].map((dns) => {
              const isSelected = config.dnsProvider === dns.id;
              return (
                <button
                  key={dns.id}
                  type="button"
                  onClick={() => onUpdateConfig({ dnsProvider: dns.id })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-sky-500/15 border-sky-500/50 text-sky-300'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-semibold text-slate-100 block">{dns.name}</span>
                  <span className="text-[10px] text-slate-400 block">{dns.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Backup / Export / Import */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Firewall Rules Backup & Restore
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{copySuccess ? 'Copied & Downloaded!' : 'Export Rules JSON'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowImportArea(!showImportArea)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-4 h-4 text-sky-400" />
              <span>Import Rules JSON</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('Reset all rules to default initial configuration?')) {
                  onResetDefaults();
                }
              }}
              className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Defaults</span>
            </button>
          </div>

          {/* Import JSON Textarea */}
          {showImportArea && (
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-xs font-medium text-slate-300 block">
                Paste JSON Backup Content:
              </label>
              <textarea
                rows={4}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{"appRules": [...], "inboundRules": [...]}'
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
              {importError && (
                <div className="text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{importError}</span>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportArea(false)}
                  className="px-3 py-1.5 text-xs text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                >
                  Apply Rules
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
