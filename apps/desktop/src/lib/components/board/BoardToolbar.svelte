<script lang="ts">
  import { boardStore } from '../../stores/board.svelte.js';
  import { plansStore } from '../../stores/plans.svelte.js';

  let phaseOptions = $derived.by<{ slug: string; name: string }[]>(() => {
    if (!plansStore.activePlan || !plansStore.activePlan.documents) return [];
    return plansStore.activePlan.documents
      .filter((d) => d.type === 'phase')
      .map((d) => ({
        slug: d.slug,
        name: d.frontmatter.name || d.type.toUpperCase(),
      }));
  });

  function handleScopeToggle(global: boolean) {
    boardStore.isGlobalMode = global;
    boardStore.loadTasksFromPlan(plansStore.activePlan);
  }

  function handlePhaseChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    boardStore.filterPhase = target.value;
    boardStore.loadTasksFromPlan(plansStore.activePlan);
  }
</script>

<div class="board-toolbar">
  <div class="toolbar-left">
    <div class="scope-toggle">
      <button
        class="toggle-btn"
        class:active={!boardStore.isGlobalMode}
        onclick={() => handleScopeToggle(false)}
      >
        Plan Tasks
      </button>
      <button
        class="toggle-btn"
        class:active={boardStore.isGlobalMode}
        onclick={() => handleScopeToggle(true)}
      >
        Global Project
      </button>
    </div>

    {#if !boardStore.isGlobalMode && phaseOptions.length > 0}
      <div class="phase-selector">
        <label for="phase-select" class="selector-label">Phase:</label>
        <select
          id="phase-select"
          class="phase-dropdown"
          value={boardStore.filterPhase}
          onchange={handlePhaseChange}
        >
          <option value="all">All Phases</option>
          {#each phaseOptions as option}
            <option value={option.slug}>{option.name}</option>
          {/each}
        </select>
      </div>
    {/if}
  </div>

  <div class="toolbar-right">
    <span class="tasks-counter">
      {boardStore.tasks.length} task{boardStore.tasks.length === 1 ? '' : 's'}
    </span>

    <button
      class="add-col-btn"
      onclick={() => (boardStore.addColumnModalOpen = true)}
    >
      + Add Column
    </button>
  </div>
</div>

<style>
  .board-toolbar {
    height: 44px;
    background: #111218;
    border-bottom: 1px solid var(--base-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-4);
    user-select: none;
    flex-shrink: 0;
  }

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .scope-toggle {
    display: flex;
    background: var(--base-void);
    border: 1px solid var(--base-border);
    border-radius: var(--radius-sm);
    padding: 2px;
    gap: 2px;
  }

  .toggle-btn {
    background: transparent;
    border: none;
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 500;
    color: var(--text-secondary);
    padding: 3px 8px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--duration-sm) var(--ease-out);
  }

  .toggle-btn:hover {
    color: var(--text-primary);
  }

  .toggle-btn.active {
    background: var(--base-overlay);
    color: var(--accent-text);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .phase-selector {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .selector-label {
    font-size: 11px;
    color: var(--text-secondary);
    font-family: var(--font-mono);
  }

  .phase-dropdown {
    background: var(--base-surface);
    border: 1px solid var(--base-border);
    color: var(--text-primary);
    font-family: var(--font-ui);
    font-size: 11px;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    outline: none;
    cursor: pointer;
  }

  .phase-dropdown:focus {
    border-color: var(--accent);
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .tasks-counter {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-secondary);
  }

  .add-col-btn {
    background: transparent;
    border: 1px solid var(--base-border);
    color: var(--text-primary);
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--duration-sm) var(--ease-out);
  }

  .add-col-btn:hover {
    background: var(--base-overlay);
    border-color: var(--accent);
    color: var(--accent-text);
  }
</style>
