---
id: 93073b4d-7c42-4161-97c0-985a56290e8b
plan: phase-2-node-graph-view
type: phase
name: Phase 2 Node Graph View — Phase 1
slug: phase-2-node-graph-view
version: '1.2'
status: draft
created: '2026-09-13T10:11:36.485Z'
lastUpdated: '2026-09-13T10:57:48.132Z'
tags: []
description: Phase 2 Node Graph View — Phase 1 for Phase 2 Node Graph View
---
# Phase 2: Node Graph View — Implementation Roadmap & Milestones

## Milestone 1: Dependency Setup & Foundation
- [x] **Install `@xyflow/svelte`**:
  - Jalankan `bun add @xyflow/svelte` di workspace `apps/desktop`.
  - Pastikan kompatibilitas penuh dengan Svelte 5 (Runes) dan Vite 6.
- [x] **Data Types**:
  - Definisikan interface `PlanNodeData`, `PlanFlowNode`, dan `PlanFlowEdge` di `apps/desktop/src/lib/types/graph.ts`.
- [x] **CSS Setup**:
  - Impor stylesheet bawaan Svelte Flow (`@xyflow/svelte/dist/style.css`).
  - Override CSS variables Svelte Flow agar menyatu sempurna dengan token tema gelap Plannic (`--xy-edge-stroke`, `--xy-node-background`, dll).

---

## Milestone 2: Custom Node & Graph Canvas Engine
- [x] **Custom Node Component (`PlanNode.svelte`)**:
  - Buat layout node 200px dengan padding 10px 14px.
  - Tambahkan handle input (kiri) dan output (kanan) dengan styling minimalis.
  - Render ikon tipe dokumen, nama dokumen, dan status badge.
  - Implementasi selected state border `var(--accent)`.
- [x] **Auto-Layout Topology Engine (`graph.svelte.ts`)**:
  - Bangun fungsi `buildFromPlan(plan: Plan)` yang memetakan:
    - Root Plan -> Level 0
    - Scope, Features, Limitations -> Level 1
    - Phases -> Level 2
  - Buat edge connections dengan tipe `smoothstep` atau `bezier`.
- [x] **Main Canvas (`GraphCanvas.svelte`)**:
  - Bungkus `<SvelteFlow>` dengan `<Background gap={24} size={1} patternColor="#222430" />`.
  - Pasang `<Controls>` di pojok kiri bawah dengan tema monochrome.
  - Pasang `<MiniMap>` di pojok kanan bawah.

---

## Milestone 3: Slide-over Drawer & Quick Inspector
- [x] **Component `SlideOverDrawer.svelte`**:
  - Buat panel sliding 420px di sisi kanan canvas dengan animasi transisi CSS halus.
  - Tampilkan header dengan nama dokumen, status, dan tombol close `✕` / `Escape`.
- [x] **Tab Preview & Editor**:
  - Tab "Preview": render `MarkdownPreview.svelte`.
  - Tab "Edit": render `CodeMirrorEditor.svelte` dengan auto-save terhubung ke `plansStore`.
- [x] **Realtime Node Update**:
  - Saat dokumen disimpan di drawer, otomatis perbarui label status dan versi pada node di canvas.

---

## Milestone 4: Header View Switcher & DX Polish
- [x] **View Switcher di Header/Toolbar**:
  - Tambahkan segmented switch: `[📄 Docs]` <-> `[◈ Graph]` di toolbar utama.
  - Tangani transisi tampilan di `apps/desktop/src/routes/+page.svelte`.
- [x] **Keyboard Shortcut**:
  - Tangkap `Ctrl+G` / `Cmd+G` untuk toggle antar view mode secara global.
  - Tangkap `Escape` untuk menutup Slide-over Drawer.
- [x] **Build & Performance Testing**:
  - Jalankan `bun run typecheck` (0 errors).
  - Jalankan `bun run --filter @plannic/desktop build` (sukses).
