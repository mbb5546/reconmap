<script>
  import { scanData } from '../stores/scanData.js';
  import { copyToClipboard } from '../lib/utils/urlGenerator.js';
  import { exportPortsToZip } from '../lib/utils/zipExport.js';

  let filter = $state('');
  let stateFilter = $state('open');
  let sortColumn = $state('port');
  let sortDirection = $state('asc');
  let copied = $state(false);
  let copyFormat = $state('newline');
  let exporting = $state(false);

  // Build flat list of ports with host info
  let allPorts = $derived.by(() => {
    const ports = [];
    for (const host of $scanData.hosts) {
      for (const port of host.ports) {
        ports.push({
          ...port,
          hostIp: host.ip,
          hostname: host.hostname
        });
      }
    }
    return ports;
  });

  // Apply filters and sorting
  let filteredPorts = $derived.by(() => {
    let ports = allPorts;

    // Filter by state
    if (stateFilter !== 'all') {
      ports = ports.filter(p => p.state === stateFilter);
    }

    // Filter by search
    if (filter) {
      const term = filter.toLowerCase();
      ports = ports.filter(p =>
        p.hostIp.includes(term) ||
        (p.hostname && p.hostname.toLowerCase().includes(term)) ||
        String(p.number).includes(term) ||
        (p.service?.name && p.service.name.toLowerCase().includes(term)) ||
        (p.service?.product && p.service.product.toLowerCase().includes(term))
      );
    }

    // Sort
    ports = [...ports].sort((a, b) => {
      let aVal, bVal;

      switch (sortColumn) {
        case 'port':
          aVal = a.number;
          bVal = b.number;
          break;
        case 'host':
          aVal = a.hostIp;
          bVal = b.hostIp;
          break;
        case 'service':
          aVal = a.service?.name || '';
          bVal = b.service?.name || '';
          break;
        case 'state':
          aVal = a.state;
          bVal = b.state;
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return ports;
  });

  function toggleSort(column) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }
  }

  function getSortIcon(column) {
    if (sortColumn !== column) return '';
    return sortDirection === 'asc' ? '\u2191' : '\u2193';
  }

  // Get unique IPs from filtered ports
  let uniqueIPs = $derived.by(() => {
    const ips = new Set(filteredPorts.map(p => p.hostIp));
    return [...ips];
  });

  async function copyIPs() {
    const separator = copyFormat === 'comma' ? ', ' : '\n';
    const ips = uniqueIPs.join(separator);
    const success = await copyToClipboard(ips);
    if (success) {
      copied = true;
      setTimeout(() => copied = false, 2000);
    }
  }

  async function handleExportZip() {
    exporting = true;
    try {
      await exportPortsToZip($scanData.hosts);
    } finally {
      exporting = false;
    }
  }
</script>

<div class="space-y-4">
  <!-- Filters -->
  <div class="space-y-3">
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="flex-1">
        <input
          type="text"
          bind:value={filter}
          placeholder="Filter by IP, port, or service..."
          class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>
      <div class="flex gap-2">
        <button
          onclick={() => stateFilter = 'all'}
          title="Show all ports regardless of state"
          class="px-3 py-2 rounded-lg text-sm font-medium transition-colors
            {stateFilter === 'all'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }"
        >
          All
        </button>
        <button
          onclick={() => stateFilter = 'open'}
          title="Show only ports that are open and accepting connections"
          class="px-3 py-2 rounded-lg text-sm font-medium transition-colors
            {stateFilter === 'open'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }"
        >
          Open
        </button>
        <button
          onclick={() => stateFilter = 'filtered'}
          title="Show only ports blocked by a firewall or filter"
          class="px-3 py-2 rounded-lg text-sm font-medium transition-colors
            {stateFilter === 'filtered'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }"
        >
          Filtered
        </button>
        <button
          onclick={() => stateFilter = 'closed'}
          title="Show only ports that are closed (not listening)"
          class="px-3 py-2 rounded-lg text-sm font-medium transition-colors
            {stateFilter === 'closed'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }"
        >
          Closed
        </button>
      </div>
    </div>

    <!-- Copy IPs -->
    {#if uniqueIPs.length > 0}
      <div class="flex items-center justify-end gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <span class="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">Copy format:</span>

        <!-- Format toggle -->
        <div class="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
          <button
            onclick={() => copyFormat = 'newline'}
            title="Separate IPs with newlines (one per line)"
            class="px-3 py-1.5 text-sm font-medium transition-colors
              {copyFormat === 'newline'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }"
          >
            Newline
          </button>
          <button
            onclick={() => copyFormat = 'comma'}
            title="Separate IPs with commas"
            class="px-3 py-1.5 text-sm font-medium transition-colors border-l border-gray-300 dark:border-gray-600
              {copyFormat === 'comma'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }"
          >
            Comma
          </button>
        </div>

        <!-- Copy button -->
        <button
          onclick={copyIPs}
          title="Copy all unique host IPs from the filtered results to clipboard"
          class="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
            bg-blue-500 hover:bg-blue-600 text-white"
        >
          {#if copied}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Copied!
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            Copy {uniqueIPs.length} IPs
          {/if}
        </button>

        <!-- Export Zip button -->
        <button
          onclick={handleExportZip}
          disabled={exporting}
          title="Download a zip file with one text file per port, each listing the hosts with that port open"
          class="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
            bg-green-500 hover:bg-green-600 disabled:bg-green-400 disabled:cursor-wait text-white"
        >
          {#if exporting}
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Exporting...
          {:else}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Export by Port
          {/if}
        </button>
      </div>
    {/if}
  </div>

  <!-- Table -->
  {#if filteredPorts.length === 0}
    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
      {#if allPorts.length === 0}
        No ports loaded. Drop an Nmap file to get started.
      {:else}
        No ports match your filter.
      {/if}
    </div>
  {:else}
    <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th
              onclick={() => toggleSort('host')}
              class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
            >
              Host {getSortIcon('host')}
            </th>
            <th
              onclick={() => toggleSort('port')}
              class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
            >
              Port {getSortIcon('port')}
            </th>
            <th
              onclick={() => toggleSort('state')}
              class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
            >
              State {getSortIcon('state')}
            </th>
            <th
              onclick={() => toggleSort('service')}
              class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
            >
              Service {getSortIcon('service')}
            </th>
            <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
              Version
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {#each filteredPorts as port}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <td class="px-4 py-3">
                <span class="font-mono text-gray-900 dark:text-gray-100">{port.hostIp}</span>
                {#if port.hostname}
                  <span class="text-gray-500 dark:text-gray-400 text-xs block">{port.hostname}</span>
                {/if}
              </td>
              <td class="px-4 py-3 font-mono text-gray-900 dark:text-gray-100">
                {port.number}/{port.protocol}
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 text-xs rounded-full
                  {port.state === 'open' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                   port.state === 'filtered' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                   'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}">
                  {port.state}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-700 dark:text-gray-300">
                {port.service?.name || '-'}
              </td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs max-w-xs truncate">
                {port.service?.banner || '-'}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <div class="text-sm text-gray-500 dark:text-gray-400">
      Showing {filteredPorts.length} of {allPorts.length} ports
    </div>
  {/if}
</div>
