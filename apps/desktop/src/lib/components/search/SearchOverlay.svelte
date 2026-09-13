<script lang="ts">
  import { onMount } from 'svelte';
  import Fuse from 'fuse.js';
  import type { PlanSummary, DocType } from '@plannic/core';
  import { plansStore } from '../../stores/plans.svelte.js';
  import { projectStore } from '../../stores/project.svelte.js';
  import { uiStore } from '../../stores/ui.svelte.js';

  interface SearchItem {
    slug: string;
    name: string;
    docType: string;
    description: string;
  }

  let query = $state('');
  let selectedIndex = $state(0);
  let inputRef = $state<HTMLInputElement | null>(null);

  let searchableItems = $derived.by(() => {
    const items: SearchItem[] = [];
    for (const plan of plansStore.items) {
      items.push({
        slug: plan.slug,
        name: plan.name,
        docType: 'PLAN',
        description: plan.description || `Plan in ${plan.mode} mode`,
      });
      if (plan.mode === 'deep') {
        items.push({
          slug: plan.slug,
          name: plan.name,
          docType: 'SCOPE',
          description: `Scope definition for ${plan.name}`,
        });
        items.push({
          slug: plan.slug,
          name: plan.name,
          docType: 'FEATURE',
          description: `Feature breakdown for ${plan.name}`,
        });
        items.push({
          slug: plan.slug,
          name: plan.name,
          docType: 'PHASE',
          description: `Phase implementation for ${plan.name}`,
        });
        items.push({
          slug: plan.slug,
          name: plan.name,
          docType: 'LIMITATION',
          description: `Limitations for ${plan.name}`,
        });
      }
    }
    return items;
  });

  let fuse = $derived(
    new Fuse(searchableItems, {
      keys: ['name', 'docType', 'description'],
      threshold: 0.35,
    })
  );

  let results = $derived.by(() => {
    if (!query.trim()) {
      return searchableItems.slice(0, 6);
    }
    return fuse.search(query, { limit: 8 }).map((r) => r.item);
  });

  $effect(() => {
    if (uiStore.searchOpen) {
      setTimeout(() => inputRef?.focus(), 50);
      query = '';
      selectedIndex = 0;
    }
  });

  function close() {
    uiStore.searchOpen = false;
  }

  function handleSelect(item: SearchItem) {
    if (projectStore.currentPath) {
      plansStore.selectPlan(projectStore.currentPath, item.slug);
      if (item.docType.toLowerCase() !== 'plan') {
        plansStore.selectDocType(item.docType.toLowerCase() as DocType);
      }
    }
    close();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      close();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % Math.max(1, results.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + results.length) % Math.max(1, results.length);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const item = results[selectedIndex];
      if (item) {
        handleSelect(item);
      }
      return;
    }
  }
</script>

<svelte:window onkeydown={(e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    uiStore.searchOpen = !uiStore.searchOpen;
  }
}} />

{#if uiStore.searchOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="search-backdrop" onclick={(e) => { if (e.target === e.currentTarget) close(); }}>
    <div class="search-modal" onkeydown={handleKeydown}>
      <div class="search-input-box">
        <span class="search-icon">⌕</span>
        <input
          bind:this={inputRef}
          bind:value={query}
          type="text"
          placeholder="Search plans..."
          class="search-input"
        />
        <span class="esc-hint" onclick={close}>ESC</span>
      </div>

      <div class="results-list">
        {#if results.length === 0}
          <div class="empty-results">No plans matching "{query}"</div>
        {:else}
          {#each results as item, index}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="result-item"
              class:selected={index === selectedIndex}
              onclick={() => handleSelect(item)}
              onmouseenter={() => (selectedIndex = index)}
            >
              <div class="item-left">
                <span class="item-name">{item.name}</span>
                <span class="item-desc">{item.description}</span>
              </div>
              <span class="doc-badge">{item.docType}</span>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .search-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 1100;
    display: flex;
    justify-content: center;
    padding-top: 80px;
  }

  .search-modal {
    width: 560px;
    max-height: 480px;
    background: var(--base-surface);
    border: 1px solid var(--base-border-hi);
    border-radius: var(--radius-md);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: search-enter var(--duration-md) var(--ease-out);
  }

  @keyframes search-enter {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .search-input-box {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--base-border);
  }

  .search-icon {
    font-size: 16px;
    color: var(--text-secondary);
  }

  .search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-family: var(--font-ui);
    font-size: 15px;
    color: var(--text-primary);
  }

  .search-input::placeholder {
    color: var(--text-secondary);
  }

  .esc-hint {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-secondary);
    background: var(--base-overlay);
    padding: 2px 5px;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  .results-list {
    overflow-y: auto;
    max-height: 380px;
    padding: var(--space-2) 0;
  }

  .empty-results {
    padding: var(--space-4);
    text-align: center;
    color: var(--text-secondary);
    font-size: var(--text-sm);
  }

  .result-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    cursor: pointer;
    transition: background-color var(--duration-sm) var(--ease-out);
  }

  .result-item:hover,
  .result-item.selected {
    background: var(--base-overlay);
  }

  .item-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .item-name {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text-primary);
  }

  .item-desc {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 420px;
  }

  .doc-badge {
    font-family: var(--font-mono);
    font-size: 10px;
    background: var(--base-overlay);
    color: var(--accent-text);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    flex-shrink: 0;
  }
</style>
