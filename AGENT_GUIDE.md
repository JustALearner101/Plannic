# 🤖 Plannic AI Agent Guide (`AGENT_GUIDE.md`)

> **Welcome, AI Coding Agent!**
> This document is designed specifically for autonomous AI agents (*Claude Code, Antigravity, Cursor, Windsurf, Roo Code, OpenCode*, etc.) and human developers. Follow this guide when asked to **"setup the project"**, **"develop a new feature"**, **"run tests"**, or **"build installers"**.

---

## 1. Quick One-Shot Setup (Agent Runbook)

When the user says *"tolong setupin Plannic dong"* or *"setup this repository"*, execute the following steps in order:

### Step 1: Install Dependencies
Plannic uses **Bun** as its package manager and monorepo workspace engine:
```bash
bun install
```

### Step 2: Verify Monorepo Type Safety & Tests
Ensure that the workspace compiles cleanly without errors:
```bash
bun run typecheck
bun run test:all
```
*(Expected: `svelte-check found 0 errors and 0 warnings`, and `5/5 test suites passed`).*

### Step 3: Register MCP Server in AI Config
To connect Plannic MCP tools to your AI client, register the following server configuration in your MCP settings (e.g. `.mcp.json` or client settings):

#### 🌟 Primary / Recommended (Universal Production Binary):
Works out of the box on any machine with the `plannic` binary on PATH:
```json
{
  "mcpServers": {
    "plannic": {
      "command": "plannic",
      "args": ["mcp"]
    }
  }
}
```

#### 🛠️ Secondary: Monorepo Development from Source (Contributors only):
When actively hacking directly on the Plannic source code inside this monorepo:
```json
{
  "mcpServers": {
    "plannic": {
      "command": "bun",
      "args": ["run", "./apps/mcp-server/src/index.ts"]
    }
  }
}
```

---

## 2. Monorepo Architecture Overview

Plannic is organized as a Bun monorepo composed of shared packages and application surfaces:

```text
Plannic/
├── packages/
│   ├── core/                  # Shared Zod schemas, TypeScript types, paths & activity schemas
│   └── fs/                    # Local filesystem engine, readers, writers, activity stream, migrators
├── apps/
│   ├── desktop/               # Tauri 2 + Svelte 5 desktop GUI (Kanban, Ghost Cursor, Graph, Editor)
│   ├── mcp-server/            # Model Context Protocol stdio server exposing 19 tools & resources
│   └── cli/                   # OpenTUI-powered interactive terminal interface
├── .docs/                     # Universal Architecture & Planning system of record
│   ├── plans/<slug>/          # Hierarchical multi-document plans (plan.md, scope.md, feature.md, phase-*.md, limitation.md)
│   ├── adrs/                  # Architectural Decision Records (e.g. ADR #0001, ADR #0002)
│   └── specs/                 # Living system specifications & API contracts
├── .plannic/                  # Workspace configuration (.plannic/config.md) & local activity stream (.agent_activity.json)
└── release/                   # Distribution binaries (.exe installers, standalone app, mcp binary)
```

---

## 3. Plannic Architecture & Workflow Enforcement Engine (Universal Agent Guidelines)

Plannic is not merely a utility or a collection of scripts—it is an **Opinionated Architecture & Workflow Enforcement System**. It ensures that all architecture knowledge (ADRs, Living Specs, and Phased Execution Plans) lives in one universal location with a consistent format governed by a single configuration file (`.plannic/config.md`).

### 3.1 Understanding the Architectural Distinction: Ephemeral Scratchpads vs. Persistent Single Source of Truth

Every modern AI coding agent has an internal, in-session reasoning loop or task scratchpad (for example: Claude Code's scratchpad, Cursor's context window, or Antigravity's native `/plan`):

- **Agent In-Session Scratchpads (Ephemeral)**: Designed for single-turn or short-lived task reasoning. They live only in prompt context or agent memory and vanish across sessions, teammates, or model switches.
- **Plannic (`.docs/` & `.plannic/config.md`) (Persistent System of Record)**: Designed for multi-session repository architecture, living API contracts, formal Architecture Decision Records (ADRs), and multi-phase implementation roadmaps committed directly into Git.

> [!TIP]
> **Coexistence Rule**: Plannic never attempts to replace or collide with an agent's internal turn-by-turn thinking. Instead, Plannic **anchors** the agent to repository truth:
> - **For Antigravity users**: Plannic activates when managing `.docs/` or invoking `/plannic*` commands, leaving native `/plan` for transient agent planning.
> - **For Claude Code, Cursor, Windsurf, & Roo Code users**: Plannic provides deterministic MCP tools (`get_config`, `get_spec`, `list_adrs`, `get_plan`, `move_task`) so the agent never designs architecture in a vacuum or loses track of multi-phase progress.

### 3.2 Human-in-the-Loop Workflow Enforcement (`enforce_feedback_artifact: true`)

Under `.plannic/config.md`, the `enforce_feedback_artifact: true` rule is active by default. This is Plannic's core safety and quality differentiator:

- **No Unilateral Code Alterations**: When an AI agent plans a feature or initiates a major refactoring, it is strictly forbidden from silently writing code without first presenting a structured architectural proposal or verification plan to the human engineer.
- **Phase Transition Approval**: An agent cannot advance to the next implementation phase (`advance_phase`) without explicit user review of completed deliverables and acceptance criteria.
- **Auditability**: Every architectural decision and document modification is tracked with an immutable changelog in `.docs/.history/`.

### 3.3 Agent Planning Protocol (Step-by-Step)

When the user asks to plan, architect, or implement a feature using Plannic:

1. **Inspect Existing ADRs & Specs**:
   - Call `list_adrs` / `get_adr` to respect accepted architectural decisions.
   - Call `list_specs` / `get_spec` to review system contracts.
2. **Read Workspace Configuration & Rules**:
   - Call `get_config` to read `.plannic/config.md` for tech stack, language preference, and active guardrails (`ruleset`).
3. **Structured Clarification & Scoping**:
   - Ask 3–5 sharp questions to resolve scope boundaries, edge cases, and tech trade-offs before generating code.
4. **Initialize Plan & Populate Documents**:
   - Call `init_plan(name=..., mode="deep")`.
   - Call `update_document` for `scope`, `feature`, `phase`, and `limitation`.
5. **Phase Execution & Progress Persistence**:
   - As tasks complete, persist progress immediately by calling `move_task(slug, taskIdentifier, "done")`.
   - Sync real-time progress to `.docs/plans/<slug>/phase-*.md`.

### 3.4 Workspace Configuration Schema Reference (`.plannic/config.md`)

The `.plannic/config.md` file serves as the single source of truth for repository rules and agent behaviors. It consists of YAML frontmatter followed by Markdown context.

#### Frontmatter Fields:

| Field | Type | Default | Required | Description |
| :--- | :--- | :--- | :---: | :--- |
| `project` | `string` | Directory name | **Yes** | Human-readable name of the project. |
| `stack` | `string[]` \| `string` | `[]` | **Yes** | Technologies, frameworks, and tools used (e.g. `[Tauri, Svelte 5, TypeScript, Bun, Rust]`). |
| `default_mode` | `"quick"` \| `"deep"` | `"deep"` | No | Default plan structure. `"quick"` creates a single-file plan; `"deep"` generates a document tree (`plan.md`, `scope.md`, `feature.md`, `phase-*.md`, `limitation.md`). |
| `lang` | `string` | `"id"` / `"en"` | No | Language code for generated plans and communication. |
| `generated_docs` | `GeneratedDocConfig[]` | *Standard 5 docs* | No | Blueprints of documents generated during deep plan initialization. |
| `ruleset` | `RulesetConfig` | *See below* | No | Workflow enforcement rules and guardrails. |

#### `ruleset` Options:

| Rule | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `strict_kanban` | `boolean` | `true` | Enforces sequential phase progression and strict task states (`todo` -> `in_progress` -> `done`). |
| `auto_changelog` | `boolean` | `true` | Automatically appends audit trail entries to `.docs/.history/` on every document update. |
| `max_phases_recommended` | `number` | `5` | Maximum recommended phases before warning about excessive plan complexity. |
| `enforce_feedback_artifact` | `boolean` | `true` | **Workflow Enforcement**: Requires AI agents to generate a reviewable plan artifact and request user approval before making changes. |
| `plans_dir` | `string` | `".docs/plans"` | Relative path to plans directory. |
| `phase_pattern` | `string` | `"phase-{n}.md"` | Naming convention for milestone phase files. |

#### `generated_docs` Item Schema:

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `type` | `"plan"` \| `"scope"` \| `"feature"` \| `"phase"` \| `"limitation"` | — | Document category. |
| `filename` | `string` | — | Target filename (e.g. `scope.md`). |
| `title` | `string` | — | Human-readable title of the document. |
| `required` | `boolean` | `true` | Whether this document is required during deep plan initialization. |
| `description` | `string` | — | Guidance text for the AI agent when generating this document. |
| `template` | `string` | — | Optional custom template path or raw markdown content. |

#### Markdown Body:
- `## Context`: High-level domain context, architecture patterns, and developer personas for the project. Read by AI agents via `get_config`.
- `## Planning Rules`: Mandatory architectural guidelines, coding principles, and guardrails the agent must follow.

---

## 4. Development & Runtime Commands

| Task | Command | Description |
| :--- | :--- | :--- |
| **Run Desktop (Dev)** | `bun run dev:desktop` | Launches Tauri 2 desktop app with hot reload |
| **Run Desktop (Web only)** | `bun run dev:web` | Fast browser-only Svelte 5 dev server on port 5173 |
| **Run MCP Server** | `bun run dev:mcp` | Runs stdio MCP server for testing |
| **Run CLI Workbench** | `bun run plan` | Launches terminal OpenTUI planning interface |
| **Typecheck Monorepo** | `bun run typecheck` | Validates TypeScript & Svelte across all packages |
| **Run Unit Tests** | `bun run test:all` | Runs all 5 package unit test suites |
| **Run E2E Tests** | `bun run test:e2e` | Runs all 7 Playwright & stability benchmark suites |

---

## 5. Building Releases & Installers

To build the latest Windows executables and installers:

### 1. Build Desktop Application & Setup Installer (.exe & .msi)
```bash
# Builds frontend and invokes Tauri 2 to compile Rust backend and NSIS/MSI bundles
bun run --filter @plannic/desktop tauri -- build
```
- **NSIS Installer**: `apps/desktop/src-tauri/target/release/bundle/nsis/plannic_<version>_x64-setup.exe`
- **MSI Installer**: `apps/desktop/src-tauri/target/release/bundle/msi/plannic_<version>_x64_en-US.msi`
- **Standalone Executable**: `apps/desktop/src-tauri/target/release/app.exe`

### 2. Compile Unified CLI (.exe)
```bash
bun run build:plannic
```

---

## 6. Troubleshooting for AI Agents

1. **Windows locks the unified executable**:
   - If `plannic.exe` is running in an editor/IDE, stop it before rebuilding.
2. **Playwright E2E Test execution**:
   - Always run with `--config e2e/playwright.config.ts` or via `bun run test:e2e`. This automatically spins up the internal SvelteKit webServer at `http://localhost:5173`.
3. **Local File Watching in Activity Stream**:
   - Desktop communicates with MCP server via `.plannic/.agent_activity.json`. Writes must be atomic (write to temporary file then rename) to prevent JSON read tearing during high-frequency events.

---

## 7. In-App Auto-Updater & Automated Releases

Plannic Desktop features a zero-touch in-app Auto-Updater backed by Tauri 2 and GitHub Releases:

### Architecture:
- **Manifest**: `https://github.com/JustALearner101/Plannic/releases/latest/download/latest.json`
- **Public Key**: Configured in `apps/desktop/src-tauri/tauri.conf.json` under `plugins.updater.pubkey`.
- **Frontend Store**: `apps/desktop/src/lib/stores/updater.svelte.ts` checks on startup and exposes reactive status (`available`, `downloading`, `ready`, `error`).
- **Notification Toast**: `apps/desktop/src/lib/components/ui/UpdateNotificationToast.svelte` provides visual download progress and "Update & Restart" one-click action.

### Triggering a New Release:
1. **Bump Version across Monorepo**:
   ```bash
   bun run bump patch   # e.g. 0.2.0 -> 0.2.1
   # atau: bun run bump minor (0.2.0 -> 0.3.0)
   # atau: bun run bump 0.2.5
   ```
2. **Commit & Push Tag**:
   ```bash
   git commit -am "chore: release v0.2.1"
   git tag v0.2.1
   git push origin main --tags
   ```
The workflow:
1. Runs `bun run typecheck` and `bun run test:all`.
2. Compiles the unified `plannic.exe` with TUI, headless JSON, and MCP modes.
3. Invokes `tauri-apps/tauri-action` to build signed Windows `.exe`, `.msi`, and signs `latest.json` with the repository secret `TAURI_SIGNING_PRIVATE_KEY`.
4. Uploads all assets to GitHub Releases.
