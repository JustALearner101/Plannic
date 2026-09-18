import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetConfigInputSchema } from "@plannic/core";
import { readConfig } from "@plannic/headless";

export function registerGetConfig(server: McpServer) {
  server.registerTool(
    "get_config",
    {
      title: "Get Project Configuration",
      description: "Read the project configuration and context from .plannic/config.md",
      inputSchema: GetConfigInputSchema.shape,
    },
    async ({ cwd }) => {
      try {
        const result = await readConfig(cwd);
        if (!result.found) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No .plannic/config.md found in "${cwd}". Consider creating one to provide project context, tech stack, and planning rules.`,
              },
            ],
            isError: false,
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: result.raw,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error reading config: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
