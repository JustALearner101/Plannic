---
name: plannic
description: Structured Architecture, Specs & Planning Workbench using Plannic MCP. Use when the user invokes `/plannic` or asks to plan a feature, record an architectural decision (ADR), view or write system/API specifications, or track implementation tasks.
---

# Plannic: Architecture, Specs & Planning Workbench

Plannic provides an opinionated, local-first engineering workbench backed by the Plannic MCP server, desktop app, and local files in `.docs/`.

---

## When to Activate
Trigger this workflow whenever:
- The user types `/plannic <initiative>`
- The user asks to plan a feature, write a PRD, or design an architecture:
  - *"tolong buatkan plan untuk..."*, *"bikin plan implementasi..."*, *"rencanakan arsitektur..."*
- The user asks to record an architectural decision:
  - *"buat ADR untuk..."*, *"catat keputusan arsitektur..."*, *"record ADR..."*
- The user asks about or wants to document system / API specifications:
  - *"buat spec untuk..."*, *"lihat API contracts..."*, *"update spec database..."*

---

## Plannic Tools Overview (15 Dedicated Tools)

### 1. Planning & Execution
- `get_config`: Reads `.plannic/config.md` project conventions and stack.
- `init_plan`: Initializes a new plan in `.docs/` (`quick` or `deep` mode).
- `get_plan`: Retrieves the full document tree of a plan.
- `update_document`: Updates a specific sub-document (`plan`, `scope`, `feature`, `phase`, `limitation`).
- `move_task`: Moves a checklist task between status columns (`todo`, `in_progress`, `done`).
- `list_plans`: Lists all plans and document counts.
- `search_plans`: Instant fuzzy search across plans, specs, and ADRs.
- `get_history`: Reads audit changelogs.

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

## MCP Resources & Prompts

### Resources
- `plannic://plans`: Overview of all active project plans.
- `plannic://adrs`: Summary of all recorded architectural decisions.
- `plannic://specs`: Catalog of all living specifications and API contracts.

### Prompts
- `plannic-grill-mode`: Interactive 5-step clarification interview.
- `plannic-distill-adr`: Prompt to extract recent decisions into an ADR.

---

## The 5-Step "Grill Mode" Workflow & Dual-Projection
1. **Read Project Context**: Call `get_config(cwd=".")`.
2. **Clarifying Questions**: Interview the user with 3–5 sharp, high-leverage questions on MVP boundaries and trade-offs.
3. **Initialize Plan**: Call `init_plan(name=..., mode="deep")`.
4. **Populate Documents**: Call `update_document` for `scope`, `feature`, `phase`, and `limitation`. Link relevant `specs: [...]` or `adrs: [...]` in frontmatter.
5. **Antigravity Dual-Projection ("1 Plannic Plan" Artifact)**:
   - Project a live, interactive plan into the conversation artifact directory:
     `<appDataDir>/brain/<conversationId>/plannic_plan_<slug>.md`
   - Use `write_to_file` with `ArtifactMetadata`:
     ```json
     {
       "UserFacing": true,
       "RequestFeedback": true,
       "Summary": "⚡ [PLANNIC] Architectural Blueprint & Phased Execution Plan: <Title> | Status: Proposed"
     }
     ```
   - Antigravity UI renders this with the native **"Proceed"** button and distinct Plannic branding (`[1 Plannic Plan]`).
   - The user reviews the plan directly in Antigravity's artifact drawer or modal and clicks **Proceed** to authorize execution.

---

## The "1 Plannic Plan" Artifact Standard

Each Plannic plan projected into Antigravity follows this layout:

```markdown
# 📐 PLANNIC ARCHITECTURAL SPEC & EXECUTION PLAN: <Title>

> **Plan ID:** `<slug>` | **Version:** `v1.0` | **Status:** `Proposed`  
> **Repository Plan:** [`.docs/plan-<slug>.md`](file:///D:/Project/Plannic/.docs/plan-<slug>.md)

### 📌 Core Architecture Documents
| Document | Purpose | File Link |
| :--- | :--- | :--- |
| **Scope & Boundaries** | In-scope vs. Out-of-scope boundaries | [`scope-<slug>.md`](file:///...) |
| **Features & Specs** | Acceptance criteria & user stories | [`feature-<slug>.md`](file:///...) |
| **Execution Roadmap** | Phased tasks & Kanban tracking | [`phase-<slug>.md`](file:///...) |
| **Constraints & Risks** | Limitations & technical debt | [`limitation-<slug>.md`](file:///...) |

### 🏛 Architectural Decision Records (ADRs) & Living Specs
- **ADR-0001:** Standard Architecture Format ([`adr-0001-...md`](file:///...))
- **Spec:** Living System Contract ([`specs/...md`](file:///...))

### 📋 Phase 1: Implementation Tasks
- [ ] Task 1.1: ...
- [ ] Task 1.2: ...

---
*(Click **Proceed** below to approve this Plannic Blueprint and start Phase 1 execution)*
```

---

## Phased Execution & Real-Time Sync Loop

When the user clicks **Proceed** on the Plannic Plan Artifact:
1. **Execute Task**: Perform the implementation work for the current task.
2. **Sync Repository (.docs/)**: Call MCP `move_task(slug, taskId, "done")` (or `"in_progress"`).
3. **Sync Antigravity Artifact**: Update the checkboxes (`- [ ]` -> `- [x]`) in `<appDataDir>/brain/<conversationId>/plannic_plan_<slug>.md`.
4. Keep both Git and the Antigravity UI in continuous 100% synchronization.

