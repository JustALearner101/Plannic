import path from "node:path";
import type {
  GetExecutionProgressOutput,
  PhaseProgress,
} from "@plannic/core";
import { readPlan } from "./reader.js";
import { extractPhaseNumber } from "./phase.js";

const CHECKLIST_REGEX = /^(\s*-\s*\[)([a-zA-Z0-9_\-\/ ]*)(\]\s*)(.+)$/;

/**
 * Calculate multi-phase execution progress metrics across all phases of a plan.
 */
export async function getExecutionProgress(
  cwd: string,
  slug: string
): Promise<GetExecutionProgressOutput> {
  const plan = await readPlan(cwd, slug);
  if (!plan) {
    throw new Error(`Plan "${slug}" not found in ${cwd}`);
  }

  const activePhase: number = (plan.root.frontmatter as any).activePhase ?? 1;

  // Filter and sort all phase documents
  const phaseDocs = plan.documents.filter(
    (d) => d.type === "phase" || path.basename(d.path).startsWith("phase-")
  );

  const phaseProgressList: PhaseProgress[] = [];
  let aggregateTotalTasks = 0;
  let aggregateCompletedTasks = 0;

  for (const doc of phaseDocs) {
    const filename = path.basename(doc.path);
    const phaseNum = extractPhaseNumber(filename);
    const phaseSlug = `phase-${phaseNum}`;
    const title = doc.frontmatter.name || `Phase ${phaseNum}`;

    const lines = doc.body.split("\n");
    let totalTasks = 0;
    let completedTasks = 0;

    for (const line of lines) {
      const match = line.match(CHECKLIST_REGEX);
      if (match) {
        totalTasks++;
        const marker = match[2].trim().toLowerCase();
        if (marker === "x") {
          completedTasks++;
        }
      }
    }

    const percentage =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    const isCurrent = phaseNum === activePhase;
    const isCompleted = totalTasks > 0 && completedTasks === totalTasks;

    aggregateTotalTasks += totalTasks;
    aggregateCompletedTasks += completedTasks;

    phaseProgressList.push({
      phaseNumber: phaseNum,
      phaseSlug,
      title,
      isCurrent,
      isCompleted,
      totalTasks,
      completedTasks,
      percentage,
    });
  }

  // Sort phases ascending
  phaseProgressList.sort((a, b) => a.phaseNumber - b.phaseNumber);

  const aggregatePercentage =
    aggregateTotalTasks === 0
      ? 0
      : Math.round((aggregateCompletedTasks / aggregateTotalTasks) * 100);

  return {
    planSlug: slug,
    activePhase,
    totalPhases: phaseProgressList.length,
    aggregatePercentage,
    phases: phaseProgressList,
  };
}
