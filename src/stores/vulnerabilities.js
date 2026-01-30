import { writable, derived } from 'svelte/store';

const STORAGE_KEY = 'vulnerabilities';

// Load from localStorage
function loadFromStorage() {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Restore Date objects
      return parsed.map(v => ({
        ...v,
        createdAt: new Date(v.createdAt)
      }));
    }
  } catch (e) {
    console.error('Failed to load vulnerabilities from storage:', e);
  }
  return [];
}

// Save to localStorage
function saveToStorage(vulnerabilities) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vulnerabilities));
  } catch (e) {
    console.error('Failed to save vulnerabilities to storage:', e);
    // Likely quota exceeded
    if (e.name === 'QuotaExceededError') {
      alert('Storage limit reached. Consider removing some vulnerabilities or screenshots.');
    }
  }
}

// Main store for vulnerabilities
export const vulnerabilities = writable(loadFromStorage());

// Subscribe to changes and persist
if (typeof window !== 'undefined') {
  vulnerabilities.subscribe(saveToStorage);
}

// Derived store for vulnerability statistics by severity
export const vulnerabilityStats = derived(vulnerabilities, $vulnerabilities => {
  const counts = {
    info: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
    total: $vulnerabilities.length
  };

  for (const vuln of $vulnerabilities) {
    if (counts[vuln.severity] !== undefined) {
      counts[vuln.severity]++;
    }
  }

  return counts;
});

// Generate a UUID
function generateId() {
  return crypto.randomUUID();
}

// Add a new vulnerability
export function addVulnerability(vuln) {
  const newVuln = {
    id: generateId(),
    title: vuln.title,
    description: vuln.description || '',
    cvss: vuln.cvss ?? null,
    severity: vuln.severity || 'info',
    affectedAssets: vuln.affectedAssets || [],
    evidence: {
      text: vuln.evidenceText || '',
      images: vuln.evidenceImages || []  // Array of base64 data URLs
    },
    createdAt: new Date()
  };

  vulnerabilities.update(list => [...list, newVuln]);
  return newVuln.id;
}

// Update an existing vulnerability
export function updateVulnerability(id, updates) {
  vulnerabilities.update(list =>
    list.map(vuln =>
      vuln.id === id ? { ...vuln, ...updates } : vuln
    )
  );
}

// Delete a vulnerability
export function deleteVulnerability(id) {
  vulnerabilities.update(list => list.filter(vuln => vuln.id !== id));
}

// Clear all vulnerabilities
export function clearVulnerabilities() {
  vulnerabilities.set([]);
}
