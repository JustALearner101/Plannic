# @plannic/desktop

Local-first desktop application for Plannic, built with **Tauri 2**, **Svelte 5**, and **UnoCSS**.

## Features

- **Interactive Kanban Board**: Visual task management with real-time sync across `todo`, `in_progress`, and `done`.
- **Ghost Cursor & Ambient HUD**: Real-time visual feedback tracking autonomous AI agent activity via `.plannic/.agent_activity.json`.
- **Milestone Dependency Graph**: Interactive dependency visualization across execution phases.
- **In-App Auto-Updater**: Instant updates via Tauri 2 updater plugin and Minisign signatures.

## Development

```bash
# Run desktop in development mode (with hot module replacement)
bun run dev:desktop

# Run web view only (browser preview)
bun run dev:web

# Build production bundle
bun run build
```

## Architecture

- **Frontend**: SvelteKit / Svelte 5 (Runes) + UnoCSS (`apps/desktop/src/`)
- **Backend**: Rust + Tauri 2 (`apps/desktop/src-tauri/`)
- **IPC Layer**: Custom Tauri commands and events interfacing with `@plannic/fs`
