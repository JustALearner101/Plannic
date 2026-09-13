---
id: 665c3c44-099d-470e-801c-486de8196829
plan: phase-3-interactive-kanban-board
type: limitation
name: Phase 3 Interactive Kanban Board — Limitations
slug: phase-3-interactive-kanban-board
version: '1.1'
status: draft
created: '2026-09-13T11:28:20.448Z'
lastUpdated: '2026-09-13T11:29:00.000Z'
tags: []
description: >-
  Phase 3 Interactive Kanban Board — Limitations for Phase 3 Interactive Kanban
  Board
---
# Phase 3: Interactive Kanban Board — Technical Limitations & Trade-offs

## 1. Trade-offs & Decisions Made

### A. Direct Markdown Parsing vs Dedicated Database / JSON
- **Keputusan**: Mengambil dan menyinkronkan task langsung dari baris checklist markdown di file `phase-*.md` alih-alih menggunakan SQLite atau database internal.
- **Konsekuensi**: Sangat bersih dan mematuhi prinsip **Local Markdown as Single Source of Truth**. Developer atau AI agent bisa langsung mengubah checklist dari editor teks apa pun tanpa takut database desync. Namun, parser harus ekstra teliti saat mereplace baris teks agar tidak merusak format markdown di sekitarnya.

### B. 3 Kolom Tetap vs Dynamic Columns
- **Keputusan**: Membatasi board pada 3 kolom inti: `Todo`, `In Progress`, dan `Done`.
- **Konsekuensi**: Mencegah bloat antarmuka dan menjaga kesederhanaan workshop tool. Status secara langsung merefleksikan checkbox CommonMark (`- [ ]`, `- [/]`, `- [x]`).

---

## 2. Technical Constraints

### A. Checklist Syntax Conventions
- Parser mengandalkan format standar CommonMark:
  - `- [ ]` untuk Todo
  - `- [/]` atau tag `[wip]` untuk In Progress
  - `- [x]` atau `- [X]` untuk Done
- Format tidak standar (seperti `* [ ]` atau `1. [ ]`) akan di-support secara best-effort dengan konversi otomatis ke list dash.

### B. Concurrent External Editing
- Jika file markdown diedit dari luar aplikasi (misalnya via VS Code atau git rebase) tepat saat drag-and-drop sedang berlangsung di Desktop App, auto-save desktop app akan menggunakan snapshot konten terakhir. Menggunakan tombol **↻ Refresh** di header direkomendasikan jika terjadi perubahan eksternal besar.

### C. Re-ordering Persistence
- Memindahkan kartu antar-kolom akan mengubah penanda checkbox baris bersangkutan. Namun, menggeser urutan kartu dalam satu kolom yang sama tidak serta merta memindahkan posisi baris secara fisik di file markdown demi menjaga urutan kronologis asli di dokumen.
