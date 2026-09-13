export type BuiltInTaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskStatus = BuiltInTaskStatus | string;

export interface KanbanTask {
  id: string;
  planSlug: string;
  phaseSlug: string;
  phaseTitle: string;
  title: string;
  status: TaskStatus;
  lineIndex: number;
  rawLine: string;
}

export interface KanbanColumnData {
  id: string;
  title: string;
  isCustom?: boolean;
  color?: string;
  items: KanbanTask[];
}
