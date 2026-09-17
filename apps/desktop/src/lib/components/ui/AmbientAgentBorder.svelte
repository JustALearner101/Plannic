<script lang="ts">
  import { agentActivityStore } from '$lib/stores/agentActivity.svelte.js';
</script>

{#if agentActivityStore.isAgentActive}
  <div class="ambient-agent-border" aria-hidden="true"></div>
{/if}

<style>
  .ambient-agent-border {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 9998;
    border: 2px solid rgba(56, 189, 248, 0.65);
    box-shadow: 
      inset 0 0 20px rgba(56, 189, 248, 0.35),
      0 0 28px rgba(56, 189, 248, 0.45);
    animation: ambientPulse 2s ease-in-out infinite alternate;
    transition: opacity 0.4s ease-out;
  }

  @keyframes ambientPulse {
    0% {
      border-color: rgba(56, 189, 248, 0.45);
      box-shadow: 
        inset 0 0 16px rgba(56, 189, 248, 0.25),
        0 0 20px rgba(56, 189, 248, 0.35);
    }
    100% {
      border-color: rgba(56, 189, 248, 0.85);
      box-shadow: 
        inset 0 0 28px rgba(56, 189, 248, 0.45),
        0 0 36px rgba(56, 189, 248, 0.65);
    }
  }
</style>
