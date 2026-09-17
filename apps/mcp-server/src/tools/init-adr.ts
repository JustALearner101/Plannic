import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { InitAdrInputSchema } from "@plannic/core";
import { initAdr } from "@plannic/fs";

export function registerInitAdr(server: McpServer) {
  server.registerTool(
    "init_adr",
    {
      title: "Initialize ADR",
      description: "Initialize a new Architecture Decision Record (ADR) with auto-incremented number in .docs/adrs/",
      inputSchema: InitAdrInputSchema.shape,
    },
    async ({ cwd, title, status, deciders, description, tags }) => {
      try {
        const result = await initAdr(cwd, { cwd, title, status, deciders, description, tags });
        return {
          content: [
            {
              type: "text" as const,
              text: `ADR #${result.number} ("${title}") created successfully.\nPath: ${result.path}\nStatus: ${status ?? "proposed"}`,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error initializing ADR: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
