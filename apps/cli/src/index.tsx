#!/usr/bin/env bun
import { listCommand } from "./commands/list.js";
import { searchCommand } from "./commands/search.js";
import { createCommand } from "./commands/create.js";
import { openCommand } from "./commands/open.js";
import { startTui } from "./app/App.js";
import { printAsciiBanner } from "./banner.js";
import { createHeadless } from "@plannic/headless";
import { initWorkspace } from "./init.js";

function printHelp() {
  printAsciiBanner();
  console.log(`\x1b[1mUSAGE:\x1b[0m
  $ plan [command] [options]
  $ bun run plan [command] [options]

\x1b[1mCOMMANDS:\x1b[0m
  \x1b[33m(default)\x1b[0m                Launch interactive dual-panel TUI mode
  \x1b[32mlist, ls\x1b[0m                 List all plans in current project (.docs/)
  \x1b[32mopen <slug>\x1b[0m              Open TUI directly focused on a specific plan
  \x1b[32mcreate <name> [flags]\x1b[0m    Create a new plan without opening TUI
  \x1b[32msearch <query>\x1b[0m           Fuzzy search across all project plans and documents

\x1b[1mFLAGS:\x1b[0m
  --json                   Output machine-readable JSON (with 'list')
  --mode <quick|deep>      Specify plan mode (with 'create', default: deep)
  -h, --help               Show this help message
  -v, --version            Display version information

\x1b[1mEXAMPLES:\x1b[0m
  $ plan
  $ plan list --json
  $ plan open auth-system
  $ plan create "Payment Gateway" --mode deep
  $ plan search "jwt"
`);
}

async function main() {
  const cwd = process.cwd();
  const rawArgs = process.argv.slice(2);

  if (rawArgs.length === 0) {
    await startTui(cwd);
    return;
  }

  const firstArg = rawArgs[0].toLowerCase();
  const subArgs = rawArgs.slice(1);

  if (firstArg === "--json") {
    const operation = subArgs[0] === "list" ? "listPlans" : subArgs[0];
    const engine = createHeadless({ cwd });
    const fn = operation && (engine as Record<string, unknown>)[operation];
    if (typeof fn !== "function") throw new Error(`Unknown headless operation: ${operation ?? "(missing)"}`);
    console.log(JSON.stringify(await fn(...subArgs.slice(1).map((value) => JSON.parse(value)))));
    return;
  }

  switch (firstArg) {
    case "init": {
      const index = subArgs.indexOf("--agent");
      const result = await initWorkspace(cwd, (index >= 0 ? subArgs[index + 1] : "all") as any);
      console.log(JSON.stringify(result, null, 2));
      if (result.conflicts.length) process.exitCode = 2;
      break;
    }
    case "mcp": {
      const { startMcpServer } = await import("../../mcp-server/src/index.js");
      await startMcpServer();
      break;
    }
    case "list":
    case "ls":
      await listCommand(cwd, subArgs);
      break;

    case "search":
    case "find":
      await searchCommand(cwd, subArgs);
      break;

    case "create":
    case "new":
      await createCommand(cwd, subArgs);
      break;

    case "open":
      await openCommand(cwd, subArgs, startTui);
      break;

    case "-h":
    case "--help":
    case "help":
      printHelp();
      break;

    case "-v":
    case "--version":
    case "version":
      printAsciiBanner(true);
      break;

    default:
      if (firstArg.startsWith("-")) {
        console.error(`\x1b[31mUnknown flag:\x1b[0m ${firstArg}`);
      } else {
        console.error(`\x1b[31mUnknown command:\x1b[0m ${firstArg}`);
      }
      printHelp();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error("\x1b[31mFatal CLI error:\x1b[0m", error);
  process.exit(1);
});
