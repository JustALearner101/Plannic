import { describe, it, expect } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { withTempWorkspace, createMcpClient } from "../harness/index.js";
import { readPlan, listPlans, updateDocument, readHistory } from "../../packages/fs/src/index.js";

describe("Phase 4: Concurrency & File Sync Stability E2E", () => {
  it("should handle simultaneous writes from MCP server and local FS without corruption", async () => {
    await withTempWorkspace(async (ws) => {
      const client = await createMcpClient(ws.path);

      try {
        // 1. Create a deep plan
        await client.callTool("init_plan", {
          cwd: ws.path,
          name: "Concurrent Testing Plan",
          mode: "deep",
        });

        const slug = "concurrent-testing-plan";

        // 2. Perform concurrent parallel operations:
        // - Operation A: MCP server updating scope
        // - Operation B: Direct FS updating feature
        // - Operation C: Direct FS updating limitation
        // - Operation D: Continuous read operations
        const p1 = client.callTool("update_document", {
          cwd: ws.path,
          slug,
          docType: "scope",
          body: "## In Scope\n- Concurrently written by MCP client",
          changeSummary: "MCP scope update",
          changedBy: "mcp-agent",
        });

        const p2 = updateDocument(
          ws.path,
          slug,
          "feature",
          "## Features\n- Concurrently written by Local FS Engine",
          "FS feature update",
          "local-fs"
        );

        const p3 = updateDocument(
          ws.path,
          slug,
          "limitation",
          "## Limitations\n- Concurrently written by Background Worker",
          "Worker limitation update",
          "worker"
        );

        // Wait for all concurrent writes to settle
        const [res1, res2, res3] = await Promise.all([p1, p2, p3]);

        expect(res1.content[0].text).toContain("updated successfully");
        expect(res2.success).toBe(true);
        expect(res3.success).toBe(true);

        // 3. Verify final plan state
        const plan = await readPlan(ws.path, slug);
        expect(plan).not.toBeNull();

        const scopeDoc = plan?.documents.find((d) => d.type === "scope");
        expect(scopeDoc?.body).toContain("Concurrently written by MCP client");

        const featureDoc = plan?.documents.find((d) => d.type === "feature");
        expect(featureDoc?.body).toContain("Concurrently written by Local FS Engine");

        const limitDoc = plan?.documents.find((d) => d.type === "limitation");
        expect(limitDoc?.body).toContain("Concurrently written by Background Worker");

        // 4. Verify audit history jsonl integrity (must have valid JSON on every line)
        const history = await readHistory(ws.path, slug);
        expect(history.length).toBeGreaterThanOrEqual(4); // created + 3 updates
        for (const entry of history) {
          expect(entry.timestamp).toBeDefined();
          expect(entry.summary).toBeDefined();
        }
      } finally {
        await client.close();
      }
    });
  });
});
