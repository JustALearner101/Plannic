import { openDirectoryDialog } from '../api/tauri.js';

const STORAGE_KEY = 'plannic_projects_config';

interface AppConfig {
  lastPath: string;
  recentPaths: string[];
}

export class ProjectStore {
  currentPath = $state<string>('');
  recentPaths = $state<string[]>([]);
  projectName = $derived(this.currentPath ? this.currentPath.split(/[\\/]/).filter(Boolean).pop() || 'Untitled' : 'No Project');

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppConfig;
        this.recentPaths = parsed.recentPaths || [];
        this.currentPath = parsed.lastPath || '';
      }
    } catch {
      // ignore
    }
  }

  private saveToStorage() {
    try {
      const data: AppConfig = {
        lastPath: this.currentPath,
        recentPaths: this.recentPaths,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  setPath(path: string) {
    if (!path) return;
    this.currentPath = path;
    if (!this.recentPaths.includes(path)) {
      this.recentPaths = [path, ...this.recentPaths.filter((p) => p !== path)].slice(0, 10);
    }
    this.saveToStorage();
  }

  removeRecent(path: string) {
    this.recentPaths = this.recentPaths.filter((p) => p !== path);
    if (this.currentPath === path) {
      this.currentPath = this.recentPaths[0] || '';
    }
    this.saveToStorage();
  }

  async browseFolder(): Promise<string | null> {
    const selected = await openDirectoryDialog();
    if (selected) {
      this.setPath(selected);
    }
    return selected;
  }
}

export const projectStore = new ProjectStore();
