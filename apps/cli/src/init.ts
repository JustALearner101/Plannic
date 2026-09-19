import fs from "node:fs/promises";
import path from "node:path";
import { agentSkills, claudeCommand } from "./generated/agent-assets.js";

export type InitAgent = "antigravity" | "claude" | "cursor" | "all";
export type AgentInstallStatus = "installed" | "skipped" | "conflict";

export interface InitOptions {
  agent?: InitAgent;
  diff?: boolean;
}

export interface InitResult {
  status: "success" | "partial";
  mcpReady: boolean;
  agents: {
    antigravity?: AgentInstallStatus;
    claude?: AgentInstallStatus;
    cursor?: AgentInstallStatus;
  };
  project: string;
  stack: string[];
  created: string[];
  unchanged: string[];
  conflicts: string[];
  skillsCount: number;
  mcpCommand: string;
  docsRoot: string;
  diffs?: Record<string, string>;
}

const skills = Object.keys(agentSkills);

const exists = async (file: string) => {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
};

const readJson = async (file: string): Promise<Record<string, unknown> | null> => {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return null;
  }
};

export function generateSimpleDiff(existing: string, proposed: string, filename: string): string {
  const existingLines = existing.split(/\r?\n/);
  const proposedLines = proposed.split(/\r?\n/);
  const diffLines: string[] = [
    `--- a/${filename} (existing)`,
    `+++ b/${filename} (proposed template)`,
  ];

  const max = Math.max(existingLines.length, proposedLines.length);
  for (let i = 0; i < max; i++) {
    const ex = existingLines[i];
    const pr = proposedLines[i];
    if (ex === pr) {
      diffLines.push(`  ${ex}`);
    } else {
      if (ex !== undefined) diffLines.push(`- ${ex}`);
      if (pr !== undefined) diffLines.push(`+ ${pr}`);
    }
  }

  return diffLines.join("\n");
}

async function writeSafe(
  cwd: string,
  relative: string,
  content: string,
  result: InitResult,
  computeDiff: boolean
) {
  const file = path.join(cwd, relative);
  if (!await exists(file)) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, content);
    result.created.push(relative);
  } else {
    const existingContent = await fs.readFile(file, "utf8");
    if (existingContent === content) {
      result.unchanged.push(relative);
    } else {
      result.conflicts.push(relative);
      if (computeDiff) {
        if (!result.diffs) result.diffs = {};
        result.diffs[relative] = generateSimpleDiff(existingContent, content, relative);
      }
    }
  }
}

export async function initWorkspace(
  cwd: string,
  agentOrOptions: InitAgent | InitOptions = "all"
): Promise<InitResult> {
  const options: InitOptions = typeof agentOrOptions === "string"
    ? { agent: agentOrOptions }
    : agentOrOptions;
  const agent = options.agent ?? "all";
  const showDiff = options.diff ?? false;

  const pkg = await readJson(path.join(cwd, "package.json"));
  const project = typeof pkg?.name === "string" ? pkg.name : path.basename(cwd);
  const stack: string[] = [];

  if (await exists(path.join(cwd, "package.json"))) stack.push("Node.js");
  if (await exists(path.join(cwd, "pyproject.toml")) || await exists(path.join(cwd, "requirements.txt"))) stack.push("Python");
  if (await exists(path.join(cwd, "Cargo.toml"))) stack.push("Rust");
  if (await exists(path.join(cwd, "go.mod"))) stack.push("Go");
  if (await exists(path.join(cwd, "Dockerfile")) || await exists(path.join(cwd, "docker-compose.yml"))) stack.push("Docker");
  if (!stack.length) stack.push("Unknown");

  const result: InitResult = {
    status: "success",
    mcpReady: true,
    agents: {},
    project,
    stack,
    created: [],
    unchanged: [],
    conflicts: [],
    skillsCount: 0,
    mcpCommand: "plannic mcp",
    docsRoot: ".docs",
  };

  if (showDiff) {
    result.diffs = {};
  }

  // Ensure docs directories
  for (const dir of [".docs/plans", ".docs/adrs", ".docs/specs", ".docs/.history"]) {
    const directory = path.join(cwd, dir);
    if (!await exists(directory)) {
      await fs.mkdir(directory, { recursive: true });
      result.created.push(`${dir}/`);
    }
  }

  // Config file
  await writeSafe(
    cwd,
    ".plannic/config.md",
    `---\nproject: ${project}\nstack: [${stack.join(", ")}]\ndefault_mode: deep\nlang: id\nruleset:\n  strict_kanban: true\n  auto_changelog: true\n  plans_dir: ".docs/plans"\n---\n`,
    result,
    showDiff
  );

  // MCP config
  const mcp = JSON.stringify({ mcpServers: { plannic: { command: "plannic", args: ["mcp"] } } }, null, 2) + "\n";
  await writeSafe(cwd, ".mcp.json", mcp, result, showDiff);

  // Antigravity skills
  if (agent === "all" || agent === "antigravity") {
    let hasSkillConflict = false;
    for (const skill of skills) {
      const rel = `.agents/skills/${skill}/SKILL.md`;
      await writeSafe(cwd, rel, agentSkills[skill as keyof typeof agentSkills], result, showDiff);
      result.skillsCount++;
      if (result.conflicts.includes(rel)) hasSkillConflict = true;
    }
    result.agents.antigravity = hasSkillConflict ? "conflict" : "installed";
  } else {
    result.agents.antigravity = "skipped";
  }

  // Claude command
  if (agent === "all" || agent === "claude") {
    const rel = ".claude/commands/plannic.md";
    await writeSafe(cwd, rel, claudeCommand, result, showDiff);
    result.agents.claude = result.conflicts.includes(rel) ? "conflict" : "installed";
  } else {
    result.agents.claude = "skipped";
  }

  // Cursor config
  if (agent === "all" || agent === "cursor") {
    const rel = ".cursor/mcp.json";
    await writeSafe(cwd, rel, mcp, result, showDiff);
    result.agents.cursor = result.conflicts.includes(rel) ? "conflict" : "installed";
  } else {
    result.agents.cursor = "skipped";
  }

  // Evaluate mcpReady
  result.mcpReady = !result.conflicts.includes(".mcp.json");
  result.status = result.conflicts.length ? "partial" : "success";

  return result;
}
