import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { agentSkills } from "../apps/cli/src/generated/agent-assets.js";

const root = process.cwd();
const canonicalDir = join(root, ".agents", "plugins", "plannic", "skills");
const deployedDir = join(root, ".agents", "skills");

function normalizeEol(str: string): string {
  return (str || "").replace(/\r\n/g, "\n").trim();
}

console.log("Verifying skills synchronization against canonical source...");

const entries = await readdir(canonicalDir, { withFileTypes: true });
const skillNames = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();

const discrepancies: string[] = [];

for (const name of skillNames) {
  const canonicalFile = join(canonicalDir, name, "SKILL.md");
  const deployedFile = join(deployedDir, name, "SKILL.md");

  let canonicalContent: string;
  try {
    canonicalContent = await readFile(canonicalFile, "utf8");
  } catch (err: any) {
    discrepancies.push(`Missing canonical skill: ${canonicalFile}`);
    continue;
  }

  let deployedContent: string;
  try {
    deployedContent = await readFile(deployedFile, "utf8");
  } catch (err: any) {
    discrepancies.push(`Missing deployed skill: ${deployedFile}`);
    continue;
  }

  if (normalizeEol(canonicalContent) !== normalizeEol(deployedContent)) {
    discrepancies.push(`Content mismatch between ${canonicalFile} and ${deployedFile}`);
  }

  // Check generated asset
  const generatedContent = (agentSkills as Record<string, string>)[name];
  if (normalizeEol(generatedContent) !== normalizeEol(canonicalContent)) {
    discrepancies.push(`Generated asset for "${name}" in apps/cli/src/generated/agent-assets.ts is out of sync with canonical source`);
  }
}

if (discrepancies.length > 0) {
  console.error(`\x1b[31m✖ Skills synchronization check failed with ${discrepancies.length} discrepancy(ies):\x1b[0m`);
  for (const d of discrepancies) {
    console.error(`  - ${d}`);
  }
  console.error(`\n\x1b[33mFix:\x1b[0m Run \`bun run sync:skills\` to synchronize all skills from canonical sources.\n`);
  process.exit(1);
}

console.log(`\x1b[32m✔ All ${skillNames.length} agent skills and generated assets are strictly synchronized with canonical sources.\x1b[0m`);
