import { initPlan } from "@plannic/headless";
import type { PlanMode } from "@plannic/core";

export async function createCommand(cwd: string, args: string[]) {
  let mode: PlanMode = "deep";
  const nonFlags: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--mode" && args[i + 1]) {
      const m = args[i + 1].toLowerCase();
      if (m === "quick" || m === "deep") {
        mode = m;
      }
      i++;
    } else if (args[i].startsWith("--mode=")) {
      const m = args[i].split("=")[1].toLowerCase();
      if (m === "quick" || m === "deep") {
        mode = m;
      }
    } else if (!args[i].startsWith("--")) {
      nonFlags.push(args[i]);
    }
  }

  const name = nonFlags.join(" ").trim();
  if (!name) {
    console.error("\x1b[31mError:\x1b[0m Please provide a name for the plan.");
    console.error("Usage: plan create <name> [--mode quick|deep]");
    process.exit(1);
  }

  console.log(`\x1b[36mCreating plan "${name}" in ${mode} mode...\x1b[0m`);
  const result = await initPlan(cwd, name, mode);

  console.log(`\x1b[32m✔ Plan initialized successfully!\x1b[0m`);
  console.log(`\x1b[1mSlug:\x1b[0m \x1b[33m${result.slug}\x1b[0m`);
  console.log(`\x1b[90mFiles created:\x1b[0m`);
  for (const f of result.filesCreated) {
    console.log(`  \x1b[90m- .docs/${f}\x1b[0m`);
  }
}
