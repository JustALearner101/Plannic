import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";

export interface McpClientSession {
  callTool: (name: string, args: Record<string, any>) => Promise<any>;
  listTools: () => Promise<any[]>;
  listResources: () => Promise<any[]>;
  readResource: (uri: string) => Promise<any>;
  listPrompts: () => Promise<any[]>;
  close: () => Promise<void>;
  process: ChildProcess;
}

/**
 * Spawns an MCP server instance pointing to a specific workspace directory
 * and returns an interactive JSON-RPC stdio client session.
 */
export async function createMcpClient(workspaceCwd: string): Promise<McpClientSession> {
  const serverPath = path.resolve(__dirname, "../../apps/mcp-server/src/index.ts");
  const proc = spawn("bun", ["run", serverPath], {
    cwd: workspaceCwd,
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      PLANNIC_CWD: workspaceCwd,
    },
  });

  let buffer = "";
  let reqId = 1;
  const pendingRequests = new Map<number, (res: any) => void>();

  proc.stdout?.on("data", (data: Buffer) => {
    buffer += data.toString();
    const lines = buffer.split("\n");
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      if (line.startsWith("{") && line.endsWith("}")) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.id && pendingRequests.has(parsed.id)) {
            const resolver = pendingRequests.get(parsed.id)!;
            pendingRequests.delete(parsed.id);
            resolver(parsed);
          }
        } catch {
          // Ignore non-json or malformed lines
        }
      }
    }
    buffer = lines[lines.length - 1];
  });

  const sendRequest = (method: string, params: any = {}): Promise<any> => {
    const id = reqId++;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pendingRequests.delete(id);
        reject(new Error(`MCP request timeout for method '${method}' (id: ${id})`));
      }, 10000);

      pendingRequests.set(id, (res) => {
        clearTimeout(timeout);
        if (res.error) {
          reject(new Error(res.error.message || JSON.stringify(res.error)));
        } else {
          resolve(res.result);
        }
      });

      const message = JSON.stringify({
        jsonrpc: "2.0",
        id,
        method,
        params,
      });
      proc.stdin?.write(message + "\n");
    });
  };

  const sendNotification = (method: string, params: any = {}) => {
    const message = JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
    });
    proc.stdin?.write(message + "\n");
  };

  // 1. Initialize MCP Handshake
  await sendRequest("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "plannic-e2e-harness", version: "1.0.0" },
  });

  sendNotification("notifications/initialized");

  return {
    process: proc,
    callTool: async (name: string, args: Record<string, any>) => {
      const result = await sendRequest("tools/call", {
        name,
        arguments: args,
      });
      return result;
    },
    listTools: async () => {
      const res = await sendRequest("tools/list", {});
      return res?.tools || [];
    },
    listResources: async () => {
      const res = await sendRequest("resources/list", {});
      return res?.resources || [];
    },
    readResource: async (uri: string) => {
      const res = await sendRequest("resources/read", { uri });
      return res;
    },
    listPrompts: async () => {
      const res = await sendRequest("prompts/list", {});
      return res?.prompts || [];
    },
    close: async () => {
      return new Promise<void>((resolve) => {
        proc.on("close", () => resolve());
        proc.kill();
      });
    },
  };
}
