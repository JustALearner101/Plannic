<script lang="ts">
  import { boardStore } from '$lib/stores/board.svelte.js';
  import { plansStore } from '$lib/stores/plans.svelte.js';

  let phaseTabs = $derived.by<
    { slug: string; name: string; isCurrent: boolean; isDone: boolean; taskCount: number }[]
  >(() => {
    if (!plansStore.activePlan || !plansStore.activePlan.documents) return [];

    const activePhaseNum: number =
      (plansStore.activePlan.root.frontmatter as any).activePhase ?? 1;

    return plansStore.activePlan.documents
      .filter((d) => d.type === 'phase' || d.path.includes('phase-'))
      .map((d) => {
        const match = d.path.match(/phase-(\d+)/i);
        const phaseNum = match ? parseInt(match[1], 10) : 1;

        // Count tasks
        const lines = d.body.split('\n');
        let total = 0;
        let done = 0;
        for (const line of lines) {
          if (/^\s*-\s*\[x\]/i.test(line)) {
            total++;
            done++;
          } else if (/^\s*-\s*\[[ /a-zA-Z0-9_-]*\]/.test(line)) {
            total++;
          }
        }

        return {
          slug: d.slug || `phase-${phaseNum}`,
          name: `Phase ${phaseNum}`,
          isCurrent: phaseNum === activePhaseNum,
          isDone: total > 0 && done === total,
          taskCount: total,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  });

  function selectPhase(phaseSlug: string) {
    boardStore.filterPhase = phaseSlug;
    boardStore.loadTasksFromPlan(plansStore.activePlan);
  }
</script>

{#if !boardStore.isGlobalMode && phaseTabs.length > 0}
  <div class="phase-tab-bar" role="tablist">
    <button
      class="phase-tab"
      class:active={boardStore.filterPhase === 'all'}
      onclick={() => selectPhase('all')}
      role="tab"
      aria-selected={boardStore.filterPhase === 'all'}
    >
      All Phases
    </button>

    {#each phaseTabs as tab}
      <button
        class="phase-tab"
        class:active={boardStore.filterPhase === tab.slug}
        class:is-current={tab.isCurrent}
        class:is-done={tab.isDone}
        onclick={() => selectPhase(tab.slug)}
        role="tab"
        aria-selected={boardStore.filterPhase === tab.slug}
      >
        {#if tab.isDone}
          <span class="tab-indicator done">✓</span>
        {:else if tab.isCurrent}
          <span class="tab-indicator active">⚡</span>
        {/if}
        <span class="tab-title">{tab.name}</span>
        {#if tab.taskCount > 0}
          <span class="tab-count">{tab.taskCount}</span>
        {/if}
      </button>
    {/each}
  </div>
{/if}

<style>
  .phase-tab-bar {
    display: flex;
    align-items: center;
    gap: 4px;
    background: #0d0e14;
    padding: 3px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--base-border);
    overflow-x: auto;
    max-width: 550px;
  }

  .phase-tab {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: transparent;
    border: none;
    padding: 3px 10px;
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--text-secondary);
    border-radius: 4px;
    cursor: pointer;
    white-space: nowrap;
    transition: all var(--duration-sm) var(--ease-out);
  }

  .phase-tab:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.05);
  }

  .phase-tab.active {
    background: var(--base-overlay);
    color: var(--text-primary);
    font-weight: 600;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  }

  .phase-tab.is-current {
    border: 1px solid rgba(56, 189, 248, 0.35);
  }

  .tab-indicator {
    font-size: 10px;
  }

  .tab-indicator.done {
    color: #10b981;
  }

  .tab-indicator.active {
    color: #38bdf8;
  }

  .tab-count {
    font-size: 9px;
    background: rgba(255, 255, 255, 0.08);
    padding: 1px 4px;
    border-radius: 8px;
    color: var(--text-secondary);
  }
</style>
