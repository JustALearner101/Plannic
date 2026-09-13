export type PlanMode = "quick" | "deep";
export type DocType = "plan" | "scope" | "feature" | "phase" | "limitation";
export type PlanStatus = "draft" | "review" | "final";

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
}

export interface PlanDocument {
  slug: string;
  type: DocType;
  path: string;
  frontmatter: DocFrontmatter;
  body: string;
  rawContent: string;
}

export interface Plan {
  slug: string;
  mode: PlanMode;
  root: PlanDocument;
  documents: PlanDocument[];
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
}

export interface ProjectConfig {
  rawContent: string;
  project: string;
  stack: string[];
  default_mode: PlanMode;
  lang?: string;
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
