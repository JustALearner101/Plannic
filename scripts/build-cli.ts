import { spawnSync } from "node:child_process";
import path from "node:path";

const isWindows = process.platform === "win32";
const outfile = path.join("dist", isWindows ? "plannic.exe" : "plannic");

console.log(`Building Plannic CLI for ${process.platform} (${process.arch}) -> ${outfile}`);

// 1. Sync skills and generate assets
const syncRes = spawnSync("bun", ["run", "scripts/sync-skills.ts"], { stdio: "inherit" });
if (syncRes.status !== 0) {
  process.exit(syncRes.status ?? 1);
}

// 2. Compile standalone binary
const compileRes = spawnSync(
  "bun",
  ["build", "apps/cli/src/index.tsx", "--compile", "--outfile", outfile],
  { stdio: "inherit" }
);

if (compileRes.status !== 0) {
  process.exit(compileRes.status ?? 1);
}

console.log(`\x1b[32m✔ Successfully built ${outfile}\x1b[0m`);
