---
name: plannic-adr
description: Interactive Architecture Decision Record (ADR) assistant. Record a new architectural decision via structured interview, or render a visual timeline of all project ADRs into an Antigravity artifact. Activate when the user invokes `/plannic-adr`, `/adr`, or asks in natural language to record an architectural decision or view ADR history.
---

# Plannic ADR Assistant & Decision Timeline

This skill provides an interactive workflow for managing Architecture Decision Records (ADRs) in `.docs/adrs/`, following the MADR (Markdown Architectural Decision Records) standard.

---

## When to Activate
- User invokes `/plannic-adr` or `/adr`.
- User asks in natural language:
  - *"catat ADR baru"* / *"buat architecture decision record"*
  - *"record decision to use X over Y"*
  - *"lihat timeline keputusan arsitektur"* / *"apa saja ADR kita?"*

---

## Execution Modes

### Mode A: Record a New ADR (User wants to record a decision)
When the user mentions a specific decision or wants to record an ADR:

1. **Clarify the Decision (if details are missing)**:
   Ensure the following 4 core MADR components are identified:
   - **Context & Problem Statement**: What technical or business problem triggered this?
   - **Considered Options**: What alternative approaches/libraries were evaluated?
   - **Decision Outcome**: What was chosen and what was the main justification?
   - **Consequences**: What are the positive gains and negative trade-offs?

2. **Initialize ADR via Plannic MCP**:
   Call `init_adr(cwd=".", title=..., status="accepted", description=...)`.
   - Plannic automatically allocates the next sequential number (e.g. `0002` -> `adr-0002-<slug>.md`).

3. **Populate Details**:
   If the user provided detailed options or consequences during conversation, use `replace_file_content` or file write tools to ensure the generated ADR in `.docs/adrs/` contains complete, production-grade rationale.

4. **Confirm to User**:
   Provide the created ADR number, path, and a short summary of how this decision protects future AI sessions from backtracking.

---

### Mode B: View ADR Timeline (User wants to inspect past decisions)
When the user asks to see existing ADRs or runs `/plannic-adr` without arguments:

1. **Fetch All ADRs**:
   Call `list_adrs(cwd=".")`.

2. **Generate Timeline Artifact**:
   Use `write_to_file` to write `<appDataDir>\brain\<conversation-id>\plannic_adrs.md`:
   - **ArtifactMetadata**:
     - `UserFacing`: `true`
     - `RequestFeedback`: `false`
     - `Summary`: "Chronological timeline of all recorded Architecture Decision Records (ADRs)."

Structure:
```markdown
# Architecture Decision Records (ADRs)

> Single Source of Truth for Architecture Choices & Trade-offs

---

| Number | Title | Status | Date | Core Decision |
| :---: | :--- | :---: | :---: | :--- |
| **#0001** | Use Tauri 2 for Desktop App | `ACCEPTED` | 2026-09-16 | Lightweight native webview (<15MB) over Electron |
| **#0002** | Use Bun as Primary Runtime | `ACCEPTED` | 2026-09-16 | Native TypeScript execution & instant test runner |

---

### Guidelines
- Decisions marked as `accepted` are binding. AI agents must respect them and not propose superseded alternatives.
- To record a new decision, run:
  > `/plannic-adr <Decision Title>`
```

3. **Respond to User**:
   Briefly summarize total recorded ADRs in chat and invite the user to read the full details in the artifact pane.
