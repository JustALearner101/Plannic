<script lang="ts">
  import type { KanbanTask } from '../../types/board.js';
  import { boardStore } from '$lib/stores/board.svelte.js';

  let { task, ontoggle }: { task: KanbanTask; ontoggle?: () => void } = $props();

  function handleCheckboxClick(e: MouseEvent) {
    e.stopPropagation();
    if (ontoggle) {
      ontoggle();
    } else {
      // Default quick toggle: todo -> in_progress -> done -> todo
      if (task.status === 'todo') {
        boardStore.updateTaskStatus(task, 'in_progress');
      } else if (task.status === 'in_progress') {
        boardStore.updateTaskStatus(task, 'done');
      } else {
        boardStore.updateTaskStatus(task, 'todo');
      }
    }
  }
</script>

<div
  class="kanban-card"
  class:is-done={task.status === 'done'}
  class:is-progress={task.status === 'in_progress'}
  data-task-id={task.id}
  data-task-title={task.title}
>
  <div class="card-header">
    <button
      class="card-checkbox"
      class:checked={task.status === 'done'}
      class:progress={task.status === 'in_progress'}
      onclick={handleCheckboxClick}
      title="Toggle status"
      aria-label="Toggle status"
    >
      {#if task.status === 'done'}
        ✓
      {:else if task.status === 'in_progress'}
        ◷
      {:else}
        ○
      {/if}
    </button>
    <div class="card-title" class:strike={task.status === 'done'}>
      {task.title}
    </div>
  </div>

  <div class="card-footer">
    <div class="footer-tags">
      {#if boardStore.isGlobalMode}
        <span class="plan-tag" title={task.planSlug}>{task.planSlug}</span>
      {/if}
      <span class="phase-tag" title={task.phaseTitle}>{task.phaseTitle}</span>
    </div>

    {#if task.status !== 'todo' && task.status !== 'in_progress' && task.status !== 'done'}
      <span class="custom-status-tag">{task.status}</span>
    {/if}
  </div>
</div>

<style>
  .kanban-card {
    background: #181a24;
    border: 1px solid var(--base-border);
    border-radius: var(--radius-sm);
    padding: 10px 12px;
    margin-bottom: 8px;
    cursor: grab;
    user-select: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    transition: transform var(--duration-sm) var(--ease-out),
                box-shadow var(--duration-sm) var(--ease-out),
                border-color var(--duration-sm) var(--ease-out),
                background-color var(--duration-sm) var(--ease-out);
  }

  .kanban-card:hover {
    border-color: var(--base-border-hi);
    background: #1c1e2b;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  }

  .kanban-card:active {
    cursor: grabbing;
    transform: scale(1.02);
    border-color: var(--accent);
    box-shadow: 0 8px 20px rgba(91, 107, 248, 0.3);
  }

  .kanban-card.is-done {
    opacity: 0.75;
    background: #14151d;
  }

  .kanban-card.is-progress {
    border-left: 3px solid #f59e0b;
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;
  }

  .card-checkbox {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1;
    cursor: pointer;
    padding: 2px;
    margin-top: 1px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--duration-sm) var(--ease-out);
  }

  .card-checkbox:hover {
    color: var(--text-primary);
    background: var(--base-overlay);
  }

  .card-checkbox.checked {
    color: #10b981;
    font-weight: bold;
  }

  .card-checkbox.progress {
    color: #f59e0b;
  }

  .card-title {
    flex: 1;
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text-primary);
    line-height: 1.35;
    word-break: break-word;
  }

  .card-title.strike {
    text-decoration: line-through;
    color: var(--text-secondary);
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
  }

  .footer-tags {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow: hidden;
  }

  .plan-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    background: rgba(91, 107, 248, 0.15);
    color: var(--accent-text);
    padding: 1px 5px;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(91, 107, 248, 0.25);
    max-width: 80px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .phase-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-secondary);
    background: var(--base-surface);
    padding: 1px 5px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--base-border);
    max-width: 110px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .custom-status-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
    padding: 1px 6px;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(245, 158, 11, 0.3);
  }
</style>
