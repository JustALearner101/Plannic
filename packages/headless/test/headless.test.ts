import { describe, expect, it } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHeadless } from "../src/index.js";

describe("headless facade", () => {
  it("keeps workspace context and delegates operations", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "plannic-headless-test-"));
    try {
      const engine = createHeadless({ cwd });
      const created = await engine.initPlan("Headless Test Plan", "quick");
      expect(created.slug).toBe("headless-test-plan");
      expect((await engine.listPlans()).length).toBe(1);

      const statusline = await engine.renderStatusLine(false);
      expect(statusline).toContain("Plannic");
      expect(statusline).toContain("headless-test-plan");

      const card = await engine.renderPlanCard();
      expect(card).toContain("Plannic Architecture Workbench");
      expect(card).toContain("Headless Test Plan");
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it("returns empty statusline for non-plannic directories", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "plannic-empty-test-"));
    try {
      const engine = createHeadless({ cwd });
      const statusline = await engine.renderStatusLine(false);
      expect(statusline).toBe("");
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});
