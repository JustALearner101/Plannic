import type { ViewRendererAdapter, RendererType } from "./types.js";
import { MarkdownRendererAdapter } from "./markdown/adapter.js";
import { MermaidRendererAdapter } from "./mermaid/adapter.js";
import { DbmlRendererAdapter } from "./dbml/adapter.js";

export class RendererRegistry {
  private adapters: Map<RendererType, ViewRendererAdapter> = new Map();
  private defaultAdapter: ViewRendererAdapter;

  constructor() {
    const md = new MarkdownRendererAdapter();
    this.defaultAdapter = md;
    this.register(md);
    this.register(new MermaidRendererAdapter());
    this.register(new DbmlRendererAdapter());
  }

  register(adapter: ViewRendererAdapter) {
    this.adapters.set(adapter.id, adapter);
  }

  resolve(docType: string, content: string): ViewRendererAdapter {
    // Check if any specialized diagram adapter wants to render this
    for (const [id, adapter] of this.adapters) {
      if (id !== "markdown" && adapter.canRender(docType, content)) {
        return adapter;
      }
    }
    return this.defaultAdapter;
  }

  getAdapter(id: RendererType): ViewRendererAdapter | undefined {
    return this.adapters.get(id);
  }
}

export const defaultRendererRegistry = new RendererRegistry();
