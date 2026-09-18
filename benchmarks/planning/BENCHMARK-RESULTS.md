# Planning Benchmark — Initial Run

Date: 2026-09-17
Command: `bun run benchmark:planning`

## Result

The run completed its orchestration, but all 10 condition/task combinations were marked `invalid`; no quality comparison is claimed.

| Metric | Result |
|---|---:|
| Tasks | 5 |
| Conditions | 2 |
| Runs | 10 |
| Valid runs | 0 |
| Baseline wins | N/A |
| Plannic wins | N/A |

## Failure observed

The isolated replay workspace originally lived under `C:\Users\NHQFH\AppData\Local\Temp`, attempted to copy generated binaries and build artifacts, then failed with `ENOSPC: no space left on device`. An earlier run also showed missing local check dependencies (`tsc` and `svelte-kit`) inside the copied workspace.

This means the current result measures benchmark setup failure only. It does not measure planning quality or implementation success.

## Changes made after the run

The replay snapshot filter now excludes `node_modules`, `.git`, `dist`, `target`, `release`, `.openclaude`, Tauri build sources, executables, Bun build artifacts, and generated benchmark results. Missing check dependencies are reported as `invalid` instead of being counted as implementation failures.

Temporary workspaces now use `D:\Project\Plannic\.tmp\planning`, on the project drive rather than the Windows temp drive.

## Next valid run requirements

1. Ensure enough free disk space for one source-only temporary workspace.
2. Ensure repository dependencies are installed and available to the replay workspace.
3. Add real implementation patches to the 10 run fixtures; the initial fixtures currently contain plan text only.
4. Run the benchmark again and use only `passed`/`failed` rows for the A/B comparison.

## Important limitation

The current five fixtures are calibration fixtures, not evidence of Plannic improvement. Their patches are empty, so a future valid run must replace them with paired baseline and Plannic implementation artifacts generated from the same task snapshot.

## Rerun after moving temp storage to D

Command: `bun run benchmark:planning`
Result: no new result artifact was written; the process stopped during the multi-run copy/check phase. Two partial workspaces remained under `.tmp/planning` and an older workspace on C was still locked by a child process. This rerun therefore remains non-evidence and does not change the `0 valid runs` conclusion.
