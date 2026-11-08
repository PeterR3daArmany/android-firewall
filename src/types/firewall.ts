export type NetworkType = 'wifi' | 'cellular';

export interface AppRule {
  packageName: string;
  appName: string;
  category: 'social' | 'media' | 'browser' | 'messaging' | 'system' | 'productivity' | 'tools';
  isSystemApp: boolean;
  uid: number;
  icon: string; // identifier or emoji/symbol
  blockWifi: boolean;
  blockCellular: boolean;
  blockRoaming: boolean;
  blockBackground: boolean;
  blockLan: boolean;
  notes?: string;
}

export interface ProcessTelemetry {
  pid: number;
  uid: number;
  packageName: string;
  processName: string;
  appName: string;
  cpuPercent: number;
  memoryMb: number;
  currentDownKbps: number;
  currentUpKbps: number;
  totalDownBytes: number;
  totalUpBytes: number;
  activeSockets: number;
  openConnections: OpenSocket[];
  history: { time: number; downKbps: number; upKbps: number }[];
}

export interface OpenSocket {
  id: string;
  protocol: 'TCP' | 'UDP' | 'QUIC';
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  remotePort: number;
  remoteHost: string;
  state: 'ESTABLISHED' | 'SYN_SENT' | 'LISTEN' | 'TIME_WAIT' | 'CLOSE_WAIT';
  country: string;
}

export interface InboundRule {
  id: string;
  name: string;
  portRange: string;
  protocol: 'TCP' | 'UDP' | 'BOTH';
  action: 'DROP' | 'REJECT' | 'ACCEPT';
  enabled: boolean;
  description: string;
  hits: number;
  isPreset: boolean;
}

export interface ConnectionLog {
  id: string;
  timestamp: number; // unix timestamp ms
  pid: number;
  packageName: string;
  appName: string;
  direction: 'OUTBOUND' | 'INBOUND';
  protocol: 'TCP' | 'UDP' | 'DNS' | 'HTTPS' | 'QUIC';
  remoteIp: string;
  remoteHost: string;
  remotePort: number;
  localPort: number;
  country: string;
  bytes: number;
  status: 'ALLOWED' | 'BLOCKED_APP_RULE' | 'BLOCKED_INBOUND_SHIELD' | 'BLOCKED_LOCKDOWN' | 'BLOCKED_ROAMING' | 'BLOCKED_BACKGROUND';
  blockedReason?: string;
}

export type InboundPolicy = 'BLOCK_ALL' | 'ALLOW_ESTABLISHED' | 'ALLOW_LAN';
export type FirewallEngineMode = 'vpn' | 'root';
export type DnsProvider = 'system' | 'cloudflare_doh' | 'quad9_doh' | 'adguard_doh' | 'nextdns';

export interface FirewallConfig {
  isEnabled: boolean;
  isLockdown: boolean; // Panic killswitch
  engineMode: FirewallEngineMode;
  inboundPolicy: InboundPolicy;
  stealthMode: boolean; // Drop ICMP echo and avoid sending TCP RST
  blockUnsolicitedInbound: boolean;
  tetheringProtection: boolean;
  dnsProvider: DnsProvider;
  currentInterface: NetworkType;
  isRoaming: boolean;
  isScreenOff: boolean;
}

export interface BandwidthHistoryPoint {
  time: string;
  downKbps: number;
  upKbps: number;
}
