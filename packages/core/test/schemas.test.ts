import { describe, it, expect } from "bun:test";
import {
  ProjectConfigFrontmatterSchema,
  DEFAULT_GENERATED_DOCS,
  GeneratedDocConfigSchema,
  RulesetConfigSchema,
  MigratePlansInputSchema,
} from "../src/schemas.js";
import {
  getHierarchicalDocFilename,
  getLegacyDocFilename,
  getPlanRelativeDirPath,
  normalizeSlash,
} from "../src/paths.js";

describe("Core Schemas & Configuration", () => {
  it("should validate default project config frontmatter without generated_docs or ruleset", () => {
    const raw = {
      project: "Plannic",
      stack: ["Tauri", "Svelte 5"],
      default_mode: "deep",
    };

    const parsed = ProjectConfigFrontmatterSchema.parse(raw);
    expect(parsed.project).toBe("Plannic");
    expect(parsed.generated_docs).toBeUndefined();
    expect(parsed.ruleset).toBeUndefined();
  });

  it("should validate and parse custom generated_docs and ruleset", () => {
    const raw = {
      project: "Plannic",
      stack: "Tauri, Svelte",
      default_mode: "deep",
      lang: "id",
      generated_docs: [
        { type: "plan", filename: "plan.md", title: "Plan Overview", required: true },
        { type: "scope", filename: "scope.md", title: "Scope Document" },
        { type: "phase", filename: "phase-1.md", title: "Phase 1" },
      ],
      ruleset: {
        strict_kanban: true,
        auto_changelog: true,
        max_phases_recommended: 7,
        plans_dir: ".docs/plans",
      },
    };

    const parsed = ProjectConfigFrontmatterSchema.parse(raw);
    expect(parsed.generated_docs).toHaveLength(3);
    expect(parsed.generated_docs?.[0].filename).toBe("plan.md");
    expect(parsed.ruleset?.strict_kanban).toBe(true);
    expect(parsed.ruleset?.max_phases_recommended).toBe(7);
    expect(parsed.ruleset?.plans_dir).toBe(".docs/plans");
  });

  it("should provide valid DEFAULT_GENERATED_DOCS matching schema", () => {
    expect(DEFAULT_GENERATED_DOCS).toHaveLength(5);
    for (const doc of DEFAULT_GENERATED_DOCS) {
      const validated = GeneratedDocConfigSchema.parse(doc);
      expect(validated.filename).toBeDefined();
      expect(validated.type).toBeDefined();
    }
  });

  it("should validate MigratePlansInputSchema with default dryRun", () => {
    const parsed = MigratePlansInputSchema.parse({
      cwd: "/test/project",
    });
    expect(parsed.dryRun).toBe(false);
    expect(parsed.slug).toBeUndefined();

    const parsedSpecific = MigratePlansInputSchema.parse({
      cwd: "/test/project",
      slug: "my-plan",
      dryRun: true,
    });
    expect(parsedSpecific.dryRun).toBe(true);
    expect(parsedSpecific.slug).toBe("my-plan");
  });

  it("should generate correct hierarchical and legacy paths", () => {
    expect(getHierarchicalDocFilename("plan")).toBe("plan.md");
    expect(getHierarchicalDocFilename("phase", 1)).toBe("phase-1.md");
    expect(getHierarchicalDocFilename("phase", 2)).toBe("phase-2.md");

    expect(getLegacyDocFilename("auth", "plan")).toBe("plan-auth.md");
    expect(getLegacyDocFilename("auth", "phase", 1)).toBe("phase-1-auth.md");
    expect(getLegacyDocFilename("auth", "phase", 2)).toBe("phase-2-auth.md");

    expect(getPlanRelativeDirPath("auth")).toBe("plans/auth");
    expect(normalizeSlash("foo\\bar\\baz")).toBe("foo/bar/baz");
  });
});
