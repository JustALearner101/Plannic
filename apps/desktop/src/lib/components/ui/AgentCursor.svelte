<script lang="ts">
  import { agentActivityStore } from '$lib/stores/agentActivity.svelte.js';

  let cursor = $derived(agentActivityStore.cursorPosition);
  let ripple = $derived(agentActivityStore.ripple);
</script>

{#if cursor.visible}
  <div
    class="agent-ghost-cursor"
    style="left: {cursor.x}px; top: {cursor.y}px;"
    class:dragging={cursor.isDragging}
  >
    <!-- Figma-style Multiplayer SVG Pointer -->
    <svg
      class="cursor-icon"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
        fill="#0284c7"
        stroke="#38bdf8"
        stroke-width="1.5"
      />
    </svg>

    <!-- Agent Badge -->
    <div class="agent-badge">
      <span class="agent-badge-icon">🤖</span>
      <span class="agent-badge-name">{cursor.agent}</span>
      {#if cursor.action}
        <span class="agent-badge-action">{cursor.action.replace(/_/g, ' ')}</span>
      {/if}
    </div>
  </div>
{/if}

{#if ripple.active}
  <div
    class="drop-ripple"
    style="left: {ripple.x}px; top: {ripple.y}px;"
  ></div>
{/if}

<style>
  .agent-ghost-cursor {
    position: fixed;
    z-index: 9999;
    pointer-events: none;
    transform: translate(-2px, -2px);
    transition: left 0.38s cubic-bezier(0.2, 0.9, 0.4, 1.1),
                top 0.38s cubic-bezier(0.2, 0.9, 0.4, 1.1);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .cursor-icon {
    filter: drop-shadow(0 2px 8px rgba(56, 189, 248, 0.6));
    transition: transform 0.2s ease-out;
  }

  .agent-ghost-cursor.dragging .cursor-icon {
    transform: rotate(-12deg) scale(1.15);
  }

  .agent-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #0284c7;
    color: #ffffff;
    font-size: 11px;
    font-weight: 600;
    font-family: var(--font-sans, system-ui, sans-serif);
    padding: 2px 7px;
    border-radius: 9999px;
    box-shadow: 0 4px 14px rgba(2, 132, 199, 0.45);
    margin-left: 12px;
    margin-top: -4px;
    white-space: nowrap;
    border: 1px solid rgba(255, 255, 255, 0.2);
    animation: fadeIn 0.2s ease-out;
  }

  .agent-badge-icon {
    font-size: 10px;
  }

  .agent-badge-name {
    letter-spacing: 0.2px;
  }

  .agent-badge-action {
    opacity: 0.85;
    font-weight: 400;
    font-size: 10px;
    margin-left: 2px;
    padding-left: 4px;
    border-left: 1px solid rgba(255, 255, 255, 0.3);
  }

  .drop-ripple {
    position: fixed;
    z-index: 9997;
    pointer-events: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    border: 2px solid #38bdf8;
    background: rgba(56, 189, 248, 0.25);
    animation: rippleExpand 0.6s cubic-bezier(0, 0.7, 0.1, 1) forwards;
  }

  @keyframes rippleExpand {
    0% {
      width: 10px;
      height: 10px;
      opacity: 1;
    }
    100% {
      width: 120px;
      height: 120px;
      opacity: 0;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.85);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
