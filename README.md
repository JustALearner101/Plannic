# Plannic

Internal planning tool berbasis desktop + MCP server untuk merencanakan proyek secara terstruktur langsung dari AI coding agent (Claude Code, Codex, dll).

## Monorepo Structure

- `packages/core`: Shared TypeScript interfaces and Zod validation schemas
- `packages/fs`: File system operations for `.docs/` reading, writing, history, and search
- `apps/mcp-server`: MCP server implementing 6 tools over stdio
- `apps/desktop`: Tauri 2 + Svelte 5 desktop app for browsing and editing PRDs

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) >= 1.2
- [Rust & Cargo](https://rustup.rs/) (for Tauri desktop app)

### Install Dependencies
```bash
bun install
```

### Run MCP Server
```bash
bun run dev:mcp
```

### Run Desktop App
```bash
bun run dev:desktop
```
