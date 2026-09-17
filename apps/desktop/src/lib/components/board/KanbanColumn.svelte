<script lang="ts">
  import { dndzone } from 'svelte-dnd-action';
  import type { KanbanColumnData, KanbanTask } from '../../types/board.js';
  import KanbanCard from './KanbanCard.svelte';
  import { boardStore } from '$lib/stores/board.svelte.js';

  let { column }: { column: KanbanColumnData } = $props();

  let items = $state<KanbanTask[]>([]);

  // Keep local items in sync with column.items
  $effect(() => {
    items = column.items;
  });

  const flipDurationMs = 200;

  function handleDndConsider(e: CustomEvent<{ items: KanbanTask[] }>) {
    items = e.detail.items;
  }

  function handleDndFinalize(e: CustomEvent<{ items: KanbanTask[] }>) {
    items = e.detail.items;
    boardStore.updateColumnItems(column.id, e.detail.items);
  }

  function handleDeleteColumn() {
    if (confirm(`Remove column "${column.title}"? Tasks inside will be moved to Todo.`)) {
      boardStore.removeCustomColumn(column.id);
    }
  }
</script>

<div class="kanban-column" data-column-id={column.id}>
  <div class="column-header">
    <div class="header-left">
      <span
        class="status-indicator"
        style="background-color: {column.color ?? (column.id === 'done' ? '#10b981' : column.id === 'in_progress' ? '#f59e0b' : '#64748b')};"
      ></span>
      <h3 class="column-title">{column.title}</h3>
      <span class="column-badge">{items.length}</span>
    </div>

    <div class="header-actions">
      {#if column.isCustom}
        <button
          class="delete-col-btn"
          onclick={handleDeleteColumn}
          title="Delete column"
          aria-label="Delete column"
        >
          ✕
        </button>
      {/if}
    </div>
  </div>

  <div
    class="column-cards-container"
    use:dndzone={{ items, flipDurationMs, dropTargetStyle: { outline: '2px dashed var(--accent)', outlineOffset: '-4px', borderRadius: '6px' } }}
    onconsider={handleDndConsider}
    onfinalize={handleDndFinalize}
  >
    {#each items as task (task.id)}
      <KanbanCard {task} />
    {/each}

    {#if items.length === 0}
      <div class="empty-dropzone">
        <span>Drop tasks here</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .kanban-column {
    width: 320px;
    min-width: 280px;
    flex-shrink: 0;
    background: var(--base-surface);
    border: 1px solid var(--base-border);
    border-radius: var(--radius-md);
    display: flex;
    flex-direction: column;
    max-height: 100%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-3);
    border-bottom: 1px solid var(--base-border);
    user-select: none;
    background: #121319;
    border-top-left-radius: var(--radius-md);
    border-top-right-radius: var(--radius-md);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .column-title {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--text-primary);
    margin: 0;
  }

  .column-badge {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-secondary);
    background: var(--base-overlay);
    padding: 1px 6px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--base-border);
  }

  .delete-col-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 11px;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: var(--radius-sm);
    transition: all var(--duration-sm) var(--ease-out);
  }

  .delete-col-btn:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.15);
  }

  .column-cards-container {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-2);
    min-height: 120px;
  }

  .empty-dropzone {
    height: 90px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-size: var(--text-xs);
    opacity: 0.6;
    user-select: none;
  }
</style>
