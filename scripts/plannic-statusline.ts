#!/usr/bin/env bun
import { renderStatusLine } from "../packages/headless/src/index.js";

async function readStdin(timeoutMs = 40): Promise<string> {
  return new Promise((resolve) => {
    let buf = "";
    const timer = setTimeout(() => {
      try { process.stdin.pause(); } catch {}
      resolve(buf);
    }, timeoutMs);

    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (c) => { buf += c; });
    process.stdin.once("end", () => {
      clearTimeout(timer);
      resolve(buf);
    });
    process.stdin.once("error", () => {
      clearTimeout(timer);
      resolve(buf);
    });
    try { process.stdin.resume(); } catch {}
  });
}

async function main() {
  let cwd = process.cwd();

  // 1. Check CLI arguments
  const args = process.argv.slice(2);
  const cwdFlagIdx = args.indexOf("--cwd");
  if (cwdFlagIdx !== -1 && args[cwdFlagIdx + 1]) {
    cwd = args[cwdFlagIdx + 1];
  } else if (args[0] && !args[0].startsWith("-")) {
    cwd = args[0];
  } else {
    // 2. Read AGY stdin payload if available
    try {
      const stdinRaw = await readStdin(35);
      if (stdinRaw && stdinRaw.trim().startsWith("{")) {
        const payload = JSON.parse(stdinRaw);
        if (payload.cwd) {
          cwd = payload.cwd;
        } else if (Array.isArray(payload.workspacePaths) && payload.workspacePaths[0]) {
          cwd = payload.workspacePaths[0];
        }
      }
    } catch {}
  }

  try {
    const line = await renderStatusLine({ cwd, useColor: true });
    if (line) {
      process.stdout.write(line);
    }
  } catch {
    // Silent fail so status bar never crashes
  }

  process.exit(0);
}

main();
