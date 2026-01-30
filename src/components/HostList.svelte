<script>
  import { scanData, uploadedFiles } from '../stores/scanData.js';
  import { copyToClipboard } from '../lib/utils/urlGenerator.js';

  let { onSelectHost = () => {} } = $props();

  let expandedHost = $state(null);
  let filter = $state('');
  let statusFilter = $state('up');
  let sourceFilter = $state('all');
  let portFilter = $state('');
  let serviceFilter = $state('all');
  let copied = $state(false);
  let copyFormat = $state('newline'); // 'newline' or 'comma'

  let availableSources = $derived(
    [...new Set($scanData.hosts.flatMap(h => h.sources || []))]
  );

  let availableServices = $derived.by(() => {
    const services = new Set();
    for (const host of $scanData.hosts) {
      for (const port of host.ports) {
        if (port.state === 'open' && port.service?.name) {
          services.add(port.service.name);
        }
      }
    }
    return [...services].sort();
  });

  let filteredHosts = $derived.by(() => {
    let hosts = $scanData.hosts;

    // Filter by status
    if (statusFilter === 'up') {
      hosts = hosts.filter(h => h.status === 'up');
    } else if (statusFilter === 'down') {
      hosts = hosts.filter(h => h.status === 'down');
    }

    // Filter by source
    if (sourceFilter !== 'all') {
      hosts = hosts.filter(h => h.sources?.includes(sourceFilter));
    }

    // Filter by port
    if (portFilter) {
      const portNum = parseInt(portFilter, 10);
      if (!isNaN(portNum)) {
        hosts = hosts.filter(h =>
          h.ports.some(p => p.number === portNum && p.state === 'open')
        );
      }
    }

    // Filter by service
    if (serviceFilter !== 'all') {
      hosts = hosts.filter(h =>
        h.ports.some(p => p.state === 'open' && p.service?.name === serviceFilter)
      );
    }

    // Filter by search term (IP/hostname/subnet)
    if (filter) {
      const term = filter.toLowerCase();
      hosts = hosts.filter(h =>
        h.ip.includes(term) ||
        (h.hostname && h.hostname.toLowerCase().includes(term))
      );
    }

    return hosts;
  });

  function toggleHost(ip) {
    expandedHost = expandedHost === ip ? null : ip;
  }

  function getOpenPortCount(host) {
    return host.ports.filter(p => p.state === 'open').length;
  }

  async function copyIPs() {
    const separator = copyFormat === 'comma' ? ', ' : '\n';
    const ips = filteredHosts.map(h => h.ip).join(separator);
    const success = await copyToClipboard(ips);
    if (success) {
      copied = true;
      setTimeout(() => copied = false, 2000);
    }
  }

  function clearFilters() {
    filter = '';
    statusFilter = 'all';
    sourceFilter = 'all';
    portFilter = '';
    serviceFilter = 'all';
  }

  let hasActiveFilters = $derived(
    filter || statusFilter !== 'all' || sourceFilter !== 'all' || portFilter || serviceFilter !== 'all'
  );
</script>

<div class="space-y-4">
  <!-- Filters -->
  <div class="space-y-3">
    <!-- Row 1: Search, Port, Service -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="flex-1">
        <input
          type="text"
          bind:value={filter}
          placeholder="Filter by IP, hostname, or subnet (e.g. 192.168.1.)"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      <input
        type="text"
        bind:value={portFilter}
        placeholder="Port"
        class="w-20 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
          font-mono text-center"
      />

      <!-- Service filter -->
      {#if availableServices.length > 0}
        <select
          bind:value={serviceFilter}
          class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="all">All services</option>
          {#each availableServices as service}
            <option value={service}>{service}</option>
          {/each}
        </select>
      {/if}
    </div>

    <!-- Row 2: Source, Status, Actions -->
    <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div class="flex flex-wrap gap-2 items-center">
        <!-- Source filter -->
        {#if availableSources.length > 1}
          <select
            bind:value={sourceFilter}
            class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          >
            <option value="all">All sources</option>
            {#each availableSources as source}
              <option value={source}>{source}</option>
            {/each}
          </select>
        {/if}

        <!-- Status buttons -->
        <div class="flex gap-1">
          <button
            onclick={() => statusFilter = 'all'}
            title="Show all hosts regardless of status"
            class="px-3 py-2 rounded-lg text-sm font-medium transition-colors
              {statusFilter === 'all'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }"
          >
            All
          </button>
          <button
            onclick={() => statusFilter = 'up'}
            title="Show only hosts that are online and responding"
            class="px-3 py-2 rounded-lg text-sm font-medium transition-colors
              {statusFilter === 'up'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }"
          >
            Up
          </button>
          <button
            onclick={() => statusFilter = 'down'}
            title="Show only hosts that are offline or not responding"
            class="px-3 py-2 rounded-lg text-sm font-medium transition-colors
              {statusFilter === 'down'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }"
          >
            Down
          </button>
        </div>

        <!-- Clear filters -->
        {#if hasActiveFilters}
          <button
            onclick={clearFilters}
            class="px-2 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            title="Clear all filters"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        {/if}
      </div>

      <!-- Copy IPs -->
      {#if filteredHosts.length > 0}
        <div class="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
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
            title="Copy all filtered host IPs to clipboard"
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
              Copy {filteredHosts.length} IPs
            {/if}
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Results count -->
  {#if hasActiveFilters && filteredHosts.length > 0}
    <div class="text-sm text-gray-500 dark:text-gray-400">
      Showing {filteredHosts.length} of {$scanData.hosts.length} hosts
    </div>
  {/if}

  <!-- Host list -->
  {#if filteredHosts.length === 0}
    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
      {#if $scanData.hosts.length === 0}
        No hosts loaded. Drop an Nmap file to get started.
      {:else}
        No hosts match your filter.
      {/if}
    </div>
  {:else}
    <div class="space-y-2">
      {#each filteredHosts as host (host.ip)}
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <!-- Host header -->
          <button
            onclick={() => toggleHost(host.ip)}
            class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div class="flex items-center space-x-3">
              <!-- Status indicator -->
              <span class="w-2.5 h-2.5 rounded-full {host.status === 'up' ? 'bg-green-500' : 'bg-red-500'}"></span>

              <!-- IP Address -->
              <span class="font-mono text-gray-900 dark:text-gray-100">{host.ip}</span>

              <!-- Hostname -->
              {#if host.hostname}
                <span class="text-gray-500 dark:text-gray-400">({host.hostname})</span>
              {/if}
            </div>

            <div class="flex items-center space-x-2">
              <!-- Source tags -->
              {#if host.sources?.length > 0}
                <div class="hidden sm:flex items-center gap-1">
                  {#each host.sources as source}
                    <span class="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-mono truncate max-w-24" title={source}>
                      {source}
                    </span>
                  {/each}
                </div>
              {/if}

              <!-- Open ports badge -->
              {#if getOpenPortCount(host) > 0}
                <span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                  {getOpenPortCount(host)} open
                </span>
              {/if}

              <!-- Expand chevron -->
              <svg
                class="w-5 h-5 text-gray-400 transition-transform {expandedHost === host.ip ? 'rotate-180' : ''}"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </button>

          <!-- Expanded content -->
          {#if expandedHost === host.ip}
            <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <!-- Sources (shown on mobile, hidden on desktop) -->
              {#if host.sources?.length > 0}
                <div class="sm:hidden mb-3">
                  <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Sources: </span>
                  {#each host.sources as source, i}
                    <span class="text-sm font-mono text-gray-900 dark:text-gray-100">{source}{i < host.sources.length - 1 ? ', ' : ''}</span>
                  {/each}
                </div>
              {/if}

              {#if host.mac}
                <div class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span class="font-medium">MAC:</span>
                  <span class="font-mono">{host.mac}</span>
                  {#if host.macVendor}
                    <span class="text-gray-500">({host.macVendor})</span>
                  {/if}
                </div>
              {/if}

              {#if host.ports.length > 0}
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-gray-500 dark:text-gray-400">
                      <th class="pb-2 font-medium">Port</th>
                      <th class="pb-2 font-medium">State</th>
                      <th class="pb-2 font-medium">Service</th>
                      <th class="pb-2 font-medium">Version</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each host.ports as port}
                      <tr class="border-t border-gray-200 dark:border-gray-700">
                        <td class="py-2 font-mono text-gray-900 dark:text-gray-100">
                          {port.number}/{port.protocol}
                        </td>
                        <td class="py-2">
                          <span class="px-2 py-0.5 text-xs rounded-full
                            {port.state === 'open' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                             port.state === 'filtered' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                             'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}">
                            {port.state}
                          </span>
                        </td>
                        <td class="py-2 text-gray-700 dark:text-gray-300">
                          {port.service?.name || '-'}
                        </td>
                        <td class="py-2 text-gray-500 dark:text-gray-400 font-mono text-xs">
                          {port.service?.banner || '-'}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              {:else}
                <p class="text-gray-500 dark:text-gray-400 text-sm">No ports scanned</p>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
