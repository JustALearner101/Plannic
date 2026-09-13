<script lang="ts">
  import type { PlanStatus } from '@plannic/core';

  let { status }: { status: PlanStatus | string } = $props();
</script>

<span class="status-badge status-{status}">
  {status}
</span>

<style>
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    line-height: 1.4;
    text-transform: lowercase;
    border: none;
  }

  .status-draft {
    background-color: #1E2030;
    color: #5C5F78;
  }

  .status-review {
    background-color: #2A2200;
    color: #D4A017;
  }

  .status-final {
    background-color: #0D2A1A;
    color: #3DAA6A;
  }
</style>
