import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { UpdateSpecInputSchema } from "@plannic/core";
import { updateSpec } from "@plannic/fs";

export function registerUpdateSpec(server: McpServer) {
  server.registerTool(
    "update_spec",
    {
      title: "Update Specification",
      description: "Update the content and/or status of a Living Specification in .docs/specs/ with semver bump and audit logging",
      inputSchema: UpdateSpecInputSchema.shape,
    },
    async ({ cwd, slug, body, changeSummary, changedBy, status }) => {
      try {
        const result = await updateSpec(cwd, { cwd, slug, body, changeSummary, changedBy, status });
        return {
          content: [
            {
              type: "text" as const,
              text: `Specification "${slug}" updated successfully.\nNew Version: ${result.version}\nPath: ${result.path}`,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error updating specification: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
