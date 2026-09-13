---
name: plannic
description: Structured project planning workbench using Plannic MCP. Use when the user invokes `/plannic` or asks in natural language to plan a feature, create an architecture plan, write a PRD, or plan project implementation (e.g. "tolong plan...", "bikin plan...", "plan implementasi...", "buat perencanaan...", "plannic", "rencanakan arsitektur...").
---

# Plannic: Project Planning & Architecture Workbench

Plannic provides a structured, iterative planning workflow backed by the Plannic MCP server and local Markdown files in `.docs/`.

---

## When to Activate

Trigger this workflow whenever:
- The user types `/plannic <feature-or-initiative>`
- The user asks to plan a feature or architecture in natural language (without needing to type a slash command):
  - *"tolong buatkan plan untuk payment gateway"*
  - *"bikin plan implementasi authentication"*
  - *"rencanakan arsitektur real-time chat"*
  - *"plan feature onboarding flow"*
  - *"buat perencanaan teknis..."*
  - Any prompt containing keywords: `plan`, `plannic`, `rencanakan`, `arsitektur`, `PRD`.

---

## Plannic MCP Tools

The Plannic MCP server provides 7 dedicated tools:
1. `get_config` — Reads `.plannic/config.md` project conventions and guidelines.
2. `init_plan` — Initializes a new plan (creates `.docs/plan-<slug>.md` and sub-documents in deep mode).
3. `get_plan` — Retrieves the document tree and content for an existing plan.
4. `update_document` — Updates a specific document section/file (`plan`, `scope`, `feature`, `phase`, `limitation`).
5. `list_plans` — Lists all plans and their status in `.docs/`.
6. `search_plans` — Fuzzy searches across all plan documents and titles.
7. `get_history` — Reads `.docs/.history/plan-<slug>.jsonl` audit trail.

---

## The 5-Step "Grill Mode" Workflow

Always follow this 5-step sequence when executing a planning request:

### Step 1: Read Project Context
Call `get_config(cwd=".")` via MCP.
- Inspect the project's tech stack, design conventions, state management rules, and preferred document templates.
- Keep these constraints in mind throughout the planning process.

### Step 2: The Grilling Phase (Clarifying Questions)
**Never jump straight into writing the plan without confirming requirements.**
Interview the user by asking 3–5 sharp, high-leverage clarifying questions. Focus on:
1. **Scope & MVP Boundaries**: What is strictly in scope for Phase 1 vs deferred to Phase 2?
2. **Architecture & Integration**: How does this interface with existing systems (auth, database, APIs, state)?
3. **Edge Cases & Failure Modes**: Network failure, offline mode, rate limits, validation rules?
4. **Non-functional Requirements**: Latency constraints, security/permissions, bundle size targets?

*Tip: If `ask_question` is available, format multiple-choice options with a write-in fallback, or ask directly in the chat.*

### Step 3: Initialize the Plan
Once the user provides answers (or confirms assumptions), call `init_plan`:
- `name`: Clean, title-cased feature name (e.g., `"Stripe Payment Gateway"`).
- `slug`: kebab-case identifier (e.g., `"stripe-payment-gateway"`).
- `mode`: `"deep"` (standard for features, architectures, multi-phase epics) or `"quick"` (for single-scope tasks/bugfixes).
- `description`: A 1–2 sentence overview of what this plan delivers.
- `cwd`: Project root directory.

### Step 4: Populate Document Sections
In `"deep"` mode, call `update_document` to populate each document thoroughly with clear, technical, markdown-formatted content:

1. **`scope` (`scope-<slug>.md`)**:
   - High-level objectives and business/technical problem being solved.
   - **In Scope**: Bulleted list of concrete deliverables.
   - **Out of Scope**: Explicitly deferred items to prevent scope creep.
   - **Success Metrics / Definition of Done**.

2. **`feature` (`feature-<slug>.md`)**:
   - Detailed functional specification.
   - Data structures, models, schemas, and API contracts (in TypeScript/Rust/JSON).
   - Component / module interactions and sequence diagrams (using mermaid).
   - UX / UI flows and state machines.

3. **`phase` (`phase-1-<slug>.md`)**:
   - Phased implementation roadmap (Phase 1 MVP, Phase 2 Polish, etc.).
   - Actionable, step-by-step checklist of tasks with dependencies.
   - Verification criteria for each phase.

4. **`limitation` (`limitation-<slug>.md`)**:
   - Technical constraints, trade-offs made, and known limitations.
   - Potential risks and mitigation strategies.
   - Deliberate shortcuts and future refactoring debt.

In `"quick"` mode, call `update_document` on the root `plan` document directly.

### Step 5: Summary & Desktop App Hand-off
Conclude the response with:
1. A concise overview of the generated plan.
2. Clickable file links to the created documents in `.docs/` using `file://` URIs.
3. An invitation to review and edit the plan visually in the **Plannic Desktop App**:
   > *💡 Tip: Buka **Plannic Desktop** untuk melihat struktur dokumen, riwayat revisi, dan melakukan pencarian instan (⌘K).*
