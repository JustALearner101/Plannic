import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetPlanInputSchema } from "@plannic/core";
import { readPlan } from "@plannic/fs";

export function registerGetPlan(server: McpServer) {
  server.registerTool(
    "get_plan",
    {
      title: "Get Plan",
      description: "Retrieve a plan and its full document tree from .docs/",
      inputSchema: GetPlanInputSchema.shape,
    },
    async ({ cwd, slug }) => {
      try {
        const plan = await readPlan(cwd, slug);
        if (!plan) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Plan with slug "${slug}" not found in "${cwd}/.docs".`,
              },
            ],
            isError: true,
          };
        }

        const formattedDocs = plan.documents
          .map((doc) => `### Document: ${doc.type.toUpperCase()} (${doc.frontmatter.name})\nFile: ${doc.path}\nVersion: ${doc.frontmatter.version} | Status: ${doc.frontmatter.status}\n\n${doc.body}`)
          .join("\n\n---\n\n");

        return {
          content: [
            {
              type: "text" as const,
              text: `# Plan: ${plan.root.frontmatter.name} (${plan.slug})\nMode: ${plan.mode}\nTotal Documents: ${plan.documents.length}\n\n${formattedDocs}`,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error retrieving plan: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
