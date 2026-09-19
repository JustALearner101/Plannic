#!/usr/bin/env bun
import { renderPlanCard } from "../packages/headless/src/index.js";

async function main() {
  const args = process.argv.slice(2);
  let cwd = process.cwd();
  let slug: string | undefined = undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--cwd" && args[i + 1]) {
      cwd = args[i + 1];
      i++;
    } else if (!args[i].startsWith("-")) {
      slug = args[i];
    }
  }

  try {
    const card = await renderPlanCard({ cwd, slug });
    console.log(card);
  } catch (error) {
    console.error("Error rendering Plannic card:", error);
  }
}

main();
