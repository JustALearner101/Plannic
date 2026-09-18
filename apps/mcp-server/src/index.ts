#!/usr/bin/env bun
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGetConfig } from "./tools/get-config.js";
import { registerInitPlan } from "./tools/init-plan.js";
import { registerGetPlan } from "./tools/get-plan.js";
import { registerUpdateDocument } from "./tools/update-document.js";
import { registerListPlans } from "./tools/list-plans.js";
import { registerSearchPlans } from "./tools/search-plans.js";
import { registerGetHistory } from "./tools/get-history.js";
import { registerMoveTask } from "./tools/move-task.js";
import { registerInitAdr } from "./tools/init-adr.js";
import { registerGetAdr } from "./tools/get-adr.js";
import { registerListAdrs } from "./tools/list-adrs.js";
import { registerInitSpec } from "./tools/init-spec.js";
import { registerGetSpec } from "./tools/get-spec.js";
import { registerUpdateSpec } from "./tools/update-spec.js";
import { registerListSpecs } from "./tools/list-specs.js";
import { registerMigratePlan } from "./tools/migrate-plan.js";
import { registerAddPhase } from "./tools/add-phase.js";
import { registerAdvancePhase } from "./tools/advance-phase.js";
import { registerGetExecutionProgress } from "./tools/get-execution-progress.js";
import { registerResources } from "./resources.js";
import { registerPrompts } from "./prompts.js";

const server = new McpServer({
  name: "plannic",
  version: "0.3.1",
});

// Register all 19 MCP tools
registerGetConfig(server);
registerInitPlan(server);
registerGetPlan(server);
registerUpdateDocument(server);
registerListPlans(server);
registerSearchPlans(server);
registerGetHistory(server);
registerMoveTask(server);
registerInitAdr(server);
registerGetAdr(server);
registerListAdrs(server);
registerInitSpec(server);
registerGetSpec(server);
registerUpdateSpec(server);
registerListSpecs(server);
registerMigratePlan(server);
registerAddPhase(server);
registerAdvancePhase(server);
registerGetExecutionProgress(server);

// Register MCP Resources and Prompts
registerResources(server);
registerPrompts(server);

export async function startMcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Plannic MCP Server started on stdio (19 tools, 3 resources, 2 prompts registered)");
}

process.on("SIGINT", async () => {
  console.error("Shutting down Plannic MCP server (SIGINT)...");
  await server.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.error("Shutting down Plannic MCP server (SIGTERM)...");
  await server.close();
  process.exit(0);
});

if (import.meta.main) startMcpServer().catch((error) => {
  console.error("Fatal error starting Plannic MCP server:", error);
  process.exit(1);
});
