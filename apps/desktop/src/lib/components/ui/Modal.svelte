<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    open = false,
    title = '',
    onclose,
    children,
    width = '440px',
  }: {
    open: boolean;
    title?: string;
    onclose: () => void;
    children?: Snippet;
    width?: string;
  } = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onclose();
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onclose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={handleBackdropClick}>
    <div class="modal" style="width: {width};">
      {#if title}
        <div class="modal-header">
          <h2 class="title">{title}</h2>
          <button class="close-btn" onclick={onclose} aria-label="Close modal">✕</button>
        </div>
      {/if}
      <div class="modal-body">
        {#if children}
          {@render children()}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: var(--base-surface);
    border: 1px solid var(--base-border-hi);
    border-radius: var(--radius-lg);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    animation: modal-enter var(--duration-md) var(--ease-out);
  }

  @keyframes modal-enter {
    from {
      opacity: 0;
      transform: scale(0.97);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--base-border);
  }

  .title {
    margin: 0;
    font-size: var(--text-md);
    font-weight: 600;
    color: var(--text-primary);
  }

  .close-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 14px;
    cursor: pointer;
    padding: 4px;
    border-radius: var(--radius-sm);
  }

  .close-btn:hover {
    color: var(--text-primary);
    background: var(--base-overlay);
  }

  .modal-body {
    padding: var(--space-5);
  }
</style>
