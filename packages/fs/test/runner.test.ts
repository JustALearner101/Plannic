import { describe, it, expect } from "bun:test";
import { spawnSync } from "node:child_process";
import * as path from "node:path";

describe("Automated Test Runner PoC", () => {
  it("should successfully execute all monorepo test suites and exit with code 0", () => {
    const scriptPath = path.resolve(import.meta.dir, "../scripts/run-all-tests.ts");
    const result = spawnSync("bun", ["run", scriptPath], {
      cwd: path.resolve(import.meta.dir, "../../.."),
      shell: true,
      encoding: "utf-8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("PLANNIC MONOREPO TEST RUNNER");
    expect(result.stdout).toMatch(/Results: \d+\/\d+ suites passed/);
  });
});
