#!/usr/bin/env bun
// Fast Antigravity Stop Hook for Plannic ADR Reminder
// Runs in < 20ms to remind the agent to record architectural decisions

try {
  const adrsDir = `${process.cwd()}/.docs/adrs`;
  const exists = await Bun.file(`${process.cwd()}/.plannic/config.md`).exists();
  if (exists) {
    console.log(
      "[Plannic] Turn complete. If new architectural trade-offs or decisions were made during this session, remember to record an ADR via init_adr."
    );
  }
} catch {
  // Silent fail
}
process.exit(0);
