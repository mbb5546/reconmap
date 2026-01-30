import { detectHttpService } from '../utils/urlGenerator.js';

/**
 * Parses Nmap XML output
 * @param {string} xmlString - Raw XML content
 * @returns {Object} - Parsed scan data
 */
export function parseNmapXml(xmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  // Check for parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML file');
  }

  const result = {
    hosts: [],
    scanInfo: null
  };

  // Parse scan info
  const nmaprun = doc.querySelector('nmaprun');
  if (nmaprun) {
    result.scanInfo = {
      scanner: nmaprun.getAttribute('scanner') || 'nmap',
      args: nmaprun.getAttribute('args') || '',
      startTime: nmaprun.getAttribute('startstr') || '',
      version: nmaprun.getAttribute('version') || ''
    };

    const finished = doc.querySelector('finished');
    if (finished) {
      result.scanInfo.endTime = finished.getAttribute('timestr') || '';
    }
  }

  // Parse hosts
  const hostElements = doc.querySelectorAll('host');
  for (const hostEl of hostElements) {
    const host = parseHost(hostEl);
    if (host) {
      result.hosts.push(host);
    }
  }

  return result;
}

/**
 * Parses a single host element
 * @param {Element} hostEl - Host XML element
 * @returns {Object|null} - Parsed host data
 */
function parseHost(hostEl) {
  // Get IP address
  const addrEl = hostEl.querySelector('address[addrtype="ipv4"], address[addrtype="ipv6"]');
  if (!addrEl) return null;

  const ip = addrEl.getAttribute('addr');

  // Get MAC address if available
  const macEl = hostEl.querySelector('address[addrtype="mac"]');
  const mac = macEl ? macEl.getAttribute('addr') : null;
  const macVendor = macEl ? macEl.getAttribute('vendor') : null;

  // Get hostname
  const hostnameEl = hostEl.querySelector('hostnames hostname');
  const hostname = hostnameEl ? hostnameEl.getAttribute('name') : null;

  // Get status
  const statusEl = hostEl.querySelector('status');
  const status = statusEl ? statusEl.getAttribute('state') : 'unknown';

  // Parse ports
  const ports = [];
  const portElements = hostEl.querySelectorAll('ports port');
  for (const portEl of portElements) {
    const port = parsePort(portEl);
    if (port) {
      ports.push(port);
    }
  }

  return {
    ip,
    hostname,
    status,
    mac,
    macVendor,
    ports
  };
}

/**
 * Parses a single port element
 * @param {Element} portEl - Port XML element
 * @returns {Object|null} - Parsed port data
 */
function parsePort(portEl) {
  const number = parseInt(portEl.getAttribute('portid'), 10);
  const protocol = portEl.getAttribute('protocol') || 'tcp';

  // Get state
  const stateEl = portEl.querySelector('state');
  const state = stateEl ? stateEl.getAttribute('state') : 'unknown';
  const reason = stateEl ? stateEl.getAttribute('reason') : '';

  // Get service info
  const serviceEl = portEl.querySelector('service');
  let service = null;

  if (serviceEl) {
    service = {
      name: serviceEl.getAttribute('name') || '',
      product: serviceEl.getAttribute('product') || '',
      version: serviceEl.getAttribute('version') || '',
      extrainfo: serviceEl.getAttribute('extrainfo') || '',
      tunnel: serviceEl.getAttribute('tunnel') || '',
      method: serviceEl.getAttribute('method') || ''
    };

    // Build banner string
    const bannerParts = [];
    if (service.product) bannerParts.push(service.product);
    if (service.version) bannerParts.push(service.version);
    if (service.extrainfo) bannerParts.push(`(${service.extrainfo})`);
    service.banner = bannerParts.join(' ');
  }

  // Get scripts output
  const scripts = [];
  const scriptElements = portEl.querySelectorAll('script');
  for (const scriptEl of scriptElements) {
    scripts.push({
      id: scriptEl.getAttribute('id'),
      output: scriptEl.getAttribute('output')
    });
  }

  const portData = {
    number,
    protocol,
    state,
    reason,
    service,
    scripts
  };

  // Detect HTTP service
  const { isHttp, isHttps } = detectHttpService(portData);
  portData.isHttp = isHttp;
  portData.isHttps = isHttps;

  return portData;
}
