import { describe, it, expect } from "bun:test";
import { withTempWorkspace, createMcpClient } from "../harness/index.js";

describe("Phase 3: MCP Server Full Protocol & 15 Tools E2E", () => {
  it("should verify complete lifecycle across all 15 MCP tools in an isolated sandbox", async () => {
    await withTempWorkspace(async (ws) => {
      const client = await createMcpClient(ws.path);

      try {
        // 1. Tool: get_config
        const configRes = await client.callTool("get_config", { cwd: ws.path });
        expect(configRes.content[0].text).toContain("Plannic E2E Test");

        // 2. Tool: init_plan (quick mode)
        const quickPlanRes = await client.callTool("init_plan", {
          cwd: ws.path,
          name: "Quick Architecture Spike",
          mode: "quick",
        });
        expect(quickPlanRes.content[0].text).toContain("Quick Architecture Spike");

        // 3. Tool: init_plan (deep mode)
        const deepPlanRes = await client.callTool("init_plan", {
          cwd: ws.path,
          name: "Deep Core Engine",
          mode: "deep",
        });
        expect(deepPlanRes.content[0].text).toContain("deep mode");

        // 4. Tool: list_plans
        const listPlansRes = await client.callTool("list_plans", { cwd: ws.path });
        expect(listPlansRes.content[0].text).toContain("quick-architecture-spike");
        expect(listPlansRes.content[0].text).toContain("deep-core-engine");

        // 5. Tool: get_plan
        const getPlanRes = await client.callTool("get_plan", {
          cwd: ws.path,
          slug: "deep-core-engine",
        });
        expect(getPlanRes.content[0].text).toContain("Total Documents: 5");

        // 6. Tool: update_document (update phase document with checklist tasks)
        const phaseTasks = `## Implementation Phase

- [ ] Task D1: Core serialization engine
- [/] Task D2: Stream buffer implementation
- [x] Task D3: Memory allocator tuning
`;
        const updateDocRes = await client.callTool("update_document", {
          cwd: ws.path,
          slug: "deep-core-engine",
          docType: "phase",
          body: phaseTasks,
          changeSummary: "Added Phase D tasks",
          changedBy: "test-agent",
        });
        expect(updateDocRes.content[0].text).toContain("updated successfully");

        // 7. Tool: move_task (move Task D1 to in_progress)
        const moveTaskRes = await client.callTool("move_task", {
          cwd: ws.path,
          slug: "deep-core-engine",
          taskIdentifier: "Core serialization engine",
          newStatus: "in_progress",
        });
        expect(moveTaskRes.content[0].text).toContain("moved from [todo] to [in_progress]");

        // 8. Tool: get_history
        const historyRes = await client.callTool("get_history", {
          cwd: ws.path,
          slug: "deep-core-engine",
        });
        expect(historyRes.content[0].text).toContain("deep-core-engine");

        // 9. Tool: search_plans
        const searchRes = await client.callTool("search_plans", {
          cwd: ws.path,
          query: "serialization",
        });
        expect(searchRes.content[0].text).toBeDefined();

        // 10. Tool: init_adr
        const initAdrRes = await client.callTool("init_adr", {
          cwd: ws.path,
          title: "Use LevelDB as Storage Engine",
          status: "accepted",
          description: "Embedded key-value storage benchmark decision",
        });
        expect(initAdrRes.content[0].text).toContain("ADR #1");
        expect(initAdrRes.content[0].text).toContain("adr-0001-use-leveldb-as-storage-engine.md");

        // 11. Tool: get_adr
        const getAdrRes = await client.callTool("get_adr", {
          cwd: ws.path,
          number: 1,
        });
        expect(getAdrRes.content[0].text).toContain("Use LevelDB as Storage Engine");

        // 12. Tool: list_adrs
        const listAdrsRes = await client.callTool("list_adrs", { cwd: ws.path });
        expect(listAdrsRes.content[0].text).toContain("Use LevelDB as Storage Engine");

        // 13. Tool: init_spec
        const initSpecRes = await client.callTool("init_spec", {
          cwd: ws.path,
          title: "Memory Buffer Protocol",
          category: "protocol",
          description: "Specification for internal memory buffers",
        });
        expect(initSpecRes.content[0].text).toContain("memory-buffer-protocol.md");

        // 14. Tool: update_spec
        const updateSpecRes = await client.callTool("update_spec", {
          cwd: ws.path,
          slug: "memory-buffer-protocol",
          body: "# Memory Buffer Protocol\n\nUpdated spec specification.",
          changeSummary: "Version bump 1.1",
          status: "living",
        });
        expect(updateSpecRes.content[0].text).toContain("1.1");

        // 15. Tool: get_spec & list_specs
        const getSpecRes = await client.callTool("get_spec", {
          cwd: ws.path,
          slug: "memory-buffer-protocol",
        });
        expect(getSpecRes.content[0].text).toContain("Memory Buffer Protocol");

        const listSpecsRes = await client.callTool("list_specs", { cwd: ws.path });
        expect(listSpecsRes.content[0].text).toContain("memory-buffer-protocol");
      } finally {
        await client.close();
      }
    });
  });

  it("should verify MCP Resources and MCP Prompts endpoints", async () => {
    await withTempWorkspace(async (ws) => {
      const client = await createMcpClient(ws.path);

      try {
        // Resources list
        const resources = await client.listResources();
        const uris = resources.map((r: any) => r.uri);
        expect(uris).toContain("plannic://plans");
        expect(uris).toContain("plannic://adrs");
        expect(uris).toContain("plannic://specs");

        // Read resource
        const plansResource = await client.readResource("plannic://plans");
        expect(plansResource).toBeDefined();

        // Prompts list
        const prompts = await client.listPrompts();
        const promptNames = prompts.map((p: any) => p.name);
        expect(promptNames).toContain("plannic-grill-mode");
        expect(promptNames).toContain("plannic-distill-adr");
      } finally {
        await client.close();
      }
    });
  });
});
