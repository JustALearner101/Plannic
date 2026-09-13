import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetHistoryInputSchema } from "@plannic/core";
import { readHistory } from "@plannic/fs";

export function registerGetHistory(server: McpServer) {
  server.registerTool(
    "get_history",
    {
      title: "Get History",
      description: "Get the changelog history entries for a plan from .docs/.history/plan-<slug>.jsonl",
      inputSchema: GetHistoryInputSchema.shape,
    },
    async ({ cwd, slug, limit }) => {
      try {
        const history = await readHistory(cwd, slug, limit ?? 20);
        if (history.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No history entries found for plan "${slug}".`,
              },
            ],
          };
        }

        const lines = history.map(
          (h) =>
            `- [${h.timestamp}] **${h.document}** (v${h.version}) via *${h.changedBy}*\n  ${h.summary}`
        );

        return {
          content: [
            {
              type: "text" as const,
              text: `# History for "${slug}" (${history.length} entries)\n\n${lines.join("\n\n")}`,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error reading history: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
