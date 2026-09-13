import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListPlansInputSchema } from "@plannic/core";
import { listPlans } from "@plannic/fs";

export function registerListPlans(server: McpServer) {
  server.registerTool(
    "list_plans",
    {
      title: "List Plans",
      description: "List all plans found in .docs/ with metadata summaries",
      inputSchema: ListPlansInputSchema.shape,
    },
    async ({ cwd }) => {
      try {
        const plans = await listPlans(cwd);
        if (plans.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No plans found in "${cwd}/.docs". Use "init_plan" to create one.`,
              },
            ],
          };
        }

        const lines = plans.map(
          (p) =>
            `- **${p.name}** (\`${p.slug}\`)\n  Mode: ${p.mode} | Status: ${p.status} | Version: v${p.version} | Docs: ${p.documentCount}\n  Updated: ${p.lastUpdated}`
        );

        return {
          content: [
            {
              type: "text" as const,
              text: `# Plans in .docs/ (${plans.length})\n\n${lines.join("\n\n")}`,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error listing plans: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
