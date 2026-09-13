---
id: 9c2855cf-c3cb-4fac-860a-136848452637
plan: phase-2-node-graph-view
type: limitation
name: Phase 2 Node Graph View — Limitations
slug: phase-2-node-graph-view
version: '1.1'
status: draft
created: '2026-09-13T10:11:36.485Z'
lastUpdated: '2026-09-13T10:49:23.694Z'
tags: []
description: Phase 2 Node Graph View — Limitations for Phase 2 Node Graph View
---
# Phase 2: Node Graph View — Technical Limitations & Trade-offs

## 1. Trade-offs & Decisions Made

### A. Library Dependency vs Custom Canvas
- **Keputusan**: Menggunakan `@xyflow/svelte` daripada menulis custom SVG/Canvas dari nol.
- **Konsekuensi**: Menambahkan sedikit ukuran bundle pada frontend desktop app (~40KB gzip), namun memberikan stabilitas tinggi, gesture handling (pinch, wheel, middle click) yang mature, edge routing Bezier yang rapi, dan fitur MiniMap bawaan tanpa harus memelihara ribuan baris kode matematika kanvas sendiri.

### B. Read-Only Topology vs Interactive Graph Builder
- **Keputusan**: Topologi node graph pada Phase 2 murni bersifat *read-only visualizer* yang ter-derive secara deterministik dari file Markdown di `.docs/`.
- **Konsekuensi**: User tidak dapat menarik edge baru untuk mengubah relasi file markdown langsung dari kanvas. Keputusan ini diambil agar sistem mematuhi prinsip **Local Markdown as Single Source of Truth**, menjaga arsitektur tetap sederhana dan bebas dari resiko korupsi struktur file.

---

## 2. Technical Constraints

### A. Svelte 5 Runes Integration
- Svelte Flow versi terbaru telah mendukung Svelte 5, namun beberapa API internal masih menggunakan pola Svelte store (`writable`). Bridge reaktif sederhana di `graph.svelte.ts` digunakan untuk menjembatani store `@xyflow` dengan Svelte 5 Runes (`$state`, `$derived`).

### B. Canvas Viewport Scalability
- Tata letak default 3 kolom dioptimalkan untuk document tree standar Plannic (5–15 dokumen per plan). Jika sebuah plan memiliki lebih dari 30 sub-dokumen atau fase berlapis, layout vertikal akan memanjang.
- **Mitigasi**: Tombol **Fit View (`F`)** dan **MiniMap** disediakan agar navigasi tetap mudah terlepas dari ukuran tree.

### C. Desktop First Architecture
- Interaksi kanvas dirancang untuk workflow desktop (mouse drag, scroll wheel, shortcut keyboard `Ctrl+G`, `Space+Drag`). Gestur multi-touch tablet tidak diutamakan pada fase ini karena Plannic berjalan sebagai native Tauri desktop workbench di Windows/macOS/Linux.
