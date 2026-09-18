export type Condition = "baseline" | "plannic";
export type TaskCategory = "single-module" | "cross-module" | "api-data" | "refactor" | "ambiguous";

export interface BenchmarkTask {
  id: string;
  title: string;
  category: TaskCategory;
  difficulty: 1 | 2 | 3;
  prompt: string;
  expectedFiles: string[];
  acceptance: string[];
  checks: string[];
  outOfScope: string[];
}

export interface Artifact {
  taskId: string;
  condition: Condition;
  plan: string;
  patch?: string;
  toolCalls?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface CheckResult { command: string; passed: boolean; output: string; }
export interface BenchmarkResult {
  taskId: string; condition: Condition; status: "passed" | "failed" | "invalid";
  checks: CheckResult[]; planScore: number; implementationScore: number;
  changedFiles: string[]; scopeDrift: string[]; durationMs: number;
  toolCalls?: number; inputTokens?: number; outputTokens?: number; error?: string;
}
