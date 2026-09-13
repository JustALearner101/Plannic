<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import type { PlanFlowNode } from '../../types/graph.js';
  import StatusBadge from '../plan/StatusBadge.svelte';
  import type { DocType } from '@plannic/core';

  let { data, selected = false }: NodeProps<PlanFlowNode> = $props();

  const docIcons: Record<DocType, string> = {
    plan: '◈',
    scope: '◉',
    feature: '⊞',
    phase: '◷',
    limitation: '⚠',
  };

  const docLabels: Record<DocType, string> = {
    plan: 'Root Plan',
    scope: 'Scope',
    feature: 'Features',
    phase: 'Phases',
    limitation: 'Limitations',
  };
</script>

<div class="plan-node" class:selected>
  <!-- Target Handle (Left) - connected from parent -->
  {#if data.docType !== 'plan'}
    <Handle
      type="target"
      position={Position.Left}
      class="node-handle handle-left"
    />
  {/if}

  <div class="node-header">
    <div class="header-type">
      <span class="type-icon">{docIcons[data.docType] ?? '◈'}</span>
      <span class="type-label">{docLabels[data.docType] ?? data.docType}</span>
    </div>
    <span class="version-tag">v{data.version}</span>
  </div>

  <div class="node-title" title={data.title}>
    {data.title}
  </div>

  <div class="node-footer">
    <StatusBadge status={data.status} />
    <span class="node-file" title={data.filename}>{data.filename}</span>
  </div>

  <!-- Source Handle (Right) - connects to children -->
  {#if data.docType === 'plan' || data.docType === 'feature'}
    <Handle
      type="source"
      position={Position.Right}
      class="node-handle handle-right"
    />
  {/if}
</div>

<style>
  .plan-node {
    width: 210px;
    background: var(--base-surface);
    border: 1px solid var(--base-border);
    border-radius: var(--radius-md);
    padding: 10px 12px;
    font-family: var(--font-ui);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: border-color var(--duration-sm) var(--ease-out),
                box-shadow var(--duration-sm) var(--ease-out),
                background-color var(--duration-sm) var(--ease-out);
    user-select: none;
    cursor: pointer;
    position: relative;
  }

  .plan-node:hover {
    border-color: var(--base-border-hi);
    background: #171922;
  }

  .plan-node.selected {
    border-color: var(--accent);
    box-shadow: 0 0 16px rgba(91, 107, 248, 0.35);
    background: #181a26;
  }

  .node-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }

  .header-type {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .type-icon {
    font-size: 12px;
    color: var(--accent-text);
  }

  .type-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-secondary);
    font-family: var(--font-mono);
  }

  .version-tag {
    font-size: 10px;
    color: var(--text-secondary);
    font-family: var(--font-mono);
    background: var(--base-overlay);
    padding: 1px 4px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--base-border);
  }

  .node-title {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text-primary);
    line-height: 1.35;
    margin-bottom: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .node-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  .node-file {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-secondary);
    opacity: 0.7;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 90px;
  }

  :global(.node-handle) {
    width: 8px !important;
    height: 8px !important;
    background: var(--base-border-hi) !important;
    border: 2px solid var(--base-surface) !important;
    border-radius: 50% !important;
    transition: background-color var(--duration-sm) var(--ease-out) !important;
  }

  .plan-node:hover :global(.node-handle),
  .plan-node.selected :global(.node-handle) {
    background: var(--accent) !important;
  }
</style>
