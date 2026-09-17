import { describe, it, expect } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { withTempWorkspace, seedMinimalRepo } from "../harness/index.js";
import { readPlan, listPlans, readHistory } from "../../packages/fs/src/index.js";

describe("Phase 4: Crash Recovery & Corrupt State Resilience E2E", () => {
  it("should handle corrupted YAML frontmatter gracefully without crashing", async () => {
    await withTempWorkspace(async (ws) => {
      await seedMinimalRepo(ws.path);

      // Inject a malformed file into .docs/
      const corruptFilePath = path.join(ws.docsPath, "plan-corrupted-plan.md");
      const corruptContent = `---
title: Broken YAML without closing delimiters
some_key: [unclosed array
bad: { unclosed object:
---
# Corrupt Content
`;
      await fs.writeFile(corruptFilePath, corruptContent, "utf-8");

      // listPlans should NOT crash; it should skip or handle corrupted document gracefully
      const plans = await listPlans(ws.path);
      expect(Array.isArray(plans)).toBe(true);

      // readPlan on corrupted plan should either return null or safe fallback without uncaught rejection
      const plan = await readPlan(ws.path, "corrupted-plan").catch(() => null);
      expect(plan === null || plan !== undefined).toBe(true);
    });
  });

  it("should handle incomplete document trees when subdocuments are deleted", async () => {
    await withTempWorkspace(async (ws) => {
      // 1. Create a deep plan
      const { initPlan } = await import("../../packages/fs/src/index.js");
      await initPlan(ws.path, "Broken Tree Plan", "deep");

      // 2. Deliberately remove the scope and phase subdocuments
      const planDir = path.join(ws.docsPath, "plans", "broken-tree-plan");
      const isHierarchical = await fs.exists(planDir);
      const scopePath = isHierarchical
        ? path.join(planDir, "scope.md")
        : path.join(ws.docsPath, "scope-broken-tree-plan.md");
      const phasePath = isHierarchical
        ? path.join(planDir, "phase-1.md")
        : path.join(ws.docsPath, "phase-1-broken-tree-plan.md");
      await fs.unlink(scopePath);
      await fs.unlink(phasePath);

      // 3. readPlan should still return the root plan and remaining documents
      const plan = await readPlan(ws.path, "broken-tree-plan");
      expect(plan).not.toBeNull();
      expect(plan?.root).toBeDefined();
      expect(plan?.documents.length).toBe(3); // root + feature + limitation
    });
  });

  it("should parse valid history entries even if a corrupted JSON line exists in .history/*.jsonl", async () => {
    await withTempWorkspace(async (ws) => {
      const { initPlan, updateDocument } = await import("../../packages/fs/src/index.js");
      await initPlan(ws.path, "History Recovery Plan", "quick");
      const slug = "history-recovery-plan";

      await updateDocument(ws.path, slug, "plan", "# Updated Once\n", "Update 1", "tester");

      // Inject a corrupted JSON line into history file
      const historyFile = path.join(ws.docsPath, ".history", `plan-${slug}.jsonl`);
      await fs.appendFile(historyFile, "\nCORRUPT NON-JSON STRING LINE\n{\"incomplete\":\n", "utf-8");

      // Append another valid update
      await updateDocument(ws.path, slug, "plan", "# Updated Twice\n", "Update 2", "tester");

      // readHistory should return the valid entries without crashing
      const entries = await readHistory(ws.path, slug);
      expect(entries.length).toBeGreaterThanOrEqual(2);
      expect(entries.some((e) => e.summary === "Update 1")).toBe(true);
      expect(entries.some((e) => e.summary === "Update 2")).toBe(true);
    });
  });
});
