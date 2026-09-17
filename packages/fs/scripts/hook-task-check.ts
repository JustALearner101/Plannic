#!/usr/bin/env bun
// Fast Antigravity PostToolUse Hook for Plannic Task Tracking
// Runs in < 30ms to provide non-blocking assistive context

try {
  // Check if .docs directory exists
  const docsDir = `${process.cwd()}/.docs`;
  const exists = await Bun.file(`${docsDir}/plan-adr-and-specs-architecture-workbench-expansion.md`).exists()
    || (await Bun.file(`${process.cwd()}/.plannic/config.md`).exists());

  if (exists) {
    console.log(
      "[Plannic] Workspace code modified. If this fulfills any phase checklist tasks, remember to advance them with move_task."
    );
  }
} catch {
  // Silent fail to avoid disrupting agent flow
}
process.exit(0);
