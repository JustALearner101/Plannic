import { describe, expect, it } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runDoctor } from "./doctor.js";

describe("plannic doctor", () => {
  it("evaluates current repository workspace correctly", async () => {
    const result = await runDoctor({ cwd: process.cwd() });
    expect(result.checks.length).toBeGreaterThanOrEqual(6);
    expect(result.checks.some((c) => c.category === "config")).toBe(true);
    expect(result.checks.some((c) => c.category === "skills")).toBe(true);
    expect(result.checks.some((c) => c.category === "docs")).toBe(true);
    expect(result.summary.passed).toBeGreaterThan(0);
  });

  it("identifies missing configuration and directories in uninitialized workspace", async () => {
    const emptyCwd = await mkdtemp(join(tmpdir(), "plannic-doctor-test-"));
    try {
      const result = await runDoctor({ cwd: emptyCwd });
      expect(result.status).toBe("unhealthy");
      expect(result.summary.failed).toBeGreaterThan(0);

      const configCheck = result.checks.find((c) => c.category === "config");
      expect(configCheck?.status).toBe("fail");
      expect(configCheck?.hint).toBeDefined();

      const docsCheck = result.checks.find((c) => c.category === "docs");
      expect(docsCheck?.status).toBe("fail");
    } finally {
      await rm(emptyCwd, { recursive: true, force: true });
    }
  });

  it("runs MCP handshake check when mcp flag is specified", async () => {
    const result = await runDoctor({ cwd: process.cwd(), mcp: true });
    const handshakeCheck = result.checks.find((c) => c.category === "handshake");
    expect(handshakeCheck).toBeDefined();
    expect(handshakeCheck?.status).toBe("pass");
    expect(handshakeCheck?.details?.toolCount).toBeGreaterThanOrEqual(19);
  });
});
