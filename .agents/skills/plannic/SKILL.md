---
name: plannic
description: Structured Architecture, Living Specs & ADR Workbench for Plannic. Use when the user invokes `/plannic` or explicitly asks to manage Plannic plans, record architectural decisions (ADR), inspect living specifications, or view Plannic status.
---

# Plannic: Architecture, Living Specs & ADR Workbench

Plannic provides a headless, local-first engineering workbench backed by `@plannic/headless`, the Plannic MCP server, desktop app, and local repository files in `.docs/`.

---

## Separation from Native Antigravity `/plan`
- **Antigravity `/plan`** is native to the agent environment for general task planning.
- **Plannic (`/plannic`)** is the repository-level system of record for multi-phase architectural blueprints, ADRs, and living specifications stored under `.docs/`.
- Plannic has its own visual indicators in the Antigravity CLI (statusline & inline cards) and does not hijack the native AGY plan review modal.

---

## When to Activate
Trigger this workflow **ONLY** when:
- The user invokes `/plannic <command|initiative>` (e.g. `/plannic`, `/plannic status`, `/plannic init <name>`)
- The user explicitly asks to work with Plannic or repository architecture:
  - *"buatkan plannic blueprint untuk..."*, *"buka status plannic..."*, *"pakai plannic untuk arsitektur..."*
- The user asks to record or view Architecture Decision Records:
  - *"buat ADR untuk..."*, *"catat keputusan arsitektur..."*, *"list adrs..."*
- The user asks about or wants to document system / API specifications:
  - *"buat spec API untuk..."*, *"lihat living specs..."*, *"update spec..."*

---

## Plannic Tools Overview (MCP & Headless Boundary)

### 1. Planning & Execution
- `get_config`: Reads `.plannic/config.md` project conventions and stack.
- `init_plan`: Initializes a new plan in `.docs/plans/<slug>/` (`quick` or `deep` mode).
- `get_plan`: Retrieves the full document tree of a plan.
- `update_document`: Updates a specific sub-document (`plan`, `scope`, `feature`, `phase`, `limitation`).
- `move_task`: Moves a checklist task between status columns (`todo`, `in_progress`, `done`).
- `list_plans`: Lists all plans and document counts.
- `search_plans`: Instant fuzzy search across plans, specs, and ADRs.
- `get_history`: Reads audit changelogs.
- `get_execution_progress`: Multi-phase progress metrics.
- `add_phase` / `advance_phase`: Multi-phase lifecycle transitions.

### 2. Architecture Decision Records (ADRs)
- `init_adr`: Creates a sequentially numbered ADR in `.docs/adrs/` (`adr-0001-...md`) using standard MADR format.
- `get_adr`: Retrieves an ADR by number or slug.
- `list_adrs`: Lists all ADRs and their status (`proposed`, `accepted`, `rejected`, `superseded`).

### 3. Living System & API Specifications
- `init_spec`: Creates a living specification or API contract in `.docs/specs/` (`<slug>.md`).
- `get_spec`: Retrieves a specification by slug.
- `update_spec`: Updates specification body content and/or status with version bump and audit logging.
- `list_specs`: Lists all living specifications and API contracts.

---

## CLI Visual Presentation & Indicators

Plannic maintains a dedicated visual representation in Antigravity CLI without colliding with AGY artifacts:

### 1. Status Bar Indicator (`scripts/plannic-statusline.ts`)
Rendered continuously in the Antigravity CLI status bar:
```text
[Plannic] │ <slug> Ph<num> (<done>/<total>) [■■■□□□] <pct>% │ <N> ADRs • <M> Specs
```

### 2. Inline Terminal Card (`scripts/plannic-card.ts`)
Rendered directly into the chat stream when checking status or completing milestones:
```text
┌── Plannic Architecture Workbench ────────────────────────────┐
│ Plan: <Title> (v1.0)                                         │
│ Phase 1/2: <Phase Title> [■■■■■□□□□□] 50%                    │
│ Tasks: 5/10 completed in active phase                        │
│ Linked: 2 ADR(s) • 1 Living Spec(s)                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Phased Plan Workflow
1. **Context & Conventions**: Call `get_config(cwd=".")`.
2. **Clarifying Scope**: Ask 3–5 sharp, high-leverage questions on MVP boundaries and trade-offs.
3. **Initialize Plan**: Call `init_plan(name=..., mode="deep")`.
4. **Populate Documents**: Call `update_document` for `scope`, `feature`, `phase`, and `limitation`.
5. **Display Status**: Output the Plannic inline card so the user sees the plan overview right in the terminal.
6. **Execute & Track**: As tasks are finished, update `.docs/plans/<slug>/phase-*.md` via `move_task(slug, taskId, "done")`.
