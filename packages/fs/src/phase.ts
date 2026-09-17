import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import matter from "gray-matter";
import type {
  AddPhaseInput,
  AddPhaseOutput,
  AdvancePhaseInput,
  AdvancePhaseOutput,
  PhaseGate,
  DocFrontmatter,
} from "@plannic/core";
import { readPlan } from "./reader.js";
import { getPlanDir, getDocsDir, getHierarchicalDocPath, getLegacyDocPath } from "./slug.js";
import { emitAgentActivity } from "./activity.js";
import { appendHistory } from "./history.js";

const CHECKLIST_REGEX = /^(\s*-\s*\[)([a-zA-Z0-9_\-\/ ]*)(\]\s*)(.+)$/;

/**
 * Extract phase number from filename or slug (e.g., "phase-2.md" -> 2, "phase-1" -> 1).
 */
export function extractPhaseNumber(identifier: string): number {
  const match = identifier.match(/phase-(\d+)/i);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * Check completion gate for a specific phase in a plan.
 */
export async function checkPhaseGate(
  cwd: string,
  slug: string,
  phaseNum?: number
): Promise<PhaseGate> {
  const plan = await readPlan(cwd, slug);
  if (!plan) {
    throw new Error(`Plan "${slug}" not found in ${cwd}`);
  }

  const targetPhaseNum = phaseNum ?? ((plan.root.frontmatter as any).activePhase ?? 1);
  const phaseSlug = `phase-${targetPhaseNum}`;

  const phaseDoc = plan.documents.find(
    (d) =>
      d.type === "phase" &&
      (d.slug === phaseSlug ||
        d.path.includes(`phase-${targetPhaseNum}.md`) ||
        d.path.includes(`phase-${targetPhaseNum}-`))
  );

  if (!phaseDoc) {
    return {
      phaseNumber: targetPhaseNum,
      phaseSlug,
      totalTasks: 0,
      completedTasks: 0,
      allTasksCompleted: true,
      status: "passed",
      uncompletedTasks: [],
    };
  }

  const lines = phaseDoc.body.split("\n");
  let totalTasks = 0;
  let completedTasks = 0;
  const uncompletedTasks: string[] = [];

  for (const line of lines) {
    const match = line.match(CHECKLIST_REGEX);
    if (match) {
      totalTasks++;
      const marker = match[2].trim().toLowerCase();
      const taskTitle = match[4].trim();

      if (marker === "x") {
        completedTasks++;
      } else {
        uncompletedTasks.push(taskTitle);
      }
    }
  }

  const allTasksCompleted = totalTasks > 0 && completedTasks === totalTasks;

  return {
    phaseNumber: targetPhaseNum,
    phaseSlug,
    totalTasks,
    completedTasks,
    allTasksCompleted,
    status: allTasksCompleted ? "passed" : "blocked",
    uncompletedTasks,
  };
}

/**
 * Add a new sequential phase to a plan (ADR #0002).
 */
export async function addPhase(
  cwd: string,
  input: AddPhaseInput
): Promise<AddPhaseOutput> {
  const plan = await readPlan(cwd, input.slug);
  if (!plan) {
    throw new Error(`Plan "${input.slug}" not found in ${cwd}`);
  }

  // Find all existing phase numbers
  const phaseNumbers = plan.documents
    .filter((d) => d.type === "phase" || d.path.includes("phase-"))
    .map((d) => {
      const filename = path.basename(d.path);
      return extractPhaseNumber(filename);
    });

  const currentMax = phaseNumbers.length > 0 ? Math.max(...phaseNumbers) : 1;
  const nextPhaseNum = currentMax + 1;
  const nextPhaseSlug = `phase-${nextPhaseNum}`;

  const isHierarchical = plan.format === "hierarchical";
  const phaseFilename = isHierarchical
    ? `phase-${nextPhaseNum}.md`
    : `phase-${nextPhaseNum}-${input.slug}.md`;

  const targetPath = isHierarchical
    ? path.join(getPlanDir(cwd, input.slug), phaseFilename)
    : path.join(getDocsDir(cwd), phaseFilename);

  const phaseTitle = input.title ?? `Phase ${nextPhaseNum} Implementation`;
  const now = new Date().toISOString();

  const frontmatter: DocFrontmatter = {
    id: crypto.randomUUID(),
    plan: input.slug,
    type: "phase",
    name: `${plan.root.frontmatter.name} — ${phaseTitle}`,
    slug: nextPhaseSlug,
    version: "1.0",
    status: "draft",
    created: now,
    lastUpdated: now,
    tags: [],
    description: `${phaseTitle} for ${plan.root.frontmatter.name}`,
  };

  let body = `# ${phaseTitle}\n\n## Deliverables\n\n`;
  if (input.deliverables && input.deliverables.length > 0) {
    body += input.deliverables.map((d) => `- [ ] ${d}`).join("\n") + "\n";
  } else {
    body += `- [ ] Initialize phase tasks\n- [ ] Implementation\n- [ ] Verification & Testing\n`;
  }

  const rawContent = matter.stringify(body, frontmatter);
  await fs.writeFile(targetPath, rawContent, "utf-8");

  // Update plan.md to include reference and total phases
  try {
    const rootRaw = await fs.readFile(plan.root.path, "utf-8");
    const parsedRoot = matter(rootRaw);
    const rootData = { ...parsedRoot.data };
    rootData.totalPhases = nextPhaseNum;
    if (rootData.activePhase === undefined) {
      rootData.activePhase = 1;
    }

    let rootBody = parsedRoot.content;
    const linkEntry = `- [${phaseTitle}](./${phaseFilename})`;
    if (!rootBody.includes(phaseFilename) && !rootBody.includes(phaseTitle)) {
      rootBody = rootBody.trimEnd() + `\n- [${phaseTitle}](./${phaseFilename})\n`;
    }

    const updatedRoot = matter.stringify(rootBody, rootData);
    await fs.writeFile(plan.root.path, updatedRoot, "utf-8");
  } catch {
    // Ignore if root plan update fails non-critically
  }

  // Emit agent activity
  await emitAgentActivity(cwd, {
    action: "add_phase",
    status: "completed",
    planSlug: input.slug,
    phaseSlug: nextPhaseSlug,
    comment: `Added ${phaseTitle}`,
  });

  return {
    success: true,
    phaseNumber: nextPhaseNum,
    phaseSlug: nextPhaseSlug,
    filePath: targetPath,
  };
}

/**
 * Advance active phase pointer to the next phase after verifying phase gate.
 */
export async function advancePhase(
  cwd: string,
  input: AdvancePhaseInput
): Promise<AdvancePhaseOutput> {
  const plan = await readPlan(cwd, input.slug);
  if (!plan) {
    throw new Error(`Plan "${input.slug}" not found in ${cwd}`);
  }

  const rootData = { ...plan.root.frontmatter } as any;
  const currentPhase: number = rootData.activePhase ?? 1;

  // Verify phase gate for current phase
  const gate = await checkPhaseGate(cwd, input.slug, currentPhase);

  if (!gate.allTasksCompleted && !input.force) {
    return {
      success: false,
      previousPhase: currentPhase,
      currentPhase,
      gatePassed: false,
      message: `Phase gate blocked: ${gate.uncompletedTasks.length} uncompleted tasks remain in Phase ${currentPhase}. Use force=true to bypass.`,
    };
  }

  const nextPhase = currentPhase + 1;

  // Check if next phase document exists, or scaffold it
  const isHierarchical = plan.format === "hierarchical";
  const nextPhaseFilename = isHierarchical
    ? `phase-${nextPhase}.md`
    : `phase-${nextPhase}-${input.slug}.md`;
  const nextPhasePath = isHierarchical
    ? path.join(getPlanDir(cwd, input.slug), nextPhaseFilename)
    : path.join(getDocsDir(cwd), nextPhaseFilename);

  let nextPhaseExists = false;
  try {
    await fs.access(nextPhasePath);
    nextPhaseExists = true;
  } catch {
    nextPhaseExists = false;
  }

  if (!nextPhaseExists) {
    // Auto-create next phase document
    await addPhase(cwd, {
      cwd,
      slug: input.slug,
      title: `Phase ${nextPhase} Implementation`,
    });
  }

  // Update plan.md activePhase
  rootData.activePhase = nextPhase;
  rootData.lastUpdated = new Date().toISOString();

  const updatedRootContent = matter.stringify(plan.root.body, rootData);
  await fs.writeFile(plan.root.path, updatedRootContent, "utf-8");

  await appendHistory(cwd, input.slug, {
    timestamp: new Date().toISOString(),
    type: "status_changed",
    version: rootData.version || "1.0",
    summary: input.comment ?? `Advanced active phase from Phase ${currentPhase} to Phase ${nextPhase}`,
    changedBy: "ai-agent",
    document: path.basename(plan.root.path),
    docType: "plan",
  });

  // Emit agent activity
  await emitAgentActivity(cwd, {
    action: "advance_phase",
    status: "completed",
    planSlug: input.slug,
    fromStatus: `phase-${currentPhase}`,
    toStatus: `phase-${nextPhase}`,
    comment: input.comment,
  });

  return {
    success: true,
    previousPhase: currentPhase,
    currentPhase: nextPhase,
    gatePassed: true,
    message: `Successfully advanced active phase to Phase ${nextPhase}.`,
  };
}
