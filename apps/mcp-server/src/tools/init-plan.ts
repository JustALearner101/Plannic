import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { InitPlanInputSchema } from "@plannic/core";
import { initPlan } from "@plannic/fs";

export function registerInitPlan(server: McpServer) {
  server.registerTool(
    "init_plan",
    {
      title: "Initialize Plan",
      description: "Initialize a new plan in .docs/ with quick mode (single file) or deep mode (document tree)",
      inputSchema: InitPlanInputSchema.shape,
    },
    async ({ cwd, name, mode }) => {
      try {
        const result = await initPlan(cwd, name, mode);
        const formattedFiles = result.filesCreated
          .map((f) => {
            const norm = f.replace(/\\/g, "/");
            return `- ${norm.startsWith(".docs") ? norm : `.docs/${norm}`}`;
          })
          .join("\n");
        return {
          content: [
            {
              type: "text" as const,
              text: `Plan "${name}" (${result.slug}) initialized successfully in ${mode} mode.\nFiles created:\n${formattedFiles}`,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error initializing plan: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
