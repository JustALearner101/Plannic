import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type { Plan, PlanDocument, PlanSummary, DocFrontmatter, DocType } from "@plannic/core";
import { getDocsDir, getDocPath } from "./slug.js";

export async function readDocumentFile(filePath: string): Promise<PlanDocument | null> {
  try {
    const rawContent = await fs.readFile(filePath, "utf-8");
    const parsed = matter(rawContent);
    const frontmatter = parsed.data as DocFrontmatter;
    return {
      slug: frontmatter.slug,
      type: frontmatter.type,
      path: filePath,
      frontmatter,
      body: parsed.content,
      rawContent,
    };
  } catch (error: unknown) {
    const isEnoent = (error as NodeJS.ErrnoException).code === "ENOENT";
    if (isEnoent) return null;
    throw error;
  }
}

export async function readPlan(cwd: string, slug: string): Promise<Plan | null> {
  const rootPath = getDocPath(cwd, slug, "plan");
  const rootDoc = await readDocumentFile(rootPath);
  if (!rootDoc) return null;

  const mode = rootDoc.frontmatter.mode ?? "quick";
  const documents: PlanDocument[] = [rootDoc];

  if (mode === "deep") {
    const docsDir = getDocsDir(cwd);
    try {
      const files = await fs.readdir(docsDir);
      // Find all files belonging to this slug, e.g. scope-<slug>.md, feature-<slug>.md, etc.
      for (const file of files) {
        if (!file.endsWith(".md") || file === `plan-${slug}.md`) continue;
        if (file.includes(`-${slug}.md`)) {
          const docPath = path.join(docsDir, file);
          const doc = await readDocumentFile(docPath);
          if (doc && doc.frontmatter.plan === slug) {
            documents.push(doc);
          }
        }
      }
    } catch {
      // If reading directory fails, return just rootDoc
    }
  }

  return {
    slug,
    mode,
    root: rootDoc,
    documents,
  };
}

export async function listPlans(cwd: string): Promise<PlanSummary[]> {
  const docsDir = getDocsDir(cwd);
  try {
    const files = await fs.readdir(docsDir);
    const planSummaries: PlanSummary[] = [];

    for (const file of files) {
      if (file.startsWith("plan-") && file.endsWith(".md")) {
        const filePath = path.join(docsDir, file);
        const doc = await readDocumentFile(filePath);
        if (doc) {
          const fm = doc.frontmatter;
          const slug = fm.slug;
          const mode = fm.mode ?? "quick";

          // Count documents matching this slug
          let docCount = 1;
          if (mode === "deep") {
            const related = files.filter(
              (f) => f.endsWith(".md") && f.includes(`-${slug}.md`)
            );
            docCount = related.length;
          }

          planSummaries.push({
            slug,
            name: fm.name,
            mode,
            status: fm.status,
            version: fm.version,
            lastUpdated: fm.lastUpdated,
            description: fm.description,
            documentCount: docCount,
          });
        }
      }
    }

    // Sort by lastUpdated descending
    planSummaries.sort(
      (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );

    return planSummaries;
  } catch (error: unknown) {
    const isEnoent = (error as NodeJS.ErrnoException).code === "ENOENT";
    if (isEnoent) return [];
    throw error;
  }
}
