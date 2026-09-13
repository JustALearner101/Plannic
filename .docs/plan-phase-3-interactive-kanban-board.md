---
id: 9ab9151b-c1ed-48b2-8f16-d235556d7db7
plan: phase-3-interactive-kanban-board
type: plan
name: Phase 3 Interactive Kanban Board
slug: phase-3-interactive-kanban-board
version: '1.2'
status: draft
created: '2026-09-13T11:28:20.448Z'
lastUpdated: '2026-09-13T11:40:19.812Z'
tags: []
description: >-
  Papan Kanban interaktif berbasis Svelte 5 dan svelte-dnd-action dengan
  sinkronisasi langsung dua arah ke checklist markdown di file phase-N.md
mode: deep
documents:
  - plan-phase-3-interactive-kanban-board.md
  - scope-phase-3-interactive-kanban-board.md
  - feature-phase-3-interactive-kanban-board.md
  - phase-1-phase-3-interactive-kanban-board.md
  - limitation-phase-3-interactive-kanban-board.md
---
# Phase 3 Interactive Kanban Board

## Goal
Menghadirkan antarmuka papan visual Kanban interaktif berbasis `svelte-dnd-action` di Plannic Desktop untuk memetakan, melacak, dan mengelola eksekusi checklist implementasi dari file `phase-*.md` secara drag-and-drop dengan sinkronisasi dua arah langsung ke file markdown lokal, yang dapat digerakkan **baik oleh manusia (via UI) maupun oleh AI Agent (via MCP tool `move_task`)**, serta mendukung **Kolom Kustom**.

## Key Highlights
- **Dual-Actor Interactivity**: Task dapat digeser secara visual oleh manusia via drag & drop di desktop app, ATAU dimanipulasi secara otonom oleh AI agent saat mengerjakan kode menggunakan tool MCP `move_task`.
- **Default 3-Column + Custom Columns**: 3 kolom bawaan (`Todo`, `In Progress`, `Done`) ditambah tombol "+ Add Column" untuk membuat alur kustom (misal: "Review", "QA", "Blocked") yang dipetakan ke sintaks markdown fleksibel `- [custom_id]`.
- **Direct Markdown Checklist Sync**: Mengekstrak task langsung dari pola checklist `- [ ]`, `- [/]`, `- [x]`, `- [<status>]` dan memperbarui file disk seketika tanpa perantara database eksternal.
- **Fluid Drag & Drop (`svelte-dnd-action`)**: Animasi kartu yang halus, responsif, dan mendukung navigasi keyboard (Space, Arrows, Enter).
- **Hybrid Scope View**: Mode default per-plan aktif dengan opsi toggle ke **Global Project Aggregated View** untuk melihat seluruh task proyek dalam satu layar.
- **Unified View Switcher**: Navigasi instan antara `[📄 Docs]`, `[◈ Graph]`, dan `[⊞ Board]` melalui header atau shortcut keyboard `Ctrl+B` / `Cmd+B`.

## Document Index
- [Scope & Requirements](./scope-phase-3-interactive-kanban-board.md) — Problem statement, batasan in-scope, out-of-scope, dan definition of done.
- [Feature & Architecture Breakdown](./feature-phase-3-interactive-kanban-board.md) — Komponen frontend, tool MCP `move_task`, data model, regex parser & serializer, dan diagram urutan mermaid.
- [Phase 1 Implementation Roadmap](./phase-1-phase-3-interactive-kanban-board.md) — 4 milestone pengerjaan teknis mulai dari MCP move_task, dependency, custom column modal, hingga verifikasi dual-actor.
- [Technical Limitations & Trade-offs](./limitation-phase-3-interactive-kanban-board.md) — Keputusan desain arsitektur, trade-offs, dan penanganan format teks markdown.
