import { readFile, writeFile, mkdir, mkdtemp, rm, cp, readdir, symlink } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import type { Artifact, BenchmarkResult, BenchmarkTask, Condition } from "./types.js";
import { scoreImplementation, scorePlan, renderComparison } from "./grader.js";

const root = import.meta.dir;
const workspaceRoot = join(process.cwd(), ".tmp", "planning");
const dependencyBin = join(process.cwd(), "apps", "desktop", "node_modules", ".bin");
await mkdir(workspaceRoot, { recursive: true });
const tasks = JSON.parse(await readFile(join(root, "tasks.json"), "utf8")) as BenchmarkTask[];
const arg = process.argv[2];
const taskFilter = process.argv.includes("--task") ? process.argv[process.argv.indexOf("--task") + 1] : undefined;
const condition: Condition | undefined = process.argv.includes("--condition=baseline") ? "baseline" : process.argv.includes("--condition=plannic") ? "plannic" : undefined;

async function command(cwd: string, cmd: string): Promise<{ passed: boolean; output: string }> {
  return new Promise((resolve) => {
    const p = spawn(cmd, { cwd, shell: true, env: { ...process.env, PATH: `${dependencyBin};${process.env.PATH ?? ""}` } }); let output = ""; let settled = false;
    const finish = (passed: boolean) => { if (settled) return; settled = true; resolve({ passed, output: output.slice(-4000) }); };
    const timeoutMs = Number(process.env.PLANNIC_BENCHMARK_TIMEOUT_MS ?? 60_000);
    const timer = setTimeout(() => {
      output += `\nCommand timed out after ${timeoutMs}ms`;
      if (process.platform === "win32" && p.pid) spawn("taskkill", ["/pid", String(p.pid), "/t", "/f"]);
      else p.kill("SIGTERM");
      finish(false);
    }, timeoutMs);
    p.stdout.on("data", (x) => output += x); p.stderr.on("data", (x) => output += x);
    p.on("close", (code) => { clearTimeout(timer); finish(code === 0); });
    p.on("error", () => { clearTimeout(timer); finish(false); });
  });
}

async function run(task: BenchmarkTask, c: Condition): Promise<BenchmarkResult> {
  const started = performance.now(); const workspace = await mkdtemp(join(workspaceRoot, "plannic-bench-"));
  try {
    const entries = await readdir(process.cwd());
    for (const entry of entries) if (entry !== ".tmp") await cp(join(process.cwd(), entry), join(workspace, entry), { recursive: true, filter: (source) => {
      const normalized = source.replaceAll("\\", "/");
      const base = normalized.split("/").pop() ?? "";
      const parts = normalized.split("/");
      const excluded = ["node_modules", ".git", "dist", "target", "release", ".openclaude", ".tmp"].some((name) => parts.includes(name)) || normalized.includes("/benchmarks/planning/results/") || normalized.includes("/apps/desktop/src-tauri/");
      return !excluded
        && !base.endsWith(".exe") && !base.endsWith(".bun-build");
    } });
    await symlink(join(process.cwd(), "node_modules"), join(workspace, "node_modules"), "junction");
    for (const relative of [
      "apps/cli/node_modules",
      "apps/desktop/node_modules",
      "apps/headless/node_modules",
      "apps/mcp-server/node_modules",
      "packages/core/node_modules",
      "packages/fs/node_modules",
      "packages/headless/node_modules",
    ]) {
      const target = join(process.cwd(), relative); const link = join(workspace, relative);
      await mkdir(join(link, ".."), { recursive: true });
      await symlink(target, link, "junction").catch(() => undefined);
    }
    const artifactPath = join(root, "runs", task.id, `${c}.json`);
    const artifact = JSON.parse(await readFile(artifactPath, "utf8")) as Artifact;
    if (artifact.taskId !== task.id || artifact.condition !== c) throw new Error("Artifact metadata does not match task/condition");
    if (artifact.patch) {
      await Bun.write(join(workspace, "implementation.patch"), artifact.patch);
      const applied = await command(workspace, "git apply --no-index implementation.patch");
      if (!applied.passed) throw new Error(`Patch could not be applied: ${applied.output}`);
    }
    const checks = [];
    for (const check of task.checks) {
      process.stdout.write(`  ${task.id}/${c}: ${check}... `);
      const result = await command(workspace, check);
      checks.push({ command: check, ...result });
      console.log(result.passed ? "PASS" : "FAIL");
    }
    const unavailable = checks.some((x) => /command not found|script not found|not recognized as an internal/i.test(x.output));
    if (unavailable) throw new Error("Benchmark environment is missing a declared check dependency; install the repository dependencies before replaying.");
    const changed = artifact.patch?.match(/^\+\+\+ b\/(.+)$/gm)?.map((x) => x.slice(6)) ?? [];
    const drift = changed.filter((file) => !task.expectedFiles.some((expected) => file.includes(expected)));
    const result = { taskId: task.id, condition: c, status: checks.every((x) => x.passed) ? "passed" : "failed", checks, planScore: scorePlan(artifact.plan, task), implementationScore: 0, changedFiles: changed, scopeDrift: drift, durationMs: Math.round(performance.now() - started), toolCalls: artifact.toolCalls, inputTokens: artifact.inputTokens, outputTokens: artifact.outputTokens } as BenchmarkResult;
    result.implementationScore = scoreImplementation(result, task); return result;
  } catch (e) { return { taskId: task.id, condition: c, status: "invalid", checks: [], planScore: 0, implementationScore: 0, changedFiles: [], scopeDrift: [], durationMs: Math.round(performance.now() - started), error: String(e) }; }
  finally { await rm(workspace, { recursive: true, force: true }); }
}

const selected = tasks.filter((t) => !taskFilter || t.id === taskFilter);
const conditions = condition ? [condition] : ["baseline", "plannic"] as Condition[];
const results: BenchmarkResult[] = [];
for (const task of selected) for (const c of conditions) {
  console.log(`Running ${task.id}/${c}`);
  results.push(await run(task, c));
}
await mkdir(join(root, "results"), { recursive: true });
await writeFile(join(root, "results", `latest-${Date.now()}.json`), JSON.stringify(results, null, 2));
process.stdout.write(renderComparison(results));
