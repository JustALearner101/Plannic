import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListSpecsInputSchema } from "@plannic/core";
import { listSpecs } from "@plannic/headless";

export function registerListSpecs(server: McpServer) {
  server.registerTool(
    "list_specs",
    {
      title: "List Specifications",
      description: "List all Living Specifications and API contracts in .docs/specs/ with their status and category",
      inputSchema: ListSpecsInputSchema.shape,
    },
    async ({ cwd, category, status }) => {
      try {
        const specs = await listSpecs(cwd, category, status);
        if (specs.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No specifications found in .docs/specs/.",
              },
            ],
          };
        }

        const lines = specs.map(
          (s) =>
            `- [${s.slug}] ${s.title} (v${s.version}, ${s.status}) [${s.category ?? "general"}] — Updated: ${s.lastUpdated}${s.description ? `\n  ${s.description}` : ""}`
        );

        return {
          content: [
            {
              type: "text" as const,
              text: `Found ${specs.length} specification(s):\n\n${lines.join("\n")}`,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error listing specifications: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
