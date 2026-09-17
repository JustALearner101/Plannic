---
name: plannic-view
description: Render an interactive visual engineering dashboard of all active plans, living specifications, and Architecture Decision Records (ADRs) using Plannic into an Antigravity artifact. Activate when the user invokes `/plannic-view`, `/dashboard`, or asks in natural language to view the project dashboard, see active plans, or check engineering status.
---

# Plannic Master Engineering Dashboard

This skill renders a unified, beautiful engineering dashboard artifact in the Antigravity Auxiliary Pane displaying active feature plans, living specifications, and architectural decision records.

---

## When to Activate
- User invokes `/plannic-view` or `/dashboard`.
- User asks in natural language:
  - *"tampilkan dashboard plannic"* / *"buka dashboard"*
  - *"lihat status plans"* / *"show project dashboard"*
  - *"overview arsitektur dan rencana"*

---

## Execution Steps

### 1. Gather Project Data
Call the following Plannic MCP tools concurrently or sequentially:
1. `get_config(cwd=".")`: Obtain project name, stack, and guidelines.
2. `list_plans(cwd=".")`: Retrieve all active and completed plans.
3. `list_specs(cwd=".")`: Retrieve all living specifications and API contracts.
4. `list_adrs(cwd=".")`: Retrieve all recorded Architecture Decision Records.

### 2. Format Dashboard Content
Assemble a clean, structured markdown document with:
- **Header**: Project Title, Tech Stack tags, and metric cards (Total Plans, Active Specs, Recorded ADRs).
- **Active Execution Plans**: A table listing each plan with:
  - Plan Name
  - Mode (`quick` | `deep`)
  - Status Badge (`draft`, `in_progress`, `final`)
  - Semantic Version
  - Document count
- **Living Specifications & API Contracts**: Catalog categorized by area (`architecture`, `api`, `database`, `security`).
- **Architecture Decision Records (ADRs)**: Chronological summary of key decisions with status (`accepted`, `proposed`, `superseded`).
- **Quick Action Cheatsheet**:
  - `/plannic-kanban` — Open active task board
  - `/plannic-spec <slug>` — Inspect specific specification
  - `/plannic-adr <number>` — View decision details

### 3. Generate Native Antigravity Artifact
Use the `write_to_file` tool to save the dashboard directly into the conversation artifact directory:
- **TargetFile**: `<appDataDir>\brain\<conversation-id>\plannic_dashboard.md`
- **ArtifactMetadata**:
  - `UserFacing`: `true`
  - `RequestFeedback`: `false`
  - `Summary`: "Interactive Plannic Master Engineering Dashboard with active plans, living specs, and ADR logs."

### 4. Respond to User
Output a concise confirmation message in chat pointing the user to the generated artifact in the right-hand panel, highlighting key project metrics and active items.
