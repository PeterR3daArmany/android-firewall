import React, { useState } from 'react';
import { 
  Pause, 
  Play, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Filter, 
  Search, 
  Lock, 
  ExternalLink, 
  Copy, 
  Check 
} from 'lucide-react';
import { ConnectionLog } from '../types/firewall';
import { formatBytes } from '../services/trafficEngine';

interface ConnectionLogProps {
  logs: ConnectionLog[];
  isPaused: boolean;
  onTogglePause: () => void;
  onClearLogs: () => void;
  onBlockApp: (packageName: string) => void;
}

export const ConnectionLogView: React.FC<ConnectionLogProps> = ({
  logs,
  isPaused,
  onTogglePause,
  onClearLogs,
  onBlockApp,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'blocked' | 'inbound' | 'outbound'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<ConnectionLog | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'blocked' && log.status === 'ALLOWED') return false;
    if (filterType === 'inbound' && log.direction !== 'INBOUND') return false;
    if (filterType === 'outbound' && log.direction !== 'OUTBOUND') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.appName.toLowerCase().includes(q) ||
        log.packageName.toLowerCase().includes(q) ||
        log.remoteHost.toLowerCase().includes(q) ||
        log.remoteIp.includes(q) ||
        log.localPort.toString().includes(q) ||
        log.remotePort.toString().includes(q)
      );
    }
    return true;
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getStatusBadge = (status: ConnectionLog['status']) => {
    switch (status) {
      case 'ALLOWED':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ALLOW
          </span>
        );
      case 'BLOCKED_APP_RULE':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            APP BLOCKED
          </span>
        );
      case 'BLOCKED_INBOUND_SHIELD':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            SHIELD DROP
          </span>
        );
      case 'BLOCKED_LOCKDOWN':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            LOCKDOWN
          </span>
        );
      case 'BLOCKED_ROAMING':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
            ROAMING DROP
          </span>
        );
      case 'BLOCKED_BACKGROUND':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            BACKGROUND DROP
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Filter logs by IP, host, app, port..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 text-xs">
          {(['all', 'blocked', 'inbound', 'outbound'] as const).map((ft) => (
            <button
              key={ft}
              onClick={() => setFilterType(ft)}
              className={`px-2.5 py-1 rounded-lg font-medium capitalize transition-colors ${
                filterType === ft
                  ? 'bg-slate-800 text-slate-100 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {ft}
            </button>
          ))}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onTogglePause}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
              isPaused
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title={isPaused ? 'Resume live packet stream' : 'Pause stream'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
          <button
            onClick={onClearLogs}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[380px] font-mono">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs italic bg-slate-950/40 rounded-2xl border border-slate-900">
            No network events recorded yet for this filter.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
            const isBlocked = log.status !== 'ALLOWED';

            return (
              <div
                key={log.id}
                onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isBlocked
                    ? 'bg-rose-950/15 border-rose-900/40 hover:border-rose-700/60'
                    : 'bg-slate-900/50 border-slate-800/70 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  {/* Timestamp & Direction */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-400 text-[11px] tabular-nums">{timeStr}</span>
                    <span
                      className={`flex items-center gap-0.5 text-[10px] font-bold px-1 rounded ${
                        log.direction === 'INBOUND'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-sky-500/20 text-sky-400'
                      }`}
                    >
                      {log.direction === 'INBOUND' ? (
                        <>
                          <ArrowDownLeft className="w-3 h-3" /> IN
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-3 h-3" /> OUT
                        </>
                      )}
                    </span>
                    <span className="text-slate-400 text-[10px]">{log.protocol}</span>
                  </div>

                  {/* App / Process */}
                  <div className="flex-1 min-w-0 truncate text-slate-300 font-sans font-medium">
                    <span className="truncate">{log.appName}</span>
                    <span className="text-slate-400 font-mono text-[11px] ml-1.5">
                      PID {log.pid}
                    </span>
                  </div>

                  {/* Remote IP & Port */}
                  <div className="text-right truncate text-slate-400 text-[11px]">
                    <span className="text-slate-300 truncate">{log.remoteHost}</span>
                    <span className="text-slate-400 ml-1">:{log.remotePort}</span>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">{getStatusBadge(log.status)}</div>
                </div>

                {/* Expanded Packet Info */}
                {selectedLog?.id === log.id && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] space-y-1.5 font-sans">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                      <div>
                        <span className="text-slate-400 font-mono text-[10px] block">
                          LOCAL SOCKET:
                        </span>
                        <span>
                          192.168.1.84:{log.localPort} ({log.protocol})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-mono text-[10px] block">
                          REMOTE TARGET:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span>
                            {log.remoteIp}:{log.remotePort} [{log.country}]
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(log.remoteIp, log.id);
                            }}
                            className="text-slate-400 hover:text-slate-200"
                            title="Copy remote IP"
                          >
                            {copiedId === log.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {log.blockedReason && (
                      <div className="p-1.5 bg-rose-950/30 border border-rose-900/50 rounded-lg text-rose-300 text-[11px]">
                        <strong>Verdict:</strong> {log.blockedReason}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-400 font-mono text-[10px]">
                        Payload: {formatBytes(log.bytes)}
                      </span>
                      {log.status === 'ALLOWED' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onBlockApp(log.packageName);
                          }}
                          className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          Block {log.appName} Access
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
