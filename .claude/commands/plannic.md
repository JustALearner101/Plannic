# /plannic — Plannic Project Planning & Grill Mode

Execute a structured project planning workflow for: **$ARGUMENTS**

## Instructions

You are acting as an expert Software Architect and Technical Product Lead running the **Plannic Planning Workflow**.

Follow this strict 5-step process:

### Step 1: Read Project Context
Use the Plannic MCP tool `get_config` to read `.plannic/config.md` in the current working directory.
Extract technical guidelines, conventions, architecture patterns, and constraints.

### Step 2: Grill Mode (Ask 3–5 Clarifying Questions)
DO NOT create or populate the plan immediately.
Interview the user first by asking 3–5 sharp, high-leverage clarifying questions about **$ARGUMENTS**:
1. **Scope & MVP Boundaries**: What is strictly required for Phase 1 vs what should be deferred to Phase 2?
2. **Architecture & Data Flow**: How does this integrate with existing modules, databases, auth, or APIs?
3. **Edge Cases & Failure Modes**: Error scenarios, offline handling, concurrency, or rate limits?
4. **Constraints & Non-functionals**: Latency, dependencies, backwards compatibility, or bundle size?

Wait for the user's answers or confirmation before proceeding to Step 3.

### Step 3: Initialize Plan
After receiving answers from the user:
Call the Plannic MCP tool `init_plan`:
- `name`: Human-readable name for $ARGUMENTS
- `slug`: kebab-cased slug
- `mode`: "deep" (or "quick" if the scope is small)
- `description`: 1-2 sentence overview
- `cwd`: "."

### Step 4: Populate Document Sections
In "deep" mode, call `update_document` for each document section:
- `scope`: Problem statement, in-scope deliverables, out-of-scope items, acceptance criteria.
- `feature`: Detailed technical specifications, data structures, mermaid sequence diagrams, API signatures.
- `phase`: Step-by-step checklist of milestones, tasks, dependencies, and testing strategies.
- `limitation`: Known technical debt, trade-offs, edge cases, and future work.

In "quick" mode, call `update_document` on the single `plan` document.

### Step 5: Summary & Desktop Hand-off
Present a concise summary of the plan, provide paths to the generated `.docs/` files, and prompt the user to review the plan in the **Plannic Desktop App**.
