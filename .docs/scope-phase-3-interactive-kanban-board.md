---
id: 9f4d5e4c-ccba-4bc2-b69f-8f87c6266188
plan: phase-3-interactive-kanban-board
type: scope
name: Phase 3 Interactive Kanban Board — Scope
slug: phase-3-interactive-kanban-board
version: '1.3'
status: draft
created: '2026-09-13T11:28:20.448Z'
lastUpdated: '2026-09-13T11:39:56.052Z'
tags: []
description: Phase 3 Interactive Kanban Board — Scope for Phase 3 Interactive Kanban Board
---
# Phase 3: Interactive Kanban Board — Scope Specification

## 1. Problem Statement
Checklist implementasi pada file markdown `phase-N-<slug>.md` sangat ideal untuk dibaca oleh developer dan AI agent. Namun saat eksekusi proyek berjalan, memantau backlog secara linear dalam dokumen teks panjang terasa kaku dan kurang memberikan kejelasan progres harian.

Interactive Kanban Board menghadirkan representasi visual berbasis kartu (Card-based Task Tracker) dengan interaksi drag-and-drop antar-kolom yang dapat digerakkan **baik oleh manusia (via UI drag-and-drop) maupun oleh AI agent (via MCP tool `move_task` / `update_task`)**, dengan struktur kolom default 3-kolom serta kemampuan membuat **Kolom Kustom**.

---

## 2. In Scope (Phase 3 MVP)

### A. Dynamic & Custom Columns (Default 3-Column Workshop)
- **Default Columns**:
  1. **Todo**: Item checklist yang belum dikerjakan (`- [ ]`).
  2. **In Progress**: Item yang sedang aktif dikerjakan (`- [/]`).
  3. **Done**: Item yang telah selesai terverifikasi (`- [x]`).
- **Custom Column Creation**:
  - Tombol **"+ Add Column"** di toolbar kanban.
  - Dialog modal untuk memberi nama kolom (misal: "Review", "QA", "Blocked") dan color accent.
  - Kolom kustom disimpan pada frontmatter dokumen atau project config.
  - Representasi sintaks markdown untuk kolom kustom: format bracket fleksibel `- [review] Task` atau `- [qa] Task`.

### B. AI Agent Interactivity via MCP Tool (`move_task`)
- MCP Server mengekspos tool baru: **`move_task`**:
  - Parameter: `cwd`, `slug`, `phaseSlug`, `taskId` (atau index/judul task), `status` (kolom tujuan).
  - Memungkinkan AI agent (seperti Claude Code, AGY, dll.) untuk memindahkan status task secara otomatis saat mereka menyelesaikan implementasi (misal: memindahkan task dari `todo` -> `in_progress` -> `done`).
  - Desktop App mendeteksi perubahan file markdown dan merefleksikan posisi kartu realtime di kanvas Kanban.

### C. Human Interactivity (Drag-and-Drop via `svelte-dnd-action`)
- Pemanfaatan library `svelte-dnd-action` yang fluid dan native Svelte 5:
  - Drag-and-drop kartu antar-kolom dan re-order kartu.
  - Direct checkbox click: klik checkbox di kartu memindahkan langsung ke Done atau Todo.
  - Keyboard accessibility (Spacebar untuk pick up, panah untuk pindah kolom, Enter untuk drop).

### D. Two-way Markdown Synchronization
- **Parser**: Membaca file `phase-*.md`, memetakan item checklist `- [ ]`, `- [/]`, `- [x]`, dan `- [<custom>]` ke kartu kanban.
- **Serializer**: Perubahan posisi kartu (oleh user atau AI agent) langsung memperbarui penanda baris checklist markdown di disk dengan debouncing 1.5s aman.
- **Audit Trail**: Mencatat setiap perubahan status task ke `.docs/.history/plan-<slug>.jsonl`.

### E. Hybrid View Mode (Single Plan vs Global Aggregated)
- **Single Plan Mode (Default)**: Menampilkan task checklist dari Plan yang sedang dibuka, dengan filter dropdown antar-Phase.
- **Global Aggregated Mode**: Toggle tombol untuk merangkum seluruh task dari semua plan di project dalam satu papan terpadu.

### F. View Switcher Integration
- Opsi view ketiga pada segmented toggle di Header / Toolbar:
  - `[📄 Docs]` <-> `[◈ Graph]` <-> **`[⊞ Board]`**
- Shortcut keyboard global: **`Ctrl+B` / `Cmd+B`** untuk langsung membuka Kanban Board.

---

## 3. Out of Scope
- Estimasi story points yang rumit, time tracking, atau lampiran file biner besar.
- Sub-task nesting tak terbatas (dibatasi 1 level sub-bullet).
- Multi-tenant cloud synchronization.

---

## 4. Success Metrics & Definition of Done
1. **Agent & Human Parity**: Task dapat digerakkan secara fluid oleh user lewat drag & drop di desktop app DAN oleh AI agent lewat MCP tool `move_task`.
2. **Kustomisasi Kolom**: User dapat menambah kolom kustom baru dan kartu yang dimasukkan ke kolom tersebut tersimpan dengan sintaks markdown yang valid.
3. **Integritas Dokumen**: Tidak ada teks di luar checklist yang terhapus atau rusak saat sinkronisasi bolak-balik.
4. **Performa**: Drag-and-drop 60 FPS, sync disk <300ms setelah debounce.
