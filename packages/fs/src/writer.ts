import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import matter from "gray-matter";
import type {
  DocType,
  DocFrontmatter,
  InitPlanOutput,
  PlanMode,
  UpdateDocumentOutput,
  HistoryEntry,
} from "@plannic/core";
import { generateSlug, getDocsDir, getDocPath, getDocFilename } from "./slug.js";
import { appendHistory } from "./history.js";

function makeDocFrontmatter(
  slug: string,
  planName: string,
  docType: DocType,
  title: string,
  now: string,
  mode?: PlanMode,
  documents?: string[]
): DocFrontmatter {
  return {
    id: crypto.randomUUID(),
    plan: slug,
    type: docType,
    name: title,
    slug,
    version: "1.0",
    status: "draft",
    created: now,
    lastUpdated: now,
    tags: [],
    description: `${title} for ${planName}`,
    ...(mode ? { mode } : {}),
    ...(documents ? { documents } : {}),
  };
}

export async function initPlan(cwd: string, name: string, mode: PlanMode): Promise<InitPlanOutput> {
  const slug = generateSlug(name);
  const docsDir = getDocsDir(cwd);
  await fs.mkdir(docsDir, { recursive: true });

  const now = new Date().toISOString();
  const filesCreated: string[] = [];

  if (mode === "quick") {
    const rootFilename = getDocFilename(slug, "plan");
    const rootPath = path.join(docsDir, rootFilename);
    const frontmatter = makeDocFrontmatter(slug, name, "plan", name, now, "quick", [rootFilename]);
    const initialBody = `# ${name}\n\n## Overview\n\n## Implementation Details\n`;
    const content = matter.stringify(initialBody, frontmatter);
    await fs.writeFile(rootPath, content, "utf-8");
    filesCreated.push(rootFilename);
  } else {
    // Deep mode
    const rootFilename = getDocFilename(slug, "plan");
    const scopeFilename = getDocFilename(slug, "scope");
    const featureFilename = getDocFilename(slug, "feature");
    const phaseFilename = getDocFilename(slug, "phase", 1);
    const limitFilename = getDocFilename(slug, "limitation");

    const allDocs = [rootFilename, scopeFilename, featureFilename, phaseFilename, limitFilename];

    // 1. Root plan doc
    const rootFrontmatter = makeDocFrontmatter(slug, name, "plan", name, now, "deep", allDocs);
    const rootBody = `# ${name}\n\n## Goal\n\n## Document Index\n- [Scope](./${scopeFilename})\n- [Feature Breakdown](./${featureFilename})\n- [Phase 1 Implementation](./${phaseFilename})\n- [Limitations](./${limitFilename})\n`;
    await fs.writeFile(path.join(docsDir, rootFilename), matter.stringify(rootBody, rootFrontmatter), "utf-8");
    filesCreated.push(rootFilename);

    // 2. Scope doc
    const scopeFrontmatter = makeDocFrontmatter(slug, name, "scope", `${name} — Scope`, now);
    const scopeBody = `## In Scope\n\n- Core functionality\n\n## Out of Scope\n\n- Secondary features\n`;
    await fs.writeFile(path.join(docsDir, scopeFilename), matter.stringify(scopeBody, scopeFrontmatter), "utf-8");
    filesCreated.push(scopeFilename);

    // 3. Feature doc
    const featureFrontmatter = makeDocFrontmatter(slug, name, "feature", `${name} — Features`, now);
    const featureBody = `## Core Features\n\n### Feature 1\nDescription and acceptance criteria.\n`;
    await fs.writeFile(path.join(docsDir, featureFilename), matter.stringify(featureBody, featureFrontmatter), "utf-8");
    filesCreated.push(featureFilename);

    // 4. Phase 1 doc
    const phaseFrontmatter = makeDocFrontmatter(slug, name, "phase", `${name} — Phase 1`, now);
    const phaseBody = `## Deliverables\n\n- Step 1\n- Step 2\n\n## Verification\n`;
    await fs.writeFile(path.join(docsDir, phaseFilename), matter.stringify(phaseBody, phaseFrontmatter), "utf-8");
    filesCreated.push(phaseFilename);

    // 5. Limitation doc
    const limitFrontmatter = makeDocFrontmatter(slug, name, "limitation", `${name} — Limitations`, now);
    const limitBody = `## Known Limitations\n\n- Edge cases not covered in this iteration\n`;
    await fs.writeFile(path.join(docsDir, limitFilename), matter.stringify(limitBody, limitFrontmatter), "utf-8");
    filesCreated.push(limitFilename);
  }

  // Create initial history entry
  const historyEntry: HistoryEntry = {
    timestamp: now,
    type: "created",
    version: "1.0",
    summary: `Plan '${name}' initialized in ${mode} mode`,
    changedBy: "claude-code",
    document: getDocFilename(slug, "plan"),
    docType: "plan",
  };
  await appendHistory(cwd, slug, historyEntry);

  return {
    status: "ok",
    slug,
    filesCreated,
  };
}

export async function updateDocument(
  cwd: string,
  slug: string,
  docType: DocType,
  body: string,
  changeSummary = "Updated document",
  changedBy = "claude-code"
): Promise<UpdateDocumentOutput> {
  const filePath = getDocPath(cwd, slug, docType);
  const raw = await fs.readFile(filePath, "utf-8");
  const parsed = matter(raw);
  const data = parsed.data as DocFrontmatter;

  // Bump version (e.g. 1.0 -> 1.1)
  const currentVersion = parseFloat(data.version || "1.0");
  const nextVersion = (isNaN(currentVersion) ? 1.0 : currentVersion + 0.1).toFixed(1);
  const now = new Date().toISOString();

  data.version = nextVersion;
  data.lastUpdated = now;

  const newContent = matter.stringify(body, data);
  await fs.writeFile(filePath, newContent, "utf-8");

  // Log history
  const filename = path.basename(filePath);
  const historyEntry: HistoryEntry = {
    timestamp: now,
    type: "updated",
    version: nextVersion,
    summary: changeSummary,
    changedBy,
    document: filename,
    docType,
  };
  await appendHistory(cwd, slug, historyEntry);

  return {
    success: true,
    version: nextVersion,
    path: filePath,
  };
}
