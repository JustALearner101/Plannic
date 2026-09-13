---
project: Plannic
stack: [Tauri, Svelte 5, TypeScript, Bun, Rust]
default_mode: deep
lang: id
---

## Context
Plannic adalah workshop tool / personal productivity tool untuk structured project planning
menggunakan kombinasi Model Context Protocol (MCP) dan Tauri desktop app.
Dibuat untuk solo developer / AI engineer (Atar) yang mengelola multiple projects bersama AI agent.

## Planning Rules
- Zero bloat, workshop tool aesthetic (monochrome ketat, border 1px, zero dekorasi berlebih)
- High cohesion & modular packages: `packages/core`, `packages/fs`, `apps/mcp-server`, `apps/desktop`
- Dokumentasi berbasis document tree: Quick Mode (1 file) atau Deep Mode (plan, scope, feature, phase, limitation)
- Selalu rekam changelog ke `.docs/.history/plan-<slug>.jsonl` untuk setiap perubahan dokumen
