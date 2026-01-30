import { writable, derived } from 'svelte/store';

const SCAN_DATA_KEY = 'scanData';
const UPLOADED_FILES_KEY = 'uploadedFiles';

// Load scan data from localStorage
function loadScanData() {
  if (typeof window === 'undefined') return { hosts: [], scanInfo: null };
  try {
    const stored = localStorage.getItem(SCAN_DATA_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load scan data from storage:', e);
  }
  return { hosts: [], scanInfo: null };
}

// Load uploaded files from localStorage
function loadUploadedFiles() {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(UPLOADED_FILES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Restore Date objects
      return parsed.map(f => ({
        ...f,
        uploadedAt: new Date(f.uploadedAt)
      }));
    }
  } catch (e) {
    console.error('Failed to load uploaded files from storage:', e);
  }
  return [];
}

// Save to localStorage with error handling
function saveToStorage(key, data) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key} to storage:`, e);
    if (e.name === 'QuotaExceededError') {
      alert('Storage limit reached. Consider clearing some data.');
    }
  }
}

// Main store for scan data
export const scanData = writable(loadScanData());

// Store for tracking uploaded files
export const uploadedFiles = writable(loadUploadedFiles());

// Subscribe to changes and persist
if (typeof window !== 'undefined') {
  scanData.subscribe(data => saveToStorage(SCAN_DATA_KEY, data));
  uploadedFiles.subscribe(files => saveToStorage(UPLOADED_FILES_KEY, files));
}

// Derived store for hosts that are up
export const hostsUp = derived(scanData, $data =>
  $data.hosts.filter(h => h.status === 'up')
);

// Derived store for all open ports across all hosts
export const allOpenPorts = derived(scanData, $data => {
  const ports = [];
  for (const host of $data.hosts) {
    for (const port of host.ports) {
      if (port.state === 'open') {
        ports.push({ ...port, host });
      }
    }
  }
  return ports;
});

// Derived store for web URLs
export const webUrls = derived(scanData, $data => {
  const urls = [];
  for (const host of $data.hosts) {
    for (const port of host.ports) {
      if (port.state === 'open' && port.isHttp) {
        const protocol = port.isHttps ? 'https' : 'http';
        const address = host.hostname || host.ip;
        const needsPort = !(
          (protocol === 'http' && port.number === 80) ||
          (protocol === 'https' && port.number === 443)
        );
        const url = needsPort
          ? `${protocol}://${address}:${port.number}`
          : `${protocol}://${address}`;
        urls.push({
          url,
          host,
          port,
          protocol
        });
      }
    }
  }
  return urls;
});

// Statistics derived store
export const stats = derived(scanData, $data => {
  const totalHosts = $data.hosts.length;
  const hostsUp = $data.hosts.filter(h => h.status === 'up').length;
  const hostsDown = totalHosts - hostsUp;

  let totalOpenPorts = 0;
  let totalServices = 0;
  const serviceSet = new Set();

  for (const host of $data.hosts) {
    for (const port of host.ports) {
      if (port.state === 'open') {
        totalOpenPorts++;
        if (port.service?.name) {
          serviceSet.add(port.service.name);
          totalServices++;
        }
      }
    }
  }

  return {
    totalHosts,
    hostsUp,
    hostsDown,
    totalOpenPorts,
    uniqueServices: serviceSet.size
  };
});

// Function to merge new scan data with existing
export function mergeScanData(newData, fileInfo = null) {
  const sourceName = fileInfo?.name || 'Unknown';

  scanData.update(current => {
    const existingIps = new Set(current.hosts.map(h => h.ip));
    const newHosts = [];

    for (const host of newData.hosts) {
      if (existingIps.has(host.ip)) {
        // Merge ports for existing host
        const existingHost = current.hosts.find(h => h.ip === host.ip);
        const existingPorts = new Set(existingHost.ports.map(p => `${p.protocol}/${p.number}`));
        for (const port of host.ports) {
          if (!existingPorts.has(`${port.protocol}/${port.number}`)) {
            existingHost.ports.push(port);
          }
        }
        // Update hostname if we didn't have one
        if (!existingHost.hostname && host.hostname) {
          existingHost.hostname = host.hostname;
        }
        // Add source if not already present
        if (!existingHost.sources.includes(sourceName)) {
          existingHost.sources.push(sourceName);
        }
      } else {
        // Tag new host with source
        host.sources = [sourceName];
        newHosts.push(host);
      }
    }

    return {
      hosts: [...current.hosts, ...newHosts],
      scanInfo: newData.scanInfo || current.scanInfo
    };
  });

  // Track uploaded file
  if (fileInfo) {
    uploadedFiles.update(files => [...files, fileInfo]);
  }
}

// Function to clear all data
export function clearScanData() {
  scanData.set({ hosts: [], scanInfo: null });
  uploadedFiles.set([]);
}

// Function to remove a specific uploaded file and its associated data
export function removeFile(fileName) {
  // Remove file from uploadedFiles
  uploadedFiles.update(files => files.filter(f => f.name !== fileName));

  // Remove hosts that only came from this file, or remove source from hosts with multiple sources
  scanData.update(current => {
    const updatedHosts = [];

    for (const host of current.hosts) {
      if (!host.sources || !host.sources.includes(fileName)) {
        // Host wasn't from this file, keep it
        updatedHosts.push(host);
      } else if (host.sources.length > 1) {
        // Host came from multiple files, just remove this source
        host.sources = host.sources.filter(s => s !== fileName);
        updatedHosts.push(host);
      }
      // If host.sources only contained this file, don't add it (effectively deleting it)
    }

    return {
      hosts: updatedHosts,
      scanInfo: current.scanInfo
    };
  });
}

// Theme store
export const darkMode = writable(true);

// Initialize theme from localStorage or system preference
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('darkMode');
  if (stored !== null) {
    darkMode.set(stored === 'true');
  } else {
    darkMode.set(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  // Apply theme class to document
  darkMode.subscribe(value => {
    if (value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', value);
  });
}
