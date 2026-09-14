import type { ViewRendererAdapter, RenderContext } from "../types.js";
import { highlightMarkdownToAnsi } from "./ansi-highlighter.js";

export class MarkdownRendererAdapter implements ViewRendererAdapter {
  id = "markdown" as const;
  displayName = "Markdown";

  canRender(_docType: string, _content: string): boolean {
    return true; // Default fallback
  }

  render(content: string, _context: RenderContext) {
    return highlightMarkdownToAnsi(content);
  }
}
