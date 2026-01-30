import JSZip from 'jszip';

/**
 * Exports all open ports to a zip file with one text file per unique port.
 * Each text file contains the list of host IPs with that port open.
 *
 * @param {Array} hosts - Array of host objects from scanData
 * @returns {Promise<void>}
 */
export async function exportPortsToZip(hosts) {
  // Build map: portKey -> [hostIPs]
  const portMap = new Map();

  for (const host of hosts) {
    for (const port of host.ports) {
      // Only include open ports
      if (port.state !== 'open') continue;

      const portKey = `${port.number}-${port.protocol}`;

      if (!portMap.has(portKey)) {
        portMap.set(portKey, []);
      }

      // Add host IP if not already present
      const hostList = portMap.get(portKey);
      if (!hostList.includes(host.ip)) {
        hostList.push(host.ip);
      }
    }
  }

  // Create zip file
  const zip = new JSZip();

  // Sort port keys for consistent ordering
  const sortedKeys = [...portMap.keys()].sort((a, b) => {
    const portA = parseInt(a.split('-')[0]);
    const portB = parseInt(b.split('-')[0]);
    return portA - portB;
  });

  for (const portKey of sortedKeys) {
    const hostList = portMap.get(portKey);
    const filename = `${portKey}-hosts.txt`;
    const content = hostList.join('\n');
    zip.file(filename, content);
  }

  // Generate zip and trigger download
  const blob = await zip.generateAsync({ type: 'blob' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ports-export.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
