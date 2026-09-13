<script lang="ts">
  import { EditorView, basicSetup } from 'codemirror';
  import { markdown } from '@codemirror/lang-markdown';
  import { EditorState } from '@codemirror/state';

  let {
    content = '',
    onsave,
  }: {
    content: string;
    onsave?: (newContent: string) => Promise<void> | void;
  } = $props();

  let editorElement: HTMLDivElement;
  let view: EditorView | null = null;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let saveStatus = $state<'idle' | 'saving' | 'saved'>('idle');
  let fadeTimer: ReturnType<typeof setTimeout> | null = null;

  const plannicTheme = EditorView.theme(
    {
      '&': {
        color: 'var(--text-primary)',
        backgroundColor: 'var(--base-void)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        height: '100%',
      },
      '.cm-content': {
        caretColor: 'var(--accent)',
        padding: '12px 16px',
        lineHeight: '1.6',
      },
      '&.cm-focused .cm-cursor': {
        borderLeftColor: 'var(--accent)',
        borderLeftWidth: '2px',
      },
      '&.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: 'var(--accent-dim) !important',
      },
      '.cm-selectionMatch': {
        backgroundColor: 'rgba(91, 107, 248, 0.2)',
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(26, 27, 35, 0.7)',
      },
      '.cm-gutters': {
        backgroundColor: 'var(--base-void)',
        color: 'var(--text-secondary)',
        borderRight: '1px solid var(--base-border)',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'var(--base-overlay)',
        color: 'var(--text-primary)',
      },
    },
    { dark: true }
  );

  function scheduleAutoSave(text: string) {
    if (saveTimer) clearTimeout(saveTimer);
    saveStatus = 'saving';

    saveTimer = setTimeout(async () => {
      if (onsave) {
        await onsave(text);
      }
      saveStatus = 'saved';
      if (fadeTimer) clearTimeout(fadeTimer);
      fadeTimer = setTimeout(() => {
        saveStatus = 'idle';
      }, 1200);
    }, 1500); // 1.5s idle debounce
  }

  function setupCodeMirror(node: HTMLDivElement, initialContent: string) {
    const state = EditorState.create({
      doc: initialContent,
      extensions: [
        basicSetup,
        markdown(),
        plannicTheme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newText = update.state.doc.toString();
            scheduleAutoSave(newText);
          }
        }),
      ],
    });

    view = new EditorView({
      state,
      parent: node,
    });

    return {
      update(newContent: string) {
        if (view && newContent !== view.state.doc.toString()) {
          view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: newContent },
          });
        }
      },
      destroy() {
        if (saveTimer) clearTimeout(saveTimer);
        if (fadeTimer) clearTimeout(fadeTimer);
        view?.destroy();
      },
    };
  }
</script>

<div class="editor-wrapper">
  <div class="editor-mount" use:setupCodeMirror={content}></div>
  <div class="status-indicator {saveStatus}">
    {#if saveStatus === 'saving'}
      Saving...
    {:else if saveStatus === 'saved'}
      Saved
    {/if}
  </div>
</div>

<style>
  .editor-wrapper {
    position: relative;
    width: 100%;
    min-height: 250px;
    border: 1px solid var(--base-border);
    border-radius: var(--radius-md);
    overflow: hidden;
    background: var(--base-void);
  }

  .editor-mount {
    width: 100%;
    min-height: 250px;
  }

  .editor-mount :global(.cm-editor) {
    height: 100%;
    min-height: 250px;
  }

  .status-indicator {
    position: absolute;
    bottom: var(--space-2);
    right: var(--space-3);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-secondary);
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    background: var(--base-surface);
    border: 1px solid var(--base-border);
    pointer-events: none;
    opacity: 0;
    transition: opacity var(--duration-sm) var(--ease-out);
  }

  .status-indicator.saving,
  .status-indicator.saved {
    opacity: 1;
  }

  .status-indicator.saved {
    color: var(--status-final);
  }
</style>
