import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetSpecInputSchema } from "@plannic/core";
import { readSpec } from "@plannic/headless";

export function registerGetSpec(server: McpServer) {
  server.registerTool(
    "get_spec",
    {
      title: "Get Specification",
      description: "Retrieve a Living Specification or API Contract by slug from .docs/specs/",
      inputSchema: GetSpecInputSchema.shape,
    },
    async ({ cwd, slug }) => {
      try {
        const spec = await readSpec(cwd, slug);
        if (!spec) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Specification "${slug}" not found in .docs/specs/.`,
              },
            ],
            isError: true,
          };
        }

        const header = `Specification: ${spec.frontmatter.title} (v${spec.frontmatter.version}, ${spec.frontmatter.status})\nCategory: ${spec.frontmatter.category ?? "general"}\nLast Updated: ${spec.frontmatter.lastUpdated}\nPath: ${spec.path}\n`;
        return {
          content: [
            {
              type: "text" as const,
              text: `${header}\n${spec.body}`,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error retrieving specification: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
