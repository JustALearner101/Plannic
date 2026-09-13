import type { Plan, PlanDocument } from '@plannic/core';
import type { KanbanTask, KanbanColumnData, TaskStatus } from '../types/board.js';
import { plansStore } from './plans.svelte.js';
import { projectStore } from './project.svelte.js';

const CHECKLIST_REGEX = /^(\s*-\s*\[)([a-zA-Z0-9_\-\/ ]*)(\]\s*)(.+)$/;

class BoardStore {
  isGlobalMode = $state<boolean>(false);
  filterPhase = $state<string>('all');
  customColumns = $state<{ id: string; title: string; color?: string }[]>([]);
  tasks = $state<KanbanTask[]>([]);
  addColumnModalOpen = $state<boolean>(false);

  // Debounce timer for saving markdown
  private saveTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();

  addCustomColumn(title: string, id?: string, color?: string) {
    const cleanId = (id || title).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    if (['todo', 'in_progress', 'done'].includes(cleanId)) return;
    if (this.customColumns.some((c) => c.id === cleanId)) return;

    this.customColumns = [...this.customColumns, { id: cleanId, title: title.trim(), color }];
  }

  removeCustomColumn(id: string) {
    // Move any task in this column back to 'todo'
    this.tasks = this.tasks.map((t) => (t.status === id ? { ...t, status: 'todo' } : t));
    this.customColumns = this.customColumns.filter((c) => c.id !== id);
  }

  getColumns(): KanbanColumnData[] {
    // Default 3 columns
    const columnsMap: Record<string, KanbanColumnData> = {
      todo: { id: 'todo', title: 'Todo', items: [] },
      in_progress: { id: 'in_progress', title: 'In Progress', items: [] },
      done: { id: 'done', title: 'Done', items: [] },
    };

    // Add custom columns
    this.customColumns.forEach((col) => {
      columnsMap[col.id] = {
        id: col.id,
        title: col.title,
        isCustom: true,
        color: col.color,
        items: [],
      };
    });

    // Populate items
    this.tasks.forEach((task) => {
      if (columnsMap[task.status]) {
        columnsMap[task.status].items.push(task);
      } else {
        // Dynamic column if task has unrecognized custom status
        columnsMap[task.status] = {
          id: task.status,
          title: task.status.replace(/_/g, ' ').toUpperCase(),
          isCustom: true,
          items: [task],
        };
      }
    });

    // Return in deterministic order: Todo, In Progress, [Customs...], Done
    const ordered: KanbanColumnData[] = [];
    if (columnsMap['todo']) ordered.push(columnsMap['todo']);
    if (columnsMap['in_progress']) ordered.push(columnsMap['in_progress']);

    Object.keys(columnsMap).forEach((key) => {
      if (key !== 'todo' && key !== 'in_progress' && key !== 'done') {
        ordered.push(columnsMap[key]);
      }
    });

    if (columnsMap['done']) ordered.push(columnsMap['done']);
    return ordered;
  }

  loadTasksFromPlan(plan: Plan | null) {
    if (!plan) {
      this.tasks = [];
      return;
    }

    const candidateDocs: PlanDocument[] = [];
    if (plan.mode === 'deep' && plan.documents) {
      plan.documents.forEach((d) => {
        if (d.type === 'phase') {
          if (this.filterPhase === 'all' || d.slug === this.filterPhase || d.path.includes(this.filterPhase)) {
            candidateDocs.push(d);
          }
        }
      });
    }

    // Fallback if no phase doc found
    if (candidateDocs.length === 0) {
      candidateDocs.push(plan.root);
    }

    const parsedTasks: KanbanTask[] = [];

    candidateDocs.forEach((doc) => {
      const lines = doc.body.split('\n');
      lines.forEach((line, index) => {
        const match = line.match(CHECKLIST_REGEX);
        if (match) {
          const marker = match[2].trim().toLowerCase();
          const title = match[4].trim();

          let status: TaskStatus = 'todo';
          if (marker === '/' || marker === 'wip') status = 'in_progress';
          else if (marker === 'x') status = 'done';
          else if (marker !== '') status = marker; // custom status

          parsedTasks.push({
            id: `${plan.slug}:${doc.type}:${index}`,
            planSlug: plan.slug,
            phaseSlug: doc.type,
            phaseTitle: doc.frontmatter.name || doc.type.toUpperCase(),
            title,
            status,
            lineIndex: index,
            rawLine: line,
          });
        }
      });
    });

    this.tasks = parsedTasks;
  }

  updateTaskStatus(task: KanbanTask, newStatus: TaskStatus) {
    const updatedTasks = this.tasks.map((t) =>
      t.id === task.id ? { ...t, status: newStatus } : t
    );
    this.tasks = updatedTasks;
    this.scheduleSave(task.planSlug, task.phaseSlug);
  }

  updateColumnItems(columnId: string, items: KanbanTask[]) {
    // Update tasks that belong to this column with the new status
    const updatedTasks = this.tasks.map((t) => {
      const inThisCol = items.find((item) => item.id === t.id);
      if (inThisCol) {
        return { ...t, status: columnId };
      }
      return t;
    });

    this.tasks = updatedTasks;

    // Trigger save for any modified plan documents
    const modifiedPhases = new Set<string>();
    items.forEach((item) => modifiedPhases.add(`${item.planSlug}:${item.phaseSlug}`));
    modifiedPhases.forEach((key) => {
      const [pSlug, phaseSlug] = key.split(':');
      this.scheduleSave(pSlug, phaseSlug);
    });
  }

  private scheduleSave(planSlug: string, docType: string) {
    const key = `${planSlug}:${docType}`;
    if (this.saveTimeouts.has(key)) {
      clearTimeout(this.saveTimeouts.get(key)!);
    }

    const timer = setTimeout(async () => {
      await this.saveDocumentToDisk(planSlug, docType);
      this.saveTimeouts.delete(key);
    }, 1500);

    this.saveTimeouts.set(key, timer);
  }

  private async saveDocumentToDisk(planSlug: string, docType: string) {
    const cwd = projectStore.currentPath;
    if (!cwd) return;

    // Get current plan
    const activePlan = plansStore.activePlan;
    if (!activePlan || activePlan.slug !== planSlug) return;

    const doc = activePlan.documents.find((d) => d.type === docType) || activePlan.root;
    if (!doc) return;

    // Filter tasks for this doc
    const docTasks = this.tasks.filter(
      (t) => t.planSlug === planSlug && t.phaseSlug === docType
    );

    // Map lineIndex -> task
    const taskByLine = new Map<number, KanbanTask>();
    docTasks.forEach((t) => taskByLine.set(t.lineIndex, t));

    const lines = doc.body.split('\n');
    let hasChanges = false;

    for (let i = 0; i < lines.length; i++) {
      const task = taskByLine.get(i);
      if (task) {
        const match = lines[i].match(CHECKLIST_REGEX);
        if (match) {
          let newMarker = ' ';
          if (task.status === 'in_progress') newMarker = '/';
          else if (task.status === 'done') newMarker = 'x';
          else if (task.status !== 'todo') newMarker = task.status;

          const newLine = `${match[1]}${newMarker}${match[3]}${match[4]}`;
          if (newLine !== lines[i]) {
            lines[i] = newLine;
            hasChanges = true;
          }
        }
      }
    }

    if (hasChanges) {
      const newBody = lines.join('\n');
      await plansStore.saveDocument(
        cwd,
        planSlug,
        docType as any,
        newBody,
        `Updated task statuses from Kanban Board`
      );
    }
  }
}

export const boardStore = new BoardStore();
