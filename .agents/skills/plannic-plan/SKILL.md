---
name: plannic-plan
description: Plannic Plan Inspector and Formatter. Inspect, view, or render a Plannic plan from `.docs/plans/` with visual phase progress, linked ADRs, and living specs. Activate when the user invokes `/plannic-plan` or asks to view a Plannic plan.
---

# Plannic Plan: CLI Inspector & Phased Progress

This skill provides an interactive inspection and status report for Plannic multi-phase plans stored in `.docs/plans/`. It renders directly into the Antigravity CLI via Plannic's dedicated TUI card or an informational markdown artifact (without hijacking Antigravity's native plan review modal).

---

## Separation from Native Antigravity `/plan`
- Use native `/plan` for Antigravity's built-in agent planning workflows.
- Use `/plannic-plan` or `/plannic` for Plannic repository blueprints in `.docs/`.

---

## When to Activate
Trigger this workflow whenever:
- The user invokes `/plannic-plan [slug]`
- The user asks to view or check progress of a Plannic plan:
  - *"tampilkan plannic plan [slug]..."*, *"cek progress plannic plan..."*

---

## Inspection & Presentation Workflow

### 1. Identify Target Plan
- If a slug is provided (e.g. `/plannic-plan auth-v2`), use it.
- If omitted:
  - Call `list_plans(cwd=".")` via Plannic MCP.
  - Select the active or most recent plan.

### 2. Fetch Progress & Context
- Call `get_plan(slug=..., cwd=".")` to load documents (`plan`, `scope`, `feature`, `phase`, `limitation`).
- Call `get_execution_progress(slug=..., cwd=".")` to load multi-phase metrics.
- Call `list_adrs(cwd=".")` and `list_specs(cwd=".")` to count linked architectural records.

### 3. Render Dedicated CLI Presentation
Display the status directly to the user in the CLI using the Plannic TUI card:
```text
┌── Plannic Architecture Workbench ────────────────────────────┐
│ Plan: <Title> (v1.0)                                         │
│ Phase <active>/<total>: <Phase Title> [■■■■□□□□□□] <pct>%    │
│ Tasks: <done>/<total> completed in active phase              │
│ Linked: <N> ADR(s) • <M> Living Spec(s)                      │
└──────────────────────────────────────────────────────────────┘
```

Optional: If the user specifically asks to export or create a file/artifact for this plan, write it with `RequestFeedback: false` so it acts purely as a readable reference document.

---

## Execution Sync Loop
When working on tasks under this plan:
1. Implement the task.
2. Advance progress via `move_task(slug, taskId, "done")`.
3. Output the updated phase metrics.
