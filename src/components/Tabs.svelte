<script>
  let { activeTab = 'hosts', tabs = [], onTabChange = () => {} } = $props();
</script>

<div class="border-b border-gray-200 dark:border-gray-700">
  <nav class="flex space-x-1" aria-label="Tabs">
    {#each tabs as tab}
      <button
        onclick={() => onTabChange(tab.id)}
        class="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors
          {activeTab === tab.id
            ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 border-b-2 border-green-500'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }"
      >
        {tab.label}
        {#if tab.count !== undefined}
          <span class="ml-2 px-2 py-0.5 text-xs rounded-full
            {activeTab === tab.id
              ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }">
            {tab.count}
          </span>
        {/if}
      </button>
    {/each}
  </nav>
</div>
