import * as fs from "@plannic/fs";
import { renderStatusLine } from "./statusline.js";
import { renderPlanCard } from "./card.js";

export interface HeadlessOptions { cwd: string; }

/** The single application boundary for workspace operations. UI layers should use this facade. */
export function createHeadless(options: HeadlessOptions) {
  const cwd = options.cwd;
  return {
    cwd,
    readConfig: () => fs.readConfig(cwd),
    readHistory: (slug: string, limit?: number) => fs.readHistory(cwd, slug, limit),
    readSpecHistory: (slug: string, limit?: number) => fs.readSpecHistory(cwd, slug, limit),
    listPlans: () => fs.listPlans(cwd),
    readPlan: (slug: string) => fs.readPlan(cwd, slug),
    searchPlans: (query: string, limit?: number) => fs.searchPlans(cwd, query, limit),
    listAdrs: (status?: any) => fs.listAdrs(cwd, status),
    readAdr: (identifier: any) => fs.readAdr(cwd, identifier),
    listSpecs: (category?: string, status?: any) => fs.listSpecs(cwd, category, status),
    readSpec: (slug: string) => fs.readSpec(cwd, slug),
    initPlan: (name: string, mode: any) => fs.initPlan(cwd, name, mode),
    updateDocument: (input: any) => fs.updateDocument(cwd, input.slug, input.docType, input.body, input.changeSummary, input.changedBy),
    initAdr: (input: any) => fs.initAdr(cwd, input),
    initSpec: (input: any) => fs.initSpec(cwd, input),
    updateSpec: (input: any) => fs.updateSpec(cwd, input),
    moveTask: (input: any) => fs.moveTask(cwd, input.slug, input.taskIdentifier, input.newStatus, input.phaseSlug, input.comment, input.changedBy),
    addPhase: (input: any) => fs.addPhase(cwd, input),
    advancePhase: (input: any) => fs.advancePhase(cwd, input),
    getExecutionProgress: (slug: string) => fs.getExecutionProgress(cwd, slug),
    migratePlan: (input: any) => fs.migratePlan(cwd, input.slug, input.dryRun, input.changedBy),
    migrateAllPlans: (input: any = {}) => fs.migrateAllPlans({ ...input, cwd }),
    renderStatusLine: (useColor?: boolean) => renderStatusLine({ cwd, useColor }),
    renderPlanCard: (slug?: string) => renderPlanCard({ cwd, slug }),
  };
}

export type HeadlessEngine = ReturnType<typeof createHeadless>;
export * from "./statusline.js";
export * from "./card.js";
export * from "@plannic/fs";
