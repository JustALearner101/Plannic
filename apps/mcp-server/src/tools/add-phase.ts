import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AddPhaseInputSchema } from "@plannic/core";
import { addPhase } from "@plannic/fs";

export function registerAddPhase(server: McpServer) {
  server.registerTool(
    "add_phase",
    {
      title: "Add Phase",
      description: "Add a new sequential phase document (phase-2.md, phase-3.md, etc.) to a plan and register it in the root plan document",
      inputSchema: AddPhaseInputSchema.shape,
    },
    async ({ cwd, slug, title, deliverables }) => {
      try {
        const result = await addPhase(cwd, {
          cwd,
          slug,
          title,
          deliverables,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Added ${result.phaseSlug} to plan "${slug}".\nPath: ${result.filePath}`,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error adding phase: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
