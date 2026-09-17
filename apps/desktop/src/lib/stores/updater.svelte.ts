import { check, type Update, type DownloadEvent } from '@tauri-apps/plugin-updater';

export type UpdaterStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'up-to-date'
  | 'error';

export class UpdaterStore {
  status = $state<UpdaterStatus>('idle');
  version = $state<string | null>(null);
  currentVersion = $state<string | null>(null);
  body = $state<string | null>(null);
  date = $state<string | null>(null);
  progress = $state<number>(0);
  downloadedBytes = $state<number>(0);
  totalBytes = $state<number>(0);
  errorMessage = $state<string | null>(null);
  dismissed = $state<boolean>(false);

  private updateInstance: Update | null = null;
  private autoCheckDone = false;

  async checkForUpdates(manual = false): Promise<boolean> {
    if (this.status === 'downloading') return false;

    this.status = 'checking';
    this.errorMessage = null;

    try {
      // In web browser or environments without Tauri IPC, check() may throw or return null
      const update = await check();

      if (update) {
        this.updateInstance = update;
        this.version = update.version;
        this.currentVersion = update.currentVersion;
        this.body = update.body ?? null;
        this.date = update.date ?? null;
        this.status = 'available';
        this.dismissed = false;
        return true;
      } else {
        this.status = manual ? 'up-to-date' : 'idle';
        if (manual) {
          setTimeout(() => {
            if (this.status === 'up-to-date') this.status = 'idle';
          }, 4000);
        }
        return false;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[Updater] Check failed:', msg);
      if (manual) {
        this.status = 'error';
        this.errorMessage = msg;
        setTimeout(() => {
          if (this.status === 'error') this.status = 'idle';
        }, 5000);
      } else {
        this.status = 'idle';
      }
      return false;
    }
  }

  async downloadAndInstall(): Promise<void> {
    if (!this.updateInstance || this.status === 'downloading') return;

    this.status = 'downloading';
    this.progress = 0;
    this.downloadedBytes = 0;
    this.totalBytes = 0;
    this.errorMessage = null;

    let total = 0;
    let downloaded = 0;

    try {
      await this.updateInstance.downloadAndInstall((event: DownloadEvent) => {
        if (event.event === 'Started') {
          total = event.data.contentLength ?? 0;
          this.totalBytes = total;
        } else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          this.downloadedBytes = downloaded;
          if (total > 0) {
            this.progress = Math.min(100, Math.round((downloaded / total) * 100));
          }
        } else if (event.event === 'Finished') {
          this.progress = 100;
          this.status = 'ready';
        }
      });
      // Windows installer automatically launches and shuts down app here
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Updater] Download/Install error:', msg);
      this.status = 'error';
      this.errorMessage = msg;
    }
  }

  dismiss() {
    this.dismissed = true;
  }

  reset() {
    this.status = 'idle';
    this.version = null;
    this.body = null;
    this.errorMessage = null;
    this.dismissed = false;
    this.progress = 0;
    this.updateInstance = null;
  }
}

export const updaterStore = new UpdaterStore();
if (typeof window !== 'undefined') {
  (window as any).__UPDATER_STORE__ = updaterStore;
}
