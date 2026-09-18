# Valid Planning Benchmark Run

Command: `bun run benchmark:planning`

| Task | Baseline | Plannic | Baseline plan | Plannic plan |
|---|---|---|---:|---:|
| single-module-config | passed | passed | 1/4 | 1/4 |
| cross-module-search | passed | passed | 0/4 | 2/4 |
| api-data-history | passed | passed | 0/4 | 2/4 |
| refactor-task-parser | passed | passed | 0/4 | 1/4 |
| ambiguous-plan-governance | passed | passed | 0/4 | 2/4 |

All 10 runs were valid. The runner used source-only workspaces on D, shared dependency junctions for every workspace package, serial execution, progress output, process-tree cleanup, and per-command timeouts.

The mean plan score improved from 0.2/4 (baseline) to 1.6/4 (Plannic), a +1.4-point gain. Implementation scores are 2/4 for both conditions because the calibration fixtures contain no implementation patches; this run validates the harness and planning signal, not implementation quality.
