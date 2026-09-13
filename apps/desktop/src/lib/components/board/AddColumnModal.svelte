<script lang="ts">
  import Modal from '../ui/Modal.svelte';
  import Button from '../ui/Button.svelte';
  import { boardStore } from '../../stores/board.svelte.js';

  let title = $state('');
  let customId = $state('');
  let selectedColor = $state('#8b5cf6');

  const colorPresets = ['#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#10b981', '#64748b'];

  function handleCreate() {
    if (!title.trim()) return;
    const colId = customId.trim() || title.trim().toLowerCase().replace(/\s+/g, '_');
    boardStore.addCustomColumn(title.trim(), colId, selectedColor);
    title = '';
    customId = '';
    boardStore.addColumnModalOpen = false;
  }
</script>

<Modal
  open={boardStore.addColumnModalOpen}
  title="Add Custom Column"
  onclose={() => (boardStore.addColumnModalOpen = false)}
>
  <form
    onsubmit={(e) => {
      e.preventDefault();
      handleCreate();
    }}
  >
    <div class="form-group">
      <label for="col-title" class="form-label">Column Title</label>
      <input
        id="col-title"
        type="text"
        class="form-input"
        placeholder="e.g. Review, QA, Blocked"
        bind:value={title}
        required
      />
    </div>

    <div class="form-group">
      <label for="col-id" class="form-label">Status ID (Optional)</label>
      <input
        id="col-id"
        type="text"
        class="form-input"
        placeholder="e.g. review, qa, blocked (defaults to title slug)"
        bind:value={customId}
      />
      <span class="field-hint">Used as markdown marker: - [status_id] Task</span>
    </div>

    <div class="form-group">
      <span class="form-label">Column Accent Color</span>
      <div class="color-palette">
        {#each colorPresets as color}
          <button
            type="button"
            class="color-dot"
            class:active={selectedColor === color}
            style="background-color: {color};"
            onclick={() => (selectedColor = color)}
            aria-label="Color {color}"
          ></button>
        {/each}
      </div>
    </div>

    <div class="modal-actions">
      <Button
        variant="ghost"
        type="button"
        onclick={() => (boardStore.addColumnModalOpen = false)}
      >
        Cancel
      </Button>
      <Button variant="primary" type="submit" disabled={!title.trim()}>
        Create Column
      </Button>
    </div>
  </form>
</Modal>

<style>
  .form-group {
    margin-bottom: var(--space-4);
  }

  .form-label {
    display: block;
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: var(--space-1);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .form-input {
    width: 100%;
    background: var(--base-surface);
    border: 1px solid var(--base-border);
    border-radius: var(--radius-sm);
    padding: var(--space-2) var(--space-3);
    color: var(--text-primary);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    outline: none;
    box-sizing: border-box;
    transition: border-color var(--duration-sm) var(--ease-out);
  }

  .form-input:focus {
    border-color: var(--accent);
  }

  .field-hint {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-secondary);
    opacity: 0.8;
    margin-top: 4px;
    display: block;
  }

  .color-palette {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  .color-dot {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform var(--duration-sm) var(--ease-out),
                border-color var(--duration-sm) var(--ease-out);
  }

  .color-dot:hover {
    transform: scale(1.15);
  }

  .color-dot.active {
    border-color: #ffffff;
    transform: scale(1.15);
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    margin-top: var(--space-6);
  }
</style>
