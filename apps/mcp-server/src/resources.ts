import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listPlans, listAdrs, listSpecs } from "@plannic/headless";

export function registerResources(server: McpServer) {
  // 1. plannic://plans
  server.registerResource(
    "all_plans",
    "plannic://plans",
    {
      title: "All Plans",
      description: "Listing of all feature and architecture plans in the project",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const cwd = process.cwd();
      const plans = await listPlans(cwd);
      const text =
        plans.length === 0
          ? "# Plannic Plans\n\nNo plans found in .docs/."
          : `# Plannic Plans\n\n${plans
              .map(
                (p) =>
                  `- **${p.name}** (\`${p.slug}\`) [${p.mode} mode]: ${p.status} (v${p.version}) — ${p.documentCount} document(s)`
              )
              .join("\n")}`;
      return {
        contents: [
          {
            uri: uri.href,
            text,
            mimeType: "text/markdown",
          },
        ],
      };
    }
  );

  // 2. plannic://adrs
  server.registerResource(
    "all_adrs",
    "plannic://adrs",
    {
      title: "All Architecture Decision Records",
      description: "Listing of all ADRs recorded in .docs/adrs/",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const cwd = process.cwd();
      const adrs = await listAdrs(cwd);
      const text =
        adrs.length === 0
          ? "# Architecture Decision Records\n\nNo ADRs found in .docs/adrs/."
          : `# Architecture Decision Records\n\n${adrs
              .map(
                (a) =>
                  `- **ADR #${String(a.number).padStart(4, "0")}**: ${a.title} [${a.status}] (${a.date})${a.description ? ` — ${a.description}` : ""}`
              )
              .join("\n")}`;
      return {
        contents: [
          {
            uri: uri.href,
            text,
            mimeType: "text/markdown",
          },
        ],
      };
    }
  );

  // 3. plannic://specs
  server.registerResource(
    "all_specs",
    "plannic://specs",
    {
      title: "All Living Specifications",
      description: "Listing of all living specifications and API contracts in .docs/specs/",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const cwd = process.cwd();
      const specs = await listSpecs(cwd);
      const text =
        specs.length === 0
          ? "# Living Specifications\n\nNo specifications found in .docs/specs/."
          : `# Living Specifications\n\n${specs
              .map(
                (s) =>
                  `- **${s.title}** (\`${s.slug}\`) [${s.category ?? "general"}]: v${s.version} (${s.status})${s.description ? ` — ${s.description}` : ""}`
              )
              .join("\n")}`;
      return {
        contents: [
          {
            uri: uri.href,
            text,
            mimeType: "text/markdown",
          },
        ],
      };
    }
  );
}
