import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SearchPlansInputSchema } from "@plannic/core";
import { searchPlans } from "@plannic/headless";

export function registerSearchPlans(server: McpServer) {
  server.registerTool(
    "search_plans",
    {
      title: "Search Plans",
      description: "Fuzzy search across all plans and documents in .docs/",
      inputSchema: SearchPlansInputSchema.shape,
    },
    async ({ cwd, query, limit }) => {
      try {
        const results = await searchPlans(cwd, query, limit ?? 5);
        if (results.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No matching plans or documents found for query "${query}".`,
              },
            ],
          };
        }

        const formatted = results
          .map(
            (r) =>
              `- **${r.planName}** (\`${r.slug}\`) — *${r.docType.toUpperCase()}* (${r.documentFile})\n  Excerpt: "${r.excerpt}"`
          )
          .join("\n\n");

        return {
          content: [
            {
              type: "text" as const,
              text: `# Search Results for "${query}" (${results.length})\n\n${formatted}`,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error searching plans: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
