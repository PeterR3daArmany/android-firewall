import { AppRule, ConnectionLog, FirewallConfig, InboundRule, ProcessTelemetry } from '../types/firewall';

// Format bytes into human readable format
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatSpeed(kbps: number): string {
  if (kbps < 1) return '0 KB/s';
  if (kbps >= 1024) {
    return `${(kbps / 1024).toFixed(2)} MB/s`;
  }
  return `${Math.round(kbps)} KB/s`;
}

interface EvaluationResult {
  allowed: boolean;
  status: ConnectionLog['status'];
  reason?: string;
}

export function evaluateConnection(
  direction: 'OUTBOUND' | 'INBOUND',
  packageName: string,
  remotePort: number,
  localPort: number,
  config: FirewallConfig,
  appRules: Record<string, AppRule>,
  inboundRules: InboundRule[]
): EvaluationResult {
  // 1. If firewall is entirely OFF, everything is permitted
  if (!config.isEnabled) {
    return { allowed: true, status: 'ALLOWED' };
  }

  // 2. Lockdown / Panic Kill Switch: zero traffic passes
  if (config.isLockdown) {
    return {
      allowed: false,
      status: 'BLOCKED_LOCKDOWN',
      reason: 'Panic Lockdown active: All network I/O severed',
    };
  }

  // 3. Inbound Connection Handling
  if (direction === 'INBOUND') {
    if (config.inboundPolicy === 'BLOCK_ALL') {
      return {
        allowed: false,
        status: 'BLOCKED_INBOUND_SHIELD',
        reason: 'Inbound Shield: Strict policy drops all incoming packets',
      };
    }

    // Check custom and preset port rules
    const matchingRule = inboundRules.find((rule) => {
      if (!rule.enabled) return false;
      const ports = rule.portRange.split(',').map((p) => p.trim());
      return ports.some((p) => {
        if (p.includes('-')) {
          const [start, end] = p.split('-').map(Number);
          return localPort >= start && localPort <= end;
        }
        return Number(p) === localPort;
      });
    });

    if (matchingRule) {
      if (matchingRule.action === 'DROP' || matchingRule.action === 'REJECT') {
        matchingRule.hits += 1;
        return {
          allowed: false,
          status: 'BLOCKED_INBOUND_SHIELD',
          reason: `Inbound Shield: ${matchingRule.name} (Port ${localPort})`,
        };
      }
    }

    if (config.blockUnsolicitedInbound) {
      return {
        allowed: false,
        status: 'BLOCKED_INBOUND_SHIELD',
        reason: 'Inbound Shield: Stateful inspection dropped unsolicited packet',
      };
    }

    return { allowed: true, status: 'ALLOWED' };
  }

  // 4. Outbound App Rule Evaluation
  const rule = appRules[packageName];
  if (!rule) {
    return { allowed: true, status: 'ALLOWED' };
  }

  // Roaming check
  if (config.isRoaming && rule.blockRoaming) {
    return {
      allowed: false,
      status: 'BLOCKED_ROAMING',
      reason: `Roaming restriction: ${rule.appName} blocked while roaming`,
    };
  }

  // Background check
  if (config.isScreenOff && rule.blockBackground) {
    return {
      allowed: false,
      status: 'BLOCKED_BACKGROUND',
      reason: `Background lock: ${rule.appName} blocked with screen off`,
    };
  }

  // Wi-Fi check
  if (config.currentInterface === 'wifi' && rule.blockWifi) {
    return {
      allowed: false,
      status: 'BLOCKED_APP_RULE',
      reason: `App rule: Wi-Fi access revoked for ${rule.appName}`,
    };
  }

  // Cellular check
  if (config.currentInterface === 'cellular' && rule.blockCellular) {
    return {
      allowed: false,
      status: 'BLOCKED_APP_RULE',
      reason: `App rule: Cellular data blocked for ${rule.appName}`,
    };
  }

  return { allowed: true, status: 'ALLOWED' };
}

// Generate a random simulated packet based on real app profiles
export function generateRandomPacket(
  processes: ProcessTelemetry[],
  config: FirewallConfig,
  appRules: Record<string, AppRule>,
  inboundRules: InboundRule[]
): { log: ConnectionLog; updatedProcess?: ProcessTelemetry } {
  // 15% chance of inbound probe simulation
  const isInbound = Math.random() < 0.15;

  if (isInbound) {
    const probePorts = [5555, 8080, 22, 1900, 3000, 443, 80];
    const targetPort = probePorts[Math.floor(Math.random() * probePorts.length)];
    const ipA = Math.floor(Math.random() * 200) + 20;
    const ipB = Math.floor(Math.random() * 255);
    const remoteIp = `${ipA}.${ipB}.14.9`;
    const countries = ['RU', 'CN', 'US', 'NL', 'DE', 'BR', 'KR'];
    const country = countries[Math.floor(Math.random() * countries.length)];

    const evalResult = evaluateConnection(
      'INBOUND',
      'netd',
      Math.floor(30000 + Math.random() * 20000),
      targetPort,
      config,
      appRules,
      inboundRules
    );

    const log: ConnectionLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      pid: 1050,
      packageName: 'netd',
      appName: 'Network Daemon',
      direction: 'INBOUND',
      protocol: targetPort === 1900 ? 'UDP' : 'TCP',
      remoteIp,
      remoteHost: `scanner-${ipA}-${ipB}.threat-radar.net`,
      remotePort: Math.floor(30000 + Math.random() * 20000),
      localPort: targetPort,
      country,
      bytes: Math.floor(64 + Math.random() * 128),
      status: evalResult.status,
      blockedReason: evalResult.reason,
    };

    return { log };
  }

  // Otherwise outbound packet from one of active processes
  const candidateProc = processes[Math.floor(Math.random() * processes.length)];
  const evalResult = evaluateConnection(
    'OUTBOUND',
    candidateProc.packageName,
    443,
    Math.floor(35000 + Math.random() * 25000),
    config,
    appRules,
    inboundRules
  );

  const bytes = evalResult.allowed ? Math.floor(1200 + Math.random() * 8500) : 64;

  let remoteHost = 'api.services.net';
  let remoteIp = '172.217.16.202';
  let country = 'US';

  if (candidateProc.packageName.includes('youtube')) {
    remoteHost = 'rr2---sn-ab5sznzl.googlevideo.com';
    remoteIp = '142.250.190.46';
  } else if (candidateProc.packageName.includes('chrome')) {
    remoteHost = 'edge.adservice.google.com';
    remoteIp = '172.217.14.238';
  } else if (candidateProc.packageName.includes('whatsapp')) {
    remoteHost = 'chat-gateway.whatsapp.net';
    remoteIp = '157.240.22.60';
    country = 'IE';
  } else if (candidateProc.packageName.includes('spotify')) {
    remoteHost = 'spclient.wg.spotify.com';
    remoteIp = '35.186.224.25';
    country = 'SE';
  } else if (candidateProc.packageName.includes('instagram')) {
    remoteHost = 'graph.instagram.com';
    remoteIp = '157.240.241.63';
  } else if (candidateProc.packageName.includes('tiktok')) {
    remoteHost = 'mon.tiktokv.com';
    remoteIp = '161.117.114.12';
    country = 'SG';
  }

  const log: ConnectionLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    pid: candidateProc.pid,
    packageName: candidateProc.packageName,
    appName: candidateProc.appName,
    direction: 'OUTBOUND',
    protocol: candidateProc.packageName.includes('youtube') ? 'QUIC' : 'TCP',
    remoteIp,
    remoteHost,
    remotePort: 443,
    localPort: Math.floor(40000 + Math.random() * 20000),
    country,
    bytes,
    status: evalResult.status,
    blockedReason: evalResult.reason,
  };

  return { log };
}
