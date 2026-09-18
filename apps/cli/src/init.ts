import fs from "node:fs/promises";
import path from "node:path";
import { agentSkills, claudeCommand } from "./generated/agent-assets.js";

export type InitAgent = "antigravity" | "claude" | "cursor" | "all";
export interface InitResult { status: "success" | "partial"; project: string; stack: string[]; created: string[]; unchanged: string[]; conflicts: string[]; skillsCount: number; mcpCommand: string; docsRoot: string; }
const skills = Object.keys(agentSkills);
const exists = async (file: string) => { try { await fs.access(file); return true; } catch { return false; } };
const readJson = async (file: string): Promise<Record<string, unknown> | null> => { try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { return null; } };
async function writeSafe(cwd: string, relative: string, content: string, result: InitResult) { const file = path.join(cwd, relative); if (!await exists(file)) { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, content); result.created.push(relative); } else if (await fs.readFile(file, "utf8") === content) result.unchanged.push(relative); else result.conflicts.push(relative); }
export async function initWorkspace(cwd: string, agent: InitAgent = "all"): Promise<InitResult> {
  const pkg = await readJson(path.join(cwd, "package.json")); const project = typeof pkg?.name === "string" ? pkg.name : path.basename(cwd); const stack: string[] = [];
  if (await exists(path.join(cwd, "package.json"))) stack.push("Node.js"); if (await exists(path.join(cwd, "pyproject.toml")) || await exists(path.join(cwd, "requirements.txt"))) stack.push("Python"); if (await exists(path.join(cwd, "Cargo.toml"))) stack.push("Rust"); if (await exists(path.join(cwd, "go.mod"))) stack.push("Go"); if (await exists(path.join(cwd, "Dockerfile")) || await exists(path.join(cwd, "docker-compose.yml"))) stack.push("Docker"); if (!stack.length) stack.push("Unknown");
  const result: InitResult = { status: "success", project, stack, created: [], unchanged: [], conflicts: [], skillsCount: 0, mcpCommand: "plannic mcp", docsRoot: ".docs" };
  for (const dir of [".docs/plans", ".docs/adrs", ".docs/specs", ".docs/.history"]) { const directory = path.join(cwd, dir); if (!await exists(directory)) { await fs.mkdir(directory, { recursive: true }); result.created.push(`${dir}/`); } }
  await writeSafe(cwd, ".plannic/config.md", `---\nproject: ${project}\nstack: [${stack.join(", ")}]\ndefault_mode: deep\nlang: id\nruleset:\n  strict_kanban: true\n  auto_changelog: true\n  plans_dir: ".docs/plans"\n---\n`, result);
  const mcp = JSON.stringify({ mcpServers: { plannic: { command: "plannic", args: ["mcp"] } } }, null, 2) + "\n"; await writeSafe(cwd, ".mcp.json", mcp, result);
  if (agent === "all" || agent === "antigravity") for (const skill of skills) { await writeSafe(cwd, `.agents/skills/${skill}/SKILL.md`, agentSkills[skill as keyof typeof agentSkills], result); result.skillsCount++; }
  if (agent === "all" || agent === "claude") await writeSafe(cwd, ".claude/commands/plannic.md", claudeCommand, result);
  if (agent === "all" || agent === "cursor") await writeSafe(cwd, ".cursor/mcp.json", mcp, result);
  result.status = result.conflicts.length ? "partial" : "success"; return result;
}
