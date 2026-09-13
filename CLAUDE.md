# Plannic Codebase Guidelines & Agent Instructions

Plannic is a local-first project planning workbench consisting of an MCP server and a Tauri 2 desktop app with Svelte 5.

---

## Agent Behavior: Natural Language Planning Triggers

Whenever the user asks to plan a feature, create a PRD, design an architecture, or plan an implementation:
- Examples: *"tolong bikin plan untuk..."*, *"buat perencanaan teknis..."*, *"rencanakan arsitektur..."*, *"plan feature..."*, or `/plannic <initiative>`.
- **Do NOT** directly start writing code or scaffold ad-hoc documents without structure.
- **Trigger the Plannic 5-Step Grill Mode**:
  1. Call `get_config` from the Plannic MCP server to read `.plannic/config.md`.
  2. Ask 3–5 sharp clarifying questions to resolve scope boundaries, edge cases, and architectural trade-offs.
  3. Call `init_plan` with `mode: "deep"`.
  4. Call `update_document` to populate `scope`, `feature`, `phase`, and `limitation`.
  5. Summarize and invite the user to inspect the plan in the Plannic Desktop app.

---

## Project Structure

- `packages/core`: Shared TypeScript types, schemas (Zod), and constants.
- `packages/fs`: Filesystem layer for reading/writing Markdown plans, `.plannic/config.md`, `.docs/.history/*.jsonl`, and Fuse.js search.
- `apps/mcp-server`: MCP server exposing 7 stdio tools (`get_config`, `init_plan`, `get_plan`, `update_document`, `list_plans`, `search_plans`, `get_history`).
- `apps/desktop`: Tauri v2 + Svelte 5 desktop application (dark theme, Geist typography, three-column workbench).

---

## Common Commands

- **Install dependencies**: `bun install`
- **Typecheck all packages**: `bun run typecheck`
- **Run desktop in dev mode**: `bun run dev:desktop`
- **Build desktop app**: `bun run --filter @plannic/desktop build`
- **Compile Rust backend**: `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml`
- **Run MCP server**: `bun run --filter @plannic/mcp-server dev`
