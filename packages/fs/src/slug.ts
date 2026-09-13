import path from "node:path";
import type { DocType } from "@plannic/core";

/**
 * Generate a URL-friendly, filesystem-safe slug from a plan name.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getDocsDir(cwd: string): string {
  return path.join(cwd, ".docs");
}

export function getDocFilename(slug: string, docType: DocType, phaseNum?: number): string {
  if (docType === "phase") {
    return `phase-${phaseNum ?? 1}-${slug}.md`;
  }
  return `${docType}-${slug}.md`;
}

export function getDocPath(cwd: string, slug: string, docType: DocType, phaseNum?: number): string {
  return path.join(getDocsDir(cwd), getDocFilename(slug, docType, phaseNum));
}

export function getHistoryPath(cwd: string, slug: string): string {
  return path.join(getDocsDir(cwd), ".history", `plan-${slug}.jsonl`);
}

export function getConfigPath(cwd: string): string {
  return path.join(cwd, ".plannic", "config.md");
}
