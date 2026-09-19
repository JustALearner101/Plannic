#!/usr/bin/env bun
import { listCommand } from "./commands/list.js";
import { searchCommand } from "./commands/search.js";
import { createCommand } from "./commands/create.js";
import { openCommand } from "./commands/open.js";
// startTui is loaded dynamically only when TUI is launched
import { printAsciiBanner } from "./banner.js";
import { createHeadless } from "@plannic/headless";
import { initWorkspace } from "./init.js";
import { runDoctor, printDoctorReport } from "./doctor.js";
import { runMcpCheck } from "./mcp-check.js";
import { generateCompletion, type ShellType } from "./completion.js";
import { checkUpgrade, performUpgrade } from "./upgrade.js";

function printHelp() {
  printAsciiBanner();
  console.log(`\x1b[1mUSAGE:\x1b[0m
  $ plannic [command] [options]
  $ bun run plan [command] [options]

\x1b[1mCOMMANDS:\x1b[0m
  \x1b[33m(default)\x1b[0m                Launch interactive dual-panel TUI mode
  \x1b[32minit\x1b[0m                     Initialize workspace config, .docs/ directories, and agent skills
  \x1b[32mdoctor\x1b[0m                   Run system and workspace diagnostics (with --json, --mcp)
  \x1b[32mmcp\x1b[0m                      Start MCP server on stdio (use --check to test handshake)
  \x1b[32mlist, ls\x1b[0m                 List all plans in current project (.docs/)
  \x1b[32mopen <slug>\x1b[0m              Open TUI directly focused on a specific plan
  \x1b[32mcreate <name> [flags]\x1b[0m    Create a new plan without opening TUI
  \x1b[32msearch <query>\x1b[0m           Fuzzy search across all project plans and documents
  \x1b[32mupgrade\x1b[0m                  Upgrade Plannic binary to the latest release (use --check to inspect)
  \x1b[32mcompletion <shell>\x1b[0m       Generate shell autocompletion (bash, zsh, powershell)

\x1b[1mFLAGS:\x1b[0m
  --json                   Output machine-readable JSON (with 'list', 'init', 'doctor', 'mcp')
  --diff                   Display colored unified diff on init conflicts
  --mcp                    Run deep MCP handshake during diagnostics (with 'doctor')
  --mode <quick|deep>      Specify plan mode (with 'create', default: deep)
  --agent <name>           Specify target agent for init (all, antigravity, claude, cursor)
  -h, --help               Show this help message
  -v, --version            Display version information

\x1b[1mEXAMPLES:\x1b[0m
  $ plannic
  $ plannic doctor
  $ plannic doctor --mcp
  $ plannic init --json
  $ plannic init --diff
  $ plannic mcp --check
  $ plannic list --json
  $ plannic upgrade --check
  $ plannic completion powershell
`);
}

async function main() {
  const cwd = process.cwd();
  const rawArgs = process.argv.slice(2);

  if (rawArgs.length === 0) {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      printHelp();
      return;
    }
    const { startTui } = await import("./app/App.js");
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
      const isJson = subArgs.includes("--json");
      const showDiff = subArgs.includes("--diff");
      const agentIdx = subArgs.indexOf("--agent");
      const agent = (agentIdx >= 0 ? subArgs[agentIdx + 1] : "all") as any;

      const result = await initWorkspace(cwd, { agent, diff: showDiff });

      if (isJson) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        if (result.conflicts.length > 0) {
          for (const conflict of result.conflicts) {
            console.log(`\x1b[33mConflict:\x1b[0m ${conflict} already exists`);
            console.log(`Kept existing file.`);
            if (!showDiff) {
              console.log(`Run \`plannic init --diff\` to compare.\n`);
            }
          }
          if (showDiff && result.diffs) {
            console.log(`\x1b[1m\x1b[36mProposed Unified Diff:\x1b[0m\n`);
            for (const [file, diff] of Object.entries(result.diffs)) {
              console.log(`\x1b[1m--- Diff for ${file} ---\x1b[0m`);
              for (const line of diff.split("\n")) {
                if (line.startsWith("+")) console.log(`\x1b[32m${line}\x1b[0m`);
                else if (line.startsWith("-")) console.log(`\x1b[31m${line}\x1b[0m`);
                else console.log(line);
              }
              console.log("");
            }
          }
        } else {
          console.log(`\x1b[32m✔\x1b[0m Workspace initialized successfully!`);
          console.log(`Project: ${result.project} (${result.stack.join(", ")})`);
          console.log(`MCP ready: ${result.mcpReady}`);
          console.log(`Skills count: ${result.skillsCount}`);
        }
      }

      if (result.conflicts.length) process.exitCode = 2;
      break;
    }

    case "doctor": {
      const isJson = subArgs.includes("--json");
      const checkMcp = subArgs.includes("--mcp");
      const result = await runDoctor({ cwd, json: isJson, mcp: checkMcp });

      if (isJson) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        printDoctorReport(result);
      }

      if (result.status === "unhealthy") {
        process.exitCode = 1;
      }
      break;
    }

    case "mcp": {
      if (subArgs.includes("--check")) {
        const isJson = subArgs.includes("--json");
        const res = await runMcpCheck(cwd);

        if (isJson) {
          console.log(JSON.stringify(res, null, 2));
        } else if (res.success) {
          console.log(`\x1b[32m✔\x1b[0m MCP server handshake verified (server: ${res.serverName} v${res.serverVersion}, ${res.toolCount} tools registered in ${res.durationMs}ms)`);
        } else {
          console.error(`\x1b[31m✖\x1b[0m MCP handshake failed: ${res.error}`);
        }

        if (!res.success) process.exitCode = 1;
        break;
      }

      const { startMcpServer } = await import("../../mcp-server/src/index.js");
      await startMcpServer();
      break;
    }

    case "upgrade": {
      if (subArgs.includes("--check")) {
        try {
          const check = await checkUpgrade();
          console.log(`Current version: v${check.currentVersion}`);
          console.log(`Latest version:  v${check.latestVersion}`);
          if (check.hasUpdate) {
            console.log(`\x1b[33mAn update is available!\x1b[0m Run \`plannic upgrade\` to install.`);
          } else {
            console.log(`\x1b[32m✔\x1b[0m You are running the latest version.`);
          }
        } catch (err: any) {
          console.error(`\x1b[31mError checking for upgrade:\x1b[0m`, err?.message || err);
          process.exitCode = 1;
        }
      } else {
        try {
          await performUpgrade();
        } catch (err: any) {
          console.error(`\x1b[31mUpgrade failed:\x1b[0m`, err?.message || err);
          process.exitCode = 1;
        }
      }
      break;
    }

    case "completion": {
      const shell = (subArgs[0] || "bash").toLowerCase() as ShellType;
      if (!["bash", "zsh", "powershell"].includes(shell)) {
        console.error(`Unsupported shell "${subArgs[0]}". Supported shells: bash, zsh, powershell`);
        process.exit(1);
      }
      console.log(generateCompletion(shell).trim());
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

    case "open": {
      const { startTui } = await import("./app/App.js");
      await openCommand(cwd, subArgs, startTui);
      break;
    }

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
