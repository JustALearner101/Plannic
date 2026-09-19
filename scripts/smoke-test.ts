import { mkdtemp, rm, access, readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const isWindows = process.platform === "win32";

// 1. Resolve binary to test
let binPath = process.argv[2] || process.env.PLANNIC_BIN;
if (!binPath) {
  const defaultDist = path.join(root, "dist", isWindows ? "plannic.exe" : "plannic");
  const exists = await access(defaultDist).then(() => true).catch(() => false);
  if (exists) {
    binPath = defaultDist;
  } else {
    console.log(`[Smoke Test] Compiled binary not found at ${defaultDist}. Using bun dev entrypoint.`);
    binPath = "bun";
  }
}

const isBunEntry = binPath === "bun";
const cliScript = path.join(root, "apps", "cli", "src", "index.tsx");

function runCommand(args: string[], cwd: string) {
  const cmd = isBunEntry ? "bun" : binPath;
  const finalArgs = isBunEntry ? ["run", cliScript, ...args] : args;

  const result = spawnSync(cmd, finalArgs, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });

  return result;
}

console.log(`\n\x1b[1m\x1b[36m=== Plannic Release Smoke Test ===\x1b[0m`);
console.log(`Target binary: ${binPath} ${isBunEntry ? `(via ${cliScript})` : ""}`);

const tempDir = await mkdtemp(path.join(os.tmpdir(), "plannic-smoke-test-"));
console.log(`Isolated workspace: ${tempDir}\n`);

let passedCount = 0;
let totalCount = 0;

function assertStep(title: string, check: () => void) {
  totalCount++;
  try {
    check();
    console.log(`\x1b[32m✔\x1b[0m Step ${totalCount}: ${title}`);
    passedCount++;
  } catch (err: any) {
    console.error(`\x1b[31m✖\x1b[0m Step ${totalCount}: ${title} FAILED`);
    console.error(`  Error: ${err.message}`);
    throw err;
  }
}

try {
  // Step 1: Version check
  assertStep("Binary version output (plannic --version)", () => {
    const res = runCommand(["--version"], tempDir);
    if (res.status !== 0) throw new Error(`Exit code ${res.status}: ${res.stderr}`);
    if (!res.stdout.includes("0.3.1") && !res.stdout.includes("Plannic")) {
      throw new Error(`Unexpected version output: ${res.stdout}`);
    }
  });

  // Step 2: Initialize workspace
  assertStep("Workspace initialization (plannic init)", () => {
    const res = runCommand(["init"], tempDir);
    if (res.status !== 0) throw new Error(`Exit code ${res.status}: ${res.stderr || res.stdout}`);
    if (!res.stdout.includes("Workspace initialized successfully")) {
      throw new Error(`Init output did not report success: ${res.stdout}`);
    }
  });

  // Step 3: Explicit JSON init
  assertStep("Explicit JSON initialization verification (plannic init --json)", () => {
    const res = runCommand(["init", "--json"], tempDir);
    if (res.status !== 0) throw new Error(`Exit code ${res.status}: ${res.stderr}`);
    const parsed = JSON.parse(res.stdout);
    if (parsed.status !== "success") throw new Error(`Expected status 'success', got '${parsed.status}'`);
    if (parsed.mcpReady !== true) throw new Error(`Expected mcpReady true, got ${parsed.mcpReady}`);
    if (parsed.agents?.antigravity !== "installed") {
      throw new Error(`Expected antigravity agent installed, got ${parsed.agents?.antigravity}`);
    }
  });

  // Step 4: Plan listing in JSON format
  assertStep("Plan listing (plannic list --json / plannic --json list)", () => {
    const res = runCommand(["--json", "list"], tempDir);
    if (res.status !== 0) throw new Error(`Exit code ${res.status}: ${res.stderr}`);
    const parsed = JSON.parse(res.stdout);
    if (!Array.isArray(parsed)) throw new Error(`Expected JSON array of plans, got ${typeof parsed}`);
  });

  // Step 5: MCP server handshake validation
  assertStep("MCP server handshake check (plannic mcp --check)", () => {
    const res = runCommand(["mcp", "--check", "--json"], tempDir);
    if (res.status !== 0) throw new Error(`Exit code ${res.status}: ${res.stderr}`);
    const parsed = JSON.parse(res.stdout);
    if (!parsed.success) throw new Error(`MCP handshake reported failure: ${parsed.error}`);
    if (parsed.serverName !== "plannic") throw new Error(`Expected server name 'plannic', got '${parsed.serverName}'`);
    if (parsed.toolCount < 19) throw new Error(`Expected at least 19 tools, got ${parsed.toolCount}`);
  });

  // Step 6: Diagnostics report
  assertStep("Doctor diagnostics check (plannic doctor --json)", () => {
    const res = runCommand(["doctor", "--json"], tempDir);
    if (res.status !== 0) throw new Error(`Exit code ${res.status}: ${res.stderr}`);
    const parsed = JSON.parse(res.stdout);
    if (parsed.status === "unhealthy") {
      throw new Error(`Doctor reported unhealthy status on freshly initialized workspace: ${JSON.stringify(parsed.summary)}`);
    }
    const configCheck = parsed.checks.find((c: any) => c.category === "config");
    if (configCheck?.status !== "pass") throw new Error(`Config check did not pass: ${configCheck?.message}`);
    const skillsCheck = parsed.checks.find((c: any) => c.category === "skills");
    if (skillsCheck?.status !== "pass") throw new Error(`Skills check did not pass: ${skillsCheck?.message}`);
  });

  console.log(`\n\x1b[1m\x1b[32m✔ All ${passedCount}/${totalCount} smoke test steps passed successfully!\x1b[0m\n`);
} finally {
  await rm(tempDir, { recursive: true, force: true }).catch(() => {});
}
