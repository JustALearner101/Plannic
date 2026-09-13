<script lang="ts">
  import { projectStore } from '../../stores/project.svelte.js';
  import { plansStore } from '../../stores/plans.svelte.js';
  import { uiStore } from '../../stores/ui.svelte.js';

  let projectMenuOpen = $state(false);

  async function handleOpenFolder() {
    projectMenuOpen = false;
    const selected = await projectStore.browseFolder();
    if (selected) {
      await plansStore.loadPlans(selected);
    }
  }

  async function handleSelectRecent(path: string) {
    projectMenuOpen = false;
    projectStore.setPath(path);
    await plansStore.loadPlans(path);
  }

  async function handleManualRefresh() {
    if (projectStore.currentPath) {
      await plansStore.loadPlans(projectStore.currentPath);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r')) {
      e.preventDefault();
      handleManualRefresh();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<header class="app-header">
  <div class="header-left">
    <span class="logo">PLANNIC</span>
    <span class="separator">/</span>

    <div class="project-selector">
      <button
        class="project-btn"
        onclick={() => (projectMenuOpen = !projectMenuOpen)}
        title={projectStore.currentPath || 'No project open'}
      >
        <span class="project-name">{projectStore.projectName}</span>
        <span class="dropdown-caret">▾</span>
      </button>

      {#if projectMenuOpen}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="menu-backdrop" onclick={() => (projectMenuOpen = false)}></div>
        <div class="dropdown-menu">
          <button class="menu-item action-item" onclick={handleOpenFolder}>
            📂 Open Folder...
          </button>

          {#if projectStore.recentPaths.length > 0}
            <div class="menu-divider"></div>
            <div class="menu-section-label">Recent Projects</div>
            {#each projectStore.recentPaths as recent}
              <button
                class="menu-item"
                class:active-project={recent === projectStore.currentPath}
                onclick={() => handleSelectRecent(recent)}
              >
                <span class="recent-path">{recent}</span>
              </button>
            {/each}
          {/if}
        </div>
      {/if}
    </div>

    <button
      class="refresh-btn"
      class:spinning={plansStore.loading}
      onclick={handleManualRefresh}
      title="Refresh plans (Ctrl+R / F5)"
    >
      <span class="refresh-icon">↻</span>
    </button>
  </div>

  <div class="header-right">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="search-trigger" onclick={() => (uiStore.searchOpen = true)}>
      <span class="search-icon">⌕</span>
      <span class="search-label">Search plans...</span>
      <span class="search-shortcut">⌘K</span>
    </div>
  </div>
</header>

<style>
  .app-header {
    height: 40px;
    background: var(--base-surface);
    border-bottom: 1px solid var(--base-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    user-select: none;
    flex-shrink: 0;
    z-index: 100;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .logo {
    font-size: var(--text-md);
    font-weight: 700;
    color: var(--accent);
    letter-spacing: 0.5px;
  }

  .separator {
    color: var(--text-secondary);
    font-size: var(--text-sm);
  }

  .project-selector {
    position: relative;
  }

  .project-btn {
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-primary);
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    font-weight: 500;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background-color var(--duration-sm) var(--ease-out);
  }

  .project-btn:hover {
    background: var(--base-overlay);
  }

  .dropdown-caret {
    font-size: 10px;
    color: var(--text-secondary);
  }

  .menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: 150;
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    width: 280px;
    background: var(--base-surface);
    border: 1px solid var(--base-border-hi);
    border-radius: var(--radius-md);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
    padding: 4px;
    z-index: 200;
    animation: menu-fade var(--duration-sm) var(--ease-out);
  }

  @keyframes menu-fade {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .menu-item {
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    padding: 8px 10px;
    font-family: var(--font-ui);
    font-size: var(--text-sm);
    color: var(--text-primary);
    border-radius: var(--radius-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
  }

  .menu-item:hover {
    background: var(--base-overlay);
  }

  .action-item {
    font-weight: 500;
    color: var(--accent-text);
  }

  .menu-divider {
    height: 1px;
    background: var(--base-border);
    margin: 4px 0;
  }

  .menu-section-label {
    padding: 4px 10px;
    font-size: 11px;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-family: var(--font-mono);
  }

  .recent-path {
    font-size: 12px;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    width: 100%;
  }

  .active-project {
    background: rgba(42, 48, 128, 0.2);
  }

  .active-project .recent-path {
    color: var(--accent-text);
  }

  .header-right {
    display: flex;
    align-items: center;
  }

  .search-trigger {
    width: 220px;
    height: 28px;
    background: var(--base-overlay);
    border: 1px solid var(--base-border);
    border-radius: var(--radius-md);
    padding: 0 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: border-color var(--duration-sm) var(--ease-out);
  }

  .search-trigger:hover {
    border-color: var(--base-border-hi);
  }

  .search-icon {
    font-size: 13px;
    color: var(--text-secondary);
  }

  .search-label {
    flex: 1;
    font-size: var(--text-xs);
    color: var(--text-secondary);
  }

  .search-shortcut {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-secondary);
    background: var(--base-surface);
    padding: 1px 4px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--base-border);
  }

  .refresh-btn {
    background: transparent;
    border: 1px solid transparent;
    color: var(--text-secondary);
    border-radius: var(--radius-sm);
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--duration-sm) var(--ease-out);
    margin-left: 4px;
  }

  .refresh-btn:hover {
    color: var(--text-primary);
    background: var(--base-overlay);
    border-color: var(--base-border);
  }

  .refresh-icon {
    font-size: 15px;
    line-height: 1;
    display: inline-block;
  }

  .refresh-btn.spinning .refresh-icon {
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
