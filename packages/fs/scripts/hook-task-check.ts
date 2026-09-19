#!/usr/bin/env bun
// Fast Antigravity PostToolUse Hook for Plannic Task Tracking
// Non-blocking assistive context for Antigravity

try {
  const cwd = process.cwd();
  const hasConfig = await Bun.file(`${cwd}/.plannic/config.md`).exists();
  const hasDocs = await Bun.file(`${cwd}/.docs`).exists();

  if (hasConfig || hasDocs) {
    console.log(
      "\x1b[36m[Plannic]\x1b[0m Workspace code modified. Advance phase tasks with `move_task` when done."
    );
  }
} catch {
  // Silent fail to avoid disrupting agent flow
}
process.exit(0);
