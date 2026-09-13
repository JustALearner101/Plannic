<script lang="ts">
  import type { Plan } from '@plannic/core';
  import StatusBadge from './StatusBadge.svelte';
  import DocumentSection from './DocumentSection.svelte';
  import Button from '../ui/Button.svelte';

  let {
    plan,
    onSaveDocument,
  }: {
    plan: Plan;
    onSaveDocument: (docType: string, body: string) => Promise<void> | void;
  } = $props();

  let viewMode = $state<'preview' | 'edit'>('preview');
  let collapsedSections = $state<Record<string, boolean>>({});

  function toggleSection(docType: string) {
    collapsedSections[docType] = !collapsedSections[docType];
  }

  function collapseAll() {
    const next: Record<string, boolean> = {};
    for (const doc of plan.documents) {
      next[doc.type] = true;
    }
    collapsedSections = next;
  }

  function expandAll() {
    collapsedSections = {};
  }

  let allCollapsed = $derived(
    plan.documents.length > 0 &&
    plan.documents.every((d) => collapsedSections[d.type])
  );

  function formatDate(iso: string): string {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  }

  function handleNavigateLink(href: string) {
    const clean = href.replace(/^\.\//, '').replace(/\.md$/, '');
    const matchedDoc = plan.documents.find(
      (d) => clean.startsWith(d.type) || clean.includes(`-${plan.slug}`)
    );
    const targetType = matchedDoc ? matchedDoc.type : clean.split('-')[0];

    if (collapsedSections[targetType]) {
      collapsedSections[targetType] = false;
    }

    setTimeout(() => {
      const el = document.getElementById(`section-${targetType}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  }
</script>

<div class="plan-detail-container">
  <!-- Title Header -->
  <div class="detail-header">
    <div class="title-row">
      <div class="title-left">
        <h1 class="plan-title">{plan.root.frontmatter.name}</h1>
        <span class="version-badge">v{plan.root.frontmatter.version}</span>
        <span class="mode-badge">{plan.mode.toUpperCase()}</span>
        <StatusBadge status={plan.root.frontmatter.status} />
      </div>
    </div>
    <div class="meta-row">
      Last updated {formatDate(plan.root.frontmatter.lastUpdated || plan.root.frontmatter.created)}
      {#if plan.root.frontmatter.description}
        — {plan.root.frontmatter.description}
      {/if}
    </div>
  </div>

  <!-- Toolbar -->
  <div class="toolbar">
    <div class="view-toggles">
      <button
        class="toggle-btn"
        class:active={viewMode === 'preview'}
        onclick={() => (viewMode = 'preview')}
      >
        Preview
      </button>
      <button
        class="toggle-btn"
        class:active={viewMode === 'edit'}
        onclick={() => (viewMode = 'edit')}
      >
        Edit
      </button>
    </div>

    <div class="toolbar-actions">
      {#if allCollapsed}
        <Button variant="ghost" size="sm" onclick={expandAll}>
          ⊞ Expand All
        </Button>
      {:else}
        <Button variant="ghost" size="sm" onclick={collapseAll}>
          ⊟ Collapse All
        </Button>
      {/if}
    </div>
  </div>

  <!-- Document Sections List -->
  <div class="sections-list">
    {#each plan.documents as doc (doc.path)}
      <DocumentSection
        document={doc}
        {viewMode}
        collapsed={!!collapsedSections[doc.type]}
        ontoggle={() => toggleSection(doc.type)}
        onsave={(type, body) => onSaveDocument(type, body)}
        onlinkclick={handleNavigateLink}
      />
    {/each}
  </div>
</div>

<style>
  .plan-detail-container {
    padding: var(--space-5) var(--space-6);
    max-width: 900px;
    margin: 0 auto;
  }

  .detail-header {
    margin-bottom: var(--space-4);
  }

  .title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-1);
  }

  .title-left {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .plan-title {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--text-primary);
  }

  .version-badge {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-secondary);
  }

  .mode-badge {
    font-family: var(--font-mono);
    font-size: 10px;
    padding: 2px 6px;
    background: var(--base-overlay);
    color: var(--accent-text);
    border-radius: var(--radius-sm);
  }

  .meta-row {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-secondary);
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid var(--base-border);
    border-bottom: 1px solid var(--base-border);
    padding: var(--space-2) 0;
    margin-bottom: var(--space-4);
  }

  .view-toggles {
    display: flex;
    gap: var(--space-4);
  }

  .toggle-btn {
    background: transparent;
    border: none;
    padding: 4px 2px;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    cursor: pointer;
    position: relative;
  }

  .toggle-btn:hover {
    color: var(--text-primary);
  }

  .toggle-btn.active {
    color: var(--text-primary);
    font-weight: 500;
  }

  .toggle-btn.active::after {
    content: '';
    position: absolute;
    bottom: -9px;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--accent);
  }

  .sections-list {
    padding-bottom: var(--space-6);
  }
</style>
