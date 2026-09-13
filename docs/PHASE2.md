# PHASE2.md — Plannic CLI + Node Graph
**Status:** Planning
**Depends on:** PHASE1.md (complete)
**Target:** TBD (setelah Phase 1 selesai dan stabil)
**Scope:** CLI mode via OpenTUI + Node Graph view di desktop app

---

## Tujuan Phase 2

Dua penambahan major yang independent satu sama lain tapi sama-sama extend Plannic ke surface baru:

1. **CLI mode** — akses Plannic langsung dari terminal, tanpa buka desktop app
2. **Node Graph view** — visualisasi document tree sebagai interactive graph di desktop app

Keduanya bisa dikerjakan paralel karena tidak ada dependency satu sama lain.

---

## 2A — CLI Mode

### Stack

| Layer | Tech | Alasan |
|---|---|---|
| TUI Framework | **OpenTUI** (`@opentui/core`) | Dipakai OpenCode di production, flexbox layout, TypeScript-native, Bun-compatible |
| UI Renderer | **`@opentui/solid`** | Filosofi reactivity mirip Svelte (no virtual DOM), konsisten sama desktop stack |
| File I/O | **`@plannic/fs` adapter-bun** | Reuse existing adapter, zero duplication |
| Entry point | **Bun binary** | `bun build --compile` → single executable `plan` |

### Struktur dalam Monorepo

```
apps/
└── cli/
    ├── src/
    │   ├── index.tsx          ← entry point, router ke views
    │   ├── views/
    │   │   ├── PlanList.tsx   ← main view, dua panel
    │   │   ├── PlanDetail.tsx ← viewer + markdown render
    │   │   ├── Search.tsx     ← fuzzy search overlay
    │   │   └── NewPlan.tsx    ← form create plan baru
    │   ├── components/
    │   │   ├── Sidebar.tsx    ← plan list panel
    │   │   ├── Viewer.tsx     ← markdown viewer panel
    │   │   ├── StatusBar.tsx  ← bottom bar (shortcuts, status)
    │   │   └── Badge.tsx      ← status/mode badge
    │   └── keymaps.ts         ← keyboard bindings via @opentui/keymap
    └── package.json
```

### Layout

```
┌─ Plannic ──────────────────────────────────────────────────────┐
│ my-fintech-app                              [?] help  [q] quit │
├─────────────────────┬──────────────────────────────────────────┤
│                     │                                          │
│  Plans              │  auth-system                  v1.3 draft │
│  ─────────────────  │  ──────────────────────────────────────  │
│  > auth-system      │                                          │
│    scope            │  # Auth System                           │
│    feature          │                                          │
│    phase-1          │  ## Overview                             │
│    limitation       │  Sistem autentikasi berbasis JWT...      │
│  ─────────────────  │                                          │
│    qris-integration │  ## Tech Stack                           │
│    onboarding-flow  │  - Next.js 15                            │
│                     │  - Supabase Auth                         │
│                     │  - React Native                          │
│                     │                                          │
│                     │  ## Acceptance Criteria                  │
│                     │  - [ ] JWT refresh token...              │
├─────────────────────┴──────────────────────────────────────────┤
│  /c create  /o open  /s search  /h history  ↑↓ navigate       │
└────────────────────────────────────────────────────────────────┘
```

### Slash Commands

| Command | Shortcut | Aksi |
|---|---|---|
| `/create` | `c` | Buka form new plan (nama + mode Quick/Deep) |
| `/open` | `o` / `Enter` | Buka plan yang di-select di viewer |
| `/search` | `s` | Buka search overlay (fuzzy, real-time) |
| `/history` | `h` | Toggle history panel di kanan |
| `/quit` | `q` / `Ctrl+C` | Keluar |

### Shell Usage

```bash
# Masuk TUI mode (auto-detect project dari cwd)
$ plan

# Langsung ke plan tertentu
$ plan open auth-system

# Create plan dari shell tanpa masuk TUI
$ plan create "QRIS Integration" --mode deep

# Search dari shell
$ plan search "payment"

# List semua plan (plain text output, pipeline-friendly)
$ plan list
$ plan list --json
```

### Markdown Rendering di Terminal

Karena tidak ada CSS di terminal, rendering `.md` pakai ANSI escape codes:

```
# Heading 1     → bold + underline + accent color
## Heading 2    → bold
**bold**        → bold
`code`          → background highlight, monospace
```code```      → bordered block, syntax highlight via highlight.js ANSI theme
- [ ] task      → ○ task (unicode checkbox)
- [x] task      → ● task (filled)
> blockquote    → left border char │, dimmed text
```

### Build & Install

```bash
# Build single executable
bun build apps/cli/src/index.tsx \
  --compile \
  --outfile dist/plan

# Install ke PATH (macOS/Linux)
cp dist/plan /usr/local/bin/plan

# Windows
copy dist\plan.exe C:\Windows\System32\plan.exe
```

### Dev Requirements

- **Bun** 1.4.1+
- **Zig** 0.16.0 (untuk build OpenTUI native core)
- Run `bun install` dari monorepo root
- Link dev packages: `./scripts/link-opentui-dev.sh apps/cli`

---

## 2B — Node Graph View (Desktop App)

### Stack

| Layer | Tech | Alasan |
|---|---|---|
| Graph library | **`@xyflow/svelte`** | Svelte port dari React Flow, pan + zoom + custom nodes, MIT license |
| Layout engine | **Dagre** | Auto-layout tree kiri → kanan, bisa di-plug ke xyflow |

### Integrasi di Desktop App

Node Graph adalah **view tambahan** di main area — toggle antara:
- Document Tree view (existing Phase 1)
- **Node Graph view** (Phase 2)

```
┌─ Plannic ───────────────────────────────────────────────────┐
│  PLANNIC / my-fintech-app              [⌕ Search]           │
├──────────────┬──────────────────────────────────────────────┤
│              │  auth-system              v1.3  [draft]      │
│  Sidebar     │  ─────────────────────────────────────────── │
│              │  [Document Tree]  [Node Graph]  ← toggle     │
│  auth-system │                                              │
│  > scope     │        [Node Graph Canvas]                   │
│    feature   │                                              │
│    phase-1   │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### Node Anatomy

```
┌─────────────────────┐
│ ◈  auth-system      │  ← icon (per doc type) + name
│    draft  v1.3      │  ← status badge + versi
└─────────────────────┘
```

| Property | Value |
|---|---|
| Width | 200px fixed |
| Background | `--base-surface` |
| Border | `1px solid var(--base-border)` |
| Border (selected) | `1px solid var(--accent)` |
| Border radius | `6px` |
| Padding | `10px 14px` |
| Font | Geist 13px |

**Icon per doc type:**

| Doc type | Icon |
|---|---|
| PLAN | `◈` |
| scope | `◉` |
| feature | `⊞` |
| phase-N | `◷` |
| limitation | `⚠` |

### Edge Style

```
Kurva: bezier (default xyflow)
Stroke: 1px, color var(--base-border-hi)
Active/selected edge: stroke var(--accent), stroke-width 1.5px
Animated edge: stroke-dasharray, hanya saat plan sedang di-update via MCP
```

### Layout — Dagre Config

```typescript
const dagreLayout = {
  rankdir: 'LR',      // left → right
  ranksep: 80,        // jarak antar kolom (px)
  nodesep: 24,        // jarak antar node dalam kolom (px)
  marginx: 32,
  marginy: 32,
}
```

Output layout:

```
[PLAN.md] ──────┬──── [scope.md]     ──── [sub-items...]
                ├──── [feature.md]   ──── [sub-items...]
                ├──── [phase-1.md]
                ├──── [phase-2.md]
                └──── [limitation.md]
```

### Interaksi

| Aksi | Behavior |
|---|---|
| Klik node | Buka document di Document Tree view (scroll ke section) |
| Double-click node | Langsung masuk Edit mode untuk dokumen itu |
| Klik + drag canvas | Pan |
| Scroll | Zoom in/out |
| `Ctrl+Shift+F` | Fit all nodes ke viewport |
| Hover node | Tooltip: last updated, changedBy, excerpt pertama |

---

## Urutan Pengerjaan

```
Phase 2A dan 2B bisa paralel.

2A — CLI:
  Week 1: Setup apps/cli, OpenTUI + Solid scaffold
  Week 2: Sidebar + Viewer dua panel, keyboard nav
  Week 3: Markdown renderer (ANSI), slash commands
  Week 4: Build binary, shell usage (plan open/create/search/list)
  Week 5: Polish, edge cases, test di Windows + macOS

2B — Node Graph:
  Week 1: Install @xyflow/svelte + dagre, toggle UI di desktop app
  Week 2: Node component, edge rendering, dagre auto-layout
  Week 3: Interaksi (klik, double-click, hover tooltip)
  Week 4: Sync dengan file changes (kalau MCP update → graph re-layout)
```

---

## Definition of Done — Phase 2

### CLI (2A)
- [ ] `plan` command tersedia di PATH sebagai single binary
- [ ] TUI muncul dengan layout dua panel saat dijalankan dari folder project
- [ ] Plan list muncul di sidebar, navigasi pakai `↑↓`
- [ ] Enter → dokumen ter-render di panel kanan dengan markdown styling
- [ ] `/create` → bisa bikin plan baru (nama + mode), file terbentuk di `.docs/`
- [ ] `/search` → overlay muncul, fuzzy search real-time
- [ ] `plan list --json` → output JSON valid, bisa di-pipe
- [ ] Berjalan di macOS + Linux (Windows best-effort)

### Node Graph (2B)
- [ ] Toggle "Node Graph" muncul di toolbar desktop app
- [ ] Graph ter-render dengan auto-layout dagre (kiri ke kanan)
- [ ] Tiap node menampilkan icon doc type + nama + status badge
- [ ] Klik node → scroll ke section di Document Tree view
- [ ] Pan + zoom berfungsi
- [ ] Graph update otomatis kalau file berubah (file watcher)

---

## Yang Tidak Ada di Phase 2

- Edit markdown langsung dari CLI (view only — edit tetap via desktop app atau editor)
- Collapse/expand node di graph (Phase 3)
- Custom node positions (drag-to-reposition) — auto-layout only
- Graph export (PNG/SVG)
- SSH mode via `@opentui/ssh` (Phase 3+)

---

## Risks Phase 2

| Risk | Likelihood | Impact | Mitigasi |
|---|---|---|---|
| OpenTUI + Zig setup complexity di CI/CD | Medium | Medium | Test manual dulu, CI nyusul |
| `@xyflow/svelte` versi tidak stabil | Low | Medium | Pin ke versi exact, fork kalau perlu |
| Dagre layout jelek kalau plan punya banyak phases | Medium | Low | Cap phases di graph view, sisanya collapsible |
| ANSI markdown rendering inconsistent antar terminal emulator | Medium | Medium | Test di: iTerm2, Ghostty, Windows Terminal, Kitty |
| OpenTUI belum ada `@opentui/solid` yang mature | Medium | High | Fallback ke `@opentui/react` kalau Solid port belum siap |

---

## Open Questions Phase 2

| # | Pertanyaan | Blocking |
|---|---|---|
| 1 | `@opentui/solid` — sudah production-ready atau masih experimental? Perlu cek repo | Sebelum 2A Week 1 |
| 2 | File watcher di Tauri untuk auto-refresh Node Graph — pakai `@tauri-apps/plugin-fs` watchFile atau Rust notify crate? | Sebelum 2B Week 4 |
| 3 | Binary name: `plan` atau `plannic`? `plan` lebih pendek tapi mungkin conflict dengan Unix `plan` command | Sebelum 2A Week 4 |

---

*Phase 2 dimulai setelah semua Definition of Done Phase 1 terpenuhi.*
