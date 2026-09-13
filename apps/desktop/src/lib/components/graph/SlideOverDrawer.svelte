<script lang="ts">
  import { graphStore } from '../../stores/graph.svelte.js';
  import { plansStore } from '../../stores/plans.svelte.js';
  import { projectStore } from '../../stores/project.svelte.js';
  import MarkdownPreview from '../editor/MarkdownPreview.svelte';
  import CodeMirrorEditor from '../editor/CodeMirrorEditor.svelte';
  import StatusBadge from '../plan/StatusBadge.svelte';
  import type { PlanDocument } from '@plannic/core';

  let mode = $state<'preview' | 'edit'>('preview');
  let saveStatus = $state<'saved' | 'saving' | 'error'>('saved');

  let currentDoc = $derived.by<PlanDocument | null>(() => {
    if (!graphStore.selectedNode || !plansStore.activePlan) return null;
    return (
      plansStore.activePlan.documents.find(
        (d) => d.type === graphStore.selectedNode?.docType
      ) || plansStore.activePlan.root
    );
  });

  async function handleSave(newBody: string) {
    if (!projectStore.currentPath || !plansStore.activePlan || !graphStore.selectedNode) return;
    saveStatus = 'saving';
    try {
      const ok = await plansStore.saveDocument(
        projectStore.currentPath,
        plansStore.activePlan.slug,
        graphStore.selectedNode.docType,
        newBody,
        `Updated ${graphStore.selectedNode.docType} from Graph Inspector`
      );
      if (ok) {
        saveStatus = 'saved';
        // Re-sync graph node version and metadata
        graphStore.buildFromPlan(plansStore.activePlan);
      } else {
        saveStatus = 'error';
      }
    } catch {
      saveStatus = 'error';
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && graphStore.drawerOpen) {
      e.stopPropagation();
      graphStore.closeDrawer();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if graphStore.drawerOpen && graphStore.selectedNode}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="drawer-backdrop" onclick={() => graphStore.closeDrawer()} role="presentation"></div>
  <aside class="slide-over-drawer">
    <div class="drawer-header">
      <div class="header-main">
        <div class="header-tags">
          <span class="type-tag">{graphStore.selectedNode.docType.toUpperCase()}</span>
          <span class="version-tag">v{currentDoc?.frontmatter.version ?? graphStore.selectedNode.version}</span>
          <StatusBadge status={currentDoc?.frontmatter.status ?? graphStore.selectedNode.status} />
        </div>
        <button
          class="close-btn"
          onclick={() => graphStore.closeDrawer()}
          title="Close drawer (Esc)"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <h2 class="doc-title">{currentDoc?.frontmatter.name ?? graphStore.selectedNode.title}</h2>
      <div class="doc-path">{currentDoc?.path.split(/[/\\]/).pop() ?? graphStore.selectedNode.filename}</div>

      <div class="drawer-toolbar">
        <div class="view-toggle">
          <button
            class="toggle-btn"
            class:active={mode === 'preview'}
            onclick={() => (mode = 'preview')}
          >
            Preview
          </button>
          <button
            class="toggle-btn"
            class:active={mode === 'edit'}
            onclick={() => (mode = 'edit')}
          >
            Edit
          </button>
        </div>

        {#if mode === 'edit'}
          <span class="save-indicator {saveStatus}">
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Auto-saved' : 'Save error'}
          </span>
        {/if}
      </div>
    </div>

    <div class="drawer-body">
      {#if currentDoc}
        {#if mode === 'preview'}
          <div class="preview-wrapper">
            <MarkdownPreview content={currentDoc.body} />
          </div>
        {:else}
          <div class="editor-wrapper">
            <CodeMirrorEditor content={currentDoc.body} onsave={handleSave} />
          </div>
        {/if}
      {:else}
        <div class="empty-drawer">
          <p>Document not found</p>
        </div>
      {/if}
    </div>
  </aside>
{/if}

<style>
  .drawer-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 50;
    animation: fadeIn var(--duration-sm) var(--ease-out);
  }

  .slide-over-drawer {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 480px;
    max-width: 90vw;
    background: var(--base-surface);
    border-left: 1px solid var(--base-border);
    display: flex;
    flex-direction: column;
    z-index: 60;
    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
    animation: slideIn var(--duration-md) var(--ease-out);
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .drawer-header {
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--base-border);
    flex-shrink: 0;
    background: #121319;
  }

  .header-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-2);
  }

  .header-tags {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .type-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    background: var(--base-overlay);
    border: 1px solid var(--base-border);
    padding: 1px 6px;
    border-radius: var(--radius-sm);
    color: var(--accent-text);
  }

  .version-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-secondary);
    background: var(--base-overlay);
    padding: 1px 5px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--base-border);
  }

  .close-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 13px;
    cursor: pointer;
    padding: 4px 6px;
    border-radius: var(--radius-sm);
    transition: color var(--duration-sm) var(--ease-out),
                background var(--duration-sm) var(--ease-out);
  }

  .close-btn:hover {
    color: var(--text-primary);
    background: var(--base-overlay);
  }

  .doc-title {
    font-size: var(--text-md);
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 4px 0;
    line-height: 1.3;
  }

  .doc-path {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-secondary);
    opacity: 0.8;
    margin-bottom: var(--space-3);
  }

  .drawer-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .view-toggle {
    display: flex;
    background: var(--base-void);
    border: 1px solid var(--base-border);
    border-radius: var(--radius-sm);
    padding: 2px;
    gap: 2px;
  }

  .toggle-btn {
    background: transparent;
    border: none;
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    padding: 3px 10px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--duration-sm) var(--ease-out);
  }

  .toggle-btn.active {
    background: var(--base-surface);
    color: var(--text-primary);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .save-indicator {
    font-size: 11px;
    font-family: var(--font-mono);
  }

  .save-indicator.saved {
    color: #10b981;
  }

  .save-indicator.saving {
    color: #f59e0b;
  }

  .save-indicator.error {
    color: #ef4444;
  }

  .drawer-body {
    flex: 1;
    overflow-y: auto;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .preview-wrapper {
    padding: var(--space-4);
    height: 100%;
    overflow-y: auto;
  }

  .editor-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .empty-drawer {
    padding: var(--space-6);
    text-align: center;
    color: var(--text-secondary);
  }
</style>
