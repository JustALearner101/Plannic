<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    variant = 'neutral',
    children,
    class: className = '',
  }: {
    variant?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
    children?: Snippet;
    class?: string;
  } = $props();
</script>

<span class="badge badge-{variant} {className}">
  {#if children}
    {@render children()}
  {/if}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    line-height: 1.2;
    white-space: nowrap;
  }

  .badge-neutral {
    background: var(--base-overlay);
    color: var(--text-secondary);
  }

  .badge-accent {
    background: var(--accent-dim);
    color: var(--accent-text);
  }

  .badge-success {
    background: #0D2A1A;
    color: var(--status-final);
  }

  .badge-warning {
    background: #2A2200;
    color: var(--status-review);
  }

  .badge-danger {
    background: var(--danger-dim);
    color: var(--danger);
  }
</style>
