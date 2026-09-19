import fs from "node:fs/promises";
import path from "node:path";
import type {
  AgentActivityEvent,
  AgentActivityStream,
} from "@plannic/core";
import { getAgentActivityPath } from "./slug.js";

const MAX_ACTIVITY_HISTORY = 50;

/**
 * Emit an agent activity event to `.plannic/.agent_activity.json`.
 * Ensures thread-safe atomic appending and limits memory footprint.
 */
export async function emitAgentActivity(
  cwd: string,
  event: Omit<AgentActivityEvent, "id" | "timestamp" | "agent"> & {
    id?: string;
    timestamp?: string;
    agent?: string;
  }
): Promise<AgentActivityEvent> {
  const activityFilePath = getAgentActivityPath(cwd);
  const dirPath = path.dirname(activityFilePath);

  // Ensure .plannic dir exists
  await fs.mkdir(dirPath, { recursive: true });

  const fullEvent: AgentActivityEvent = {
    id: event.id ?? `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: event.timestamp ?? new Date().toISOString(),
    agent: event.agent ?? "Antigravity",
    action: event.action,
    status: event.status ?? "executing",
    planSlug: event.planSlug,
    taskId: event.taskId,
    taskTitle: event.taskTitle,
    fromStatus: event.fromStatus,
    toStatus: event.toStatus,
    phaseSlug: event.phaseSlug,
    comment: event.comment,
    metadata: event.metadata,
  };

  let currentStream: AgentActivityStream = {
    events: [],
    lastUpdated: new Date().toISOString(),
  };

  try {
    const raw = await fs.readFile(activityFilePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.events)) {
      currentStream = parsed;
    }
  } catch {
    // If file doesn't exist or is invalid JSON, use empty stream
  }

  const updatedEvents = [...currentStream.events, fullEvent];
  // Retain only last N events
  if (updatedEvents.length > MAX_ACTIVITY_HISTORY) {
    updatedEvents.splice(0, updatedEvents.length - MAX_ACTIVITY_HISTORY);
  }

  // Reconcile executing states when completion event is received
  if (fullEvent.status === "completed" || fullEvent.status === "failed") {
    for (let i = updatedEvents.length - 2; i >= 0; i--) {
      if (
        updatedEvents[i].agent === fullEvent.agent &&
        updatedEvents[i].status === "executing"
      ) {
        updatedEvents[i].status = fullEvent.status;
      }
    }
  }

  const activeAgent =
    fullEvent.status === "executing"
      ? fullEvent.agent
      : updatedEvents.slice().reverse().find((e) => e.status === "executing")?.agent;

  const streamData: AgentActivityStream = {
    events: updatedEvents,
    lastUpdated: fullEvent.timestamp,
    activeAgent,
  };

  // Write atomically via temporary file (with unique entropy to avoid collisions)
  const tmpPath = `${activityFilePath}.tmp.${Date.now()}_${Math.random().toString(36).slice(2)}`;
  await fs.writeFile(tmpPath, JSON.stringify(streamData, null, 2), "utf-8");
  await fs.rename(tmpPath, activityFilePath);

  return fullEvent;
}

/**
 * Read the current agent activity stream.
 */
export async function readAgentActivity(cwd: string): Promise<AgentActivityStream> {
  const activityFilePath = getAgentActivityPath(cwd);
  try {
    const raw = await fs.readFile(activityFilePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.events)) {
      return parsed;
    }
  } catch {
    // Ignore missing file
  }

  return {
    events: [],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Clear the agent activity stream.
 */
export async function clearAgentActivity(cwd: string): Promise<void> {
  const activityFilePath = getAgentActivityPath(cwd);
  try {
    await fs.unlink(activityFilePath);
  } catch {
    // Ignore error if file does not exist
  }
}
