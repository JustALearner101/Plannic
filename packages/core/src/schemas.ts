import { z } from "zod";

export const PlanModeSchema = z.enum(["quick", "deep"]);
export const PlanDocTypeSchema = z.enum(["plan", "scope", "feature", "phase", "limitation"]);
export const EngineeringDocTypeSchema = z.enum(["adr", "spec"]);
export const DocTypeSchema = z.enum(["plan", "scope", "feature", "phase", "limitation", "adr", "spec"]);
export const PlanStatusSchema = z.enum(["draft", "review", "final"]);
export const AdrStatusSchema = z.enum(["proposed", "accepted", "rejected", "superseded"]);
export const SpecStatusSchema = z.enum(["draft", "living", "deprecated"]);

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
  specs: z.array(z.string()).optional(),
  adrs: z.array(z.number()).optional(),
});

export const AdrFrontmatterSchema = z.object({
  id: z.string().uuid(),
  number: z.number().int().positive(),
  title: z.string().min(1),
  slug: z.string().min(1),
  status: AdrStatusSchema.default("proposed"),
  date: z.string(),
  deciders: z.array(z.string()).optional(),
  supersedes: z.number().int().positive().optional(),
  supersededBy: z.number().int().positive().optional(),
  tags: z.array(z.string()).default([]),
  description: z.string().default(""),
});

export const SpecFrontmatterSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  slug: z.string().min(1),
  status: SpecStatusSchema.default("draft"),
  version: z.string().default("1.0"),
  category: z.string().optional(),
  created: z.string(),
  lastUpdated: z.string(),
  owners: z.array(z.string()).optional(),
  tags: z.array(z.string()).default([]),
  description: z.string().default(""),
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

export const GeneratedDocConfigSchema = z.object({
  type: DocTypeSchema,
  filename: z.string().min(1),
  title: z.string().min(1),
  required: z.boolean().optional().default(true),
  description: z.string().optional(),
  template: z.string().optional(),
});

export const RulesetConfigSchema = z.object({
  strict_kanban: z.boolean().optional().default(true),
  auto_changelog: z.boolean().optional().default(true),
  max_phases_recommended: z.number().int().positive().optional().default(5),
  enforce_feedback_artifact: z.boolean().optional().default(true),
  plans_dir: z.string().optional().default(".docs/plans"),
  phase_pattern: z.string().optional().default("phase-{n}.md"),
});

export const DEFAULT_GENERATED_DOCS: z.infer<typeof GeneratedDocConfigSchema>[] = [
  { type: "plan" as const, filename: "plan.md", title: "Plan Overview", required: true },
  { type: "scope" as const, filename: "scope.md", title: "Scope & Boundaries", required: true },
  { type: "feature" as const, filename: "feature.md", title: "Feature Breakdown", required: true },
  { type: "phase" as const, filename: "phase-1.md", title: "Phase 1 Implementation", required: true },
  { type: "limitation" as const, filename: "limitation.md", title: "Limitations & Constraints", required: true },
];

export const ProjectConfigFrontmatterSchema = z.object({
  project: z.string().min(1),
  stack: z.union([z.array(z.string()), z.string()]),
  default_mode: PlanModeSchema.default("deep"),
  lang: z.string().optional(),
  generated_docs: z.array(GeneratedDocConfigSchema).optional(),
  ruleset: RulesetConfigSchema.optional(),
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

export const MigratePlansInputSchema = z.object({
  cwd: z.string().min(1).describe("Absolute path to project folder"),
  slug: z.string().optional().describe("Optional specific plan slug to migrate. If omitted, migrates all legacy flat plans."),
  dryRun: z.boolean().optional().default(false).describe("If true, simulates migration without modifying files"),
});

// ADR & Spec MCP Tool Input Schemas

export const InitAdrInputSchema = z.object({
  cwd: z.string().min(1).describe("Absolute path to project folder"),
  title: z.string().min(1).describe("Title of the ADR (e.g. 'Use Tauri 2 for Desktop App')"),
  status: AdrStatusSchema.optional().default("proposed").describe("Status of the ADR ('proposed' | 'accepted' | 'rejected' | 'superseded')"),
  deciders: z.array(z.string()).optional().describe("List of decision makers"),
  description: z.string().optional().describe("Short summary of the architectural decision"),
  tags: z.array(z.string()).optional().describe("Tags for categorizing the ADR"),
});

export const GetAdrInputSchema = z.object({
  cwd: z.string().min(1).describe("Absolute path to project folder"),
  number: z.number().int().positive().optional().describe("ADR number (e.g. 1 for adr-0001)"),
  slug: z.string().optional().describe("ADR slug or filename without extension"),
});

export const ListAdrsInputSchema = z.object({
  cwd: z.string().min(1).describe("Absolute path to project folder"),
  status: AdrStatusSchema.optional().describe("Filter ADRs by status ('proposed' | 'accepted' | 'rejected' | 'superseded')"),
});

export const InitSpecInputSchema = z.object({
  cwd: z.string().min(1).describe("Absolute path to project folder"),
  title: z.string().min(1).describe("Title of the specification (e.g. 'API Contracts')"),
  category: z.string().optional().describe("Category: 'architecture' | 'api' | 'database' | 'security' | 'workflow'"),
  description: z.string().optional().describe("Summary of what this specification defines"),
  tags: z.array(z.string()).optional().describe("Tags for categorizing the spec"),
});

export const GetSpecInputSchema = z.object({
  cwd: z.string().min(1).describe("Absolute path to project folder"),
  slug: z.string().min(1).describe("Slug of the specification (e.g. 'api-contracts')"),
});

export const UpdateSpecInputSchema = z.object({
  cwd: z.string().min(1).describe("Absolute path to project folder"),
  slug: z.string().min(1).describe("Slug of the specification to update"),
  body: z.string().min(1).describe("New markdown body content for the specification"),
  changeSummary: z.string().optional().describe("Summary of what changed"),
  changedBy: z.string().optional().default("agent").describe("Who made the change"),
  status: SpecStatusSchema.optional().describe("Updated status: 'draft' | 'living' | 'deprecated'"),
});

export const ListSpecsInputSchema = z.object({
  cwd: z.string().min(1).describe("Absolute path to project folder"),
  category: z.string().optional().describe("Filter specs by category"),
  status: SpecStatusSchema.optional().describe("Filter specs by status ('draft' | 'living' | 'deprecated')"),
});

