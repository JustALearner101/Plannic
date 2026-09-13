<script lang="ts">
  import type { PlanDocument } from '@plannic/core';
  import MarkdownPreview from '../editor/MarkdownPreview.svelte';
  import CodeMirrorEditor from '../editor/CodeMirrorEditor.svelte';

  let {
    document,
    viewMode = 'preview',
    collapsed = false,
    ontoggle,
    onsave,
    onlinkclick,
  }: {
    document: PlanDocument;
    viewMode?: 'preview' | 'edit';
    collapsed?: boolean;
    ontoggle?: () => void;
    onsave?: (docType: string, body: string) => Promise<void> | void;
    onlinkclick?: (href: string) => void;
  } = $props();

  const iconMap: Record<string, string> = {
    plan: '◈',
    scope: '◉',
    feature: '⊞',
    phase: '◷',
    limitation: '⚠',
  };

  let icon = $derived(iconMap[document.type] || '◈');
  let title = $derived(document.frontmatter.name || document.type.toUpperCase());
</script>

<div class="doc-section" id="section-{document.type}">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="section-header" onclick={ontoggle}>
    <div class="header-left">
      <span class="chevron">{collapsed ? '►' : '▾'}</span>
      <span class="type-icon">{icon}</span>
      <span class="section-title">{title}</span>
    </div>
    <div class="header-right">
      <span class="version-label">v{document.frontmatter.version}</span>
      {#if collapsed}
        <span class="collapsed-badge">[collapsed]</span>
      {/if}
    </div>
  </div>
  <div class="section-divider"></div>

  {#if !collapsed}
    <div class="section-content">
      {#if viewMode === 'preview'}
        <MarkdownPreview content={document.body} {onlinkclick} />
      {:else}
        <CodeMirrorEditor
          content={document.body}
          onsave={(newBody) => onsave?.(document.type, newBody)}
        />
      {/if}
    </div>
  {/if}
</div>

<style>
  .doc-section {
    margin-bottom: var(--space-5);
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0 8px;
    cursor: pointer;
    user-select: none;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .chevron {
    font-size: 10px;
    color: var(--text-secondary);
    width: 14px;
    display: inline-block;
  }

  .type-icon {
    font-size: 13px;
    color: var(--accent-text);
  }

  .section-title {
    font-size: var(--text-md);
    font-weight: 500;
    color: var(--text-primary);
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .version-label {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-secondary);
  }

  .collapsed-badge {
    font-size: var(--text-xs);
    color: var(--text-secondary);
  }

  .section-divider {
    height: 1px;
    background: var(--base-border);
    width: 100%;
    margin-bottom: var(--space-3);
  }

  .section-content {
    animation: content-fade var(--duration-md) var(--ease-out);
  }

  @keyframes content-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
