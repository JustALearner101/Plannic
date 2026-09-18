import { describe, expect, it } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initWorkspace } from "./init.js";

describe("workspace init", () => {
  it("creates the golden path and is idempotent", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "plannic-init-"));
    try {
      await writeFile(join(cwd, "package.json"), JSON.stringify({ name: "demo" }));
      const first = await initWorkspace(cwd);
      expect(first.status).toBe("success"); expect(first.skillsCount).toBe(6);
      expect(JSON.parse(await readFile(join(cwd, ".mcp.json"), "utf8")).mcpServers.plannic.args).toEqual(["mcp"]);
      const second = await initWorkspace(cwd);
      expect(second.status).toBe("success"); expect(second.conflicts).toEqual([]);
    } finally { await rm(cwd, { recursive: true, force: true }); }
  });

  it("preserves conflicting files and reports partial status", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "plannic-init-conflict-"));
    try {
      await writeFile(join(cwd, ".mcp.json"), "custom\n");
      const result = await initWorkspace(cwd, "cursor");
      expect(result.status).toBe("partial"); expect(result.conflicts).toContain(".mcp.json");
      expect(await readFile(join(cwd, ".mcp.json"), "utf8")).toBe("custom\n");
    } finally { await rm(cwd, { recursive: true, force: true }); }
  });
});
