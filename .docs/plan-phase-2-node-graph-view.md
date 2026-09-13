---
id: 69c3e740-82aa-4858-a1a5-235d3da96023
plan: phase-2-node-graph-view
type: plan
name: Phase 2 Node Graph View
slug: phase-2-node-graph-view
version: '1.1'
status: draft
created: '2026-09-13T10:11:36.485Z'
lastUpdated: '2026-09-13T10:49:29.479Z'
tags: []
description: Phase 2 Node Graph View for Phase 2 Node Graph View
mode: deep
documents:
  - plan-phase-2-node-graph-view.md
  - scope-phase-2-node-graph-view.md
  - feature-phase-2-node-graph-view.md
  - phase-1-phase-2-node-graph-view.md
  - limitation-phase-2-node-graph-view.md
---
# Phase 2: Node Graph View

## Goal
Menghadirkan kanvas visual interaktif (Node Graph View) berbasis `@xyflow/svelte` di Plannic Desktop untuk memetakan dan menavigasi struktur pohon dokumen rencana proyek (Root Plan, Scope, Features, Phases, Limitations) secara visual dengan performa tinggi dan tema gelap workshop yang presisi.

## Key Highlights
- **Interactive Canvas Engine**: Panning & zooming tak terbatas dengan `@xyflow/svelte`, dilengkapi dot-grid background, controls, dan MiniMap.
- **Auto-Layout Deterministic Topology**: Visualisasi hierarkis 3-kolom: Left (Root Plan) -> Middle (Scope, Features, Limitations) -> Right (Phases/Milestones).
- **Slide-over Quick Inspector**: Mengklik node membuka side drawer 420px untuk preview markdown dan quick-edit dengan CodeMirror 6 tanpa berpindah halaman.
- **Dual View Mode**: Beralih instan antara Document View klasik (`📄`) dan Node Graph View (`◈`) menggunakan shortcut `Ctrl+G` / `Cmd+G`.

## Document Index
- [Scope & Requirements](./scope-phase-2-node-graph-view.md) — Batasan MVP, In-Scope, Out-of-Scope, dan Definition of Done.
- [Feature & Architecture Breakdown](./feature-phase-2-node-graph-view.md) — Komponen frontend, data model, diagram urutan mermaid, dan node anatomy.
- [Phase 1 Implementation Roadmap](./phase-1-phase-2-node-graph-view.md) — Rincian 4 milestone pengerjaan teknis dari setup dependency hingga polish.
- [Technical Limitations & Trade-offs](./limitation-phase-2-node-graph-view.md) — Keputusan desain arsitektur, trade-offs, dan batasan teknis.
