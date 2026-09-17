import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AdvancePhaseInputSchema } from "@plannic/core";
import { advancePhase } from "@plannic/fs";

export function registerAdvancePhase(server: McpServer) {
  server.registerTool(
    "advance_phase",
    {
      title: "Advance Phase",
      description: "Advance a plan to its next sequential phase after validating that all tasks in the current phase are complete",
      inputSchema: AdvancePhaseInputSchema.shape,
    },
    async ({ cwd, slug, force, comment }) => {
      try {
        const result = await advancePhase(cwd, {
          cwd,
          slug,
          force,
          comment,
        });

        if (!result.success) {
          return {
            content: [
              {
                type: "text" as const,
                text: result.message,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Plan "${slug}" advanced from Phase ${result.previousPhase} to Phase ${result.currentPhase}.\n${result.message}`,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error advancing phase: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
