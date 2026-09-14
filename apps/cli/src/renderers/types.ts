export type RendererType = "markdown" | "mermaid" | "dbml" | "chart" | "raw";

export interface RenderContext {
  width: number;
  height: number;
  theme: "dark" | "light";
  colorSupport: boolean;
}

export interface ViewRendererAdapter {
  id: RendererType;
  displayName: string;
  canRender(docType: string, content: string): boolean;
  render(content: string, context: RenderContext): any;
}
