import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  initPlan,
  readPlan,
  listPlans,
  updateDocument,
  migratePlan,
  migrateAllPlans,
  writeConfig,
  readConfig,
} from "../src/index.js";

describe("Hierarchical Plans & Dual-Discovery Engine", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "plannic-hierarchical-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should initialize a new plan in .docs/plans/<slug>/ by default in deep mode", async () => {
    const output = await initPlan(tempDir, "Payment Gateway", "deep");
    expect(output.status).toBe("ok");
    expect(output.slug).toBe("payment-gateway");

    const planDir = path.join(tempDir, ".docs", "plans", "payment-gateway");
    const dirExists = await fs.exists(planDir);
    expect(dirExists).toBe(true);

    const files = await fs.readdir(planDir);
    expect(files).toContain("plan.md");
    expect(files).toContain("scope.md");
    expect(files).toContain("feature.md");
    expect(files).toContain("phase-1.md");
    expect(files).toContain("limitation.md");

    // Verify reading back via readPlan
    const plan = await readPlan(tempDir, "payment-gateway");
    expect(plan).not.toBeNull();
    expect(plan?.format).toBe("hierarchical");
    expect(plan?.documents.length).toBe(5);
  });

  it("should generate custom documents based on config.generated_docs", async () => {
    // Write custom config
    await writeConfig(tempDir, {
      project: "Custom Project",
      stack: ["Bun", "TypeScript"],
      default_mode: "deep",
      generated_docs: [
        { type: "plan", filename: "plan.md", title: "Overview" },
        { type: "scope", filename: "scope.md", title: "Scope" },
        { type: "phase", filename: "phase-1.md", title: "Milestone 1" },
        { type: "phase", filename: "phase-2.md", title: "Milestone 2" },
      ],
    });

    const output = await initPlan(tempDir, "Multi Milestone Feature", "deep");
    expect(output.status).toBe("ok");

    const planDir = path.join(tempDir, ".docs", "plans", "multi-milestone-feature");
    const files = await fs.readdir(planDir);
    expect(files).toContain("plan.md");
    expect(files).toContain("scope.md");
    expect(files).toContain("phase-1.md");
    expect(files).toContain("phase-2.md");
    expect(files).not.toContain("limitation.md");

    const plan = await readPlan(tempDir, "multi-milestone-feature");
    expect(plan?.documents.length).toBe(4);
  });

  it("should support dual-discovery when both hierarchical and legacy flat plans exist", async () => {
    // 1. Create a legacy flat plan manually
    const docsDir = path.join(tempDir, ".docs");
    await fs.mkdir(docsDir, { recursive: true });

    const legacyRoot = `---
id: 11111111-1111-1111-1111-111111111111
plan: legacy-auth
type: plan
name: Legacy Auth
slug: legacy-auth
version: "1.0"
status: draft
created: "2026-01-01T00:00:00.000Z"
lastUpdated: "2026-01-01T00:00:00.000Z"
tags: []
description: Legacy flat auth plan
mode: deep
---
# Legacy Auth
`;
    const legacyScope = `---
id: 22222222-2222-2222-2222-222222222222
plan: legacy-auth
type: scope
name: Legacy Auth — Scope
slug: legacy-auth
version: "1.0"
status: draft
created: "2026-01-01T00:00:00.000Z"
lastUpdated: "2026-01-01T00:00:00.000Z"
tags: []
description: Scope
---
## In Scope
`;
    await fs.writeFile(path.join(docsDir, "plan-legacy-auth.md"), legacyRoot, "utf-8");
    await fs.writeFile(path.join(docsDir, "scope-legacy-auth.md"), legacyScope, "utf-8");

    // 2. Create a hierarchical plan
    await initPlan(tempDir, "Modern Auth", "deep");

    // 3. Test listPlans
    const plans = await listPlans(tempDir);
    expect(plans.length).toBe(2);

    const legacySummary = plans.find((p) => p.slug === "legacy-auth");
    expect(legacySummary?.format).toBe("legacy_flat");
    expect(legacySummary?.documentCount).toBe(2);

    const modernSummary = plans.find((p) => p.slug === "modern-auth");
    expect(modernSummary?.format).toBe("hierarchical");
    expect(modernSummary?.documentCount).toBe(5);

    // 4. Test reading both plans
    const legacyRead = await readPlan(tempDir, "legacy-auth");
    expect(legacyRead?.format).toBe("legacy_flat");

    const modernRead = await readPlan(tempDir, "modern-auth");
    expect(modernRead?.format).toBe("hierarchical");

    // 5. Update legacy document seamlessly
    const updated = await updateDocument(tempDir, "legacy-auth", "scope", "## Updated In Scope Content");
    expect(updated.success).toBe(true);
    expect(updated.version).toBe("1.1");
  });

  it("should safely migrate legacy flat plans to hierarchical folders", async () => {
    const docsDir = path.join(tempDir, ".docs");
    await fs.mkdir(docsDir, { recursive: true });

    const slug = "search-refactor";
    const files = [
      `plan-${slug}.md`,
      `scope-${slug}.md`,
      `feature-${slug}.md`,
      `phase-1-${slug}.md`,
      `limitation-${slug}.md`,
    ];

    for (const file of files) {
      const docType = file.split("-")[0];
      const content = `---
id: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
plan: ${slug}
type: ${docType === "phase" ? "phase" : docType}
name: ${slug} ${docType}
slug: ${slug}
version: "1.0"
status: draft
created: "2026-01-01T00:00:00.000Z"
lastUpdated: "2026-01-01T00:00:00.000Z"
tags: []
description: test
mode: deep
---
# Content for ${file}
See [Scope](./scope-${slug}.md)
`;
      await fs.writeFile(path.join(docsDir, file), content, "utf-8");
    }

    // Dry-run first
    const dryRunResult = await migratePlan(tempDir, slug, true);
    expect(dryRunResult.success).toBe(true);
    expect(dryRunResult.filesMoved.length).toBe(5);

    // Files should still be flat in .docs
    const docsDirFilesPre = await fs.readdir(docsDir);
    expect(docsDirFilesPre.filter((f) => f.includes(slug)).length).toBe(5);

    // Live migration
    const migrationResult = await migratePlan(tempDir, slug, false);
    expect(migrationResult.success).toBe(true);

    // Flat files should be gone from root .docs/
    const docsDirFilesPost = await fs.readdir(docsDir);
    expect(docsDirFilesPost.filter((f) => f.endsWith(".md")).length).toBe(0);

    // New folder should exist
    const planDir = path.join(tempDir, ".docs", "plans", slug);
    const planFiles = await fs.readdir(planDir);
    expect(planFiles).toContain("plan.md");
    expect(planFiles).toContain("scope.md");
    expect(planFiles).toContain("feature.md");
    expect(planFiles).toContain("phase-1.md");
    expect(planFiles).toContain("limitation.md");

    // Internal link should have been rewritten
    const planMdContent = await fs.readFile(path.join(planDir, "plan.md"), "utf-8");
    expect(planMdContent).toContain("[Scope](./scope.md)");

    // Read back via readPlan
    const plan = await readPlan(tempDir, slug);
    expect(plan?.format).toBe("hierarchical");
  });

  it("should migrate all legacy plans in batch", async () => {
    const docsDir = path.join(tempDir, ".docs");
    await fs.mkdir(docsDir, { recursive: true });

    // Plan A
    await fs.writeFile(
      path.join(docsDir, "plan-feature-a.md"),
      `---\nid: 11111111-1111-1111-1111-111111111111\nplan: feature-a\ntype: plan\nname: A\nslug: feature-a\nversion: "1.0"\nstatus: draft\ncreated: "2026-01-01T00:00:00.000Z"\nlastUpdated: "2026-01-01T00:00:00.000Z"\ntags: []\ndescription: A\n---\n# A`,
      "utf-8"
    );
    // Plan B
    await fs.writeFile(
      path.join(docsDir, "plan-feature-b.md"),
      `---\nid: 22222222-2222-2222-2222-222222222222\nplan: feature-b\ntype: plan\nname: B\nslug: feature-b\nversion: "1.0"\nstatus: draft\ncreated: "2026-01-01T00:00:00.000Z"\nlastUpdated: "2026-01-01T00:00:00.000Z"\ntags: []\ndescription: B\n---\n# B`,
      "utf-8"
    );

    const batchResult = await migrateAllPlans({ cwd: tempDir });
    expect(batchResult.totalPlans).toBe(2);
    expect(batchResult.successCount).toBe(2);

    const plans = await listPlans(tempDir);
    expect(plans.every((p) => p.format === "hierarchical")).toBe(true);
  });
});
