import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  EyeOff, 
  Wifi, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  Lock 
} from 'lucide-react';
import { FirewallConfig, InboundPolicy, InboundRule } from '../types/firewall';

interface InboundShieldProps {
  config: FirewallConfig;
  inboundRules: InboundRule[];
  onUpdateConfig: (patch: Partial<FirewallConfig>) => void;
  onUpdateRule: (id: string, patch: Partial<InboundRule>) => void;
  onAddRule: (rule: Omit<InboundRule, 'id' | 'hits'>) => void;
  onDeleteRule: (id: string) => void;
  onSimulateInboundProbe: () => void;
}

export const InboundShield: React.FC<InboundShieldProps> = ({
  config,
  inboundRules,
  onUpdateConfig,
  onUpdateRule,
  onAddRule,
  onDeleteRule,
  onSimulateInboundProbe,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newPortRange, setNewPortRange] = useState('');
  const [newProtocol, setNewProtocol] = useState<'TCP' | 'UDP' | 'BOTH'>('TCP');
  const [newAction, setNewAction] = useState<'DROP' | 'REJECT' | 'ACCEPT'>('DROP');
  const [newDescription, setNewDescription] = useState('');

  const totalBlockedHits = inboundRules.reduce((acc, r) => acc + (r.action !== 'ACCEPT' ? r.hits : 0), 0);

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim() || !newPortRange.trim()) return;

    onAddRule({
      name: newRuleName.trim(),
      portRange: newPortRange.trim(),
      protocol: newProtocol,
      action: newAction,
      enabled: true,
      description: newDescription.trim() || 'Custom inbound firewall filter rule',
      isPreset: false,
    });

    setNewRuleName('');
    setNewPortRange('');
    setNewDescription('');
    setShowAddModal(false);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Master Policy Banner */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Inbound Connection Filter</h3>
              <p className="text-xs text-slate-400">Protects against unsolicited external packets & port probes</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Total Deflected</span>
            <span className="text-base font-bold text-rose-400 font-mono tabular-nums">
              {totalBlockedHits} probes
            </span>
          </div>
        </div>

        {/* Inbound Policy Mode Selector */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-medium text-slate-300">Default Inbound Policy</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                id: 'ALLOW_ESTABLISHED' as InboundPolicy,
                title: 'Stateful SPI',
                subtitle: 'Allow established replies only',
                icon: ShieldCheck,
              },
              {
                id: 'BLOCK_ALL' as InboundPolicy,
                title: 'Drop All Inbound',
                subtitle: 'Strict zero-trust lock',
                icon: Lock,
              },
              {
                id: 'ALLOW_LAN' as InboundPolicy,
                title: 'Allow LAN Only',
                subtitle: 'Permit local Wi-Fi casting',
                icon: Wifi,
              },
            ].map((policy) => {
              const Icon = policy.icon;
              const isSelected = config.inboundPolicy === policy.id;
              return (
                <button
                  key={policy.id}
                  type="button"
                  onClick={() => onUpdateConfig({ inboundPolicy: policy.id })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-medium text-xs mb-0.5">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{policy.title}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{policy.subtitle}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stealth Mode & Tethering Protection Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between p-2.5 bg-slate-950/50 rounded-xl border border-slate-800/60">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-purple-400" />
              <div>
                <span className="text-xs font-medium text-slate-200 block">Stealth Mode</span>
                <span className="text-[10px] text-slate-400">Silent drop (no TCP RST / ICMP reply)</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateConfig({ stealthMode: !config.stealthMode })}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                config.stealthMode ? 'bg-purple-600' : 'bg-slate-800'
              }`}
              aria-label="Toggle Stealth Mode"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  config.stealthMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-950/50 rounded-xl border border-slate-800/60">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-xs font-medium text-slate-200 block">Tethering Shield</span>
                <span className="text-[10px] text-slate-400">Isolate hotspot clients from local ports</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateConfig({ tetheringProtection: !config.tetheringProtection })}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                config.tetheringProtection ? 'bg-amber-600' : 'bg-slate-800'
              }`}
              aria-label="Toggle Tethering Shield"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  config.tetheringProtection ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Port Rules Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Inbound Port Shields ({inboundRules.length})
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSimulateInboundProbe}
            className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Simulate external inbound port scan attack"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Test Shield</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Rule</span>
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]">
        {inboundRules.map((rule) => {
          const isDrop = rule.action === 'DROP' || rule.action === 'REJECT';
          return (
            <div
              key={rule.id}
              className={`p-3 rounded-2xl border transition-all ${
                rule.enabled
                  ? isDrop
                    ? 'bg-slate-900/70 border-slate-800'
                    : 'bg-emerald-950/10 border-emerald-900/30'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200 truncate">{rule.name}</span>
                    <span className="font-mono text-xs text-sky-400 font-medium">
                      Port {rule.portRange} ({rule.protocol})
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        isDrop ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {rule.action}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{rule.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 font-mono">
                    <span>Deflected Hits: {rule.hits}</span>
                    <span aria-hidden="true">·</span>
                    <span>{rule.isPreset ? 'Android Default Policy' : 'Custom User Rule'}</span>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onUpdateRule(rule.id, { enabled: !rule.enabled })}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                      rule.enabled ? 'bg-emerald-600' : 'bg-slate-800'
                    }`}
                    aria-label={`Toggle rule ${rule.name}`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        rule.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  {!rule.isPreset && (
                    <button
                      type="button"
                      onClick={() => onDeleteRule(rule.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors rounded-lg"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-semibold text-slate-100">Add Inbound Port Shield</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Block Custom HTTP Server"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Port or Range</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 8080 or 4000-5000"
                    value={newPortRange}
                    onChange={(e) => setNewPortRange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Protocol</label>
                  <select
                    value={newProtocol}
                    onChange={(e) => setNewProtocol(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                    <option value="BOTH">TCP & UDP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Action</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['DROP', 'REJECT', 'ACCEPT'] as const).map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setNewAction(act)}
                      className={`py-2 text-xs font-medium rounded-xl border text-center transition-all ${
                        newAction === act
                          ? act === 'DROP'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-400 font-bold'
                            : act === 'REJECT'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold'
                            : 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Reason or notes for this rule"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/40"
                >
                  Create Shield Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
