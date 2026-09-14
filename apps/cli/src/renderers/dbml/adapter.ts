import type { ViewRendererAdapter, RenderContext } from "../types.js";

export class DbmlRendererAdapter implements ViewRendererAdapter {
  id = "dbml" as const;
  displayName = "DBML Schema";

  canRender(_docType: string, content: string): boolean {
    return content.includes("```dbml");
  }

  render(content: string, _context: RenderContext) {
    const lines = content.split("\n");
    const output: string[] = [
      "\x1b[34m┌─── [DBML Schema Diagram Slot] ──────────────────────┐\x1b[0m",
      "\x1b[90m│ (Database Entity Relationship adapter slot)          │\x1b[0m",
      "\x1b[34m└──────────────────────────────────────────────────────┘\x1b[0m",
      "",
    ];

    let inside = false;
    for (const line of lines) {
      if (line.trim().startsWith("```dbml")) {
        inside = true;
        output.push("\x1b[36m⊞ Database Tables & Relationships:\x1b[0m");
        continue;
      }
      if (inside && line.trim().startsWith("```")) {
        inside = false;
        output.push("");
        continue;
      }
      if (inside) {
        output.push(`  \x1b[34m│\x1b[0m \x1b[97m${line}\x1b[0m`);
      }
    }

    return output;
  }
}
