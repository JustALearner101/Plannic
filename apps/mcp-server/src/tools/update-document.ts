import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { UpdateDocumentInputSchema } from "@plannic/core";
import { updateDocument } from "@plannic/headless";

export function registerUpdateDocument(server: McpServer) {
  server.registerTool(
    "update_document",
    {
      title: "Update Document",
      description: "Update the body of a specific document in a plan's document tree",
      inputSchema: UpdateDocumentInputSchema.shape,
    },
    async ({ cwd, slug, docType, body, changeSummary, changedBy }) => {
      try {
        const result = await updateDocument(
          cwd,
          slug,
          docType,
          body,
          changeSummary ?? `Updated ${docType} document`,
          changedBy ?? "claude-code"
        );
        return {
          content: [
            {
              type: "text" as const,
              text: `Document "${docType}" for plan "${slug}" updated successfully.\nNew Version: ${result.version}\nPath: ${result.path}`,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error updating document: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
