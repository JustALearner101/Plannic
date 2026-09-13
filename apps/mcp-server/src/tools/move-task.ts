import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MoveTaskInputSchema } from "@plannic/core";
import { moveTask } from "@plannic/fs";

export function registerMoveTask(server: McpServer) {
  server.registerTool(
    "move_task",
    {
      title: "Move Task",
      description: "Move a checklist task between status columns (todo, in_progress, done, or custom status) in a plan's phase documents",
      inputSchema: MoveTaskInputSchema.shape,
    },
    async ({ cwd, slug, taskIdentifier, newStatus, phaseSlug, comment }) => {
      try {
        const result = await moveTask(
          cwd,
          slug,
          taskIdentifier,
          newStatus,
          phaseSlug,
          comment,
          "ai-agent"
        );
        return {
          content: [
            {
              type: "text" as const,
              text: `Task "${result.taskTitle}" in plan "${slug}" moved from [${result.previousStatus}] to [${result.newStatus}].\nDocument: ${result.documentFile} (v${result.version})`,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error moving task: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
