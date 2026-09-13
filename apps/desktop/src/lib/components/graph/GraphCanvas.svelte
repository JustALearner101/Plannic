<script lang="ts">
  import {
    SvelteFlow,
    Controls,
    Background,
    MiniMap,
    type NodeTypes,
  } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import PlanNode from './PlanNode.svelte';
  import SlideOverDrawer from './SlideOverDrawer.svelte';
  import { graphStore } from '../../stores/graph.svelte.js';
  import { plansStore } from '../../stores/plans.svelte.js';
  import type { PlanNodeData } from '../../types/graph.js';

  const nodeTypes: NodeTypes = {
    planNode: PlanNode as any,
  };

  // Keep graph in sync when active plan changes
  $effect(() => {
    graphStore.buildFromPlan(plansStore.activePlan);
  });

  function handleNodeClick({ node }: { node: any }) {
    if (node?.data) {
      graphStore.selectNode(node.data as PlanNodeData);
    }
  }

  function handlePaneClick() {
    // optional click outside
  }
</script>

<div class="graph-canvas-container">
  {#if !plansStore.activePlan}
    <div class="canvas-empty">
      <div class="empty-icon">◈</div>
      <p class="empty-text">No plan selected</p>
      <span class="empty-hint">Select or create a plan to view its node graph</span>
    </div>
  {:else}
    <SvelteFlow
      nodes={graphStore.nodes}
      edges={graphStore.edges}
      {nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      minZoom={0.2}
      maxZoom={2}
      onnodeclick={handleNodeClick}
      onpaneclick={handlePaneClick}
      class="plannic-flow"
    >
      <Background gap={24} size={1} patternColor="#222430" />
      <Controls position="bottom-left" showLock={false} />
      <MiniMap
        position="bottom-right"
        nodeColor="#5B6BF8"
        maskColor="rgba(14, 15, 20, 0.75)"
        style="background: #14151B; border: 1px solid #222430; border-radius: 6px; width: 140px; height: 90px;"
      />
    </SvelteFlow>

    <!-- Slide-over Drawer Inspector -->
    <SlideOverDrawer />
  {/if}
</div>

<style>
  .graph-canvas-container {
    width: 100%;
    height: 100%;
    position: relative;
    background: var(--base-void);
    overflow: hidden;
  }

  .canvas-empty {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    user-select: none;
  }

  .empty-icon {
    font-size: 36px;
    color: var(--accent);
    margin-bottom: var(--space-3);
    opacity: 0.5;
  }

  .empty-text {
    font-size: var(--text-md);
    font-weight: 500;
    color: var(--text-primary);
    margin: 0 0 6px 0;
  }

  .empty-hint {
    font-size: var(--text-xs);
    color: var(--text-secondary);
  }

  :global(.plannic-flow) {
    background: var(--base-void) !important;
  }

  /* Override @xyflow Controls styling to fit workshop aesthetic */
  :global(.svelte-flow__controls) {
    background: var(--base-surface) !important;
    border: 1px solid var(--base-border) !important;
    border-radius: var(--radius-sm) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
    overflow: hidden;
  }

  :global(.svelte-flow__controls-button) {
    background: transparent !important;
    border-bottom: 1px solid var(--base-border) !important;
    color: var(--text-secondary) !important;
    fill: var(--text-secondary) !important;
    transition: all var(--duration-sm) var(--ease-out) !important;
    width: 28px !important;
    height: 28px !important;
  }

  :global(.svelte-flow__controls-button:last-child) {
    border-bottom: none !important;
  }

  :global(.svelte-flow__controls-button:hover) {
    background: var(--base-overlay) !important;
    color: var(--text-primary) !important;
    fill: var(--text-primary) !important;
  }

  /* Override @xyflow Minimap styling */
  :global(.svelte-flow__minimap) {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;
  }
</style>
