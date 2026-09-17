# Plannic Architecture & Planning Guidelines

When working in this repository, Plannic serves as the primary system of record for planning and architecture:

## 1. Respect Existing Architecture Decision Records (ADRs)
- Before proposing fundamental architectural changes or introducing major dependencies, check `.docs/adrs/` via `list_adrs` or `get_adr`.
- Decisions marked as `accepted` are binding. Do not propose rejected or superseded alternatives unless explicitly asked.

## 2. Check Living Specifications
- When implementing or extending system modules, reference the corresponding specification in `.docs/specs/` via `get_spec` or the `plannic://specs` resource.
- Keep specifications updated whenever APIs or data models change using `update_spec`.

## 3. The 5-Step Planning Process
- When the user asks to plan a new feature or architectural initiative:
  1. Call `get_config` to understand stack and conventions.
  2. Ask 3–5 clarifying questions to resolve scope boundaries.
  3. Call `init_plan(mode="deep")`.
  4. Call `update_document` for `scope`, `feature`, `phase`, and `limitation`.
  5. Project the plan into an Antigravity Artifact (`<brain>/plannic_plan_<slug>.md`) with `RequestFeedback: true` to enable native UI review and approval.

## 4. Antigravity Dual-Projection & Real-Time Sync
- When planning an initiative or executing tasks in Antigravity:
  - Maintain the repository `.docs/` 5-document tree as the universal system of record.
  - Simultaneously project the live plan to Antigravity's artifact system (`plannic_plan_<slug>.md`) so the user receives the interactive "Proceed" button modal (`RequestFeedback: true`).
  - As tasks are completed, keep both in 100% sync: call `move_task` for `.docs/phase-*.md` and update `- [x]` in the artifact.
