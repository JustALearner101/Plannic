---
name: plannic-kanban
description: Render an interactive Kanban task board of the active implementation phase into an Antigravity artifact. Activate when the user invokes `/plannic-kanban`, `/kanban`, or asks to view the task board, checklist, or implementation roadmap.
---

# Plannic Kanban Task Board

This skill inspects active implementation plans and renders a clean, categorized Kanban board artifact (`plannic_kanban.md`) in the Antigravity Auxiliary Pane with tasks sorted into `To Do`, `In Progress`, and `Done`.

---

## When to Activate
- User invokes `/plannic-kanban` or `/kanban`.
- User asks in natural language:
  - *"tampilkan kanban"* / *"lihat task board"*
  - *"cek checklist task fase 1"* / *"show implementation progress"*
  - *"apa task berikutnya yang harus dikerjakan?"*

---

## Execution Steps

### 1. Identify Target Plan
1. Call `list_plans(cwd=".")` to locate active plans.
2. If the user specified a plan name or slug, use that plan. Otherwise, pick the most recently updated active plan (`status: "in_progress"` or `"draft"`).
3. Call `get_plan(cwd=".", slug=...)` to retrieve the plan's documents.

### 2. Extract Phase Checklist Tasks
Find all documents with `type === "phase"` (e.g. `phase-1-<slug>.md`):
- Parse all checklist lines:
  - `- [ ]` or marked as todo -> **To Do**
  - `- [/]` or containing `in_progress` -> **In Progress**
  - `- [x]` or marked as done -> **Done**
- Calculate progress metrics:
  - $\text{Completion Rate} = \frac{\text{Done}}{\text{Total}} \times 100\%$
  - Generate visual ASCII progress bar: e.g. `[████████░░] 80% (8/10 Tasks)`

### 3. Generate Kanban Artifact
Use `write_to_file` to write `<appDataDir>\brain\<conversation-id>\plannic_kanban.md`:
- **ArtifactMetadata**:
  - `UserFacing`: `true`
  - `RequestFeedback`: `false`
  - `Summary`: "Plannic Kanban Task Board displaying active phase tasks across To Do, In Progress, and Done."

Structure of the artifact:
```markdown
# Kanban Task Board: [Plan Name]

> Active Phase: **[Phase Title]**  
> Overall Progress: **[████████░░] 80% (8/10 Tasks)**

---

### [IN PROGRESS] ([Count])
- [ ] **Task [ID]**: [Task title and module affected]

### [TO DO] ([Count])
- [ ] **Task [ID]**: [Task title and description]

### [DONE] ([Count])
- [x] **Task [ID]**: [Task title]

---

### Task Actions
- To move a task to in-progress or done, simply tell me:
  > *"Tolong pindahkan task [ID/Title] ke done"* (I will execute `move_task` for you).
- Re-run `/plannic-kanban` at any time to refresh this board.
```

### 4. Respond to User
Send a concise summary in chat highlighting current progress, what is currently in progress, and the next recommended task to tackle.
