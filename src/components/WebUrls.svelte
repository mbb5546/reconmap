<script>
  import { webUrls } from '../stores/scanData.js';
  import { copyToClipboard } from '../lib/utils/urlGenerator.js';

  let filter = $state('');
  let copiedUrl = $state(null);

  let filteredUrls = $derived.by(() => {
    if (!filter) return $webUrls;
    const term = filter.toLowerCase();
    return $webUrls.filter(u =>
      u.url.toLowerCase().includes(term) ||
      u.host.ip.includes(term) ||
      (u.host.hostname && u.host.hostname.toLowerCase().includes(term))
    );
  });

  async function handleCopy(url) {
    const success = await copyToClipboard(url);
    if (success) {
      copiedUrl = url;
      setTimeout(() => {
        if (copiedUrl === url) copiedUrl = null;
      }, 2000);
    }
  }

  async function copyAllUrls() {
    const urls = filteredUrls.map(u => u.url).join('\n');
    const success = await copyToClipboard(urls);
    if (success) {
      copiedUrl = 'all';
      setTimeout(() => {
        if (copiedUrl === 'all') copiedUrl = null;
      }, 2000);
    }
  }
</script>

<div class="space-y-4">
  <!-- Header with filter and copy all -->
  <div class="flex flex-col sm:flex-row gap-3">
    <div class="flex-1">
      <input
        type="text"
        bind:value={filter}
        placeholder="Filter URLs..."
        class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
    </div>
    {#if filteredUrls.length > 0}
      <button
        onclick={copyAllUrls}
        title="Copy all URLs to clipboard, one per line"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors
          bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
      >
        {#if copiedUrl === 'all'}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          Copied!
        {:else}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          Copy All ({filteredUrls.length})
        {/if}
      </button>
    {/if}
  </div>

  <!-- URL List -->
  {#if filteredUrls.length === 0}
    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
      {#if $webUrls.length === 0}
        No HTTP/HTTPS services detected. Drop an Nmap file to get started.
      {:else}
        No URLs match your filter.
      {/if}
    </div>
  {:else}
    <div class="space-y-2">
      {#each filteredUrls as item (`${item.host.ip}:${item.port.number}`)}
        <div class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition-colors group">
          <div class="flex items-center gap-3 min-w-0">
            <!-- Protocol badge -->
            <span class="flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded
              {item.protocol === 'https'
                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              }">
              {item.protocol.toUpperCase()}
            </span>

            <!-- URL as link -->
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              class="font-mono text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400 truncate"
            >
              {item.url}
            </a>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0 ml-2">
            <!-- Service name -->
            {#if item.port.service?.name}
              <span class="hidden sm:inline text-xs text-gray-500 dark:text-gray-400">
                {item.port.service.name}
              </span>
            {/if}

            <!-- Copy button -->
            <button
              onclick={() => handleCopy(item.url)}
              class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Copy URL"
            >
              {#if copiedUrl === item.url}
                <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              {:else}
                <svg class="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              {/if}
            </button>

            <!-- Open link -->
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Open in new tab"
            >
              <svg class="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </a>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
