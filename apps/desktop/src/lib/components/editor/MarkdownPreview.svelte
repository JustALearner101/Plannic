<script lang="ts">
  import { marked } from 'marked';

  let {
    content = '',
    onlinkclick,
  }: {
    content: string;
    onlinkclick?: (href: string) => void;
  } = $props();

  let renderedHtml = $derived.by(() => {
    try {
      return marked.parse(content, { async: false }) as string;
    } catch {
      return '<p class="error">Error rendering markdown.</p>';
    }
  });

  function handleContainerClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href) return;

    // If external URL (http/https), allow default or handle separately
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return;
    }

    // Intercept relative internal links (.md or section anchors)
    e.preventDefault();
    onlinkclick?.(href);
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="prose-container" onclick={handleContainerClick}>
  {@html renderedHtml}
</div>

<style>
  .prose-container {
    padding: var(--space-4) 0;
    color: var(--text-primary);
    font-family: var(--font-ui);
    font-size: var(--text-base);
    line-height: 1.7;
    max-width: 800px;
  }

  .prose-container :global(h1),
  .prose-container :global(h2),
  .prose-container :global(h3),
  .prose-container :global(h4) {
    color: var(--text-primary);
    font-weight: 600;
    margin-top: 1.6em;
    margin-bottom: 0.6em;
    line-height: 1.3;
  }

  .prose-container :global(h1) {
    font-size: var(--text-lg);
    border-bottom: 1px solid var(--base-border);
    padding-bottom: 0.3em;
  }

  .prose-container :global(h2) {
    font-size: var(--text-md);
  }

  .prose-container :global(h3) {
    font-size: var(--text-base);
  }

  .prose-container :global(p) {
    margin: 0.8em 0;
  }

  .prose-container :global(ul),
  .prose-container :global(ol) {
    margin: 0.8em 0;
    padding-left: 1.5em;
  }

  .prose-container :global(li) {
    margin: 0.3em 0;
  }

  .prose-container :global(code) {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    background: var(--base-overlay);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    color: var(--accent-text);
  }

  .prose-container :global(pre) {
    background: var(--base-void);
    border: 1px solid var(--base-border);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    overflow-x: auto;
    margin: 1em 0;
  }

  .prose-container :global(pre code) {
    background: transparent;
    padding: 0;
    color: var(--text-primary);
  }

  .prose-container :global(blockquote) {
    border-left: 3px solid var(--accent);
    margin: 1em 0;
    padding-left: var(--space-3);
    color: var(--text-secondary);
  }

  .prose-container :global(a) {
    color: var(--accent-text);
    text-decoration: none;
    cursor: pointer;
  }

  .prose-container :global(a:hover) {
    text-decoration: underline;
  }

  .prose-container :global(hr) {
    border: none;
    border-top: 1px solid var(--base-border);
    margin: 2em 0;
  }
</style>
