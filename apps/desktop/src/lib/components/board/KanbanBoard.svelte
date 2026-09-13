<script lang="ts">
  import { boardStore } from '../../stores/board.svelte.js';
  import { plansStore } from '../../stores/plans.svelte.js';
  import KanbanColumn from './KanbanColumn.svelte';
  import BoardToolbar from './BoardToolbar.svelte';
  import AddColumnModal from './AddColumnModal.svelte';

  // Load tasks whenever active plan or filter changes
  $effect(() => {
    boardStore.loadTasksFromPlan(plansStore.activePlan);
  });

  let columns = $derived(boardStore.getColumns());
</script>

<div class="kanban-board-wrapper">
  <BoardToolbar />

  <div class="kanban-columns-container">
    {#if !plansStore.activePlan && !boardStore.isGlobalMode}
      <div class="board-empty-state">
        <div class="empty-icon">⊞</div>
        <p class="empty-text">No plan selected</p>
        <span class="empty-hint">Select a plan with phase checklist items to start tracking</span>
      </div>
    {:else if columns.every((c) => c.items.length === 0)}
      <div class="board-empty-state">
        <div class="empty-icon">⊞</div>
        <p class="empty-text">No checklist tasks found</p>
        <span class="empty-hint">
          Add tasks in your <code class="code-inline">phase-*.md</code> documents with format:
          <code class="code-inline">- [ ] Task name</code>
        </span>
      </div>
    {:else}
      {#each columns as column (column.id)}
        <KanbanColumn {column} />
      {/each}
    {/if}
  </div>

  <AddColumnModal />
</div>

<style>
  .kanban-board-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--base-void);
    overflow: hidden;
  }

  .kanban-columns-container {
    flex: 1;
    display: flex;
    gap: var(--space-4);
    padding: var(--space-4);
    overflow-x: auto;
    overflow-y: hidden;
    align-items: flex-start;
  }

  .board-empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 300px;
    color: var(--text-secondary);
    user-select: none;
  }

  .empty-icon {
    font-size: 36px;
    color: var(--accent);
    margin-bottom: var(--space-3);
    opacity: 0.5;
  }

  .empty-text {
    font-size: var(--text-md);
    font-weight: 500;
    color: var(--text-primary);
    margin: 0 0 6px 0;
  }

  .empty-hint {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    max-width: 400px;
    text-align: center;
    line-height: 1.4;
  }

  .code-inline {
    font-family: var(--font-mono);
    background: var(--base-surface);
    border: 1px solid var(--base-border);
    padding: 1px 4px;
    border-radius: var(--radius-sm);
    color: var(--accent-text);
  }
</style>
