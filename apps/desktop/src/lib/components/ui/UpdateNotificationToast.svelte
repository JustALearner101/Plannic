<script lang="ts">
  import { updaterStore } from '$lib/stores/updater.svelte.js';

  function formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }
</script>

{#if (updaterStore.status === 'available' || updaterStore.status === 'downloading' || updaterStore.status === 'ready' || updaterStore.status === 'error') && !updaterStore.dismissed}
  <div class="update-toast" role="alert">
    <div class="toast-header">
      <div class="header-title">
        <span class="pulse-indicator"></span>
        <span class="title-text">Update Available</span>
        {#if updaterStore.version}
          <span class="version-tag">v{updaterStore.version}</span>
        {/if}
      </div>
      <button class="close-btn" onclick={() => updaterStore.dismiss()} title="Dismiss">
        ✕
      </button>
    </div>

    <div class="toast-body">
      {#if updaterStore.currentVersion}
        <div class="version-diff">
          <span class="curr-ver">Current: v{updaterStore.currentVersion}</span>
          <span class="ver-arrow">→</span>
          <span class="new-ver">New: v{updaterStore.version}</span>
        </div>
      {/if}

      {#if updaterStore.body}
        <div class="release-notes">
          <pre>{updaterStore.body}</pre>
        </div>
      {/if}

      {#if updaterStore.status === 'downloading'}
        <div class="progress-section">
          <div class="progress-info">
            <span>Downloading update...</span>
            <span>{updaterStore.progress}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: {updaterStore.progress}%"></div>
          </div>
          {#if updaterStore.totalBytes > 0}
            <div class="bytes-info">
              {formatBytes(updaterStore.downloadedBytes)} / {formatBytes(updaterStore.totalBytes)}
            </div>
          {/if}
        </div>
      {/if}

      {#if updaterStore.status === 'ready'}
        <div class="ready-notice">
          Update downloaded! Launching installer and restarting...
        </div>
      {/if}

      {#if updaterStore.status === 'error'}
        <div class="error-notice">
          {updaterStore.errorMessage || 'Failed to download update.'}
        </div>
      {/if}
    </div>

    <div class="toast-actions">
      {#if updaterStore.status === 'available'}
        <button class="btn-ghost" onclick={() => updaterStore.dismiss()}>
          Later
        </button>
        <button class="btn-primary" onclick={() => updaterStore.downloadAndInstall()}>
          Update & Restart
        </button>
      {:else if updaterStore.status === 'downloading'}
        <button class="btn-primary" disabled>
          <span class="spinner">↻</span> Downloading...
        </button>
      {:else if updaterStore.status === 'ready'}
        <button class="btn-primary" disabled>
          Restarting...
        </button>
      {:else if updaterStore.status === 'error'}
        <button class="btn-ghost" onclick={() => updaterStore.dismiss()}>
          Close
        </button>
        <button class="btn-primary" onclick={() => updaterStore.downloadAndInstall()}>
          Retry
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .update-toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 380px;
    max-width: calc(100vw - 48px);
    background: #0f1117;
    border: 1px solid rgba(56, 189, 248, 0.4);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.15);
    border-radius: 8px;
    z-index: 1000;
    overflow: hidden;
    font-family: var(--font-ui, system-ui, sans-serif);
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .toast-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pulse-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #38bdf8;
    box-shadow: 0 0 8px #38bdf8;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% { transform: scale(0.85); opacity: 0.7; }
    50% { transform: scale(1.15); opacity: 1; }
    100% { transform: scale(0.85); opacity: 0.7; }
  }

  .title-text {
    font-size: 13px;
    font-weight: 600;
    color: #f1f5f9;
    letter-spacing: 0.3px;
  }

  .version-tag {
    font-family: var(--font-mono, monospace);
    font-size: 11px;
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.12);
    padding: 1px 6px;
    border-radius: 4px;
    border: 1px solid rgba(56, 189, 248, 0.3);
  }

  .close-btn {
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 13px;
    cursor: pointer;
    padding: 4px;
    line-height: 1;
    border-radius: 4px;
    transition: all 0.15s ease;
  }

  .close-btn:hover {
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.08);
  }

  .toast-body {
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .version-diff {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-mono, monospace);
    font-size: 11px;
    color: #94a3b8;
  }

  .curr-ver {
    color: #64748b;
  }

  .ver-arrow {
    color: #38bdf8;
  }

  .new-ver {
    color: #38bdf8;
    font-weight: 600;
  }

  .release-notes {
    background: #090a0f;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    padding: 8px 10px;
    max-height: 90px;
    overflow-y: auto;
  }

  .release-notes pre {
    margin: 0;
    font-family: var(--font-mono, monospace);
    font-size: 11px;
    color: #cbd5e1;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.4;
  }

  .progress-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #cbd5e1;
    font-family: var(--font-mono, monospace);
  }

  .progress-track {
    height: 6px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #0284c7, #38bdf8);
    box-shadow: 0 0 8px rgba(56, 189, 248, 0.6);
    transition: width 0.2s ease-out;
  }

  .bytes-info {
    font-size: 10px;
    color: #64748b;
    font-family: var(--font-mono, monospace);
    text-align: right;
  }

  .ready-notice {
    font-size: 12px;
    color: #34d399;
    font-weight: 500;
  }

  .error-notice {
    font-size: 11px;
    color: #f87171;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    padding: 6px 8px;
    border-radius: 4px;
  }

  .toast-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding: 10px 14px 12px;
    background: rgba(255, 255, 255, 0.02);
    border-top: 1px solid rgba(255, 255, 255, 0.04);
  }

  .btn-ghost {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    font-size: 12px;
    padding: 5px 12px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.15s ease;
  }

  .btn-ghost:hover {
    color: #f1f5f9;
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
  }

  .btn-primary {
    background: #0284c7;
    border: 1px solid #38bdf8;
    color: #ffffff;
    font-size: 12px;
    font-weight: 600;
    padding: 5px 14px;
    border-radius: 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 0 10px rgba(2, 132, 199, 0.3);
    transition: all 0.15s ease;
  }

  .btn-primary:hover:not(:disabled) {
    background: #0369a1;
    box-shadow: 0 0 14px rgba(56, 189, 248, 0.5);
  }

  .btn-primary:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .spinner {
    display: inline-block;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
