import path from "node:path";
import type { DocType } from "@plannic/core";

import {
  getHierarchicalDocFilename,
  getLegacyDocFilename as getLegacyDocFilenameCore,
} from "@plannic/core";

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

export function getPlansDir(cwd: string): string {
  return path.join(getDocsDir(cwd), "plans");
}

export function getPlanDir(cwd: string, slug: string): string {
  return path.join(getPlansDir(cwd), slug);
}

export function getHierarchicalDocPath(
  cwd: string,
  slug: string,
  docType: DocType,
  phaseNum?: number
): string {
  return path.join(getPlanDir(cwd, slug), getHierarchicalDocFilename(docType, phaseNum));
}

export function getLegacyDocFilename(slug: string, docType: DocType, phaseNum?: number): string {
  return getLegacyDocFilenameCore(slug, docType, phaseNum);
}

export function getDocFilename(slug: string, docType: DocType, phaseNum?: number): string {
  if (docType === "phase") {
    return `phase-${phaseNum ?? 1}-${slug}.md`;
  }
  return `${docType}-${slug}.md`;
}

export function getLegacyDocPath(
  cwd: string,
  slug: string,
  docType: DocType,
  phaseNum?: number
): string {
  return path.join(getDocsDir(cwd), getDocFilename(slug, docType, phaseNum));
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

export function getAdrsDir(cwd: string): string {
  return path.join(getDocsDir(cwd), "adrs");
}

export function getSpecsDir(cwd: string): string {
  return path.join(getDocsDir(cwd), "specs");
}

export function formatAdrNumber(num: number): string {
  return String(num).padStart(4, "0");
}

export function formatAdrFilename(num: number, slug: string): string {
  return `adr-${formatAdrNumber(num)}-${slug}.md`;
}

export function getAdrPath(cwd: string, num: number, slug: string): string {
  return path.join(getAdrsDir(cwd), formatAdrFilename(num, slug));
}

export function formatSpecFilename(slug: string): string {
  return `${slug}.md`;
}

export function getSpecPath(cwd: string, slug: string): string {
  return path.join(getSpecsDir(cwd), formatSpecFilename(slug));
}

export function getSpecHistoryPath(cwd: string, slug: string): string {
  return path.join(getDocsDir(cwd), ".history", `spec-${slug}.jsonl`);
}

export function getAgentActivityPath(cwd: string): string {
  return path.join(cwd, ".plannic", ".agent_activity.json");
}

