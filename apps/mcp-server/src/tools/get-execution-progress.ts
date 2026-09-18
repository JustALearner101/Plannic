import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetExecutionProgressInputSchema } from "@plannic/core";
import { getExecutionProgress } from "@plannic/headless";

export function registerGetExecutionProgress(server: McpServer) {
  server.registerTool(
    "get_execution_progress",
    {
      title: "Get Execution Progress",
      description: "Get aggregate completion percentage, active phase, and per-phase metrics across a plan's multi-phase roadmap",
      inputSchema: GetExecutionProgressInputSchema.shape,
    },
    async ({ cwd, slug }) => {
      try {
        const result = await getExecutionProgress(cwd, slug);

        const lines = [
          `# Execution Progress: ${result.planSlug}`,
          `Active Phase: Phase ${result.activePhase} of ${result.totalPhases}`,
          `Overall Progress: ${result.aggregatePercentage}%`,
          "",
          "## Phases:",
        ];

        for (const p of result.phases) {
          const currentBadge = p.isCurrent ? " [ACTIVE]" : "";
          const checkBadge = p.isCompleted ? " [COMPLETED]" : "";
          lines.push(
            `- **Phase ${p.phaseNumber}** (${p.title}): ${p.percentage}% (${p.completedTasks}/${p.totalTasks} tasks)${currentBadge}${checkBadge}`
          );
        }

        return {
          content: [
            {
              type: "text" as const,
              text: lines.join("\n"),
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error getting execution progress: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
