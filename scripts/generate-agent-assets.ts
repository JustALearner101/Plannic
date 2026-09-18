import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const skills = ["plannic", "plannic-adr", "plannic-kanban", "plannic-plan", "plannic-spec", "plannic-view"];
const sources = Object.fromEntries(await Promise.all(skills.map(async (name) => [name, await readFile(join(root, ".agents", "plugins", "plannic", "skills", name, "SKILL.md"), "utf8")]))) as Record<string, string>;
const claude = await readFile(join(root, ".claude", "commands", "plannic.md"), "utf8");
await mkdir(join(root, "apps", "cli", "src", "generated"), { recursive: true });
await writeFile(join(root, "apps", "cli", "src", "generated", "agent-assets.ts"), `export const agentSkills = ${JSON.stringify(sources)} as const;\nexport const claudeCommand = ${JSON.stringify(claude)};\n`);
