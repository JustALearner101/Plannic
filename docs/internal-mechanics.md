# ⚙️ Plannic Internal Mechanics & Logic Guide (`docs/internal-mechanics.md`)

> **Deep-Dive into Realtime Activity Streams, Atomic Writes, Kanban Task State Transitions, and Sequential Gating**

This guide documents the engineering mechanics, internal algorithms, and concurrency safeguards that power Plannic's seamless collaboration between autonomous AI coding agents and human developers.

---

## 1. Realtime Ghost Cursor & Activity Synchronization

When an AI coding agent calls an MCP tool (e.g. `move_task`, `init_plan`, `update_document`), the desktop application immediately responds by glowing electric cyan (`#38bdf8`), animating a ghost cursor over the affected task card, and showing an activity status HUD.

### 1.1 The File-Tearing Problem & Atomic Writes
Because AI coding agents often execute multiple tool calls in rapid succession, writing directly to `.plannic/.agent_activity.json` would cause **file read tearing** (where the desktop app attempts to read and parse the file while the MCP process has only partially flushed the buffer, causing `SyntaxError: Unexpected end of JSON input`).

Plannic solves this through **Atomic File Replacement**:

```typescript
// packages/fs/src/activity.ts
export async function writeActivityEvent(cwd: string, event: AgentActivityEvent): Promise<void> {
  const targetPath = getActivityPath(cwd);
  const tempPath = `${targetPath}.tmp.${process.pid}.${Date.now()}`;

  const payload: AgentActivityFile = {
    version: "1.0",
    lastUpdated: new Date().toISOString(),
    currentEvent: event,
  };

  // 1. Write completely to unique temporary file
  await fs.writeFile(tempPath, JSON.stringify(payload, null, 2), "utf-8");

  // 2. Atomic rename at the OS kernel level (guaranteed atomic on POSIX & Windows NTFS)
  await fs.rename(tempPath, targetPath);
}
```

### 1.2 Event Payload Contract (`AgentActivityEvent`)
```typescript
export interface AgentActivityEvent {
  id: string;                      // UUID of the event
  timestamp: string;               // ISO 8601 UTC
  toolName: string;                // e.g. "move_task", "update_document"
  agentName: string;               // e.g. "Claude Code", "Antigravity", "Cursor"
  targetSlug?: string;             // Slug of affected plan, ADR, or spec
  targetDocType?: string;          // "plan", "scope", "feature", "phase", "limitation"
  taskIdentifier?: string;         // Title substring or identifier of target task
  phaseSlug?: string;              // Target phase (e.g. "phase-1")
  actionSummary: string;           // Human-readable action description
  status: "started" | "completed" | "failed";
}
```

### 1.3 Desktop Visual HUD & Decay Lifecycle
The desktop app (`apps/desktop/src/lib/stores/agentActivity.svelte.ts`) listens via filesystem watcher. Upon receiving an event:
1. **Trigger Glow**: Sets state to `active`, causing the desktop border to glow `#38bdf8`.
2. **Move Cursor**: Translates the Ghost Cursor badge to the DOM coordinates of the target task card or document item.
3. **Decay Timer**: If no subsequent events arrive within **3,500ms**, the HUD gently fades back to the default monochrome palette (`#0F1117`).

---

## 2. Markdown Kanban Task State Engine

Plannic does not use an external database for task tracking. All task states are parsed and modified directly within Markdown milestone phase documents (`.docs/plans/<slug>/phase-*.md`).

### 2.1 Task Checkbox Formats
Plannic recognizes and parses standard GitHub Flavored Markdown checklist syntax:
- `todo`: `- [ ] Task title`
- `in_progress`: `- [/] Task title` or `- [-] Task title`
- `done`: `- [x] Task title` or `- [X] Task title`

### 2.2 Surgical Regex Replacement (`moveTask`)
When `move_task(slug, taskIdentifier, newStatus)` is called, Plannic executes a non-destructive regex replacement that preserves all neighboring markdown indentation, sub-bullets, and trailing notes:

```typescript
// packages/fs/src/tasks.ts
const taskRegex = new RegExp(
  `^([ \\t]*-[ \\t]*\\[)([ xX\\/-]?)([\\]][ \\t]*.*?${escapeRegExp(taskIdentifier)}.*?)$`,
  "m"
);

// Translates target status:
// "todo"        => "[ ]"
// "in_progress" => "[-]"
// "done"        => "[x]"
```

### 2.3 Strict Kanban Sequential Gating (`strict_kanban: true`)
When `ruleset.strict_kanban` is enabled in `.plannic/config.md`:
1. Plannic inspects all preceding phase documents (e.g. `phase-1.md` before `phase-2.md`).
2. If any unfinished tasks (`- [ ]` or `- [-]`) exist in Phase $N-1$, an agent attempting to mark a task in Phase $N$ as `done` will be rejected or prompted to complete preceding milestones first.
3. This guarantees that implementation follows structured architectural dependencies.

---

## 3. Append-Only Audit Trail & Version Snapshots

Every mutating operation in Plannic (`update_document`, `move_task`, `update_spec`) creates an immutable audit trail entry in `.docs/.history/<slug>.jsonl`.

### 3.1 History Entry Schema
```json
{
  "timestamp": "2026-09-19T14:45:46.000Z",
  "type": "updated",
  "version": "1.2",
  "summary": "Moved task Task 1.1 to done",
  "changedBy": "claude-code",
  "document": "phase-1.md",
  "docType": "phase"
}
```

### 3.2 Immutability Guarantees
- Plannic **only appends** lines to `.docs/.history/<slug>.jsonl`.
- If an agent hallucinated or mistakenly deleted a document section, human developers can call `get_history(slug)` or inspect the `.jsonl` file directly to retrieve exact previous document snapshots.

---

## 4. Architecture Decision Records (ADRs) Sequence Engine

ADRs in `.docs/adrs/` follow the MADR (Markdown Architectural Decision Records) standard with sequential numbering:

1. **Auto-Numbering**: `init_adr` scans all existing files in `.docs/adrs/` matching `adr-(\\d{4})-.*\\.md`. It parses the highest integer, adds 1, and zero-pads the result (e.g. `adr-0005-my-decision.md`).
2. **Superseding Links**: When an architectural decision is replaced, Plannic updates the original ADR's frontmatter (`status: superseded`, `supersededBy: 5`) and links the new ADR (`supersedes: 2`), preserving an unbroken historical lineage of architectural evolution.

---

## 5. Living System Specifications Engine

Specifications in `.docs/specs/` document module interfaces, schemas, and contracts.

1. **Status Lifecycle**:
   - `draft`: Specification is under authoring or review.
   - `living`: Active system contract. Any breaking API or schema changes must be updated here.
   - `deprecated`: Replaced by a newer specification or retired module.
2. **Semantic Versioning**: Every call to `update_spec` increments the specification's version (`1.0` -> `1.1`) and records who initiated the change in the frontmatter metadata.
