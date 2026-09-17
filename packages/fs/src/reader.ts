import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type {
  Plan,
  PlanDocument,
  PlanSummary,
  DocFrontmatter,
  DocType,
  AdrDocument,
  AdrSummary,
  AdrFrontmatter,
  AdrStatus,
  SpecDocument,
  SpecSummary,
  SpecFrontmatter,
  SpecStatus,
} from "@plannic/core";
import {
  getDocsDir,
  getDocPath,
  getPlansDir,
  getPlanDir,
  getHierarchicalDocPath,
  getLegacyDocPath,
  getAdrsDir,
  getSpecsDir,
  formatAdrNumber,
  getSpecPath,
} from "./slug.js";

export async function readDocumentFile(filePath: string): Promise<PlanDocument | null> {
  try {
    const rawContent = await fs.readFile(filePath, "utf-8");
    let parsed: matter.GrayMatterFile<string>;
    try {
      parsed = matter(rawContent);
    } catch {
      // Gracefully handle malformed YAML frontmatter without crashing callers
      return null;
    }
    const frontmatter = (parsed.data || {}) as DocFrontmatter;
    return {
      slug: frontmatter.slug || "",
      type: frontmatter.type || "plan",
      path: filePath,
      frontmatter,
      body: parsed.content || "",
      rawContent,
    };
  } catch (error: unknown) {
    const isEnoent = (error as NodeJS.ErrnoException).code === "ENOENT";
    if (isEnoent) return null;
    throw error;
  }
}

export async function readPlan(cwd: string, slug: string): Promise<Plan | null> {
  // 1. Dual-discovery: check hierarchical plan first (.docs/plans/<slug>/plan.md)
  const hierarchicalRootPath = getHierarchicalDocPath(cwd, slug, "plan");
  const hierarchicalRootDoc = await readDocumentFile(hierarchicalRootPath);

  if (hierarchicalRootDoc) {
    const planDir = getPlanDir(cwd, slug);
    const mode = hierarchicalRootDoc.frontmatter.mode ?? "deep";
    const documents: PlanDocument[] = [hierarchicalRootDoc];

    try {
      const files = await fs.readdir(planDir);
      for (const file of files) {
        if (!file.endsWith(".md") || file === "plan.md") continue;
        const docPath = path.join(planDir, file);
        const doc = await readDocumentFile(docPath);
        if (doc) {
          documents.push(doc);
        }
      }
    } catch {
      // If reading directory fails, return just rootDoc
    }

    return {
      slug,
      mode,
      format: "hierarchical",
      root: hierarchicalRootDoc,
      documents,
    };
  }

  // 2. Fallback: Legacy flat file in .docs/plan-<slug>.md
  const legacyRootPath = getLegacyDocPath(cwd, slug, "plan");
  const legacyRootDoc = await readDocumentFile(legacyRootPath);
  if (!legacyRootDoc) return null;

  const mode = legacyRootDoc.frontmatter.mode ?? "quick";
  const documents: PlanDocument[] = [legacyRootDoc];

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
    format: "legacy_flat",
    root: legacyRootDoc,
    documents,
  };
}

export async function listPlans(cwd: string): Promise<PlanSummary[]> {
  const planSummaries: Map<string, PlanSummary> = new Map();

  // 1. Scan hierarchical plans under .docs/plans/
  const plansDir = getPlansDir(cwd);
  try {
    const planDirs = await fs.readdir(plansDir, { withFileTypes: true });
    for (const dirent of planDirs) {
      if (!dirent.isDirectory()) continue;
      const slug = dirent.name;
      const planRootPath = path.join(plansDir, slug, "plan.md");
      const doc = await readDocumentFile(planRootPath);
      if (doc) {
        const fm = doc.frontmatter;
        const mode = fm.mode ?? "deep";

        let docCount = 1;
        try {
          const dirFiles = await fs.readdir(path.join(plansDir, slug));
          docCount = dirFiles.filter((f) => f.endsWith(".md")).length;
        } catch {
          // ignore
        }

        planSummaries.set(slug, {
          slug: fm.slug || slug,
          name: fm.name || slug,
          mode,
          status: fm.status || "draft",
          version: fm.version || "1.0",
          lastUpdated: fm.lastUpdated || fm.created || "",
          description: fm.description || "",
          documentCount: docCount,
          format: "hierarchical",
        });
      }
    }
  } catch {
    // If .docs/plans does not exist, continue to legacy scan
  }

  // 2. Scan legacy flat plans under .docs/
  const docsDir = getDocsDir(cwd);
  try {
    const files = await fs.readdir(docsDir);

    for (const file of files) {
      if (file.startsWith("plan-") && file.endsWith(".md")) {
        const filePath = path.join(docsDir, file);
        const doc = await readDocumentFile(filePath);
        if (doc) {
          const fm = doc.frontmatter;
          const slug = fm.slug;
          // If already found in hierarchical, hierarchical takes precedence
          if (planSummaries.has(slug)) continue;

          const mode = fm.mode ?? "quick";

          // Count documents matching this slug
          let docCount = 1;
          if (mode === "deep") {
            const related = files.filter(
              (f) => f.endsWith(".md") && f.includes(`-${slug}.md`)
            );
            docCount = related.length;
          }

          planSummaries.set(slug, {
            slug,
            name: fm.name,
            mode,
            status: fm.status,
            version: fm.version,
            lastUpdated: fm.lastUpdated,
            description: fm.description,
            documentCount: docCount,
            format: "legacy_flat",
          });
        }
      }
    }
  } catch (error: unknown) {
    const isEnoent = (error as NodeJS.ErrnoException).code === "ENOENT";
    if (!isEnoent) throw error;
  }

  const result = Array.from(planSummaries.values());
  // Sort by lastUpdated descending
  result.sort(
    (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );

  return result;
}

export async function readAdr(
  cwd: string,
  identifier: { number?: number; slug?: string } | number | string
): Promise<AdrDocument | null> {
  const adrsDir = getAdrsDir(cwd);
  try {
    const files = await fs.readdir(adrsDir);
    let targetFile: string | undefined;

    if (typeof identifier === "number") {
      const prefix = `adr-${formatAdrNumber(identifier)}-`;
      targetFile = files.find((f) => f.startsWith(prefix) && f.endsWith(".md"));
    } else if (typeof identifier === "string") {
      // Check if it's a number string e.g. "1" or "0001"
      const parsedNum = parseInt(identifier, 10);
      if (!isNaN(parsedNum) && String(parsedNum) === identifier.replace(/^0+/, "")) {
        const prefix = `adr-${formatAdrNumber(parsedNum)}-`;
        targetFile = files.find((f) => f.startsWith(prefix) && f.endsWith(".md"));
      } else {
        // Slug match
        targetFile = files.find(
          (f) => f.endsWith(".md") && (f.includes(`-${identifier}.md`) || f === `${identifier}.md` || f === identifier)
        );
      }
    } else if (typeof identifier === "object") {
      if (identifier.number !== undefined) {
        const prefix = `adr-${formatAdrNumber(identifier.number)}-`;
        targetFile = files.find((f) => f.startsWith(prefix) && f.endsWith(".md"));
      } else if (identifier.slug) {
        targetFile = files.find(
          (f) => f.endsWith(".md") && (f.includes(`-${identifier.slug}.md`) || f === `${identifier.slug}.md`)
        );
      }
    }

    if (!targetFile) return null;

    const filePath = path.join(adrsDir, targetFile);
    const rawContent = await fs.readFile(filePath, "utf-8");
    const parsed = matter(rawContent);
    const frontmatter = parsed.data as AdrFrontmatter;

    return {
      number: frontmatter.number,
      slug: frontmatter.slug,
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

export async function listAdrs(
  cwd: string,
  filterStatus?: AdrStatus
): Promise<AdrSummary[]> {
  const adrsDir = getAdrsDir(cwd);
  try {
    const files = await fs.readdir(adrsDir);
    const adrs: AdrSummary[] = [];

    for (const file of files) {
      if (file.startsWith("adr-") && file.endsWith(".md")) {
        const filePath = path.join(adrsDir, file);
        const rawContent = await fs.readFile(filePath, "utf-8");
        const parsed = matter(rawContent);
        const fm = parsed.data as AdrFrontmatter;

        if (filterStatus && fm.status !== filterStatus) {
          continue;
        }

        adrs.push({
          number: fm.number,
          slug: fm.slug,
          title: fm.title,
          status: fm.status,
          date: fm.date,
          description: fm.description,
          tags: fm.tags || [],
        });
      }
    }

    // Sort by number ascending
    adrs.sort((a, b) => a.number - b.number);
    return adrs;
  } catch (error: unknown) {
    const isEnoent = (error as NodeJS.ErrnoException).code === "ENOENT";
    if (isEnoent) return [];
    throw error;
  }
}

export async function readSpec(
  cwd: string,
  slug: string
): Promise<SpecDocument | null> {
  const cleanSlug = slug.replace(/\.md$/, "");
  const filePath = getSpecPath(cwd, cleanSlug);
  try {
    const rawContent = await fs.readFile(filePath, "utf-8");
    const parsed = matter(rawContent);
    const frontmatter = parsed.data as SpecFrontmatter;

    return {
      slug: frontmatter.slug,
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

export async function listSpecs(
  cwd: string,
  filterCategory?: string,
  filterStatus?: SpecStatus
): Promise<SpecSummary[]> {
  const specsDir = getSpecsDir(cwd);
  try {
    const files = await fs.readdir(specsDir);
    const specs: SpecSummary[] = [];

    for (const file of files) {
      if (file.endsWith(".md")) {
        const filePath = path.join(specsDir, file);
        const rawContent = await fs.readFile(filePath, "utf-8");
        const parsed = matter(rawContent);
        const fm = parsed.data as SpecFrontmatter;

        if (filterCategory && fm.category !== filterCategory) {
          continue;
        }
        if (filterStatus && fm.status !== filterStatus) {
          continue;
        }

        specs.push({
          slug: fm.slug,
          title: fm.title,
          status: fm.status,
          version: fm.version,
          category: fm.category,
          lastUpdated: fm.lastUpdated,
          description: fm.description,
          tags: fm.tags || [],
        });
      }
    }

    // Sort by title ascending
    specs.sort((a, b) => a.title.localeCompare(b.title));
    return specs;
  } catch (error: unknown) {
    const isEnoent = (error as NodeJS.ErrnoException).code === "ENOENT";
    if (isEnoent) return [];
    throw error;
  }
}

