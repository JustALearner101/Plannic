---
name: plannic-plan
description: Interactive Antigravity Plan Projection Assistant. Project an active or existing Plannic plan from `.docs/` into a native Antigravity Artifact with an interactive 'Proceed' button, or initialize a new architectural plan with dual projection. Activate when the user invokes `/plannic-plan` or asks to project or view an execution plan in Antigravity.
---

# Plannic Plan: Antigravity Native Artifact Projection

This skill bridges Plannic's universal repository-level planning files in `.docs/` with Antigravity's native interactive **Artifact System**, rendering a branded **"1 Plannic Plan"** directly in the Antigravity UI with a live **"Proceed"** button.

---

## When to Activate
Trigger this workflow whenever:
- The user invokes `/plannic-plan [slug]`
- The user asks to project or sync a plan into Antigravity:
  - *"buka plan ini di artifact..."*, *"tampilkan plan di antigravity..."*, *"project plan ke artifact..."*
- The user asks to review an existing plan before proceeding with execution.

---

## The Dual-Projection Workflow

### 1. Identify Target Plan
- If a slug is provided (e.g., `/plannic-plan my-feature`), use it.
- If no slug is provided:
  - Call `list_plans(cwd=".")` via Plannic MCP.
  - Select the most recently updated active plan, or prompt the user if ambiguous.

### 2. Fetch Document Tree & Context
- Call `get_plan(slug=..., cwd=".")` via Plannic MCP to load:
  - `plan` (metadata, title, version)
  - `scope` (MVP boundaries, out-of-scope)
  - `feature` (user stories, requirements)
  - `phase` (tasks, checkboxes, status)
  - `limitation` (risks, trade-offs)
- Call `list_adrs(cwd=".")` and `list_specs(cwd=".")` to resolve linked decisions and contracts.

### 3. Generate the Antigravity Plan Artifact
Write the artifact using `write_to_file` to:
`<appDataDir>/brain/<conversationId>/plannic_plan_<slug>.md`

Provide `ArtifactMetadata`:
```json
{
  "UserFacing": true,
  "RequestFeedback": true,
  "Summary": "⚡ [PLANNIC PLAN] <Title> (v1.0) | <N> Tasks Pending Approval | Linked: <M> ADRs, <K> Specs"
}
```

### 4. Structure the "1 Plannic Plan" Content
The artifact must contain:
1. **Header & Metadata:**
   ```markdown
   # 📐 PLANNIC ARCHITECTURAL SPEC & EXECUTION PLAN: <Title>

   > **Plan Slug:** `<slug>` | **Version:** `<version>` | **Status:** `<status>`  
   > **Universal Plan Index:** [`.docs/plan-<slug>.md`](file:///D:/Project/Plannic/.docs/plan-<slug>.md)
   ```
2. **Document Grid:**
   Table with direct clickable `file:///` links to all 5 documents in `.docs/`.
3. **Linked ADRs & Living Specs:**
   Summary of binding architectural decisions and data contracts.
4. **Execution Roadmap (Phase Tasks):**
   Render the checklist of tasks from `phase-<slug>.md` with `- [ ]` (todo) and `- [x]` (done).
5. **Approval Callout:**
   Notify the user that clicking **Proceed** in Antigravity will start execution.

---

## Execution Sync Protocol
Once the user clicks **Proceed**:
1. Begin execution of the pending tasks in Phase 1.
2. After completing each task:
   - Call MCP `move_task(slug, taskId, "done")` to persist progress in Git.
   - Update `<appDataDir>/brain/<conversationId>/plannic_plan_<slug>.md` to mark `- [x]` in the Antigravity artifact.
3. Keep Git and the Antigravity UI in 100% lockstep.
