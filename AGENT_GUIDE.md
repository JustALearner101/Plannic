# 🤖 Plannic AI Agent Guide (`AGENT_GUIDE.md`)

> **Welcome, AI Coding Agent!**
> This document is designed specifically for autonomous AI agents (Antigravity, Claude Code, Cursor, Windsurf, Roo Code, etc.) and human developers. Follow this guide when asked to **"setup the project"**, **"develop a new feature"**, **"run tests"**, or **"build installers"**.

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
To connect Plannic MCP tools to the user's AI client, ensure the following configuration is registered:

#### For Antigravity / Claude Code / Cursor (`.mcp.json`):
```json
{
  "mcpServers": {
    "plannic": {
      "command": "bun",
      "args": ["run", "D:/Project/Plannic/apps/mcp-server/src/index.ts"]
    }
  }
}
```
*Or using the precompiled binary:*
```json
{
  "mcpServers": {
    "plannic": {
      "command": "D:/Project/Plannic/release/plannic-mcp.exe",
      "args": []
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
│   ├── core/                  # Shared Zod schemas, TypeScript types, and path constants
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

## 3. Plannic Planning & Architecture Protocols (Mandatory for Agents)

When the user asks to plan a feature or design an architecture:

1. **Inspect Existing ADRs & Specs**:
   - Call `list_adrs` / `get_adr` to respect accepted architectural decisions.
   - Call `list_specs` / `get_spec` to review system contracts.
2. **Check Workspace Configuration**:
   - Call `get_config` to read `.plannic/config.md` for tech stack, language, and rule enforcement.
3. **Trigger Structured Interview**:
   - Ask 3–5 sharp questions to resolve scope boundaries, edge cases, and tech trade-offs.
4. **Initialize Plan & Populate Documents**:
   - Call `init_plan(mode="deep")`.
   - Call `update_document` for `scope`, `feature`, `phase`, and `limitation`.
5. **Dual Projection**:
   - Project the plan into an Antigravity Artifact (`<brain>/plannic_plan_<slug>.md`) with `RequestFeedback: true` so the user can review and approve it.
   - Keep tasks `- [x]` in sync across `.docs/plans/<slug>/phase-1.md` and the artifact via `move_task`.

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

### 2. Compile MCP Server Binary (.exe)
```bash
bun build --compile apps/mcp-server/src/index.ts --outfile release/plannic-mcp.exe
```

---

## 6. Troubleshooting for AI Agents

1. **`EPERM: operation not permitted` when overwriting `plannic-mcp.exe`**:
   - Windows locks active `.exe` files. If the MCP server is currently running in your editor/IDE, output the new binary to `release/plannic-mcp.exe` or kill the running process first.
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
2. Compiles standalone `plannic-mcp.exe`.
3. Invokes `tauri-apps/tauri-action` to build signed Windows `.exe`, `.msi`, and signs `latest.json` with the repository secret `TAURI_SIGNING_PRIVATE_KEY`.
4. Uploads all assets to GitHub Releases.

