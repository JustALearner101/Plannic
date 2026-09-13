# PHASE1.md — Plannic MVP
**Status:** Planning
**Target:** 4–6 minggu
**Scope:** MCP Server fungsional + Desktop App minimal viable

---

## Tujuan Phase 1

Buktikan bahwa loop utama bekerja end-to-end:

> Claude Code → `get_config()` → grill user → `create_plan()` → document tree terbentuk di `.docs/` → bisa dibaca & diedit via desktop app

Tidak ada fitur sekunder. Tidak ada polish. Yang penting loop ini solid.

---

## Deliverables

### D1 — Monorepo Scaffold
- [ ] Bun workspaces setup (`packages/core`, `packages/fs`, `apps/mcp-server`, `apps/desktop`)
- [ ] `tsconfig.base.json` shared
- [ ] `packages/core` — semua types & Zod schemas
- [ ] `packages/fs` — reader, writer, history (`.jsonl`), search (Fuse.js)
- [ ] Root `package.json` dengan scripts: `dev`, `build`, `typecheck`

### D2 — `.plannic/config.md` Convention
- [ ] Define format & fields wajib config file
- [ ] Contoh config untuk beberapa project type (fullstack app, library, infra)
- [ ] MCP tool `get_config()` — baca `.plannic/config.md` dari `cwd`, return isinya

### D3 — Document Tree Convention
- [ ] Define struktur folder `.docs/` untuk Quick Mode dan Deep Mode
- [ ] Naming convention untuk file (slug-based, lowercase, hyphenated)
- [ ] Frontmatter schema wajib per file type (PLAN, Scope, Feature, Phase, Limitation)

```
Quick Mode output:
.docs/
└── plan-<slug>.md

Deep Mode output:
.docs/
├── plan-<slug>.md          ← root, index ke semua file
├── scope-<slug>.md
├── limitation-<slug>.md
├── feature-<slug>.md
├── phase-1-<slug>.md
├── phase-2-<slug>.md       ← optional, kalau ada
└── .history/
    ├── plan-<slug>.jsonl
    └── ...
```

### D4 — MCP Server (6 tools)

| Tool | Input | Output | Notes |
|---|---|---|---|
| `get_config` | `cwd` | config content string | Return raw `.plannic/config.md` |
| `init_plan` | `cwd`, `name`, `mode` | `{ status, slug, files_created[] }` | Scaffold semua file sesuai mode |
| `get_plan` | `cwd`, `slug` | tree of documents | Return semua file dalam plan |
| `update_document` | `cwd`, `slug`, `doc_type`, `body` | `{ version, path }` | Update satu file dalam tree |
| `list_plans` | `cwd` | list of plan summaries | Scan `.docs/` |
| `get_history` | `cwd`, `slug` | list of history entries | Baca semua `.jsonl` dalam plan |

### D5 — Desktop App (Tauri + Svelte 5)

Views yang wajib ada di Phase 1:

**Project Selector**
- Simpan project paths di app config (JSON di app data dir)
- Bisa tambah / hapus project
- Auto-load project terakhir saat buka app

**Plan List View** (sidebar kiri)
- List semua plan di `.docs/`
- Badge: mode (Quick/Deep), status (draft/review/final), versi
- Klik → buka Plan Detail

**Plan Detail View** (main area)
- Kalau Quick Mode: render satu `.md` file
- Kalau Deep Mode: render document tree — tiap file jadi collapsible section
- Toggle: Preview (rendered Markdown) ↔ Editor (CodeMirror raw)
- Auto-save 1.5s setelah idle

**History Panel** (kanan, collapsible)
- Timeline per plan
- Entry: timestamp, doc yang diubah, versi, changedBy (mcp/desktop/manual)

**Search**
- Search bar di header
- Fuzzy search via Fuse.js
- Cari di: nama plan, tags, isi semua dokumen dalam tree

---

## Urutan Pengerjaan

```
Week 1:
  ├── Monorepo scaffold (D1)
  └── packages/core — types & schemas

Week 2:
  ├── packages/fs — reader, writer, history, search
  └── .plannic/config.md convention (D3)

Week 3:
  ├── MCP server — get_config, init_plan, get_plan (D4 core tools)
  └── Manual test dari Claude Code (init_plan harus jalan dulu)

Week 4:
  ├── MCP server — update_document, list_plans, get_history
  └── Desktop app — project selector + plan list (D5 awal)

Week 5:
  ├── Desktop app — plan detail view + history panel
  └── Desktop app — search

Week 6:
  └── Integration test end-to-end + bug fix
      (Claude Code → MCP → files → desktop app baca)
```

---

## Definition of Done — Phase 1

Phase 1 selesai kalau semua ini bisa dilakukan tanpa error:

```
1. Buka project baru di Claude Code
2. Ketik: "tolong plan implementasi auth system buat project ini"
3. Claude Code panggil get_config() → baca .plannic/config.md
4. Claude Code grill user (3–5 pertanyaan)
5. Claude Code panggil init_plan() dengan mode Deep
6. File terbentuk: plan-auth.md, scope-auth.md, feature-auth.md, dll
7. Buka Plannic desktop app
8. Pilih project folder → plan muncul di sidebar
9. Klik plan → semua file ter-render sebagai tree
10. Edit satu section → auto-save → history entry terbentuk
11. Ketik di search bar → hasil muncul real-time
12. Dari Claude Code: panggil update_document() → perubahan langsung keliatan di app
```

---

## Yang Tidak Ada di Phase 1

- Node graph view (Phase 2)
- Kanban (Phase 2+)
- Grill UI di desktop app (Phase 2)
- Export PDF
- Multiple project switcher yang fancy
- Onboarding wizard
- Keyboard shortcuts
- Dark/light theme toggle (default dark)

---

## Risks Phase 1

| Risk | Mitigasi |
|---|---|
| Tauri file watcher belum di-setup → app tidak auto-refresh kalau MCP update file | Pakai manual refresh button dulu, file watcher Phase 2 |
| Path resolution di MCP (Windows vs Unix) | Test di dua OS dari awal, pakai `path.resolve` konsisten |
| Svelte 5 runes API masih berubah-ubah | Pin ke versi exact di package.json |
| CodeMirror 6 setup di Svelte butuh adapter | Cek `@codemirror/svelte` atau custom mount |
