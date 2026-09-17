import fs from "node:fs/promises";
import path from "node:path";
import type {
  MigratePlanResult,
  MigratePlansOutput,
  MigratePlansInput,
} from "@plannic/core";
import { getDocsDir, getPlansDir, getPlanDir } from "./slug.js";
import { appendHistory } from "./history.js";

/**
 * Maps a legacy flat filename to its target hierarchical filename within a plan folder.
 * E.g. "plan-auth.md" -> "plan.md"
 *      "phase-1-auth.md" -> "phase-1.md"
 *      "scope-auth.md" -> "scope.md"
 */
export function mapLegacyFilenameToHierarchical(filename: string, slug: string): string | null {
  if (!filename.endsWith(".md")) return null;

  if (filename === `plan-${slug}.md`) {
    return "plan.md";
  }

  const phaseMatch = filename.match(new RegExp(`^phase-(\\d+)-${slug}\\.md$`));
  if (phaseMatch) {
    return `phase-${phaseMatch[1]}.md`;
  }

  const genericMatch = filename.match(new RegExp(`^(scope|feature|limitation)-${slug}\\.md$`));
  if (genericMatch) {
    return `${genericMatch[1]}.md`;
  }

  // Any other file matching *-<slug>.md
  if (filename.endsWith(`-${slug}.md`)) {
    const prefix = filename.slice(0, -(slug.length + 4));
    return `${prefix}.md`;
  }

  return null;
}

/**
 * Migrates a single legacy flat plan into .docs/plans/<slug>/
 */
export async function migratePlan(
  cwd: string,
  slug: string,
  dryRun = false,
  changedBy = "migration-tool"
): Promise<MigratePlanResult> {
  const docsDir = getDocsDir(cwd);
  const planDir = getPlanDir(cwd, slug);

  try {
    const files = await fs.readdir(docsDir);
    const legacyFiles = files.filter(
      (f) => f.endsWith(".md") && (f === `plan-${slug}.md` || f.endsWith(`-${slug}.md`))
    );

    if (legacyFiles.length === 0) {
      return {
        slug,
        success: false,
        filesMoved: [],
        error: `No legacy flat files found for slug "${slug}" in ${docsDir}`,
      };
    }

    const fileMappings: { from: string; to: string; fromFile: string; toFile: string }[] = [];
    for (const file of legacyFiles) {
      const targetFilename = mapLegacyFilenameToHierarchical(file, slug);
      if (!targetFilename) continue;
      fileMappings.push({
        from: path.join(docsDir, file),
        to: path.join(planDir, targetFilename),
        fromFile: file,
        toFile: targetFilename,
      });
    }

    if (dryRun) {
      return {
        slug,
        success: true,
        filesMoved: fileMappings.map((m) => ({ from: m.from, to: m.to })),
      };
    }

    // Step 1: Create target plan directory
    await fs.mkdir(planDir, { recursive: true });

    // Step 2: Write all files to new location with rewritten local relative links
    for (const mapping of fileMappings) {
      let content = await fs.readFile(mapping.from, "utf-8");

      // Replace internal relative links e.g. (./scope-<slug>.md) -> (./scope.md)
      for (const m of fileMappings) {
        content = content.replaceAll(m.fromFile, m.toFile);
      }

      await fs.writeFile(mapping.to, content, "utf-8");

      // Verify written file
      const stat = await fs.stat(mapping.to);
      if (stat.size === 0) {
        throw new Error(`Integrity verification failed for migrated file: ${mapping.to}`);
      }
    }

    // Step 3: Only after all files are verified, safely unlink old files
    for (const mapping of fileMappings) {
      await fs.unlink(mapping.from);
    }

    // Step 4: Record history
    await appendHistory(cwd, slug, {
      timestamp: new Date().toISOString(),
      type: "updated",
      version: "migrated",
      summary: `Plan migrated from legacy flat files to hierarchical directory: .docs/plans/${slug}/`,
      changedBy,
      document: "plan.md",
      docType: "plan",
    });

    return {
      slug,
      success: true,
      filesMoved: fileMappings.map((m) => ({ from: m.from, to: m.to })),
    };
  } catch (error: unknown) {
    return {
      slug,
      success: false,
      filesMoved: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Migrates all legacy flat plans in .docs/ to .docs/plans/
 */
export async function migrateAllPlans(
  input: MigratePlansInput
): Promise<MigratePlansOutput> {
  const { cwd, slug, dryRun = false } = input;
  const docsDir = getDocsDir(cwd);

  if (slug) {
    const result = await migratePlan(cwd, slug, dryRun);
    return {
      migrated: [result],
      totalPlans: 1,
      successCount: result.success ? 1 : 0,
    };
  }

  try {
    const files = await fs.readdir(docsDir);
    const legacySlugs = new Set<string>();

    for (const file of files) {
      if (file.startsWith("plan-") && file.endsWith(".md")) {
        const planSlug = file.slice("plan-".length, -".md".length);
        legacySlugs.add(planSlug);
      }
    }

    const results: MigratePlanResult[] = [];
    for (const s of legacySlugs) {
      const result = await migratePlan(cwd, s, dryRun);
      results.push(result);
    }

    const successCount = results.filter((r) => r.success).length;
    return {
      migrated: results,
      totalPlans: results.length,
      successCount,
    };
  } catch (error: unknown) {
    const isEnoent = (error as NodeJS.ErrnoException).code === "ENOENT";
    if (isEnoent) {
      return {
        migrated: [],
        totalPlans: 0,
        successCount: 0,
      };
    }
    throw error;
  }
}
