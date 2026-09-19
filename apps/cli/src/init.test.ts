import { describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initWorkspace } from "./init.js";

describe("workspace init", () => {
  it("creates the golden path and is idempotent with explicit agent status", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "plannic-init-"));
    try {
      await writeFile(join(cwd, "package.json"), JSON.stringify({ name: "demo" }));
      const first = await initWorkspace(cwd);
      expect(first.status).toBe("success");
      expect(first.mcpReady).toBe(true);
      expect(first.agents.antigravity).toBe("installed");
      expect(first.agents.claude).toBe("installed");
      expect(first.agents.cursor).toBe("installed");
      expect(first.skillsCount).toBe(6);
      expect(JSON.parse(await readFile(join(cwd, ".mcp.json"), "utf8")).mcpServers.plannic.args).toEqual(["mcp"]);

      const second = await initWorkspace(cwd);
      expect(second.status).toBe("success");
      expect(second.mcpReady).toBe(true);
      expect(second.conflicts).toEqual([]);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it("preserves conflicting files and generates diffs on request", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "plannic-init-conflict-"));
    try {
      await mkdir(join(cwd, ".cursor"), { recursive: true });
      await writeFile(join(cwd, ".mcp.json"), "custom-mcp\n");
      await writeFile(join(cwd, ".cursor", "mcp.json"), "custom-cursor\n");

      const result = await initWorkspace(cwd, { agent: "cursor", diff: true });
      expect(result.status).toBe("partial");
      expect(result.mcpReady).toBe(false);
      expect(result.agents.cursor).toBe("conflict");
      expect(result.conflicts).toContain(".mcp.json");
      expect(result.conflicts).toContain(".cursor/mcp.json");
      expect(await readFile(join(cwd, ".mcp.json"), "utf8")).toBe("custom-mcp\n");

      // Verify diff was computed
      expect(result.diffs).toBeDefined();
      expect(result.diffs?.[".mcp.json"]).toBeDefined();
      expect(result.diffs?.[".mcp.json"]).toContain("- custom-mcp");
      expect(result.diffs?.[".mcp.json"]).toContain("+ {");
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});
