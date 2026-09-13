import { z } from "zod";

export const PlanModeSchema = z.enum(["quick", "deep"]);
export const DocTypeSchema = z.enum(["plan", "scope", "feature", "phase", "limitation"]);
export const PlanStatusSchema = z.enum(["draft", "review", "final"]);

export const DocFrontmatterSchema = z.object({
  id: z.string().uuid(),
  plan: z.string().min(1),
  type: DocTypeSchema,
  name: z.string().min(1),
  slug: z.string().min(1),
  version: z.string().default("1.0"),
  status: PlanStatusSchema.default("draft"),
  created: z.string().datetime(),
  lastUpdated: z.string().datetime(),
  tags: z.array(z.string()).default([]),
  description: z.string().default(""),
  mode: PlanModeSchema.optional(),
  documents: z.array(z.string()).optional(),
});

export const HistoryEntrySchema = z.object({
  timestamp: z.string().datetime(),
  type: z.enum(["created", "updated", "status_changed"]),
  version: z.string(),
  summary: z.string(),
  changedBy: z.string().default("manual"),
  document: z.string().min(1),
  docType: DocTypeSchema,
});

export const ProjectConfigFrontmatterSchema = z.object({
  project: z.string().min(1),
  stack: z.union([z.array(z.string()), z.string()]),
  default_mode: PlanModeSchema.default("deep"),
  lang: z.string().optional(),
});

// MCP Tool Input Schemas

export const GetConfigInputSchema = z.object({
  cwd: z.string().min(1).describe("Absolute path to project folder"),
});

export const InitPlanInputSchema = z.object({
  cwd: z.string().min(1).describe("Absolute path to project folder"),
  name: z.string().min(1).describe("Plan name, e.g. 'Auth System'"),
  mode: PlanModeSchema.describe("Plan mode: 'quick' (single file) or 'deep' (document tree)"),
});

export const GetPlanInputSchema = z.object({
  cwd: z.string().min(1).describe("Absolute path to project folder"),
  slug: z.string().min(1).describe("Slug of the plan to retrieve"),
});

export const UpdateDocumentInputSchema = z.object({
  cwd: z.string().min(1).describe("Absolute path to project folder"),
  slug: z.string().min(1).describe("Slug of the plan"),
  docType: DocTypeSchema.describe("Document type to update ('plan' | 'scope' | 'feature' | 'phase' | 'limitation')"),
  body: z.string().min(1).describe("New markdown body content for the document"),
  changeSummary: z.string().optional().describe("Summary of what changed"),
  changedBy: z.string().optional().default("claude-code").describe("Who made the change ('claude-code' | 'desktop' | 'manual')"),
});

export const ListPlansInputSchema = z.object({
  cwd: z.string().min(1).describe("Absolute path to project folder"),
});

export const SearchPlansInputSchema = z.object({
  cwd: z.string().min(1).describe("Absolute path to project folder"),
  query: z.string().min(1).describe("Search query text"),
  limit: z.number().int().positive().optional().default(5).describe("Max results to return"),
});

export const GetHistoryInputSchema = z.object({
  cwd: z.string().min(1).describe("Absolute path to project folder"),
  slug: z.string().min(1).describe("Slug of the plan"),
  limit: z.number().int().positive().optional().default(20).describe("Max history entries to return"),
});

export const MoveTaskInputSchema = z.object({
  cwd: z.string().min(1).describe("Absolute path to project folder"),
  slug: z.string().min(1).describe("Slug of the plan"),
  taskIdentifier: z.string().min(1).describe("Task title substring or identifier to match"),
  newStatus: z.string().min(1).describe("New status: 'todo' | 'in_progress' | 'done' or a custom status identifier (e.g. 'review')"),
  phaseSlug: z.string().optional().describe("Specific phase document slug (e.g. 'phase-1') or omit to auto-match across phases"),
  comment: z.string().optional().describe("Optional note for audit trail"),
});
