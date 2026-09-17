import { readPlan } from "./reader.js";
import { updateDocument } from "./writer.js";
import { emitAgentActivity } from "./activity.js";
import type { MoveTaskOutput } from "@plannic/core";

const CHECKLIST_REGEX = /^(\s*-\s*\[)([a-zA-Z0-9_\-\/ ]*)(\]\s*)(.+)$/;

export async function moveTask(
  cwd: string,
  slug: string,
  taskIdentifier: string,
  newStatus: string,
  phaseSlug?: string,
  comment?: string,
  changedBy: string = "ai-agent"
): Promise<MoveTaskOutput> {
  const plan = await readPlan(cwd, slug);
  if (!plan) {
    throw new Error(`Plan "${slug}" not found in project ${cwd}`);
  }

  // Determine candidate documents to search
  let candidateDocs = plan.documents.filter((d) => d.type === "phase");
  if (phaseSlug) {
    candidateDocs = candidateDocs.filter(
      (d) => d.slug === phaseSlug || d.path.includes(phaseSlug)
    );
  }
  // Fallback to searching all documents if no phase doc matches
  if (candidateDocs.length === 0) {
    candidateDocs = plan.documents;
  }

  const cleanIdent = taskIdentifier.trim().toLowerCase();
  const numericIndex = !isNaN(Number(cleanIdent)) ? parseInt(cleanIdent, 10) : -1;

  for (const doc of candidateDocs) {
    const lines = doc.body.split("\n");
    let matchLineIdx = -1;
    let matchedTitle = "";
    let prevMarker = " ";

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(CHECKLIST_REGEX);
      if (!match) continue;

      const marker = match[2];
      const title = match[4].trim();

      const cleanLineTitle = title.replace(/[*_`]/g, "").toLowerCase();
      const strippedIdent = cleanIdent.replace(/[*_`]/g, "");

      if (
        i === numericIndex ||
        title.toLowerCase().includes(cleanIdent) ||
        cleanLineTitle.includes(strippedIdent)
      ) {
        matchLineIdx = i;
        matchedTitle = title;
        prevMarker = marker;
        break;
      }
    }

    if (matchLineIdx !== -1) {
      // Map previous marker to status name
      const prevTrim = prevMarker.trim().toLowerCase();
      let previousStatus = "todo";
      if (prevTrim === "/" || prevTrim === "wip") previousStatus = "in_progress";
      else if (prevTrim === "x") previousStatus = "done";
      else if (prevTrim !== "") previousStatus = prevTrim;

      // Determine new marker
      const cleanNewStatus = newStatus.trim().toLowerCase();
      let newMarker = " ";
      if (cleanNewStatus === "todo") newMarker = " ";
      else if (cleanNewStatus === "in_progress") newMarker = "/";
      else if (cleanNewStatus === "done") newMarker = "x";
      else newMarker = cleanNewStatus; // custom column marker (e.g. 'review', 'qa')

      // Replace the line
      const match = lines[matchLineIdx].match(CHECKLIST_REGEX)!;
      lines[matchLineIdx] = `${match[1]}${newMarker}${match[3]}${match[4]}`;
      const newBody = lines.join("\n");

      const updateResult = await updateDocument(
        cwd,
        slug,
        doc.type,
        newBody,
        comment ?? `Task "${matchedTitle}" moved from [${previousStatus}] to [${newStatus}]`,
        changedBy,
        doc.path
      );

      const filename = doc.path.split(/[/\\]/).pop() || doc.path;

      try {
        await emitAgentActivity(cwd, {
          agent: changedBy === "ai-agent" ? "Antigravity" : changedBy,
          action: "move_task",
          status: "completed",
          planSlug: slug,
          taskTitle: matchedTitle,
          fromStatus: previousStatus,
          toStatus: cleanNewStatus,
          phaseSlug: doc.slug || doc.type,
          comment,
        });
      } catch {
        // Activity emission is non-blocking/graceful
      }

      return {
        success: true,
        taskTitle: matchedTitle,
        previousStatus,
        newStatus: cleanNewStatus,
        documentFile: filename,
        version: updateResult.version,
      };
    }
  }

  throw new Error(
    `Task matching "${taskIdentifier}" not found in plan "${slug}". Make sure it is formatted as a checklist item: - [ ] Task name`
  );
}
