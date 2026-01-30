<script>
  import FileDropZone from './components/FileDropZone.svelte';
  import HostList from './components/HostList.svelte';
  import PortTable from './components/PortTable.svelte';
  import WebUrls from './components/WebUrls.svelte';
  import VulnerabilityTracker from './components/VulnerabilityTracker.svelte';
  import Tabs from './components/Tabs.svelte';
  import ThemeToggle from './components/ThemeToggle.svelte';
  import { scanData, stats, webUrls, uploadedFiles, clearScanData, removeFile } from './stores/scanData.js';
  import { vulnerabilities } from './stores/vulnerabilities.js';

  let activeTab = $state('hosts');
  let showDropZone = $state(true);
  let showScans = $state(false);

  let tabs = $derived([
    { id: 'hosts', label: 'Hosts', count: $stats.hostsUp },
    { id: 'ports', label: 'Ports', count: $stats.totalOpenPorts },
    { id: 'urls', label: 'Web URLs', count: $webUrls.length },
    { id: 'vulns', label: 'Vulnerabilities', count: $vulnerabilities.length }
  ]);

  let hasData = $derived($scanData.hosts.length > 0);

  function handleFilesLoaded() {
    // Collapse drop zone after loading files
    if (hasData) {
      showDropZone = false;
    }
  }

  function handleClear() {
    clearScanData();
    showDropZone = true;
  }
</script>

<div class="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
  <!-- Header -->
  <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-14">
        <div class="flex items-center space-x-3">
          <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
          </svg>
          <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">recoNmap</h1>
        </div>

        <div class="flex items-center space-x-3">
          {#if hasData}
            <button
              onclick={() => showDropZone = !showDropZone}
              class="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {showDropZone ? 'Hide' : 'Add Files'}
            </button>
            <button
              onclick={handleClear}
              class="px-3 py-1.5 text-sm rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              Clear
            </button>
          {/if}
          <ThemeToggle />
        </div>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <!-- Drop zone -->
    {#if showDropZone || !hasData}
      <div class="mb-6">
        <FileDropZone onFilesLoaded={handleFilesLoaded} />
      </div>
    {/if}

    <!-- Loaded scans (collapsible) -->
    {#if $uploadedFiles.length > 0}
      <div class="mb-6">
        <button
          onclick={() => showScans = !showScans}
          class="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <svg
              class="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform {showScans ? 'rotate-180' : ''}"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Loaded Scans</span>
            <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
              {$uploadedFiles.length}
            </span>
          </div>
          <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {#each $uploadedFiles.slice(0, 3) as file, i}
              <span class="hidden sm:inline truncate max-w-24">{file.name}{i < Math.min($uploadedFiles.length, 3) - 1 ? ',' : ''}</span>
            {/each}
            {#if $uploadedFiles.length > 3}
              <span class="hidden sm:inline">+{$uploadedFiles.length - 3} more</span>
            {/if}
          </div>
        </button>

        {#if showScans}
          <div class="mt-2 space-y-2">
            {#each $uploadedFiles as file (file.name + file.uploadedAt.getTime())}
              <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ml-4 group">
                <div class="flex items-center justify-between gap-2 px-3 py-2">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="px-1.5 py-0.5 text-xs font-medium rounded flex-shrink-0
                      {file.type === 'xml'
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                        : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                      }">
                      {file.type.toUpperCase()}
                    </span>
                    <span class="text-gray-900 dark:text-gray-100 font-medium text-sm truncate">{file.name}</span>
                    <span class="text-gray-400 dark:text-gray-500 flex-shrink-0">·</span>
                    <span class="text-gray-500 dark:text-gray-400 text-sm flex-shrink-0">{file.hostsCount} host{file.hostsCount !== 1 ? 's' : ''}</span>
                  </div>
                  <button
                    onclick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                    title="Remove this scan file"
                    class="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
                {#if file.scanInfo?.args}
                  <div class="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                    <code class="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">{file.scanInfo.args}</code>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Stats bar -->
    {#if hasData}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">{$stats.totalHosts}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Total Hosts</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">{$stats.hostsUp}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Hosts Up</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">{$stats.totalOpenPorts}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Open Ports</div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">{$stats.uniqueServices}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Services</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Tabs {activeTab} {tabs} onTabChange={(id) => activeTab = id} />

        <div class="p-4">
          {#if activeTab === 'hosts'}
            <HostList />
          {:else if activeTab === 'ports'}
            <PortTable />
          {:else if activeTab === 'urls'}
            <WebUrls />
          {:else if activeTab === 'vulns'}
            <VulnerabilityTracker />
          {/if}
        </div>
      </div>
    {/if}
  </main>
</div>
