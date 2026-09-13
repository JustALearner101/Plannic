import type { Node, Edge } from '@xyflow/svelte';
import type { DocType, PlanStatus } from '@plannic/core';

export interface PlanNodeData extends Record<string, unknown> {
  slug: string;
  docType: DocType;
  title: string;
  status: PlanStatus;
  version: string;
  lastUpdated: string;
  filename: string;
  path: string;
  excerpt?: string;
}

export type PlanFlowNode = Node<PlanNodeData, 'planNode'>;
export type PlanFlowEdge = Edge;
