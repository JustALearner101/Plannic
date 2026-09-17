import { describe, it, expect } from "bun:test";
import { spawn } from "node:child_process";
import path from "node:path";

describe("MCP Server Endpoints", () => {
  it("should start and respond to tools/list, resources/list, and prompts/list via stdio", async () => {
    const serverPath = path.resolve(__dirname, "../src/index.ts");
    const proc = spawn("bun", ["run", serverPath], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let buffer = "";

    const sendRequest = (msg: object) => {
      proc.stdin.write(JSON.stringify(msg) + "\n");
    };

    const waitResponse = (): Promise<any> => {
      return new Promise((resolve) => {
        const onData = (data: Buffer) => {
          buffer += data.toString();
          const lines = buffer.split("\n");
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            if (line.startsWith("{") && line.endsWith("}")) {
              proc.stdout.off("data", onData);
              buffer = lines.slice(i + 1).join("\n");
              resolve(JSON.parse(line));
              return;
            }
          }
        };
        proc.stdout.on("data", onData);
      });
    };

    // 1. Initialize
    sendRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0.0" },
      },
    });

    const initRes = await waitResponse();
    expect(initRes.result).toBeDefined();
    expect(initRes.result.serverInfo.name).toBe("plannic");

    // 2. Initialized notification
    sendRequest({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    });

    // 3. List Tools
    sendRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    });

    const toolsRes = await waitResponse();
    expect(toolsRes.result).toBeDefined();
    const toolNames = toolsRes.result.tools.map((t: any) => t.name);
    expect(toolNames).toContain("init_adr");
    expect(toolNames).toContain("get_adr");
    expect(toolNames).toContain("list_adrs");
    expect(toolNames).toContain("init_spec");
    expect(toolNames).toContain("get_spec");
    expect(toolNames).toContain("update_spec");
    expect(toolNames).toContain("list_specs");
    expect(toolNames).toContain("migrate_plans");
    expect(toolNames).toContain("add_phase");
    expect(toolNames).toContain("advance_phase");
    expect(toolNames).toContain("get_execution_progress");
    expect(toolNames.length).toBe(19);

    // 4. List Resources
    sendRequest({
      jsonrpc: "2.0",
      id: 3,
      method: "resources/list",
      params: {},
    });

    const resourcesRes = await waitResponse();
    expect(resourcesRes.result).toBeDefined();
    const resourceUris = resourcesRes.result.resources.map((r: any) => r.uri);
    expect(resourceUris).toContain("plannic://plans");
    expect(resourceUris).toContain("plannic://adrs");
    expect(resourceUris).toContain("plannic://specs");

    // 5. List Prompts
    sendRequest({
      jsonrpc: "2.0",
      id: 4,
      method: "prompts/list",
      params: {},
    });

    const promptsRes = await waitResponse();
    expect(promptsRes.result).toBeDefined();
    const promptNames = promptsRes.result.prompts.map((p: any) => p.name);
    expect(promptNames).toContain("plannic-grill-mode");
    expect(promptNames).toContain("plannic-distill-adr");

    proc.kill();
  });
});
