import { describe, it, expect } from "bun:test";
import { spawn } from "node:child_process";
import path from "node:path";
import { withTempWorkspace, seedStandardRepo } from "../harness/index.js";

function runCli(cwd: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const cliPath = path.resolve(__dirname, "../../apps/cli/src/index.tsx");
  const preloadPath = path.resolve(__dirname, "../../apps/cli/node_modules/@opentui/solid/scripts/preload.js");
  return new Promise((resolve) => {
    const proc = spawn("bun", ["run", "--preload", preloadPath, cliPath, ...args], {
      cwd,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NO_COLOR: "1" },
    });

    let stdout = "";
    let stderr = "";
    proc.stdout?.on("data", (d) => (stdout += d.toString()));
    proc.stderr?.on("data", (d) => (stderr += d.toString()));

    proc.on("close", (code) => {
      resolve({ code: code ?? 0, stdout, stderr });
    });
  });
}

describe("Phase 3: CLI Commands & Terminal Interface E2E", () => {
  it("should display help text and version information", async () => {
    await withTempWorkspace(async (ws) => {
      const help = await runCli(ws.path, ["--help"]);
      expect(help.code).toBe(0);
      expect(help.stdout).toContain("Plannic CLI");
      expect(help.stdout).toContain("USAGE:");
      expect(help.stdout).toContain("COMMANDS:");

      const version = await runCli(ws.path, ["--version"]);
      expect(version.code).toBe(0);
      expect(version.stdout).toContain("Plannic CLI v0.1.0");
    });
  });

  it("should create a new plan via CLI create command in deep mode", async () => {
    await withTempWorkspace(async (ws) => {
      const createRes = await runCli(ws.path, ["create", "CLI Engine Upgrade", "--mode", "deep"]);
      expect(createRes.code).toBe(0);

      const listRes = await runCli(ws.path, ["list", "--json"]);
      expect(listRes.code).toBe(0);
      expect(listRes.stdout).toContain("cli-engine-upgrade");
    });
  });

  it("should list and search plans in a populated sandbox repository", async () => {
    await withTempWorkspace(async (ws) => {
      await seedStandardRepo(ws.path);

      // List plans
      const listRes = await runCli(ws.path, ["list"]);
      expect(listRes.code).toBe(0);
      expect(listRes.stdout).toContain("authentication-engine");
      expect(listRes.stdout).toContain("kanban-workspace-revamp");

      // Search query
      const searchRes = await runCli(ws.path, ["search", "OAuth"]);
      expect(searchRes.code).toBe(0);
      expect(searchRes.stdout).toContain("authentication-engine");
    });
  });
});
