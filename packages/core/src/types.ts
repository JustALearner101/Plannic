export type PlanMode = "quick" | "deep";
export type PlanDocType = "plan" | "scope" | "feature" | "phase" | "limitation";
export type EngineeringDocType = "adr" | "spec";
export type DocType = PlanDocType | EngineeringDocType;

export type PlanStatus = "draft" | "review" | "final";
export type AdrStatus = "proposed" | "accepted" | "rejected" | "superseded";
export type SpecStatus = "draft" | "living" | "deprecated";

export interface DocFrontmatter {
  id: string;
  plan: string;
  type: DocType;
  name: string;
  slug: string;
  version: string;
  status: PlanStatus;
  created: string;
  lastUpdated: string;
  tags: string[];
  description: string;
  mode?: PlanMode;
  documents?: string[];
  specs?: string[];
  adrs?: number[];
}

export interface AdrFrontmatter {
  id: string;
  number: number;
  title: string;
  slug: string;
  status: AdrStatus;
  date: string;
  deciders?: string[];
  supersedes?: number;
  supersededBy?: number;
  tags: string[];
  description: string;
}

export interface AdrDocument {
  number: number;
  slug: string;
  path: string;
  frontmatter: AdrFrontmatter;
  body: string;
  rawContent: string;
}

export interface AdrSummary {
  number: number;
  slug: string;
  title: string;
  status: AdrStatus;
  date: string;
  description: string;
  tags: string[];
}

export interface SpecFrontmatter {
  id: string;
  title: string;
  slug: string;
  status: SpecStatus;
  version: string;
  category?: string;
  created: string;
  lastUpdated: string;
  owners?: string[];
  tags: string[];
  description: string;
}

export interface SpecDocument {
  slug: string;
  path: string;
  frontmatter: SpecFrontmatter;
  body: string;
  rawContent: string;
}

export interface SpecSummary {
  slug: string;
  title: string;
  status: SpecStatus;
  version: string;
  category?: string;
  lastUpdated: string;
  description: string;
  tags: string[];
}

export interface PlanDocument {
  slug: string;
  type: DocType;
  path: string;
  frontmatter: DocFrontmatter;
  body: string;
  rawContent: string;
}

export type PlanFormat = "hierarchical" | "legacy_flat";

export interface GeneratedDocConfig {
  type: DocType;
  filename: string;
  title: string;
  required?: boolean;
  description?: string;
  template?: string;
}

export interface RulesetConfig {
  strict_kanban?: boolean;
  auto_changelog?: boolean;
  max_phases_recommended?: number;
  enforce_feedback_artifact?: boolean;
  plans_dir?: string;
  phase_pattern?: string;
}

export interface Plan {
  slug: string;
  mode: PlanMode;
  format?: PlanFormat;
  root: PlanDocument;
  documents: PlanDocument[];
  activePhase?: number;
  totalPhases?: number;
}

export interface PlanSummary {
  slug: string;
  name: string;
  mode: PlanMode;
  status: PlanStatus;
  version: string;
  lastUpdated: string;
  description: string;
  documentCount: number;
  format?: PlanFormat;
}

export interface HistoryEntry {
  timestamp: string;
  type: "created" | "updated" | "status_changed";
  version: string;
  summary: string;
  changedBy: string;
  document: string;
  docType: DocType;
}

export interface ProjectConfigFrontmatter {
  project: string;
  stack: string[] | string;
  default_mode: PlanMode;
  lang?: string;
  generated_docs?: GeneratedDocConfig[];
  ruleset?: RulesetConfig;
}

export interface ProjectConfig {
  rawContent: string;
  project: string;
  stack: string[];
  default_mode: PlanMode;
  lang?: string;
  generated_docs?: GeneratedDocConfig[];
  ruleset?: RulesetConfig;
  body: string;
}

// MCP Tool I/O Interfaces

export interface GetConfigInput {
  cwd: string;
}

export interface GetConfigOutput {
  found: boolean;
  content: string;
  path: string;
  config?: ProjectConfig;
}

export interface InitPlanInput {
  cwd: string;
  name: string;
  mode: PlanMode;
}

export interface InitPlanOutput {
  status: string;
  slug: string;
  filesCreated: string[];
}

export interface GetPlanInput {
  cwd: string;
  slug: string;
}

export interface GetPlanOutput {
  found: boolean;
  plan?: Plan;
}

export interface UpdateDocumentInput {
  cwd: string;
  slug: string;
  docType: DocType;
  body: string;
  changeSummary?: string;
  changedBy?: string;
}

export interface UpdateDocumentOutput {
  success: boolean;
  version: string;
  path: string;
}

export interface ListPlansInput {
  cwd: string;
}

export interface ListPlansOutput {
  plans: PlanSummary[];
}

export interface SearchResult {
  slug: string;
  planName: string;
  docType: DocType;
  documentFile: string;
  score: number;
  excerpt: string;
}

export interface SearchPlansInput {
  cwd: string;
  query: string;
  limit?: number;
}

export interface SearchPlansOutput {
  results: SearchResult[];
}

export interface GetHistoryInput {
  cwd: string;
  slug: string;
  limit?: number;
}

export interface GetHistoryOutput {
  history: HistoryEntry[];
}

export interface MoveTaskInput {
  cwd: string;
  slug: string;
  taskIdentifier: string;
  newStatus: string;
  phaseSlug?: string;
  comment?: string;
}

export interface MoveTaskOutput {
  success: boolean;
  taskTitle: string;
  previousStatus: string;
  newStatus: string;
  documentFile: string;
  version: string;
}

export interface MigratePlanFileMapping {
  from: string;
  to: string;
}

export interface MigratePlanResult {
  slug: string;
  success: boolean;
  filesMoved: MigratePlanFileMapping[];
  error?: string;
}

export interface MigratePlansInput {
  cwd: string;
  slug?: string;
  dryRun?: boolean;
}

export interface MigratePlansOutput {
  migrated: MigratePlanResult[];
  totalPlans: number;
  successCount: number;
}

// ADR & Spec MCP Tool I/O Interfaces

export interface InitAdrInput {
  cwd: string;
  title: string;
  status?: AdrStatus;
  deciders?: string[];
  description?: string;
  tags?: string[];
}

export interface InitAdrOutput {
  status: string;
  number: number;
  slug: string;
  path: string;
}

export interface GetAdrInput {
  cwd: string;
  number?: number;
  slug?: string;
}

export interface GetAdrOutput {
  found: boolean;
  adr?: AdrDocument;
}

export interface ListAdrsInput {
  cwd: string;
  status?: AdrStatus;
}

export interface ListAdrsOutput {
  adrs: AdrSummary[];
}

export interface InitSpecInput {
  cwd: string;
  title: string;
  category?: string;
  description?: string;
  tags?: string[];
}

export interface InitSpecOutput {
  status: string;
  slug: string;
  path: string;
}

export interface GetSpecInput {
  cwd: string;
  slug: string;
}

export interface GetSpecOutput {
  found: boolean;
  spec?: SpecDocument;
}

export interface UpdateSpecInput {
  cwd: string;
  slug: string;
  body: string;
  changeSummary?: string;
  changedBy?: string;
  status?: SpecStatus;
}

export interface UpdateSpecOutput {
  success: boolean;
  version: string;
  path: string;
}

export interface ListSpecsInput {
  cwd: string;
  category?: string;
  status?: SpecStatus;
}

export interface ListSpecsOutput {
  specs: SpecSummary[];
}

