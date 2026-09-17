<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Header from '$lib/components/layout/Header.svelte';
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
  import HistoryPanel from '$lib/components/layout/HistoryPanel.svelte';
  import PlanDetail from '$lib/components/plan/PlanDetail.svelte';
  import GraphCanvas from '$lib/components/graph/GraphCanvas.svelte';
  import KanbanBoard from '$lib/components/board/KanbanBoard.svelte';
  import NewPlanModal from '$lib/components/plan/NewPlanModal.svelte';
  import SearchOverlay from '$lib/components/search/SearchOverlay.svelte';
  import AmbientAgentBorder from '$lib/components/ui/AmbientAgentBorder.svelte';
  import AgentCursor from '$lib/components/ui/AgentCursor.svelte';
  import UpdateNotificationToast from '$lib/components/ui/UpdateNotificationToast.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  import { projectStore } from '$lib/stores/project.svelte.js';
  import { plansStore } from '$lib/stores/plans.svelte.js';
  import { uiStore } from '$lib/stores/ui.svelte.js';
  import { graphStore } from '$lib/stores/graph.svelte.js';
  import { boardStore } from '$lib/stores/board.svelte.js';
  import { agentActivityStore } from '$lib/stores/agentActivity.svelte.js';
  import { updaterStore } from '$lib/stores/updater.svelte.js';

  onMount(async () => {
    agentActivityStore.init();
    updaterStore.checkForUpdates();
    if (projectStore.currentPath) {
      await plansStore.loadPlans(projectStore.currentPath);
    }
  });

  onDestroy(() => {
    agentActivityStore.destroy();
  });

  async function handleOpenProject() {
    const selected = await projectStore.browseFolder();
    if (selected) {
      await plansStore.loadPlans(selected);
    }
  }

  async function handleSaveDocument(docType: string, body: string) {
    if (projectStore.currentPath && plansStore.selectedSlug) {
      await plansStore.saveDocument(
        projectStore.currentPath,
        plansStore.selectedSlug,
        docType as any,
        body
      );
    }
  }
</script>

<div class="shell">
  <AmbientAgentBorder />
  <AgentCursor />
  <Header />

  <div class="workspace">
    <Sidebar />

    <main class="main-area" class:graph-mode={uiStore.mainView === 'graph' || uiStore.mainView === 'board'}>
      {#if !projectStore.currentPath}
        <div class="empty-state">
          <div class="empty-box">
            <p class="empty-title">Open a project to start</p>
            <Button variant="outline" size="md" onclick={handleOpenProject}>
              Open Project
            </Button>
          </div>
        </div>
      {:else if plansStore.items.length === 0}
        <div class="empty-state">
          <div class="empty-box">
            <p class="empty-title">No plans in .docs/ yet</p>
            <p class="empty-subtext">
              Ask your AI agent to run <code class="code-inline">init_plan()</code> to get started,
              or create one manually:
            </p>
            <Button variant="primary" size="md" onclick={() => (uiStore.newPlanModalOpen = true)}>
              + New Plan
            </Button>
          </div>
        </div>
      {:else if uiStore.mainView === 'board'}
        <KanbanBoard />
      {:else if uiStore.mainView === 'graph' && plansStore.activePlan}
        <GraphCanvas />
      {:else if plansStore.activePlan}
        <PlanDetail
          plan={plansStore.activePlan}
          onSaveDocument={handleSaveDocument}
        />
      {:else}
        <div class="empty-state">
          <div class="empty-box">
            <p class="empty-title">Select a plan from the sidebar</p>
          </div>
        </div>
      {/if}
    </main>

    <HistoryPanel />
  </div>
</div>

<SearchOverlay />
<NewPlanModal />
<UpdateNotificationToast />

<style>
  .shell {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    background: var(--base-void);
    overflow: hidden;
  }

  .workspace {
    display: flex;
    flex: 1;
    overflow: hidden;
    position: relative;
  }

  .main-area {
    flex: 1;
    min-width: 500px;
    height: 100%;
    overflow-y: auto;
    background: var(--base-void);
    position: relative;
  }

  .main-area.graph-mode {
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 400px;
  }

  .empty-box {
    text-align: center;
    max-width: 400px;
    padding: var(--space-6);
  }

  .empty-title {
    font-size: var(--text-base);
    color: var(--text-secondary);
    margin-bottom: var(--space-4);
  }

  .empty-subtext {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    line-height: 1.6;
    margin-bottom: var(--space-5);
  }

  .code-inline {
    font-family: var(--font-mono);
    color: var(--accent-text);
    background: var(--base-overlay);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
  }
</style>
