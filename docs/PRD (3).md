# PRD: DocuMind
**Product Requirements Document v1.0**
**Status:** Draft
**Author:** Akhtar Jaffan Ramadhan (Atar)
**Created:** 2026-09-13
**Last Updated:** 2026-09-13

---

## Table of Contents

1. [Overview](#1-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Non-Goals](#3-goals--non-goals)
4. [User Persona](#4-user-persona)
5. [Architecture Overview](#5-architecture-overview)
6. [Monorepo Structure](#6-monorepo-structure)
7. [Tech Stack](#7-tech-stack)
8. [Feature Specifications](#8-feature-specifications)
9. [MCP Server — Tools Spec](#9-mcp-server--tools-spec)
10. [PRD Document Schema](#10-prd-document-schema)
11. [Versioning & History System](#11-versioning--history-system)
12. [Desktop App — UI Flows](#12-desktop-app--ui-flows)
13. [Data Flow Diagrams](#13-data-flow-diagrams)
14. [Acceptance Criteria](#14-acceptance-criteria)
15. [Risks & Mitigations](#15-risks--mitigations)
16. [Roadmap](#16-roadmap)
17. [Open Questions](#17-open-questions)

---

## 1. Overview

**DocuMind** adalah internal planning tool berbasis desktop + MCP server yang memungkinkan developer merencanakan proyek secara terstruktur langsung dari AI coding agent (Claude Code, Codex, dll). Output-nya berupa file `.md` yang tersimpan di folder `.docs/` dalam project masing-masing, lengkap dengan versioning, search, dan history tracking.

Tools ini bukan produk publik — ini personal productivity tool yang dibangun dengan mindset "belajar sambil pakai", menggunakan stack yang ringan, modern, dan non-konvensional.

**Tagline internal:** *"Plan first, code later."*

---

## 2. Problem Statement

Saat ini, planning sebelum coding sering dilakukan secara ad-hoc:
- PRD ditulis manual di Notion/Obsidian yang terpisah dari codebase
- AI coding agent tidak punya konteks terstruktur tentang arsitektur, stack, atau acceptance criteria
- Tidak ada history perubahan planning selain Git commit (kalau ingat di-commit)
- Saat ganti project atau resume kerja, konteks sering hilang

**Akibatnya:** AI coding agent sering menghasilkan output yang "drift" dari intention awal karena tidak ada sumber kebenaran tunggal yang accessible.

---

## 3. Goals & Non-Goals

### Goals (v1.0)

- [x] MCP server yang bisa dipanggil dari Claude Code / Codex
- [x] Generate struktur PRD terstruktur sebagai `.md` file di `.docs/` project
- [x] CRUD PRD via MCP tools (create, read, update, list, search)
- [x] Built-in versioning dengan changelog internal (independent dari Git)
- [x] Desktop app (Tauri + Svelte) sebagai UI untuk browse & edit PRD
- [x] Fuzzy search PRD via apps maupun MCP
- [x] Monorepo — shared types dan file system logic

### Non-Goals (v1.0)

- [ ] Multi-user / collaboration
- [ ] Cloud sync / remote storage
- [ ] Authentication
- [ ] PRD template marketplace
- [ ] AI generate PRD otomatis dari MCP server (model yang manggil yang generate — MCP hanya file manager)
- [ ] Mobile app

---

## 4. User Persona

**Atar — Solo Developer / AI Engineer**

- Sering pakai Claude Code, Codex, dan AI coding agent lainnya
- Kerja di banyak project paralel (Armada, IOH RAG, portfolio, dsb)
- Butuh konteks planning yang bisa diakses AI agent tanpa harus dijelasin ulang
- Prefer workflow yang mulus: dari terminal / AI chat → planning tersimpan → coding
- Mau belajar stack baru (Svelte, Tauri, Bun) sambil build something useful

---

## 5. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    AI Coding Agent                       │
│              (Claude Code / Codex / etc)                │
└────────────────────────┬────────────────────────────────┘
                         │ MCP Protocol (stdio / SSE)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   MCP Server (Bun + TS)                  │
│                                                         │
│  Tools:                                                 │
│  create_prd · get_prd · update_prd                      │
│  list_prds · search_prds · get_history                  │
│                                                         │
│  Uses: @core (types) · @fs (file ops)                   │
└────────────┬──────────────────────────────┬────────────┘
             │                              │
             ▼                              ▼
┌────────────────────┐         ┌────────────────────────┐
│  .docs/ per project │         │  .docs/.history/       │
│  ├── prd-main.md   │         │  ├── prd-main.jsonl    │
│  ├── prd-auth.md   │         │  └── prd-auth.jsonl    │
│  └── ...           │         └────────────────────────┘
└────────────────────┘
             ▲
             │ reads same files
             ▼
┌─────────────────────────────────────────────────────────┐
│              Desktop App (Tauri + Svelte 5)              │
│                                                         │
│  - Browse & view PRDs                                   │
│  - Edit PRD (raw .md editor)                            │
│  - Search PRDs (Fuse.js)                                │
│  - View history / changelog                             │
└─────────────────────────────────────────────────────────┘
```

**Key principle:** MCP server dan Desktop app keduanya baca/tulis file yang sama di `.docs/`. Tidak ada database terpusat — filesystem adalah source of truth.

---

## 6. Monorepo Structure

```
documind/
├── apps/
│   ├── desktop/                 # Tauri 2 + Svelte 5
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── components/  # UI components
│   │   │   │   ├── stores/      # Svelte stores (state)
│   │   │   │   └── api/         # calls ke Tauri commands
│   │   │   ├── routes/          # SvelteKit-style routing
│   │   │   └── app.html
│   │   ├── src-tauri/           # Rust backend Tauri
│   │   │   ├── src/
│   │   │   │   └── main.rs
│   │   │   └── tauri.conf.json
│   │   └── package.json
│   │
│   └── mcp-server/              # Bun + MCP SDK
│       ├── src/
│       │   ├── index.ts         # entry point, register tools
│       │   ├── tools/
│       │   │   ├── create-prd.ts
│       │   │   ├── get-prd.ts
│       │   │   ├── update-prd.ts
│       │   │   ├── list-prds.ts
│       │   │   ├── search-prds.ts
│       │   │   └── get-history.ts
│       │   └── utils/
│       │       └── path-resolver.ts
│       └── package.json
│
├── packages/
│   ├── core/                    # shared types & PRD schema
│   │   ├── src/
│   │   │   ├── types.ts         # PrdDocument, HistoryEntry, etc.
│   │   │   └── schema.ts        # Zod schemas
│   │   └── package.json
│   │
│   └── fs/                      # shared file system operations
│       ├── src/
│       │   ├── reader.ts        # baca .md + frontmatter
│       │   ├── writer.ts        # tulis .md + frontmatter
│       │   ├── history.ts       # baca/tulis .jsonl history
│       │   └── search.ts        # Fuse.js wrapper
│       └── package.json
│
├── package.json                 # root — bun workspaces
├── bunfig.toml
├── tsconfig.base.json
└── README.md
```

---

## 7. Tech Stack

### Runtime & Tooling
| Layer | Tech | Alasan |
|---|---|---|
| Runtime | **Bun** | Fast, built-in bundler, native TypeScript, workspace support |
| Language | **TypeScript** (strict) | Shared types antara packages |
| Monorepo | **Bun Workspaces** | Zero-config, native di Bun |

### Desktop App
| Layer | Tech | Alasan |
|---|---|---|
| Shell | **Tauri 2** | Lightweight (vs Electron), Rust backend, akses native FS |
| Frontend | **Svelte 5** | No runtime, reactive runes, paling ringan di kelasnya |
| Styling | **UnoCSS** | Utility-first, on-demand, lebih ringan dari Tailwind |
| Editor | **CodeMirror 6** | Embeddable, extensible, support Markdown syntax highlight |

### MCP Server
| Layer | Tech | Alasan |
|---|---|---|
| Protocol | **@modelcontextprotocol/sdk** | Official Anthropic MCP SDK |
| Transport | **stdio** (default) | Kompatibel dengan Claude Code & Codex out of the box |
| Schema Validation | **Zod** | Runtime type safety untuk tool inputs |

### Shared Packages
| Layer | Tech | Alasan |
|---|---|---|
| Frontmatter | **gray-matter** | Parse & stringify YAML frontmatter di `.md` |
| Search | **Fuse.js** | Lightweight fuzzy search, no server needed |
| History Store | **lowdb** | JSON file-based, zero setup, portable |

---

## 8. Feature Specifications

### 8.1 PRD Management (Core)

#### Create PRD
- Input: nama PRD + working directory path (dari AI agent)
- Output: file `.md` baru di `<project>/.docs/<slug>.md`
- Auto-generate frontmatter (id, nama, tanggal, versi, status)
- Scaffold struktur PRD kosong siap diisi AI agent
- Record history entry: `created`

#### Read PRD
- Input: slug atau nama PRD + working directory
- Output: isi file `.md` lengkap (frontmatter + body)
- Kalau tidak ditemukan: return error yang informatif

#### Update PRD
- Input: slug, section yang diupdate, konten baru
- Output: file `.md` terupdate
- Auto-increment versi di frontmatter
- Record history entry: `updated` + diff summary

#### List PRDs
- Input: working directory path
- Output: list semua PRD di `.docs/` dengan metadata (nama, status, versi, last updated)

#### Search PRDs
- Input: query string + working directory
- Output: ranked list PRD yang match (fuzzy search via Fuse.js)
- Search di: nama, tags, isi body

#### Get History
- Input: slug PRD + working directory
- Output: list semua changelog entry untuk PRD tersebut

---

### 8.2 Desktop App (UI)

#### Project Switcher
- User bisa set "active project" = path ke folder project
- App membaca `.docs/` dari path tersebut
- Bisa simpan multiple project paths di app config

#### PRD List View
- List semua PRD di project aktif
- Filter by status (draft, review, final)
- Sort by: last updated, created, name
- Badge versi

#### PRD Detail View
- Render Markdown ke HTML (preview mode)
- Toggle ke raw editor (CodeMirror)
- Sidebar: metadata + history changelog

#### Search
- Search bar di top
- Real-time fuzzy search via Fuse.js
- Highlight match di hasil

#### History View
- Timeline vertikal per PRD
- Tiap entry: timestamp, jenis perubahan, ringkasan diff

---

## 9. MCP Server — Tools Spec

### Tool: `create_prd`
```typescript
input: {
  name: string,          // nama PRD e.g. "Auth System"
  cwd: string,           // absolute path ke project folder
  tags?: string[],       // opsional tags
  description?: string   // deskripsi singkat
}

output: {
  success: boolean,
  slug: string,          // e.g. "auth-system"
  path: string,          // absolute path ke file .md
  content: string        // isi awal file
}
```

### Tool: `get_prd`
```typescript
input: {
  slug: string,
  cwd: string
}

output: {
  found: boolean,
  prd?: {
    slug: string,
    path: string,
    frontmatter: PrdFrontmatter,
    body: string,
    rawContent: string
  }
}
```

### Tool: `update_prd`
```typescript
input: {
  slug: string,
  cwd: string,
  section?: string,      // nama section yang diupdate (opsional)
  body: string,          // full body baru ATAU content section
  mode: "full" | "section"
}

output: {
  success: boolean,
  version: string,       // versi baru e.g. "1.3"
  path: string
}
```

### Tool: `list_prds`
```typescript
input: {
  cwd: string,
  status?: "draft" | "review" | "final" | "all"
}

output: {
  prds: Array<{
    slug: string,
    name: string,
    status: string,
    version: string,
    lastUpdated: string,
    description: string
  }>
}
```

### Tool: `search_prds`
```typescript
input: {
  query: string,
  cwd: string,
  limit?: number    // default 5
}

output: {
  results: Array<{
    slug: string,
    name: string,
    score: number,
    excerpt: string
  }>
}
```

### Tool: `get_history`
```typescript
input: {
  slug: string,
  cwd: string,
  limit?: number    // default 20
}

output: {
  history: Array<{
    timestamp: string,
    type: "created" | "updated" | "status_changed",
    version: string,
    summary: string,
    changedBy: string   // "mcp" | "desktop" | "manual"
  }>
}
```

---

## 10. PRD Document Schema

### File: `.docs/<slug>.md`

```markdown
---
id: uuid-v4
name: Auth System
slug: auth-system
version: "1.2"
status: draft           # draft | review | final
created: 2026-09-13T10:00:00Z
lastUpdated: 2026-09-13T14:30:00Z
tags: [auth, backend, security]
description: Sistem autentikasi berbasis JWT untuk DocuMind
---

## Overview
...

## Problem Statement
...

## Tech Stack
...

## Architecture
...

## Feature Spec
...

## Acceptance Criteria
...

## Flow
...

## Open Questions
...
```

### File: `.docs/.history/<slug>.jsonl`

Setiap baris adalah satu JSON entry (newline-delimited JSON):

```jsonl
{"timestamp":"2026-09-13T10:00:00Z","type":"created","version":"1.0","summary":"PRD dibuat","changedBy":"mcp"}
{"timestamp":"2026-09-13T12:00:00Z","type":"updated","version":"1.1","summary":"Tambah section Architecture","changedBy":"mcp"}
{"timestamp":"2026-09-13T14:30:00Z","type":"updated","version":"1.2","summary":"Update Acceptance Criteria","changedBy":"desktop"}
```

---

## 11. Versioning & History System

### Prinsip
- Versi disimpan di frontmatter `.md` (format: `MAJOR.MINOR`)
- Setiap `update_prd` → increment MINOR
- Status change `draft → review → final` → increment MAJOR
- History disimpan di `.docs/.history/<slug>.jsonl` (append-only)
- **Independent dari Git** — history selalu ada, tidak perlu commit

### Aturan Increment
| Action | Versi sebelum | Versi sesudah |
|---|---|---|
| `create_prd` | — | `1.0` |
| `update_prd` (body/section) | `1.2` | `1.3` |
| Status `draft → review` | `1.5` | `2.0` |
| Status `review → final` | `2.3` | `3.0` |

### Diff Summary
- Bukan full diff — cukup summary string yang digenerate oleh AI agent yang memanggil tool
- Tool `update_prd` bisa terima opsional `changeSummary: string` dari caller

---

## 12. Desktop App — UI Flows

### Flow 1: Buka App → Browse PRD

```
[App Launch]
    ↓
[Cek apakah ada saved projects]
    ├── Ada → Load project terakhir aktif
    └── Tidak ada → Show "Add Project" onboarding
         ↓
[Pilih folder project]
    ↓
[Scan .docs/ → List PRDs]
    ↓
[PRD List View]
```

### Flow 2: Lihat & Edit PRD

```
[Klik PRD di list]
    ↓
[PRD Detail View — Preview mode]
    ↓
[Toggle "Edit" button]
    ↓
[CodeMirror editor muncul dengan raw .md]
    ↓
[User edit → auto-save setelah 1s idle]
    ↓
[fs/writer.ts update file + append history entry]
    ↓
[Preview refresh]
```

### Flow 3: Search

```
[Ketik di search bar]
    ↓
[Fuse.js query ke semua PRD yang sudah di-index]
    ↓
[Real-time hasil muncul dengan excerpt]
    ↓
[Klik hasil → PRD Detail View]
```

---

## 13. Data Flow Diagrams

### MCP Tool Call: `create_prd`

```
Claude Code                MCP Server              File System
    │                          │                       │
    │── create_prd(input) ────▶│                       │
    │                          │── validate input      │
    │                          │   (Zod)               │
    │                          │                       │
    │                          │── resolve path ──────▶│
    │                          │   cwd + .docs/        │
    │                          │                       │
    │                          │── scaffold .md ──────▶│
    │                          │   gray-matter write   │ .docs/auth-system.md
    │                          │                       │
    │                          │── append history ────▶│
    │                          │   lowdb write         │ .docs/.history/auth-system.jsonl
    │                          │                       │
    │◀── { success, slug } ────│                       │
```

### Desktop App: Edit PRD

```
Desktop App             @fs/writer              File System
    │                       │                       │
    │── save(slug, body) ──▶│                       │
    │                       │── read current ──────▶│
    │                       │◀── raw .md ───────────│
    │                       │                       │
    │                       │── merge frontmatter   │
    │                       │   increment version   │
    │                       │                       │
    │                       │── write .md ─────────▶│ (updated)
    │                       │── append .jsonl ──────▶│ (history)
    │                       │                       │
    │◀── { version } ───────│                       │
```

---

## 14. Acceptance Criteria

### AC-01: MCP Server Bisa Dipanggil dari Claude Code
- [ ] MCP server bisa diregister di Claude Code via `mcp.json` config
- [ ] Tool `create_prd` berhasil dipanggil dari prompt Claude Code
- [ ] Tool menghasilkan file `.md` di path yang benar

### AC-02: File .md Terbentuk dengan Benar
- [ ] File memiliki YAML frontmatter yang valid (parseable oleh gray-matter)
- [ ] Slug di-generate dari nama (lowercase, hyphenated)
- [ ] Versi awal adalah `1.0`
- [ ] Status awal adalah `draft`

### AC-03: Versioning Berfungsi
- [ ] Setiap `update_prd` increment versi di frontmatter
- [ ] History entry ter-append di `.jsonl` file
- [ ] `get_history` mengembalikan list entry yang benar

### AC-04: Search Berfungsi
- [ ] `search_prds` mengembalikan hasil relevan untuk query string
- [ ] Fuzzy matching bekerja (typo tolerance)
- [ ] Result diurutkan by relevance score

### AC-05: Desktop App Bisa Baca File yang Dibuat MCP
- [ ] App bisa scan `.docs/` dari project path yang dipilih user
- [ ] PRD yang dibuat via MCP muncul di app list
- [ ] Edit via app → file terupdate + history terupdate

### AC-06: Desktop App UI Minimal Viable
- [ ] Project switcher berfungsi
- [ ] PRD list view tampil dengan metadata
- [ ] PRD detail view render Markdown
- [ ] Raw editor (CodeMirror) bisa toggle
- [ ] Search bar berfungsi real-time

### AC-07: Monorepo Build Clean
- [ ] `bun install` dari root install semua dependencies
- [ ] `packages/core` dan `packages/fs` bisa di-import oleh kedua apps
- [ ] MCP server bisa di-run dengan `bun run apps/mcp-server/src/index.ts`
- [ ] Desktop app bisa di-build dengan `bunx tauri build`

---

## 15. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Tauri + Svelte 5 learning curve | Medium | Medium | Start dari Tauri template official, Svelte 5 docs sudah mature |
| MCP stdio transport edge cases (path resolution, escaping) | Medium | High | Test manual dari Claude Code sebelum implement semua tools |
| `.jsonl` history file corrupt kalau write conflict (simultaneous MCP + desktop edit) | Low | Medium | Simple file lock via tmp file, atau last-write-wins dengan timestamp |
| Fuse.js performance lambat kalau PRD banyak | Low | Low | Index di-rebuild saat app load / file berubah, cukup untuk personal use |
| gray-matter tidak handle edge case frontmatter | Low | Medium | Wrap semua parse/write dalam try-catch dengan fallback |

---

## 16. Roadmap

### v1.0 — MVP (target: 4–6 minggu)
- [x] Monorepo setup (Bun workspaces)
- [ ] `packages/core` — types & Zod schemas
- [ ] `packages/fs` — reader, writer, history, search
- [ ] `apps/mcp-server` — semua 6 tools
- [ ] `apps/desktop` — project switcher, list view, detail view, editor, search
- [ ] Manual test end-to-end dari Claude Code

### v1.1 — Polish
- [ ] PRD templates (blank, feature spec, architecture)
- [ ] Export PRD ke PDF
- [ ] Keyboard shortcuts di desktop app
- [ ] MCP transport: tambah SSE support (selain stdio)

### v2.0 — Future
- [ ] Global PRD store (lintas project, optional)
- [ ] Web app companion (biar bisa akses di browser juga)
- [ ] Plugin system untuk custom PRD sections
- [ ] Sync ke Notion / Linear (opsional connector)

---

## 17. Open Questions

| # | Pertanyaan | Status |
|---|---|---|
| 1 | Apakah perlu `.docs/documind.config.json` per project untuk custom settings? | Open |
| 2 | Bagaimana handle kalau user rename/hapus `.md` file manual di luar app? | Open |
| 3 | Apakah history `.jsonl` perlu di-`.gitignore` default, atau justru di-commit bersama PRD? | Open |
| 4 | Perlu onboarding wizard di desktop app untuk first-time setup MCP? | Open |
| 5 | Naming: "DocuMind" atau nama lain? | Open |

---

*PRD ini adalah living document. Update via MCP atau desktop app akan di-track di history.*
