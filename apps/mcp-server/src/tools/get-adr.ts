import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetAdrInputSchema } from "@plannic/core";
import { readAdr } from "@plannic/headless";

export function registerGetAdr(server: McpServer) {
  server.registerTool(
    "get_adr",
    {
      title: "Get ADR",
      description: "Retrieve an Architecture Decision Record (ADR) by number or slug from .docs/adrs/",
      inputSchema: GetAdrInputSchema.shape,
    },
    async ({ cwd, number, slug }) => {
      try {
        const adr = await readAdr(cwd, { number, slug });
        if (!adr) {
          return {
            content: [
              {
                type: "text" as const,
                text: `ADR not found for identifier: ${number !== undefined ? `#${number}` : slug}`,
              },
            ],
            isError: true,
          };
        }

        const info = `ADR #${adr.number}: ${adr.frontmatter.title} (${adr.frontmatter.status})\nDate: ${adr.frontmatter.date}\nPath: ${adr.path}\n\n${adr.body}`;
        return {
          content: [
            {
              type: "text" as const,
              text: info,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error retrieving ADR: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
