---
id: 412c8b58-0743-49f0-8957-7cf5964f4df5
plan: phase-3-interactive-kanban-board
type: phase
name: Phase 3 Interactive Kanban Board — Phase 1
slug: phase-3-interactive-kanban-board
version: '3.0'
status: draft
created: 2026-09-13T11:28:20.448Z
lastUpdated: '2026-09-13T12:05:42.229Z'
tags: []
description: ''
---
# Phase 3: Interactive Kanban Board — Implementation Roadmap & Milestones

## Milestone 1: MCP Tool `move_task` & Core Engine (AI Agent Interactivity)
- [x] **Core Schema (`packages/core`)**:
  - Definisikan `MoveTaskInputSchema` di `packages/core/src/schemas.ts` dan tipe terkait di `types.ts`.
- [x] **Filesystem Engine (`packages/fs`)**:
  - Buat fungsi `moveTask(cwd, slug, taskIdentifier, newStatus, comment)` di `packages/fs/src/tasks.ts`.
  - Parsing dan replace baris checklist markdown (`- [ ]`, `- [/]`, `- [x]`, `- [custom]`).
  - Rekam audit log ke `.docs/.history/plan-<slug>.jsonl`.
- [x] **Tool MCP (`apps/mcp-server`)**:
  - Register tool `move_task` di `apps/mcp-server/src/tools/move-task.ts`.
  - Recompile `plannic-mcp.exe`.

---

## Milestone 2: Desktop Dependency & State Store (`board.svelte.ts`)
- [x] **Install `svelte-dnd-action`**:
  - Jalankan `bun add svelte-dnd-action --cwd apps/desktop`.
- [x] **Tipe Data (`apps/desktop/src/lib/types/board.ts`)**:
  - Interface `KanbanTask`, `KanbanColumnData`, `TaskStatus`.
- [x] **State Store `board.svelte.ts`**:
  - Default 3 kolom: `todo`, `in_progress`, `done`.
  - Fungsi `addColumn(title: string, id?: string)` untuk membuat kolom kustom.
  - Parsing task dari dokumen `phase-*.md` aktif dengan regex fleksibel.
  - Serialization dan auto-save debounced (1.5s idle) ke disk.

---

## Milestone 3: Kanban UI Components & Custom Column Modal
- [x] **`KanbanCard.svelte`**:
  - Card layout bertema workshop (`#181A24`, border 1px).
  - Checkbox klik langsung untuk toggle cepat.
  - Badge origin saat mode global aktif.
- [x] **`KanbanColumn.svelte`**:
  - Integrasi directive `use:dndzone` dari `svelte-dnd-action`.
  - Header kolom dengan counter badge dan tombol hapus jika kolom kustom.
  - Visual dropzone placeholder.
- [x] **`AddColumnModal.svelte`**:
  - Modal input untuk menambah kolom kustom baru (nama kolom, status id).
- [x] **`BoardToolbar.svelte`**:
  - Filter phase dokumen ("All Phases", "Phase 1", dst.).
  - Toggle segmented button: `[Single Plan]` vs `[Global Project]`.
  - Tombol "+ Add Column".
- [x] **`KanbanBoard.svelte`**:
  - Kontainer 3 kolom default + kolom-kolom kustom yang ditambahkan user.
  - Scroll horizontal halus jika kolom banyak.

---

## Milestone 4: Header Switcher & Verification (Dual-Actor Testing)
- [x] **Header Switcher Integration**:
  - Tambahkan opsi ketiga pada view switcher di `Header.svelte`: `[📄 Docs] | [◈ Graph] | [⊞ Board]`.
  - Shortcut keyboard `Ctrl+B` / `Cmd+B`.
  - Render kondisional di `apps/desktop/src/routes/+page.svelte`.
- [x] **Verifikasi Human Drag-and-Drop**:
  - Drag kartu antar-kolom di Desktop App, pastikan file markdown ter-update.
- [x] **Verifikasi AI Agent via MCP**:
  - Panggil tool MCP `move_task` dari agent, pastikan kartu di Desktop App otomatis berpindah posisi.
- [x] **Build & Typecheck**:
  - `bun run typecheck` across all packages (0 errors).
  - `bun run --filter @plannic/desktop build` (sukses).
