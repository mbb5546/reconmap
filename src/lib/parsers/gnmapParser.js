import { detectHttpService } from '../utils/urlGenerator.js';

/**
 * Parses Nmap grepable output (.gnmap)
 * @param {string} content - Raw gnmap content
 * @returns {Object} - Parsed scan data
 */
export function parseGnmap(content) {
  const result = {
    hosts: [],
    scanInfo: null
  };

  const lines = content.split('\n');
  const hostMap = new Map();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      // Parse comment lines for scan info
      if (trimmed.startsWith('# Nmap')) {
        result.scanInfo = parseScanInfoLine(trimmed);
      }
      continue;
    }

    // Parse host line
    const hostData = parseHostLine(trimmed);
    if (hostData) {
      const existing = hostMap.get(hostData.ip);
      if (existing) {
        // Merge ports
        for (const port of hostData.ports) {
          const exists = existing.ports.some(
            p => p.number === port.number && p.protocol === port.protocol
          );
          if (!exists) {
            existing.ports.push(port);
          }
        }
        // Update hostname if we didn't have one
        if (!existing.hostname && hostData.hostname) {
          existing.hostname = hostData.hostname;
        }
      } else {
        hostMap.set(hostData.ip, hostData);
      }
    }
  }

  result.hosts = Array.from(hostMap.values());
  return result;
}

/**
 * Parses scan info from comment line
 * @param {string} line - Comment line
 * @returns {Object} - Scan info
 */
function parseScanInfoLine(line) {
  // Format: # Nmap 7.94 scan initiated Mon Jan 15 10:30:00 2024 as: nmap -sV -p- 192.168.1.0/24
  const match = line.match(/# Nmap ([\d.]+) scan initiated (.+?) as: (.+)/);
  if (match) {
    return {
      scanner: 'nmap',
      version: match[1],
      startTime: match[2],
      args: match[3]
    };
  }
  return {
    scanner: 'nmap',
    args: line.replace(/^#\s*/, '')
  };
}

/**
 * Parses a single host line from gnmap
 * @param {string} line - Host line
 * @returns {Object|null} - Parsed host data
 */
function parseHostLine(line) {
  // Format: Host: 192.168.1.1 (hostname.local)	Status: Up
  // Format: Host: 192.168.1.1 ()	Ports: 22/open/tcp//ssh//OpenSSH 8.4/, 80/open/tcp//http//nginx/	Ignored State: closed (998)

  // Extract host IP and hostname
  const hostMatch = line.match(/Host:\s+([\d.]+)\s+\(([^)]*)\)/);
  if (!hostMatch) return null;

  const ip = hostMatch[1];
  const hostname = hostMatch[2] || null;

  // Determine status
  let status = 'up';
  if (line.includes('Status: Down')) {
    status = 'down';
  }

  // Extract ports
  const ports = [];
  const portsMatch = line.match(/Ports:\s+(.+?)(?:\t|$)/);

  if (portsMatch) {
    const portsStr = portsMatch[1];
    // Split by comma, but be careful of commas in version strings
    const portEntries = portsStr.split(/,\s+(?=\d)/);

    for (const entry of portEntries) {
      const port = parsePortEntry(entry.trim());
      if (port) {
        ports.push(port);
      }
    }
  }

  return {
    ip,
    hostname,
    status,
    mac: null,
    macVendor: null,
    ports
  };
}

/**
 * Parses a single port entry from gnmap
 * @param {string} entry - Port entry string
 * @returns {Object|null} - Parsed port data
 */
function parsePortEntry(entry) {
  // Format: 22/open/tcp//ssh//OpenSSH 8.4/
  // Format: 80/open/tcp//http//nginx 1.18.0/
  // Fields: port/state/protocol/owner/service/rpc info/version/

  const parts = entry.split('/');
  if (parts.length < 3) return null;

  const number = parseInt(parts[0], 10);
  if (isNaN(number)) return null;

  const state = parts[1] || 'unknown';
  const protocol = parts[2] || 'tcp';
  const serviceName = parts[4] || '';
  const versionInfo = parts[6] || '';

  const service = {
    name: serviceName,
    product: '',
    version: '',
    extrainfo: '',
    tunnel: '',
    banner: versionInfo
  };

  // Try to parse version info
  if (versionInfo) {
    const versionMatch = versionInfo.match(/^([^\d]*)([\d.]+)?(.*)$/);
    if (versionMatch) {
      service.product = versionMatch[1].trim();
      service.version = versionMatch[2] || '';
      service.extrainfo = versionMatch[3].trim();
    } else {
      service.product = versionInfo;
    }
  }

  const portData = {
    number,
    protocol,
    state,
    reason: '',
    service: service.name ? service : null,
    scripts: []
  };

  // Detect HTTP service
  const { isHttp, isHttps } = detectHttpService(portData);
  portData.isHttp = isHttp;
  portData.isHttps = isHttps;

  return portData;
}
