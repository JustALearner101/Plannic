import fs from "node:fs/promises";
import path from "node:path";
import { readConfig } from "@plannic/fs";
import { runMcpCheck } from "./mcp-check.js";
import { agentSkills } from "./generated/agent-assets.js";

export interface DoctorCheck {
  name: string;
  category: "binary" | "version" | "config" | "mcp" | "skills" | "docs" | "handshake";
  status: "pass" | "fail" | "warn";
  message: string;
  details?: Record<string, unknown>;
  hint?: string;
}

export interface DoctorResult {
  status: "healthy" | "unhealthy" | "warning";
  timestamp: string;
  version: string;
  checks: DoctorCheck[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
  };
}

export interface DoctorOptions {
  cwd?: string;
  mcp?: boolean;
  json?: boolean;
}

const CURRENT_VERSION = "0.3.1";
const REQUIRED_SKILLS = Object.keys(agentSkills);
const REQUIRED_DOCS_DIRS = [".docs/plans", ".docs/adrs", ".docs/specs", ".docs/.history"];

const exists = async (target: string): Promise<boolean> => {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
};

export async function runDoctor(options: DoctorOptions = {}): Promise<DoctorResult> {
  const cwd = options.cwd ?? process.cwd();
  const checks: DoctorCheck[] = [];

  // 1. Binary check
  const isWindows = process.platform === "win32";
  const binaryName = isWindows ? "plannic.exe" : "plannic";
  const pathEnv = process.env.PATH || "";
  const pathDirs = pathEnv.split(path.delimiter);
  let foundInPath: string | null = null;

  for (const dir of pathDirs) {
    if (!dir) continue;
    const candidate = path.join(dir, binaryName);
    if (await exists(candidate)) {
      foundInPath = candidate;
      break;
    }
  }

  const currentExec = process.execPath;
  const isRunningCompiled = path.basename(currentExec).toLowerCase().startsWith("plannic");

  if (foundInPath) {
    checks.push({
      name: "plannic binary",
      category: "binary",
      status: "pass",
      message: `plannic binary ditemukan di PATH: ${foundInPath}`,
      details: { binaryPath: foundInPath },
    });
  } else if (isRunningCompiled) {
    checks.push({
      name: "plannic binary",
      category: "binary",
      status: "pass",
      message: `plannic binary aktif: ${currentExec}`,
      details: { binaryPath: currentExec },
    });
  } else {
    checks.push({
      name: "plannic binary",
      category: "binary",
      status: "warn",
      message: `plannic binary belum terdaftar di PATH (sedang berjalan via runtime ${path.basename(currentExec)})`,
      hint: isWindows
        ? "Jalankan installer: scripts/install.ps1 atau tambahkan folder biner ke PATH."
        : "Jalankan installer: curl -fsSL https://.../install.sh | sh atau tambahkan ~/.local/bin ke PATH.",
    });
  }

  // 2. Version check
  checks.push({
    name: "version",
    category: "version",
    status: "pass",
    message: `versi: ${CURRENT_VERSION}`,
    details: { version: CURRENT_VERSION },
  });

  // 3. Workspace config check
  try {
    const configRes = await readConfig(cwd);
    if (configRes.found && configRes.config) {
      const { project, stack } = configRes.config;
      checks.push({
        name: "workspace config",
        category: "config",
        status: "pass",
        message: `workspace config valid (.plannic/config.md - project: ${project}, stack: [${stack.join(", ")}])`,
        details: { project, stack },
      });
    } else {
      checks.push({
        name: "workspace config",
        category: "config",
        status: "fail",
        message: "workspace config tidak ditemukan (.plannic/config.md)",
        hint: "Jalankan `plannic init` untuk menginisialisasi konfigurasi workspace.",
      });
    }
  } catch (err: any) {
    checks.push({
      name: "workspace config",
      category: "config",
      status: "fail",
      message: `workspace config rusak: ${err?.message || String(err)}`,
      hint: "Jalankan `plannic init` untuk memperbarui atau perbaiki frontmatter .plannic/config.md.",
    });
  }

  // 4. MCP config check
  const mcpJsonPath = path.join(cwd, ".mcp.json");
  if (await exists(mcpJsonPath)) {
    try {
      const content = await fs.readFile(mcpJsonPath, "utf8");
      const parsed = JSON.parse(content);
      const plannicServer = parsed?.mcpServers?.plannic;

      if (plannicServer && plannicServer.command) {
        checks.push({
          name: "MCP config",
          category: "mcp",
          status: "pass",
          message: `MCP config valid (.mcp.json - command: "${plannicServer.command}", args: ${JSON.stringify(plannicServer.args ?? [])})`,
          details: { command: plannicServer.command, args: plannicServer.args },
        });
      } else {
        checks.push({
          name: "MCP config",
          category: "mcp",
          status: "fail",
          message: "server 'plannic' tidak ditemukan di .mcp.json",
          hint: "Tambahkan registrasi mcpServers.plannic di .mcp.json atau jalankan `plannic init`.",
        });
      }
    } catch (err: any) {
      checks.push({
        name: "MCP config",
        category: "mcp",
        status: "fail",
        message: `.mcp.json tidak valid JSON: ${err.message}`,
        hint: "Perbaiki sintaks JSON di .mcp.json atau hapus dan jalankan `plannic init`.",
      });
    }
  } else {
    checks.push({
      name: "MCP config",
      category: "mcp",
      status: "warn",
      message: ".mcp.json tidak ditemukan di root workspace",
      hint: "Jalankan `plannic init` untuk membuat file konfigurasi MCP server.",
    });
  }

  // 5. Agent skills check
  const missingSkills: string[] = [];
  for (const skill of REQUIRED_SKILLS) {
    const skillPath = path.join(cwd, `.agents/skills/${skill}/SKILL.md`);
    if (!await exists(skillPath)) {
      missingSkills.push(skill);
    }
  }

  if (missingSkills.length === 0) {
    checks.push({
      name: "skills",
      category: "skills",
      status: "pass",
      message: `skills lengkap (${REQUIRED_SKILLS.length}/${REQUIRED_SKILLS.length} skills tersedia di .agents/skills/)`,
      details: { skills: REQUIRED_SKILLS },
    });
  } else if (missingSkills.length < REQUIRED_SKILLS.length) {
    checks.push({
      name: "skills",
      category: "skills",
      status: "warn",
      message: `sebagian skills hilang (${REQUIRED_SKILLS.length - missingSkills.length}/${REQUIRED_SKILLS.length} terpasang, hilang: ${missingSkills.join(", ")})`,
      hint: "Jalankan `plannic init` untuk melengkapi skills yang hilang.",
    });
  } else {
    checks.push({
      name: "skills",
      category: "skills",
      status: "fail",
      message: "skills belum terpasang di .agents/skills/",
      hint: "Jalankan `plannic init` untuk menginstal agent skills.",
    });
  }

  // 6. Docs directories check
  const missingDirs: string[] = [];
  const dirCounts: Record<string, number> = {};

  for (const dir of REQUIRED_DOCS_DIRS) {
    const dirPath = path.join(cwd, dir);
    if (!await exists(dirPath)) {
      missingDirs.push(dir);
    } else {
      try {
        const files = await fs.readdir(dirPath);
        dirCounts[dir] = files.length;
      } catch {
        dirCounts[dir] = 0;
      }
    }
  }

  if (missingDirs.length === 0) {
    const summaryStr = REQUIRED_DOCS_DIRS.map((d) => `${path.basename(d)}: ${dirCounts[d] ?? 0}`).join(", ");
    checks.push({
      name: "docs directories",
      category: "docs",
      status: "pass",
      message: `docs directories tersedia (${summaryStr})`,
      details: { directories: dirCounts },
    });
  } else {
    checks.push({
      name: "docs directories",
      category: "docs",
      status: "fail",
      message: `direktori docs hilang: ${missingDirs.join(", ")}`,
      hint: "Jalankan `plannic init` untuk membuat folder document tree .docs/.",
    });
  }

  // 7. MCP handshake check (if requested)
  if (options.mcp) {
    const mcpRes = await runMcpCheck(cwd, 8000);
    if (mcpRes.success) {
      checks.push({
        name: "MCP handshake",
        category: "handshake",
        status: "pass",
        message: `MCP handshake berhasil (server: ${mcpRes.serverName} v${mcpRes.serverVersion}, ${mcpRes.toolCount} tools terdaftar)`,
        details: {
          server: mcpRes.serverName,
          version: mcpRes.serverVersion,
          toolCount: mcpRes.toolCount,
          tools: mcpRes.tools,
          durationMs: mcpRes.durationMs,
        },
      });
    } else {
      checks.push({
        name: "MCP handshake",
        category: "handshake",
        status: "fail",
        message: `MCP handshake gagal: ${mcpRes.error}`,
        hint: "Periksa apakah biner MCP dapat dijalankan atau biner sedang terkunci.",
      });
    }
  }

  const failed = checks.filter((c) => c.status === "fail").length;
  const warnings = checks.filter((c) => c.status === "warn").length;
  const passed = checks.filter((c) => c.status === "pass").length;

  const overallStatus = failed > 0 ? "unhealthy" : warnings > 0 ? "warning" : "healthy";

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: CURRENT_VERSION,
    checks,
    summary: {
      passed,
      failed,
      warnings,
    },
  };
}

export function printDoctorReport(result: DoctorResult): void {
  console.log(`\n\x1b[1m\x1b[36mPlannic Diagnostics (Doctor)\x1b[0m\n`);

  for (const check of result.checks) {
    let icon = "\x1b[32m✔\x1b[0m";
    if (check.status === "fail") icon = "\x1b[31m✖\x1b[0m";
    else if (check.status === "warn") icon = "\x1b[33mℹ\x1b[0m";

    console.log(`${icon} ${check.message}`);
    if (check.hint && check.status !== "pass") {
      console.log(`  \x1b[90m↳ Saran: ${check.hint}\x1b[0m`);
    }
  }

  console.log("");
  let statusText = "\x1b[32m✔ Semua sistem sehat (healthy)\x1b[0m";
  if (result.status === "unhealthy") {
    statusText = `\x1b[31m✖ Ditemukan ${result.summary.failed} masalah kritis (unhealthy)\x1b[0m`;
  } else if (result.status === "warning") {
    statusText = `\x1b[33mℹ Ditemukan ${result.summary.warnings} peringatan (warning)\x1b[0m`;
  }

  console.log(`Status: ${statusText}`);
  console.log(`Ringkasan: ${result.summary.passed} lolos, ${result.summary.failed} gagal, ${result.summary.warnings} peringatan\n`);
}
