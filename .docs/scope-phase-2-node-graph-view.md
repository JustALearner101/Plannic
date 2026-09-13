---
id: 60a54265-df6a-46b9-b606-7b9efd01ae35
plan: phase-2-node-graph-view
type: scope
name: Phase 2 Node Graph View — Scope
slug: phase-2-node-graph-view
version: '1.2'
status: draft
created: '2026-09-13T10:11:36.485Z'
lastUpdated: '2026-09-13T10:48:52.284Z'
tags: []
description: Phase 2 Node Graph View — Scope for Phase 2 Node Graph View
---
# Phase 2: Node Graph View — Scope Specification

## 1. Problem Statement
Membaca rencana proyek yang panjang secara teks linear sering kali menyulitkan developer dan AI agent untuk memahami keterkaitan hierarkis antar-komponen, batasan teknis, dan tahapan implementasi secara sekilas. 

Node Graph View menghadirkan antarmuka kanvas visual interaktif (2D visual workbench) yang memetakan struktur dokumen Plannic menjadi pohon ketergantungan relasional yang mudah dieksplorasi secara visual.

---

## 2. In Scope (Phase 2 MVP)

### A. Graph Rendering & Canvas (@xyflow/svelte)
- Integrasi library `@xyflow/svelte` (Svelte Flow) yang kompatibel dengan Svelte 5 (Runes).
- Infinite canvas dengan dukungan:
  - Panning halus (mouse drag / spacebar + drag).
  - Zooming halus (wheel zoom / pinch gesture).
  - Kontrol kanvas: Zoom in, Zoom out, Fit View, dan MiniMap semi-transparan di pojok kanan bawah.
  - Background kanvas: Dot grid halus bertema monochrome workshop (`--base-border-hi`).

### B. Single Plan Tree Topology & Auto-Layout
- Visualisasi hierarki 1 Plan aktif:
  - **Kolom Kiri (Root)**: Dokumen Plan utama (`plan-<slug>.md`).
  - **Kolom Tengah (Specifications)**: `Scope` (`scope-<slug>.md`), `Features` (`feature-<slug>.md`), dan `Limitations` (`limitation-<slug>.md`).
  - **Kolom Kanan (Execution)**: `Phase 1` (`phase-1-<slug>.md`) dan fase-fase berikutnya.
- Auto-layout otomatis menggunakan algoritma hierarkis (Dagre layout) sehingga susunan node selalu rapi secara deterministik tanpa konfigurasi manual.
- Node dapat digeser posisinya secara bebas oleh user di kanvas (interactive dragging) dengan posisi visual lokal.

### C. Node Anatomy & Design System
- Desain komponen custom node yang mematuhi design token `GUI.md`:
  - Lebar konsisten 200px, padding 10px 14px.
  - Background: `var(--base-surface)` (#14151B), Border: 1px `var(--base-border)` (#222430).
  - Selected state: Border 1px `var(--accent)` (#5B6BF8) dengan shadow glow subtil.
  - Node header: Ikon dokumen (`◈`, `◉`, `⊞`, `◷`, `⚠`), nama dokumen (Geist font, `--text-sm`), dan status badge (Draft, In Progress, Complete).
  - Connectors / Handles: Handle kiri (target) dan kanan (source) dengan kurva Bezier halus.
  - Active connection edge: Stroke 1px `var(--base-border-hi)`, hover/selected edge: `var(--accent)` dengan animated dash.

### D. Slide-over Drawer / Quick Inspector
- Mengklik sebuah node pada kanvas membuka panel samping (Slide-over Drawer) di sisi kanan:
  - Ringkasan metadata dokumen (tipe, versi, last updated, status).
  - Tab toggle: **Markdown Preview** dan **CodeMirror Quick Editor**.
  - Tombol aksi: "Buka di Full Editor" atau "Tutup Panel".
  - Auto-save perubahan yang dibuat di Quick Editor langsung tersimpan ke filesystem.

### E. View Switcher Integration
- Toggle segmented button di header/toolbar desktop app:
  - `[📄 Documents]` <-> `[◈ Graph View]`
  - Shortcut keyboard `Ctrl+G` / `Cmd+G` untuk berpindah view secara instan.

---

## 3. Out of Scope
- **Global Project Knowledge Graph**: Visualisasi seluruh plan dalam 1 kanvas global ditunda ke fase selanjutnya setelah node graph per-plan stabil.
- **Interactive Topology Builder**: Pembuatan node baru atau penarikan edge baru dari kanvas untuk mengubah struktur file markdown (topologi Phase 2 bersifat *read-only visualizer* yang otomatis ter-derive dari file markdown di `.docs/`).
- **3D Canvas / Force-Directed Physics**: Canvas tetap 2D terstruktur hierarkis demi performa dan kejelasan navigasi teknis.
- **Multi-user Realtime Collaboration**: Aplikasi adalah local-first single developer workshop tool.

---

## 4. Success Metrics & Definition of Done
1. **Performa Kanvas**: Mampu merender canvas pada 60 FPS saat panning dan zooming pada layar resolusi tinggi.
2. **Kelancaran Navigasi**: Beralih antara Document View dan Graph View berlangsung seketika (<100ms) tanpa frame drop atau freeze UI.
3. **Integritas Data**: Perubahan teks pada quick drawer langsung tersimpan ke disk dan memperbarui status badge node secara otomatis tanpa perlu refresh manual.
4. **Workshop Aesthetic**: Tampilan kanvas monokromatik, konsisten 100% dengan design system Plannic (Geist font, token dark theme, zero decorative distraction).
