<script>
  import { parseNmapXml } from '../lib/parsers/xmlParser.js';
  import { parseGnmap } from '../lib/parsers/gnmapParser.js';
  import { mergeScanData, clearScanData } from '../stores/scanData.js';

  let { onFilesLoaded = () => {} } = $props();

  let isDragging = $state(false);
  let isLoading = $state(false);
  let error = $state(null);
  let fileInput;

  function handleDragOver(e) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(e) {
    e.preventDefault();
    isDragging = false;
  }

  function handleDrop(e) {
    e.preventDefault();
    isDragging = false;
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
    // Reset input so same file can be selected again
    e.target.value = '';
  }

  async function processFiles(files) {
    if (files.length === 0) return;

    isLoading = true;
    error = null;

    try {
      for (const file of files) {
        const content = await file.text();
        const fileName = file.name.toLowerCase();

        let parsedData;
        let fileType;
        if (fileName.endsWith('.xml')) {
          parsedData = parseNmapXml(content);
          fileType = 'xml';
        } else if (fileName.endsWith('.gnmap')) {
          parsedData = parseGnmap(content);
          fileType = 'gnmap';
        } else {
          // Try to detect format from content
          if (content.trim().startsWith('<?xml') || content.includes('<nmaprun')) {
            parsedData = parseNmapXml(content);
            fileType = 'xml';
          } else if (content.includes('Host:') && content.includes('Ports:')) {
            parsedData = parseGnmap(content);
            fileType = 'gnmap';
          } else {
            throw new Error(`Unknown file format: ${file.name}`);
          }
        }

        const fileInfo = {
          name: file.name,
          size: file.size,
          type: fileType,
          hostsCount: parsedData.hosts.length,
          uploadedAt: new Date(),
          scanInfo: parsedData.scanInfo
        };

        mergeScanData(parsedData, fileInfo);
      }
      onFilesLoaded();
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  function handleClear() {
    clearScanData();
    error = null;
  }
</script>

<div class="relative">
  <div
    class="border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer
      {isDragging
        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
        : 'border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500'
      }
      {isLoading ? 'opacity-50 pointer-events-none' : ''}"
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    onclick={() => fileInput.click()}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Enter' && fileInput.click()}
  >
    <input
      type="file"
      bind:this={fileInput}
      onchange={handleFileSelect}
      accept=".xml,.gnmap"
      multiple
      class="hidden"
    />

    {#if isLoading}
      <div class="flex items-center justify-center space-x-2">
        <svg class="animate-spin h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-gray-600 dark:text-gray-300">Processing files...</span>
      </div>
    {:else}
      <svg class="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
      </svg>
      <p class="text-gray-600 dark:text-gray-300">
        <span class="font-medium text-green-600 dark:text-green-400">Drop Nmap files here</span>
        or click to browse
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Supports .xml and .gnmap formats
      </p>
    {/if}
  </div>

  {#if error}
    <div class="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
    </div>
  {/if}
</div>

<style>
  /* Prevent text selection during drag */
  div[role="button"] {
    user-select: none;
  }
</style>
