import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

export interface McpCheckResult {
  success: boolean;
  serverName?: string;
  serverVersion?: string;
  toolCount?: number;
  tools?: string[];
  error?: string;
  durationMs?: number;
}

export async function runMcpCheck(cwd: string = process.cwd(), timeoutMs: number = 8000): Promise<McpCheckResult> {
  const startTime = Date.now();

  // Determine how to spawn MCP server
  let cmd: string;
  let args: string[];

  // 1. Check if cwd has .mcp.json with configured command
  const mcpJsonPath = path.join(cwd, ".mcp.json");
  let customCmd: string | undefined;
  let customArgs: string[] | undefined;
  try {
    const raw = await fs.readFile(mcpJsonPath, "utf8");
    const parsed = JSON.parse(raw);
    const plannicServer = parsed?.mcpServers?.plannic;
    if (plannicServer?.command) {
      customCmd = plannicServer.command;
      customArgs = plannicServer.args ?? [];
    }
  } catch {
    // ignore
  }

  // 2. Resolve executable
  const isBun = Boolean(process.versions.bun);
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(currentDir, "../../..");
  const devMcpEntry = path.join(repoRoot, "apps/mcp-server/src/index.ts");
  const hasDevEntry = await fs.access(devMcpEntry).then(() => true).catch(() => false);

  if (process.env.PLANNIC_MCP_BIN) {
    cmd = process.env.PLANNIC_MCP_BIN;
    args = ["mcp"];
  } else if (hasDevEntry && isBun) {
    cmd = process.execPath; // bun
    args = ["run", devMcpEntry];
  } else if (customCmd && customCmd !== "plannic") {
    cmd = customCmd;
    args = customArgs ?? ["mcp"];
  } else {
    // In compiled binary or PATH
    cmd = process.execPath;
    args = ["mcp"];
  }

  return new Promise<McpCheckResult>((resolve) => {
    let resolved = false;
    let stdoutBuffer = "";
    let serverName = "";
    let serverVersion = "";
    let tools: string[] = [];

    const cleanup = (result: McpCheckResult) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      try {
        proc.kill("SIGTERM");
      } catch {
        // ignore
      }
      resolve({ ...result, durationMs: Date.now() - startTime });
    };

    const timer = setTimeout(() => {
      cleanup({
        success: false,
        error: `MCP handshake timed out after ${timeoutMs}ms (cmd: ${cmd} ${args.join(" ")})`,
      });
    }, timeoutMs);

    let proc: ReturnType<typeof spawn>;
    try {
      proc = spawn(cmd, args, {
        cwd,
        env: { ...process.env, NODE_ENV: "production" },
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (err: any) {
      cleanup({
        success: false,
        error: `Failed to spawn MCP server: ${err?.message || String(err)}`,
      });
      return;
    }

    proc.on("error", (err) => {
      cleanup({
        success: false,
        error: `Process error: ${err.message}`,
      });
    });

    const sendRpc = (payload: Record<string, unknown>) => {
      if (proc.stdin && !proc.stdin.destroyed) {
        proc.stdin.write(JSON.stringify(payload) + "\n");
      }
    };

    let step: "init" | "tools" | "done" = "init";

    // Handle stdout messages
    proc.stdout?.on("data", (chunk: Buffer) => {
      stdoutBuffer += chunk.toString("utf8");

      const lines = stdoutBuffer.split("\n");
      stdoutBuffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed);

          if (step === "init" && msg.id === 1 && msg.result) {
            serverName = msg.result.serverInfo?.name ?? "unknown";
            serverVersion = msg.result.serverInfo?.version ?? "unknown";

            // Send initialized notification
            sendRpc({
              jsonrpc: "2.0",
              method: "notifications/initialized",
              params: {},
            });

            // Request tools list
            step = "tools";
            sendRpc({
              jsonrpc: "2.0",
              id: 2,
              method: "tools/list",
              params: {},
            });
          } else if (step === "tools" && msg.id === 2 && msg.result) {
            step = "done";
            const rawTools = msg.result.tools;
            if (Array.isArray(rawTools)) {
              tools = rawTools.map((t: any) => t.name);
            }

            cleanup({
              success: true,
              serverName,
              serverVersion,
              toolCount: tools.length,
              tools,
            });
          }
        } catch {
          // Ignore non-JSON lines (e.g. logging)
        }
      }
    });

    // Send initial request
    sendRpc({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "plannic-doctor",
          version: "0.3.1",
        },
      },
    });
  });
}
