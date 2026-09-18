import type { BenchmarkResult, BenchmarkTask } from "./types.js";

export function scorePlan(plan: string, task: BenchmarkTask): number {
  const text = plan.toLowerCase();
  const hits = [...task.acceptance, ...task.expectedFiles].filter((x) => text.includes(x.toLowerCase())).length;
  return Math.min(4, Math.round((hits / Math.max(1, task.acceptance.length + task.expectedFiles.length)) * 4));
}

export function scoreImplementation(result: Pick<BenchmarkResult, "checks" | "changedFiles" | "scopeDrift">, task: BenchmarkTask): number {
  const passed = result.checks.length > 0 && result.checks.every((x) => x.passed);
  const covered = task.expectedFiles.some((x) => result.changedFiles.some((f) => f.includes(x)));
  if (passed && covered && result.scopeDrift.length === 0) return 4;
  if (passed && covered) return 3;
  if (passed || covered) return 2;
  return 0;
}

export function renderComparison(results: BenchmarkResult[]): string {
  const rows = results.map((r) => `| ${r.taskId} | ${r.condition} | ${r.status} | ${r.planScore}/4 | ${r.implementationScore}/4 | ${r.durationMs} |`).join("\n");
  return `# Planning Benchmark\n\n| Task | Condition | Status | Plan | Implementation | Duration (ms) |\n|---|---|---:|---:|---:|---:|\n${rows}\n`;
}
