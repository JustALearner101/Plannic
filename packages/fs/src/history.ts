import fs from "node:fs/promises";
import path from "node:path";
import type { HistoryEntry } from "@plannic/core";
import { getHistoryPath } from "./slug.js";

/**
 * Append a single history entry as a JSONL line to .docs/.history/plan-<slug>.jsonl
 */
export async function appendHistory(cwd: string, slug: string, entry: HistoryEntry): Promise<void> {
  const historyPath = getHistoryPath(cwd, slug);
  await fs.mkdir(path.dirname(historyPath), { recursive: true });
  const line = JSON.stringify(entry) + "\n";
  await fs.appendFile(historyPath, line, "utf-8");
}

/**
 * Read history entries from .docs/.history/plan-<slug>.jsonl
 * Returns entries sorted newest first, up to `limit`.
 */
export async function readHistory(cwd: string, slug: string, limit = 20): Promise<HistoryEntry[]> {
  const historyPath = getHistoryPath(cwd, slug);
  try {
    const raw = await fs.readFile(historyPath, "utf-8");
    const lines = raw.trim().split("\n").filter((l) => l.trim().length > 0);
    const entries: HistoryEntry[] = [];
    for (const line of lines) {
      try {
        entries.push(JSON.parse(line));
      } catch {
        // Skip corrupted line
      }
    }
    // Return newest first
    return entries.reverse().slice(0, limit);
  } catch (error: unknown) {
    const isEnoent = (error as NodeJS.ErrnoException).code === "ENOENT";
    if (isEnoent) {
      return [];
    }
    throw error;
  }
}
