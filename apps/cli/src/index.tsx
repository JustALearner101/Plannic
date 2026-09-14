#!/usr/bin/env bun
import { listCommand } from "./commands/list.js";
import { searchCommand } from "./commands/search.js";
import { createCommand } from "./commands/create.js";
import { openCommand } from "./commands/open.js";
import { startTui } from "./app/App.js";

function printHelp() {
  console.log(`
\x1b[1m\x1b[36mPlannic CLI\x1b[0m — Structured Project Planning Workbench (Terminal Edition)

\x1b[1mUSAGE:\x1b[0m
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

  switch (firstArg) {
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
      console.log("Plannic CLI v0.1.0 (OpenTUI Edition)");
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
