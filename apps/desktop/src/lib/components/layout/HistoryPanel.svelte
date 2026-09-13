<script lang="ts">
  import { plansStore } from '../../stores/plans.svelte.js';
  import { uiStore } from '../../stores/ui.svelte.js';

  function formatTime(iso: string): string {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }
</script>

{#if !uiStore.historyCollapsed}
  <aside class="history-panel">
    <div class="panel-header">
      <span class="panel-title">History</span>
      <button class="hide-btn" onclick={() => uiStore.toggleHistory()}>
        ›› hide
      </button>
    </div>

    <div class="timeline-container">
      {#if plansStore.history.length === 0}
        <div class="empty-history">
          No history recorded for this plan.
        </div>
      {:else}
        <div class="timeline">
          {#each plansStore.history as entry, index}
            <div class="timeline-item">
              <div class="timeline-marker">
                <span class="dot" class:dot-latest={index === 0}>
                  {index === 0 ? '●' : '○'}
                </span>
                {#if index < plansStore.history.length - 1}
                  <div class="line"></div>
                {/if}
              </div>

              <div class="timeline-content">
                <div class="time-header">
                  <span class="timestamp">{formatTime(entry.timestamp)}</span>
                </div>
                <div class="file-row">
                  <span class="file-name">{entry.document}</span>
                  <span class="version-tag">v{entry.version}</span>
                </div>
                <div class="source-badge">
                  via {entry.changedBy}
                </div>
                {#if entry.summary}
                  <div class="entry-summary">{entry.summary}</div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </aside>
{:else}
  <button
    class="collapsed-toggle"
    onclick={() => uiStore.toggleHistory()}
    title="Show History Panel"
  >
    ‹‹ History
  </button>
{/if}

<style>
  .history-panel {
    width: 280px;
    flex-shrink: 0;
    background: var(--base-surface);
    border-left: 1px solid var(--base-border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
    animation: slide-in var(--duration-md) var(--ease-out);
  }

  @keyframes slide-in {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  .collapsed-toggle {
    position: fixed;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    background: var(--base-surface);
    border: 1px solid var(--base-border);
    border-right: none;
    color: var(--text-secondary);
    padding: 8px 6px;
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
    font-family: var(--font-mono);
    font-size: 11px;
    cursor: pointer;
    z-index: 50;
  }

  .collapsed-toggle:hover {
    background: var(--base-overlay);
    color: var(--text-primary);
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--base-border);
  }

  .panel-title {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-primary);
  }

  .hide-btn {
    background: transparent;
    border: none;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-secondary);
    cursor: pointer;
    padding: 2px 4px;
    border-radius: var(--radius-sm);
  }

  .hide-btn:hover {
    color: var(--text-primary);
    background: var(--base-overlay);
  }

  .timeline-container {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-4);
  }

  .empty-history {
    text-align: center;
    color: var(--text-secondary);
    font-size: var(--text-xs);
    padding: var(--space-4) 0;
  }

  .timeline {
    display: flex;
    flex-direction: column;
  }

  .timeline-item {
    display: flex;
    gap: var(--space-3);
    position: relative;
    padding-bottom: var(--space-4);
  }

  .timeline-marker {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 14px;
    flex-shrink: 0;
  }

  .dot {
    font-size: 12px;
    line-height: 1;
    color: var(--base-border-hi);
  }

  .dot-latest {
    color: var(--accent);
  }

  .line {
    flex: 1;
    width: 1px;
    background: var(--base-border);
    margin-top: 4px;
  }

  .timeline-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .timestamp {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-secondary);
  }

  .file-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .file-name {
    font-size: var(--text-sm);
    color: var(--text-primary);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .version-tag {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--accent-text);
  }

  .source-badge {
    align-self: flex-start;
    font-family: var(--font-mono);
    font-size: 10px;
    background: var(--base-overlay);
    color: var(--text-secondary);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    margin-top: 2px;
  }

  .entry-summary {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 2px;
    line-height: 1.4;
  }
</style>
