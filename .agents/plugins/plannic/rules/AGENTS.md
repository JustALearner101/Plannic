# Plannic Architecture & Living Specs Guidelines (Antigravity Plugin)

Plannic serves as the repository-level architecture, living specifications, and ADR workbench stored in `.docs/`.

## 1. Strict Separation from Antigravity Native `/plan`
- **DO NOT override or intercept Antigravity's native `/plan` command.**
- Antigravity's built-in `/plan` is dedicated to native Antigravity task planning and execution workflows.
- Plannic activates **ONLY** when:
  - The user invokes `/plannic` (e.g., `/plannic`, `/plannic-plan`, `/plannic-adr`, `/plannic-spec`, `/plannic-status`, `/plannic-kanban`).
  - The user explicitly asks to manage or document repository architecture, ADRs, or living specifications in `.docs/`.
  - The user explicitly mentions "Plannic" or "pakai Plannic".

## 2. Dedicated CLI Display & Indicators (Independent of AGY Artifacts)
- Plannic maintains its own visual presentation in Antigravity CLI:
  - **Persistent CLI Status Bar:** Managed via `bun run scripts/plannic-statusline.ts`, showing real-time plan slug, active phase, progress bar, ADRs, and living specs count.
  - **Inline Terminal Card:** Rendered directly into the chat stream via `renderPlanCard` (`bun run scripts/plannic-card.ts`) for status overviews without cluttering AGY artifact modals.
- **DO NOT** use `RequestFeedback: true` to hijack Antigravity's native plan review modal. Plannic execution progress belongs to `.docs/` and Plannic's dedicated indicators.

## 3. Architecture Decision Records (ADRs)
- Before proposing fundamental architectural changes or introducing major dependencies, check `.docs/adrs/` via `list_adrs` or `get_adr`.
- Decisions marked as `accepted` are binding. Do not propose rejected or superseded alternatives unless explicitly asked.
- When new trade-offs or decisions are confirmed with the user, record them via `init_adr`.

## 4. Living Specifications & Contracts
- When implementing or extending system modules, reference corresponding specifications in `.docs/specs/` via `get_spec` or the `plannic://specs` resource.
- Keep specifications updated whenever APIs, schemas, or data models change using `update_spec`.

## 5. Phased Plan Execution & Progress Sync
- When executing tasks defined under a Plannic plan:
  - Maintain the repository `.docs/plans/<slug>/phase-*.md` as the primary system of record.
  - As each task completes, call `move_task(slug, taskId, "done")` to persist progress.
  - Use `get_execution_progress` or display the Plannic inline card to show status.
