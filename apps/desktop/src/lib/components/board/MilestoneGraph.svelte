<script lang="ts">
  import { plansStore } from '$lib/stores/plans.svelte.js';
  import { boardStore } from '$lib/stores/board.svelte.js';

  interface MilestoneNode {
    num: number;
    title: string;
    slug: string;
    total: number;
    done: number;
    percentage: number;
    isCurrent: boolean;
    isPassed: boolean;
  }

  let milestones = $derived.by<MilestoneNode[]>(() => {
    if (!plansStore.activePlan || !plansStore.activePlan.documents) return [];

    const activePhaseNum: number =
      (plansStore.activePlan.root.frontmatter as any).activePhase ?? 1;

    return plansStore.activePlan.documents
      .filter((d) => d.type === 'phase' || d.path.includes('phase-'))
      .map((d) => {
        const match = d.path.match(/phase-(\d+)/i);
        const phaseNum = match ? parseInt(match[1], 10) : 1;

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

        const percentage = total === 0 ? 0 : Math.round((done / total) * 100);

        return {
          num: phaseNum,
          title: d.frontmatter.name || `Phase ${phaseNum}`,
          slug: d.slug || `phase-${phaseNum}`,
          total,
          done,
          percentage,
          isCurrent: phaseNum === activePhaseNum,
          isPassed: total > 0 && done === total,
        };
      })
      .sort((a, b) => a.num - b.num);
  });

  function handleSelectPhase(slug: string) {
    boardStore.filterPhase = slug;
    boardStore.loadTasksFromPlan(plansStore.activePlan);
  }
</script>

{#if milestones.length > 1}
  <div class="milestone-pipeline-container">
    <div class="milestone-track">
      {#each milestones as m, i}
        <button
          class="milestone-node"
          class:current={m.isCurrent}
          class:passed={m.isPassed}
          onclick={() => handleSelectPhase(m.slug)}
          title="{m.title}: {m.percentage}% ({m.done}/{m.total} tasks completed)"
        >
          <div class="node-circle">
            {#if m.isPassed}
              ✓
            {:else}
              {m.num}
            {/if}
          </div>
          <div class="node-info">
            <span class="node-label">Phase {m.num}</span>
            <span class="node-progress">{m.percentage}%</span>
          </div>
        </button>

        {#if i < milestones.length - 1}
          <div class="milestone-connector" class:passed={m.isPassed}>
            <div class="connector-line"></div>
          </div>
        {/if}
      {/each}
    </div>
  </div>
{/if}

<style>
  .milestone-pipeline-container {
    padding: 8px 16px;
    background: #0b0c10;
    border-bottom: 1px solid var(--base-border);
    overflow-x: auto;
  }

  .milestone-track {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .milestone-node {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    transition: all var(--duration-sm) var(--ease-out);
  }

  .milestone-node:hover {
    background: var(--base-surface);
  }

  .node-circle {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--base-overlay);
    border: 2px solid var(--base-border);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    font-family: var(--font-mono);
  }

  .milestone-node.passed .node-circle {
    background: rgba(16, 185, 129, 0.2);
    border-color: #10b981;
    color: #10b981;
  }

  .milestone-node.current .node-circle {
    background: rgba(56, 189, 248, 0.25);
    border-color: #38bdf8;
    color: #38bdf8;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
  }

  .node-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .node-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .node-progress {
    font-size: 9px;
    font-family: var(--font-mono);
    color: var(--text-secondary);
  }

  .milestone-connector {
    width: 32px;
    height: 2px;
    background: var(--base-border);
    margin: 0 4px;
    position: relative;
  }

  .milestone-connector.passed {
    background: #10b981;
  }
</style>
