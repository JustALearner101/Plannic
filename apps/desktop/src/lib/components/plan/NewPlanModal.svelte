<script lang="ts">
  import Modal from '../ui/Modal.svelte';
  import Button from '../ui/Button.svelte';
  import type { PlanMode } from '@plannic/core';
  import { plansStore } from '$lib/stores/plans.svelte.js';
  import { projectStore } from '$lib/stores/project.svelte.js';
  import { uiStore } from '$lib/stores/ui.svelte.js';

  let planName = $state('');
  let selectedMode = $state<PlanMode>('deep');
  let creating = $state(false);
  let errorMsg = $state('');

  function handleClose() {
    uiStore.newPlanModalOpen = false;
    planName = '';
    errorMsg = '';
  }

  async function handleCreate() {
    if (!planName.trim()) {
      errorMsg = 'Please enter a plan name.';
      return;
    }
    if (!projectStore.currentPath) {
      errorMsg = 'Please open a project folder first.';
      return;
    }

    creating = true;
    errorMsg = '';
    try {
      await plansStore.createPlan(projectStore.currentPath, planName.trim(), selectedMode);
      handleClose();
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
    } finally {
      creating = false;
    }
  }
</script>

<Modal
  open={uiStore.newPlanModalOpen}
  title="New Plan"
  onclose={handleClose}
  width="440px"
>
  <form onsubmit={(e) => { e.preventDefault(); handleCreate(); }}>
    <div class="field-group">
      <label for="plan-name" class="field-label">Name</label>
      <input
        id="plan-name"
        type="text"
        bind:value={planName}
        placeholder="auth-system"
        class="text-input"
        required
      />
    </div>

    <div class="field-group">
      <span class="field-label">Mode</span>
      <div class="mode-options">
        <button
          type="button"
          class="mode-card"
          class:selected={selectedMode === 'quick'}
          onclick={() => (selectedMode = 'quick')}
        >
          <span class="mode-title">Quick</span>
          <span class="mode-desc">1 file (.docs/plan-&lt;slug&gt;.md)</span>
        </button>

        <button
          type="button"
          class="mode-card"
          class:selected={selectedMode === 'deep'}
          onclick={() => (selectedMode = 'deep')}
        >
          <span class="mode-title">Deep</span>
          <span class="mode-desc">Document tree (plan, scope, features, etc.)</span>
        </button>
      </div>
    </div>

    {#if errorMsg}
      <div class="error-banner">{errorMsg}</div>
    {/if}

    <div class="modal-footer">
      <Button variant="ghost" onclick={handleClose} disabled={creating}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" disabled={creating}>
        {creating ? 'Creating...' : 'Create Plan'}
      </Button>
    </div>
  </form>
</Modal>

<style>
  .field-group {
    margin-bottom: var(--space-4);
  }

  .field-label {
    display: block;
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: var(--space-2);
  }

  .text-input {
    width: 100%;
    background: var(--base-overlay);
    border: 1px solid var(--base-border);
    border-radius: var(--radius-md);
    padding: 8px 12px;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-primary);
    outline: none;
    transition: border-color var(--duration-sm) var(--ease-out);
  }

  .text-input:focus {
    border-color: var(--accent);
  }

  .mode-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }

  .mode-card {
    background: var(--base-overlay);
    border: 1px solid var(--base-border);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    text-align: left;
    cursor: pointer;
    transition: border-color var(--duration-sm) var(--ease-out),
                background-color var(--duration-sm) var(--ease-out);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .mode-card:hover {
    border-color: var(--base-border-hi);
  }

  .mode-card.selected {
    border-color: var(--accent);
    background: var(--accent-dim);
  }

  .mode-title {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-primary);
  }

  .mode-card.selected .mode-title {
    color: #ffffff;
  }

  .mode-desc {
    font-size: 11px;
    color: var(--text-secondary);
    line-height: 1.3;
  }

  .mode-card.selected .mode-desc {
    color: var(--accent-text);
  }

  .error-banner {
    color: var(--danger);
    font-size: var(--text-xs);
    margin-bottom: var(--space-3);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    margin-top: var(--space-5);
  }
</style>
