import { spawn } from "node:child_process";
import path from "node:path";

interface Suite {
  id: string;
  name: string;
  command: string;
  args: string[];
}

const SUITES: Suite[] = [
  {
    id: "harness",
    name: "Sandbox & Fixture Harness Suite",
    command: "bun",
    args: ["test", "e2e/tests/harness.test.ts"],
  },
  {
    id: "mcp-protocol",
    name: "MCP Server Protocol & 15 Tools Suite",
    command: "bun",
    args: ["test", "e2e/tests/mcp-protocol.test.ts"],
  },
  {
    id: "cli",
    name: "CLI Commands & Terminal Interface Suite",
    command: "bun",
    args: ["test", "e2e/tests/cli.test.ts"],
  },
  {
    id: "stability-concurrency",
    name: "Multi-Surface Concurrency Stability Suite",
    command: "bun",
    args: ["test", "e2e/tests/stability-concurrency.test.ts"],
  },
  {
    id: "stability-scale",
    name: "High Volume Scale & Latency Benchmark Suite",
    command: "bun",
    args: ["test", "e2e/tests/stability-scale.test.ts"],
  },
  {
    id: "stability-crash",
    name: "Crash Recovery & Corrupt State Resilience Suite",
    command: "bun",
    args: ["test", "e2e/tests/stability-crash-recovery.test.ts"],
  },
  {
    id: "desktop-visual-workbench",
    name: "Desktop Visual Workbench & Native Smoke Suite (Playwright)",
    command: "bunx",
    args: ["playwright", "test", "--config", "e2e/playwright.config.ts"],
  },
];

async function runSuite(suite: Suite): Promise<{ passed: boolean; durationMs: number; output: string }> {
  const start = performance.now();
  return new Promise((resolve) => {
    const proc = spawn(suite.command, suite.args, {
      cwd: path.resolve(__dirname, ".."),
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    proc.stdout?.on("data", (d) => (output += d.toString()));
    proc.stderr?.on("data", (d) => (output += d.toString()));

    proc.on("close", (code) => {
      const durationMs = Math.round(performance.now() - start);
      resolve({ passed: code === 0, durationMs, output });
    });
  });
}

async function main() {
  console.log("\n======================================================================");
  console.log("            PLANNIC UNIFIED END-TO-END & STABILITY RUNNER             ");
  console.log("======================================================================\n");

  const results: { name: string; passed: boolean; durationMs: number; output: string }[] = [];
  let allPassed = true;

  for (let i = 0; i < SUITES.length; i++) {
    const suite = SUITES[i];
    const progress = `[${i + 1}/${SUITES.length}]`;
    process.stdout.write(`${progress} Running ${suite.name}... `);

    const result = await runSuite(suite);
    results.push({ name: suite.name, ...result });

    if (result.passed) {
      console.log(`\x1b[32mPASS\x1b[0m (${result.durationMs}ms)`);
    } else {
      console.log(`\x1b[31mFAIL\x1b[0m (${result.durationMs}ms)`);
      console.log("\x1b[33m--- Suite Output ---\x1b[0m");
      console.log(result.output.trim());
      console.log("\x1b[33m--------------------\x1b[0m\n");
      allPassed = false;
    }
  }

  const totalDuration = results.reduce((sum, r) => sum + r.durationMs, 0);
  const passedCount = results.filter((r) => r.passed).length;

  console.log("\n----------------------------------------------------------------------");
  console.log(
    `Summary: ${passedCount}/${results.length} suites passed (${(totalDuration / 1000).toFixed(2)}s)`
  );
  console.log("----------------------------------------------------------------------\n");

  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
