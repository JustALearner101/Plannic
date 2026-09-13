import type { Plan, PlanSummary, PlanDocument, DocType, HistoryEntry, PlanMode } from '@plannic/core';
import {
  listProjectPlans,
  readProjectPlan,
  saveProjectDocument,
  readProjectHistory,
  initProjectPlan,
  deleteProjectPlan,
} from '../api/tauri.js';

export class PlansStore {
  items = $state<PlanSummary[]>([]);
  activePlan = $state<Plan | null>(null);
  selectedSlug = $state<string | null>(null);
  activeDocType = $state<DocType>('plan');
  history = $state<HistoryEntry[]>([]);
  loading = $state<boolean>(false);

  activeDocument = $derived.by<PlanDocument | null>(() => {
    if (!this.activePlan) return null;
    return (
      this.activePlan.documents.find((d) => d.type === this.activeDocType) ||
      this.activePlan.root
    );
  });

  async loadPlans(cwd: string) {
    if (!cwd) {
      this.items = [];
      this.activePlan = null;
      this.selectedSlug = null;
      return;
    }
    this.loading = true;
    try {
      this.items = await listProjectPlans(cwd);
      if (this.selectedSlug) {
        // reload active plan
        await this.selectPlan(cwd, this.selectedSlug);
      } else if (this.items.length > 0) {
        await this.selectPlan(cwd, this.items[0].slug);
      } else {
        this.activePlan = null;
        this.history = [];
      }
    } finally {
      this.loading = false;
    }
  }

  async selectPlan(cwd: string, slug: string) {
    this.selectedSlug = slug;
    this.activeDocType = 'plan';
    const plan = await readProjectPlan(cwd, slug);
    this.activePlan = plan;
    await this.refreshHistory(cwd, slug);
  }

  selectDocType(type: DocType) {
    this.activeDocType = type;
  }

  async refreshHistory(cwd: string, slug: string) {
    this.history = await readProjectHistory(cwd, slug);
  }

  async saveDocument(
    cwd: string,
    slug: string,
    docType: DocType,
    body: string,
    changeSummary?: string
  ): Promise<boolean> {
    try {
      const result = await saveProjectDocument(cwd, slug, docType, body, changeSummary);
      if (result.success) {
        // Update local document body & version
        if (this.activePlan) {
          const doc = this.activePlan.documents.find((d) => d.type === docType);
          if (doc) {
            doc.body = body;
            doc.frontmatter.version = result.version;
            doc.frontmatter.lastUpdated = new Date().toISOString();
          }
        }
        await this.refreshHistory(cwd, slug);
        // Refresh plan summaries
        this.items = await listProjectPlans(cwd);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to save document:', e);
      return false;
    }
  }

  async createPlan(cwd: string, name: string, mode: PlanMode): Promise<string> {
    const slug = await initProjectPlan(cwd, name, mode);
    await this.loadPlans(cwd);
    await this.selectPlan(cwd, slug);
    return slug;
  }

  async deletePlan(cwd: string, slug: string): Promise<void> {
    await deleteProjectPlan(cwd, slug);
    if (this.selectedSlug === slug) {
      this.selectedSlug = null;
      this.activePlan = null;
      this.history = [];
    }
    await this.loadPlans(cwd);
  }
}

export const plansStore = new PlansStore();
