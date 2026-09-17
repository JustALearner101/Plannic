import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import matter from "gray-matter";
import {
  DEFAULT_GENERATED_DOCS,
  type DocType,
  type DocFrontmatter,
  type InitPlanOutput,
  type PlanMode,
  type UpdateDocumentOutput,
  type HistoryEntry,
  type InitAdrInput,
  type InitAdrOutput,
  type InitSpecInput,
  type InitSpecOutput,
  type UpdateSpecInput,
  type UpdateSpecOutput,
  type AdrFrontmatter,
  type SpecFrontmatter,
} from "@plannic/core";
import {
  generateSlug,
  getDocsDir,
  getPlansDir,
  getPlanDir,
  getHierarchicalDocPath,
  getLegacyDocPath,
  getDocPath,
  getDocFilename,
  getAdrsDir,
  getSpecsDir,
  formatAdrNumber,
  formatAdrFilename,
  getAdrPath,
  formatSpecFilename,
  getSpecPath,
} from "./slug.js";
import { appendHistory, appendSpecHistory } from "./history.js";
import { readConfig } from "./config.js";

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

export async function resolveDocPath(
  cwd: string,
  slug: string,
  docType: DocType
): Promise<string> {
  const planDir = getPlanDir(cwd, slug);
  const hierarchicalPath = getHierarchicalDocPath(cwd, slug, docType);

  try {
    await fs.access(hierarchicalPath);
    return hierarchicalPath;
  } catch {
    // try fallback within hierarchical if docType === "phase"
    if (docType === "phase") {
      const altPhase = path.join(planDir, "phase.md");
      try {
        await fs.access(altPhase);
        return altPhase;
      } catch {
        // ignore
      }
    }
  }

  // Check legacy flat path
  const legacyPath = getLegacyDocPath(cwd, slug, docType);
  try {
    await fs.access(legacyPath);
    return legacyPath;
  } catch {
    // If neither exists, check if planDir exists
    try {
      await fs.access(planDir);
      return hierarchicalPath;
    } catch {
      // check if legacy root exists
      const legacyPlanPath = getLegacyDocPath(cwd, slug, "plan");
      try {
        await fs.access(legacyPlanPath);
        return legacyPath;
      } catch {
        // default to hierarchical
        return hierarchicalPath;
      }
    }
  }
}

export async function initPlan(cwd: string, name: string, mode: PlanMode): Promise<InitPlanOutput> {
  const slug = generateSlug(name);
  const planDir = getPlanDir(cwd, slug);
  await fs.mkdir(planDir, { recursive: true });

  const now = new Date().toISOString();
  const filesCreated: string[] = [];

  const { config } = await readConfig(cwd);

  if (mode === "quick") {
    const rootFilename = "plan.md";
    const rootPath = path.join(planDir, rootFilename);
    const frontmatter = makeDocFrontmatter(slug, name, "plan", name, now, "quick", [rootFilename]);
    const initialBody = `# ${name}\n\n## Overview\n\n## Implementation Details\n`;
    const content = matter.stringify(initialBody, frontmatter);
    await fs.writeFile(rootPath, content, "utf-8");
    filesCreated.push(path.join(".docs", "plans", slug, rootFilename));
  } else {
    // Deep mode driven by config.generated_docs or DEFAULT_GENERATED_DOCS
    const docsToGenerate =
      config?.generated_docs && config.generated_docs.length > 0
        ? config.generated_docs
        : DEFAULT_GENERATED_DOCS;

    const allFilenames = docsToGenerate.map((d) => d.filename);

    for (const docConfig of docsToGenerate) {
      const filePath = path.join(planDir, docConfig.filename);
      let body = "";
      let title = `${name} — ${docConfig.title}`;

      if (docConfig.type === "plan") {
        title = name;
        const indexLinks = docsToGenerate
          .filter((d) => d.type !== "plan")
          .map((d) => `- [${d.title}](./${d.filename})`)
          .join("\n");
        body = `# ${name}\n\n## Goal\n\n## Document Index\n${indexLinks}\n`;
      } else if (docConfig.type === "scope") {
        body = `## In Scope\n\n- Core functionality\n\n## Out of Scope\n\n- Secondary features\n`;
      } else if (docConfig.type === "feature") {
        body = `## Core Features\n\n### Feature 1\nDescription and acceptance criteria.\n`;
      } else if (docConfig.type === "phase") {
        body = `## Deliverables\n\n- Step 1\n- Step 2\n\n## Verification\n`;
      } else if (docConfig.type === "limitation") {
        body = `## Known Limitations\n\n- Edge cases not covered in this iteration\n`;
      } else {
        body = docConfig.template ?? `## ${docConfig.title}\n\n${docConfig.description ?? ""}\n`;
      }

      const frontmatter = makeDocFrontmatter(
        slug,
        name,
        docConfig.type,
        title,
        now,
        docConfig.type === "plan" ? "deep" : undefined,
        docConfig.type === "plan" ? allFilenames : undefined
      );

      await fs.writeFile(filePath, matter.stringify(body, frontmatter), "utf-8");
      filesCreated.push(path.join(".docs", "plans", slug, docConfig.filename));
    }
  }

  // Create initial history entry
  const historyEntry: HistoryEntry = {
    timestamp: now,
    type: "created",
    version: "1.0",
    summary: `Plan '${name}' initialized in ${mode} mode`,
    changedBy: "claude-code",
    document: "plan.md",
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
  changedBy = "claude-code",
  targetPath?: string
): Promise<UpdateDocumentOutput> {
  const filePath = targetPath ?? (await resolveDocPath(cwd, slug, docType));
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

export async function initAdr(cwd: string, input: InitAdrInput): Promise<InitAdrOutput> {
  const adrsDir = getAdrsDir(cwd);
  await fs.mkdir(adrsDir, { recursive: true });

  // Find next ADR number
  let maxNumber = 0;
  try {
    const files = await fs.readdir(adrsDir);
    for (const file of files) {
      const match = file.match(/^adr-(\d+)-.*\.md$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  } catch {
    // If directory read fails, start at 0
  }

  const nextNumber = maxNumber + 1;
  const slug = generateSlug(input.title);
  const filePath = getAdrPath(cwd, nextNumber, slug);

  const now = new Date().toISOString().slice(0, 10);
  const frontmatter: AdrFrontmatter = {
    id: crypto.randomUUID(),
    number: nextNumber,
    title: input.title,
    slug,
    status: input.status ?? "proposed",
    date: now,
    tags: input.tags ?? [],
    description: input.description ?? "",
    ...(input.deciders ? { deciders: input.deciders } : {}),
  };

  const initialBody = `# ADR ${formatAdrNumber(nextNumber)}: ${input.title}

## Context and Problem Statement
${input.description ? `${input.description}\n` : "Describe the context and problem statement here."}

## Considered Options
- Option 1
- Option 2

## Decision Outcome
Chosen option: "[Option 1]", because [justification].

## Consequences
- **Positive**:
- **Negative / Trade-offs**:
`;

  const content = matter.stringify(initialBody, frontmatter);
  await fs.writeFile(filePath, content, "utf-8");

  return {
    status: "created",
    number: nextNumber,
    slug,
    path: filePath,
  };
}

export async function initSpec(cwd: string, input: InitSpecInput): Promise<InitSpecOutput> {
  const specsDir = getSpecsDir(cwd);
  await fs.mkdir(specsDir, { recursive: true });

  const slug = generateSlug(input.title);
  const filePath = getSpecPath(cwd, slug);

  const now = new Date().toISOString();
  const frontmatter: SpecFrontmatter = {
    id: crypto.randomUUID(),
    title: input.title,
    slug,
    status: "draft",
    version: "1.0",
    created: now,
    lastUpdated: now,
    tags: input.tags ?? [],
    description: input.description ?? "",
    ...(input.category ? { category: input.category } : {}),
  };

  const initialBody = `# ${input.title}

## 1. Overview
${input.description ? `${input.description}\n` : "System or technical specification overview."}

## 2. Architecture & Design

## 3. Data Models & Schemas

## 4. API Endpoints & Contracts
`;

  const content = matter.stringify(initialBody, frontmatter);
  await fs.writeFile(filePath, content, "utf-8");

  return {
    status: "created",
    slug,
    path: filePath,
  };
}

export async function updateSpec(cwd: string, input: UpdateSpecInput): Promise<UpdateSpecOutput> {
  const filePath = getSpecPath(cwd, input.slug);
  const raw = await fs.readFile(filePath, "utf-8");
  const parsed = matter(raw);
  const data = parsed.data as SpecFrontmatter;

  // Bump version (e.g. 1.0 -> 1.1)
  const currentVersion = parseFloat(data.version || "1.0");
  const nextVersion = (isNaN(currentVersion) ? 1.0 : currentVersion + 0.1).toFixed(1);
  const now = new Date().toISOString();

  data.version = nextVersion;
  data.lastUpdated = now;
  if (input.status) {
    data.status = input.status;
  }

  const newContent = matter.stringify(input.body, data);
  await fs.writeFile(filePath, newContent, "utf-8");

  // Log history
  const filename = path.basename(filePath);
  const historyEntry: HistoryEntry = {
    timestamp: now,
    type: "updated",
    version: nextVersion,
    summary: input.changeSummary || "Updated specification",
    changedBy: input.changedBy || "agent",
    document: filename,
    docType: "spec",
  };
  await appendSpecHistory(cwd, input.slug, historyEntry);

  return {
    success: true,
    version: nextVersion,
    path: filePath,
  };
}

