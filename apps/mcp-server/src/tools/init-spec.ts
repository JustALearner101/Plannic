import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { InitSpecInputSchema } from "@plannic/core";
import { initSpec } from "@plannic/fs";

export function registerInitSpec(server: McpServer) {
  server.registerTool(
    "init_spec",
    {
      title: "Initialize Specification",
      description: "Initialize a new Living Specification or API Contract in .docs/specs/",
      inputSchema: InitSpecInputSchema.shape,
    },
    async ({ cwd, title, category, description, tags }) => {
      try {
        const result = await initSpec(cwd, { cwd, title, category, description, tags });
        return {
          content: [
            {
              type: "text" as const,
              text: `Specification "${title}" (${result.slug}) created successfully in .docs/specs/.\nPath: ${result.path}`,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error initializing specification: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
