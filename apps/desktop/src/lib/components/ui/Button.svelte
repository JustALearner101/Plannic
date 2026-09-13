<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    variant = 'ghost',
    size = 'md',
    disabled = false,
    onclick,
    children,
    class: className = '',
    type = 'button',
  }: {
    variant?: 'primary' | 'ghost' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
    class?: string;
    type?: 'button' | 'submit' | 'reset';
  } = $props();
</script>

<button
  {type}
  {disabled}
  {onclick}
  class="btn btn-{variant} btn-{size} {className}"
>
  {#if children}
    {@render children()}
  {/if}
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    font-family: var(--font-ui);
    font-weight: 500;
    border-radius: var(--radius-md);
    cursor: pointer;
    border: 1px solid transparent;
    transition: background-color var(--duration-sm) var(--ease-out),
                border-color var(--duration-sm) var(--ease-out),
                color var(--duration-sm) var(--ease-out);
    white-space: nowrap;
  }

  .btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* Sizes */
  .btn-sm {
    padding: 2px var(--space-2);
    font-size: var(--text-xs);
  }

  .btn-md {
    padding: 6px var(--space-3);
    font-size: var(--text-sm);
  }

  .btn-lg {
    padding: 8px var(--space-4);
    font-size: var(--text-base);
  }

  /* Variants */
  .btn-primary {
    background: var(--accent);
    color: #ffffff;
    border-color: var(--accent);
  }
  .btn-primary:hover:not(:disabled) {
    background: #4A5AE8;
    border-color: #4A5AE8;
  }

  .btn-ghost {
    background: transparent;
    color: var(--text-secondary);
  }
  .btn-ghost:hover:not(:disabled) {
    background: var(--base-overlay);
    color: var(--text-primary);
  }

  .btn-outline {
    background: transparent;
    color: var(--text-primary);
    border-color: var(--base-border);
  }
  .btn-outline:hover:not(:disabled) {
    background: var(--base-overlay);
    border-color: var(--base-border-hi);
  }

  .btn-danger {
    background: var(--danger-dim);
    color: var(--danger);
    border-color: var(--danger-dim);
  }
  .btn-danger:hover:not(:disabled) {
    background: var(--danger);
    color: #ffffff;
  }
</style>
