<script lang="ts">
  import { plansStore } from '$lib/stores/plans.svelte.js';
  import { projectStore } from '$lib/stores/project.svelte.js';
  import { uiStore } from '$lib/stores/ui.svelte.js';
  import PlanItem from '../plan/PlanItem.svelte';
  import type { DocType } from '@plannic/core';

  function handleSelectPlan(slug: string) {
    if (projectStore.currentPath) {
      plansStore.selectPlan(projectStore.currentPath, slug);
    }
  }

  function handleSelectDoc(type: DocType) {
    plansStore.selectDocType(type);
  }

  async function handleDeletePlan(slug: string) {
    if (projectStore.currentPath) {
      await plansStore.deletePlan(projectStore.currentPath, slug);
    }
  }
</script>

<aside class="app-sidebar">
  <div class="sidebar-header">
    <span class="sidebar-title">Plans</span>
    <button class="new-plan-btn" onclick={() => (uiStore.newPlanModalOpen = true)}>
      + New
    </button>
  </div>

  <div class="plans-list">
    {#if plansStore.loading}
      <div class="loading-state">Loading plans...</div>
    {:else if plansStore.items.length === 0}
      <div class="empty-sidebar">
        <p class="empty-text">No plans found</p>
        <span class="empty-hint">Create one with [+ New]</span>
      </div>
    {:else}
      {#each plansStore.items as plan (plan.slug)}
        <PlanItem
          {plan}
          isActive={plansStore.selectedSlug === plan.slug}
          activeDocType={plansStore.activeDocType}
          onselect={() => handleSelectPlan(plan.slug)}
          onselectdoc={(type) => handleSelectDoc(type)}
          ondelete={() => handleDeletePlan(plan.slug)}
        />
      {/each}
    {/if}
  </div>
</aside>

<style>
  .app-sidebar {
    width: 240px;
    flex-shrink: 0;
    background: var(--base-surface);
    border-right: 1px solid var(--base-border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-3);
    border-bottom: 1px solid var(--base-border);
  }

  .sidebar-title {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-primary);
  }

  .new-plan-btn {
    background: transparent;
    border: none;
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    transition: color var(--duration-sm) var(--ease-out);
  }

  .new-plan-btn:hover {
    color: var(--accent-text);
    background: var(--base-overlay);
  }

  .plans-list {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-2) var(--space-2);
  }

  .loading-state,
  .empty-sidebar {
    padding: var(--space-4) var(--space-2);
    text-align: center;
    color: var(--text-secondary);
    font-size: var(--text-xs);
  }

  .empty-text {
    margin: 0 0 4px;
    font-weight: 500;
  }

  .empty-hint {
    font-size: 11px;
    opacity: 0.8;
  }
</style>
