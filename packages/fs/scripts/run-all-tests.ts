import { spawn } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";

interface SuiteResult {
  name: string;
  cwd: string;
  passed: boolean;
  durationMs: number;
  output: string;
}

const SUITES = [
  { name: "packages/core", cwd: path.resolve(import.meta.dir, "../../../packages/core"), testFile: "test/schemas.test.ts" },
  { name: "packages/fs (adr & spec)", cwd: path.resolve(import.meta.dir, ".."), testFile: "test/adr-spec.test.ts" },
  { name: "packages/fs (hierarchical & migrator)", cwd: path.resolve(import.meta.dir, ".."), testFile: "test/hierarchical-migrator.test.ts" },
  { name: "packages/fs (activity & phase)", cwd: path.resolve(import.meta.dir, ".."), testFile: "test/phase.test.ts test/activity.test.ts" },
  { name: "apps/mcp-server", cwd: path.resolve(import.meta.dir, "../../../apps/mcp-server"), testFile: "test/mcp-endpoints.test.ts" },
];

async function runSuite(suite: { name: string; cwd: string; testFile: string }): Promise<SuiteResult> {
  const start = performance.now();
  return new Promise((resolve) => {
    const proc = spawn("bun", ["test", suite.testFile], {
      cwd: suite.cwd,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    proc.stdout?.on("data", (chunk) => {
      output += chunk.toString();
    });
    proc.stderr?.on("data", (chunk) => {
      output += chunk.toString();
    });

    proc.on("close", (code) => {
      const durationMs = Math.round(performance.now() - start);
      resolve({
        name: suite.name,
        cwd: suite.cwd,
        passed: code === 0,
        durationMs,
        output,
      });
    });

    proc.on("error", (err) => {
      resolve({
        name: suite.name,
        cwd: suite.cwd,
        passed: false,
        durationMs: Math.round(performance.now() - start),
        output: err.message,
      });
    });
  });
}

async function runAll(): Promise<boolean> {
  console.log("\n==================================================");
  console.log("       PLANNIC MONOREPO TEST RUNNER               ");
  console.log("==================================================\n");

  const results: SuiteResult[] = [];
  let allPassed = true;

  for (const suite of SUITES) {
    process.stdout.write(`• Running ${suite.name}... `);
    const result = await runSuite(suite);
    results.push(result);

    if (result.passed) {
      console.log(`\x1b[32mPASS\x1b[0m (${result.durationMs}ms)`);
    } else {
      console.log(`\x1b[31mFAIL\x1b[0m (${result.durationMs}ms)`);
      console.log("\x1b[33m--- Suite Output ---\x1b[0m");
      console.log(result.output.trim());
      console.log("\x1b[33m--------------------\x1b[0m");
      allPassed = false;
    }
  }

  const totalDuration = results.reduce((sum, r) => sum + r.durationMs, 0);
  const passedCount = results.filter((r) => r.passed).length;

  console.log("\n--------------------------------------------------");
  console.log(`Results: ${passedCount}/${results.length} suites passed (${totalDuration}ms)`);
  console.log("--------------------------------------------------\n");

  return allPassed;
}

// Check for --watch flag
const isWatch = process.argv.includes("--watch");

if (isWatch) {
  console.log("Entering watch mode. Watching for file changes in packages/ and apps/...\n");
  await runAll();

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const watchDirs = [
    path.resolve(import.meta.dir, "../src"),
    path.resolve(import.meta.dir, "../test"),
    path.resolve(import.meta.dir, "../../../apps/mcp-server/src"),
    path.resolve(import.meta.dir, "../../../apps/mcp-server/test"),
  ];

  for (const dir of watchDirs) {
    if (fs.existsSync(dir)) {
      fs.watch(dir, { recursive: true }, (_eventType, filename) => {
        if (!filename || !/\.(ts|tsx|js)$/.test(filename)) return;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          console.log(`\nChange detected in ${filename}. Re-running tests...`);
          void runAll();
        }, 300);
      });
    }
  }
} else {
  const success = await runAll();
  process.exit(success ? 0 : 1);
}
