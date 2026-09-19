#!/usr/bin/env bun
// Fast Antigravity Stop Hook for Plannic ADR Reminder
// Reminds the agent to record architectural decisions if any were made

try {
  const cwd = process.cwd();
  const exists = (await Bun.file(`${cwd}/.plannic/config.md`).exists()) || (await Bun.file(`${cwd}/.docs`).exists());
  if (exists) {
    console.log(
      "\x1b[36m[Plannic]\x1b[0m Turn complete. If architectural trade-offs or decisions were made, record an ADR via `init_adr`."
    );
  }
} catch {
  // Silent fail
}
process.exit(0);
