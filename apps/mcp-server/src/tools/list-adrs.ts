import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListAdrsInputSchema } from "@plannic/core";
import { listAdrs, formatAdrNumber } from "@plannic/headless";

export function registerListAdrs(server: McpServer) {
  server.registerTool(
    "list_adrs",
    {
      title: "List ADRs",
      description: "List all Architecture Decision Records in .docs/adrs/ with their status and metadata",
      inputSchema: ListAdrsInputSchema.shape,
    },
    async ({ cwd, status }) => {
      try {
        const adrs = await listAdrs(cwd, status);
        if (adrs.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: status ? `No ADRs found with status "${status}".` : "No ADRs found in .docs/adrs/.",
              },
            ],
          };
        }

        const lines = adrs.map(
          (a) =>
            `- [ADR #${formatAdrNumber(a.number)}] ${a.title} (${a.status}) — ${a.date}${a.description ? `\n  ${a.description}` : ""}`
        );

        return {
          content: [
            {
              type: "text" as const,
              text: `Found ${adrs.length} ADR(s):\n\n${lines.join("\n")}`,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error listing ADRs: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
