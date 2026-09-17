import { describe, it, expect } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import {
  withTempWorkspace,
  seedMinimalRepo,
  seedStandardRepo,
  createMcpClient,
} from "../harness/index.js";
import { listPlans, listAdrs, listSpecs } from "../../packages/fs/src/index.js";

describe("E2E Test Harness & Sandbox", () => {
  it("should create an isolated sandbox and clean up automatically", async () => {
    let capturedPath = "";
    await withTempWorkspace(async (ws) => {
      capturedPath = ws.path;
      const stat = await fs.stat(ws.docsPath);
      expect(stat.isDirectory()).toBe(true);

      const configContent = await fs.readFile(ws.configPath, "utf-8");
      expect(configContent).toContain("Plannic E2E Test");
    });

    // Verify it was cleaned up
    const exists = await fs.stat(capturedPath).catch(() => null);
    expect(exists).toBeNull();
  });

  it("should seed standard repository with plans, ADRs, and specs", async () => {
    await withTempWorkspace(async (ws) => {
      await seedStandardRepo(ws.path);

      const plans = await listPlans(ws.path);
      expect(plans.length).toBe(3);

      const adrs = await listAdrs(ws.path);
      expect(adrs.length).toBe(3);

      const specs = await listSpecs(ws.path);
      expect(specs.length).toBe(2);
    });
  });

  it("should communicate with MCP server via stdio against the sandbox", async () => {
    await withTempWorkspace(async (ws) => {
      await seedMinimalRepo(ws.path);

      const client = await createMcpClient(ws.path);
      try {
        const tools = await client.listTools();
        expect(tools.length).toBe(19);

        // Call get_config
        const configRes = await client.callTool("get_config", { cwd: ws.path });
        expect(configRes.content[0].text).toContain("Plannic E2E Test");

        // Call list_plans
        const plansRes = await client.callTool("list_plans", { cwd: ws.path });
        expect(plansRes.content[0].text).toContain("Quick Prototype");
      } finally {
        await client.close();
      }
    });
  });
});
