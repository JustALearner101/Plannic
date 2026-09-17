import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MigratePlansInputSchema } from "@plannic/core";
import { migrateAllPlans } from "@plannic/fs";

export function registerMigratePlan(server: McpServer) {
  server.registerTool(
    "migrate_plans",
    {
      title: "Migrate Plans to Hierarchical",
      description:
        "Migrate legacy flat plans in .docs/ (e.g. plan-<slug>.md) to the modern hierarchical directory layout (.docs/plans/<slug>/) with safety verification.",
      inputSchema: MigratePlansInputSchema.shape,
    },
    async ({ cwd, slug, dryRun }) => {
      try {
        const result = await migrateAllPlans({
          cwd,
          slug,
          dryRun: dryRun ?? false,
        });

        if (result.totalPlans === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No legacy flat plans found to migrate in "${cwd}/.docs". All plans are already hierarchical or no plans exist.`,
              },
            ],
          };
        }

        const details = result.migrated
          .map((m) => {
            if (!m.success) {
              return `❌ **${m.slug}**: Failed - ${m.error}`;
            }
            const modeLabel = dryRun ? "[SIMULATION]" : "[MIGRATED]";
            const files = m.filesMoved
              .map((f) => `  - \`${f.from}\` ➔ \`${f.to}\``)
              .join("\n");
            return `✅ **${m.slug}** ${modeLabel}:\n${files}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text" as const,
              text: `# Plan Migration Results (${result.successCount}/${result.totalPlans} successful)\nMode: ${
                dryRun ? "Dry-run (no files modified)" : "Live Migration"
              }\n\n${details}`,
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error during plan migration: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
