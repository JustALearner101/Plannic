<script lang="ts">
  import type { PlanSummary, DocType } from '@plannic/core';
  import StatusBadge from './StatusBadge.svelte';

  let {
    plan,
    isActive = false,
    activeDocType = 'plan',
    onselect,
    onselectdoc,
    ondelete,
  }: {
    plan: PlanSummary;
    isActive?: boolean;
    activeDocType?: DocType;
    onselect: () => void;
    onselectdoc?: (type: DocType) => void;
    ondelete?: () => void;
  } = $props();

  let expanded = $state(false);

  function handleRootClick() {
    onselect();
    expanded = !expanded;
  }

  const subDocs: { type: DocType; label: string; icon: string }[] = [
    { type: 'plan', label: 'plan', icon: '◈' },
    { type: 'scope', label: 'scope', icon: '◉' },
    { type: 'feature', label: 'feature', icon: '⊞' },
    { type: 'phase', label: 'phase-1', icon: '◷' },
    { type: 'limitation', label: 'limitation', icon: '⚠' },
  ];
</script>

<div class="plan-item-group">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="plan-root-item"
    class:active={isActive}
    onclick={handleRootClick}
  >
    <div class="root-left">
      <span class="chevron">{expanded ? '▾' : '►'}</span>
      <span class="plan-name" title={plan.name}>{plan.name}</span>
    </div>
    <div class="root-right">
      <StatusBadge status={plan.status} />
      {#if ondelete}
        <button
          class="delete-plan-btn"
          onclick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete plan "${plan.name}" and all its documents?`)) {
              ondelete?.();
            }
          }}
          title="Delete plan"
          aria-label="Delete plan"
        >
          ✕
        </button>
      {/if}
    </div>
  </div>

  {#if expanded && plan.mode === 'deep'}
    <div class="sub-items-tree">
      {#each subDocs as doc}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="sub-doc-item"
          class:sub-active={isActive && activeDocType === doc.type}
          onclick={(e) => {
            e.stopPropagation();
            onselectdoc?.(doc.type);
          }}
        >
          <span class="sub-icon">{doc.icon}</span>
          <span class="sub-label">{doc.label}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .plan-item-group {
    margin-bottom: 2px;
  }

  .plan-root-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    cursor: pointer;
    border-radius: var(--radius-sm);
    border-left: 2px solid transparent;
    transition: background-color var(--duration-sm) var(--ease-out),
                border-color var(--duration-sm) var(--ease-out);
    user-select: none;
  }

  .plan-root-item:hover {
    background: var(--base-overlay);
  }

  .plan-root-item.active {
    border-left: 2px solid var(--accent);
    background: var(--base-overlay);
  }

  .root-left {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }

  .chevron {
    font-size: 10px;
    color: var(--text-secondary);
    width: 12px;
    flex-shrink: 0;
  }

  .plan-name {
    font-size: var(--text-sm);
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .root-right {
    margin-left: var(--space-2);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .delete-plan-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 11px;
    line-height: 1;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: var(--radius-sm);
    opacity: 0;
    transition: opacity var(--duration-sm) var(--ease-out),
                color var(--duration-sm) var(--ease-out),
                background var(--duration-sm) var(--ease-out);
  }

  .plan-root-item:hover .delete-plan-btn {
    opacity: 0.6;
  }

  .delete-plan-btn:hover {
    opacity: 1 !important;
    color: #ef4444;
    background: rgba(239, 68, 68, 0.15);
  }

  .sub-items-tree {
    display: flex;
    flex-direction: column;
  }

  .sub-doc-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 5px 12px 5px 28px;
    cursor: pointer;
    font-size: var(--text-sm);
    color: var(--text-secondary);
    transition: color var(--duration-sm) var(--ease-out),
                background-color var(--duration-sm) var(--ease-out);
    user-select: none;
  }

  .sub-doc-item:hover {
    color: var(--text-primary);
    background: rgba(26, 27, 35, 0.5);
  }

  .sub-doc-item.sub-active {
    color: var(--accent-text);
    background: rgba(42, 48, 128, 0.2);
  }

  .sub-icon {
    font-size: 12px;
    color: var(--text-secondary);
    width: 14px;
  }

  .sub-doc-item.sub-active .sub-icon {
    color: var(--accent-text);
  }

  .sub-label {
    font-family: var(--font-mono);
    font-size: 12px;
  }
</style>
