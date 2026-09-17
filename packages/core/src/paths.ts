import type { DocType } from "./types.js";

/**
 * Normalizes slash paths to forward slashes for universal cross-platform handling.
 */
export function normalizeSlash(p: string): string {
  return p.replace(/\\/g, "/");
}

/**
 * Returns standard filename for a document in a hierarchical plan folder.
 * E.g.: "plan.md", "scope.md", "phase-1.md", "phase-2.md".
 */
export function getHierarchicalDocFilename(docType: DocType, phaseNum = 1): string {
  if (docType === "phase") {
    return `phase-${phaseNum}.md`;
  }
  return `${docType}.md`;
}

/**
 * Returns legacy flat filename for a document in .docs/.
 * E.g.: "plan-my-feature.md", "phase-1-my-feature.md".
 */
export function getLegacyDocFilename(slug: string, docType: DocType, phaseNum = 1): string {
  if (docType === "phase") {
    return `phase-${phaseNum}-${slug}.md`;
  }
  return `${docType}-${slug}.md`;
}

/**
 * Returns relative path from docs directory to hierarchical plan folder.
 * E.g.: "plans/my-feature"
 */
export function getPlanRelativeDirPath(slug: string, plansDir = "plans"): string {
  return `${plansDir}/${slug}`;
}
