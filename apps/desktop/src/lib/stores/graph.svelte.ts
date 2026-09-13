import type { Plan, PlanDocument } from '@plannic/core';
import type { PlanFlowNode, PlanFlowEdge, PlanNodeData } from '../types/graph.js';

class GraphStore {
  viewMode = $state<'documents' | 'graph'>('documents');
  drawerOpen = $state(false);
  selectedNode = $state<PlanNodeData | null>(null);
  nodes = $state<PlanFlowNode[]>([]);
  edges = $state<PlanFlowEdge[]>([]);

  toggleViewMode() {
    this.viewMode = this.viewMode === 'documents' ? 'graph' : 'documents';
  }

  setViewMode(mode: 'documents' | 'graph') {
    this.viewMode = mode;
  }

  selectNode(data: PlanNodeData) {
    this.selectedNode = data;
    this.drawerOpen = true;
  }

  closeDrawer() {
    this.drawerOpen = false;
  }

  buildFromPlan(plan: Plan | null) {
    if (!plan) {
      this.nodes = [];
      this.edges = [];
      this.selectedNode = null;
      this.drawerOpen = false;
      return;
    }

    const newNodes: PlanFlowNode[] = [];
    const newEdges: PlanFlowEdge[] = [];

    // 1. Root Node (Plan)
    const rootDoc = plan.root;
    const rootNodeData: PlanNodeData = {
      slug: plan.slug,
      docType: 'plan',
      title: rootDoc.frontmatter.name || plan.slug,
      status: rootDoc.frontmatter.status || 'draft',
      version: rootDoc.frontmatter.version || '1.0',
      lastUpdated: rootDoc.frontmatter.lastUpdated || '',
      filename: `plan-${plan.slug}.md`,
      path: rootDoc.path || `plan-${plan.slug}.md`,
    };

    newNodes.push({
      id: `node-${plan.slug}-plan`,
      type: 'planNode',
      position: { x: 50, y: 220 },
      data: rootNodeData,
    });

    if (plan.mode === 'deep' && plan.documents) {
      // Find sub documents
      const scopeDoc = plan.documents.find((d) => d.type === 'scope');
      const featureDoc = plan.documents.find((d) => d.type === 'feature');
      const limitationDoc = plan.documents.find((d) => d.type === 'limitation');
      const phaseDocs = plan.documents.filter((d) => d.type === 'phase');

      // 2. Level 1: Scope (Y: 60)
      if (scopeDoc) {
        const id = `node-${plan.slug}-scope`;
        newNodes.push(this.createDocNode(scopeDoc, id, { x: 360, y: 60 }));
        newEdges.push(this.createEdge(`edge-plan-scope`, `node-${plan.slug}-plan`, id));
      }

      // 3. Level 1: Feature (Y: 220)
      if (featureDoc) {
        const id = `node-${plan.slug}-feature`;
        newNodes.push(this.createDocNode(featureDoc, id, { x: 360, y: 220 }));
        newEdges.push(this.createEdge(`edge-plan-feature`, `node-${plan.slug}-plan`, id));
      }

      // 4. Level 1: Limitation (Y: 380)
      if (limitationDoc) {
        const id = `node-${plan.slug}-limitation`;
        newNodes.push(this.createDocNode(limitationDoc, id, { x: 360, y: 380 }));
        newEdges.push(this.createEdge(`edge-plan-limitation`, `node-${plan.slug}-plan`, id));
      }

      // 5. Level 2: Phases (X: 680, starting Y: 140)
      if (phaseDocs.length > 0) {
        const featureNodeId = featureDoc ? `node-${plan.slug}-feature` : `node-${plan.slug}-plan`;
        const startY = phaseDocs.length === 1 ? 220 : 140;

        phaseDocs.forEach((phaseDoc, index) => {
          const id = `node-${plan.slug}-phase-${index + 1}`;
          const posY = startY + index * 140;
          newNodes.push(this.createDocNode(phaseDoc, id, { x: 680, y: posY }));
          newEdges.push(this.createEdge(`edge-feature-phase-${index + 1}`, featureNodeId, id));
        });
      }
    }

    this.nodes = newNodes;
    this.edges = newEdges;
  }

  private createDocNode(
    doc: PlanDocument,
    id: string,
    position: { x: number; y: number }
  ): PlanFlowNode {
    const filename = doc.path.split(/[/\\]/).pop() || `${doc.type}-${doc.slug}.md`;
    return {
      id,
      type: 'planNode',
      position,
      data: {
        slug: doc.slug,
        docType: doc.type,
        title: doc.frontmatter.name || doc.type.toUpperCase(),
        status: doc.frontmatter.status || 'draft',
        version: doc.frontmatter.version || '1.0',
        lastUpdated: doc.frontmatter.lastUpdated || '',
        filename,
        path: doc.path,
      },
    };
  }

  private createEdge(id: string, source: string, target: string): PlanFlowEdge {
    return {
      id,
      source,
      target,
      type: 'smoothstep',
      animated: false,
      style: 'stroke: var(--base-border-hi); stroke-width: 1.5px;',
    };
  }
}

export const graphStore = new GraphStore();
