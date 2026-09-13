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

const server = new McpServer({
  name: "plannic",
  version: "0.1.0",
});

// Register all 8 MCP tools
registerGetConfig(server);
registerInitPlan(server);
registerGetPlan(server);
registerUpdateDocument(server);
registerListPlans(server);
registerSearchPlans(server);
registerGetHistory(server);
registerMoveTask(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Plannic MCP Server started on stdio (8 tools registered)");
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

main().catch((error) => {
  console.error("Fatal error starting Plannic MCP server:", error);
  process.exit(1);
});
