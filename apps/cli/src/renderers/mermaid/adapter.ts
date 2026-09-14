import type { ViewRendererAdapter, RenderContext } from "../types.js";

export class MermaidRendererAdapter implements ViewRendererAdapter {
  id = "mermaid" as const;
  displayName = "Mermaid Diagram";

  canRender(_docType: string, content: string): boolean {
    return content.includes("```mermaid");
  }

  render(content: string, _context: RenderContext) {
    const lines = content.split("\n");
    const output: string[] = [
      "\x1b[35m┌─── [Mermaid Diagram Slot] ──────────────────────────┐\x1b[0m",
      "\x1b[90m│ (Visual terminal graph adapter slot initialized)     │\x1b[0m",
      "\x1b[35m└──────────────────────────────────────────────────────┘\x1b[0m",
      "",
    ];

    // Extract diagram blocks and display them clearly
    let inside = false;
    for (const line of lines) {
      if (line.trim().startsWith("```mermaid")) {
        inside = true;
        output.push("\x1b[36m◈ Flowchart / Architecture:\x1b[0m");
        continue;
      }
      if (inside && line.trim().startsWith("```")) {
        inside = false;
        output.push("");
        continue;
      }
      if (inside) {
        output.push(`  \x1b[33m│\x1b[0m \x1b[97m${line}\x1b[0m`);
      }
    }

    return output;
  }
}
