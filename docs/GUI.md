# GUI.md — Plannic Design Spec
**Version:** 1.0
**Status:** Draft
**Scope:** Desktop App (Tauri + Svelte 5) — Phase 1 UI

---

## 1. Design Philosophy

Plannic bukan SaaS dashboard. Ini **workshop tool** — tempat kerja serius yang dipakai malam hari setelah seharian ngoding. Desainnya harus mencerminkan itu: tenang, tidak berisik, tidak ada elemen yang minta perhatian kalau tidak perlu.

**Satu hal yang bold:** indigo accent pada active state dan koneksi node graph.
Sisanya: monochrome ketat, border tipis, zero dekorasi.

**Prinsip:**
- Setiap elemen visual harus earn tempatnya — kalau bisa dibuang tanpa kehilangan informasi, buang
- Struktur dokumen adalah navigasi — hierarchy file tree = hierarchy visual
- Empty state adalah undangan, bukan error

---

## 2. Design Tokens

### Color
```
--base-void:       #0E0F14   ← main background (blue-tinted, bukan pure black)
--base-surface:    #13141A   ← sidebar, panel background
--base-overlay:    #1A1B23   ← hover state, subtle elevation
--base-border:     #1E2030   ← semua border, divider
--base-border-hi:  #2A2D45   ← focused border, active outline

--text-primary:    #E2E4EE   ← body text, labels
--text-secondary:  #5C5F78   ← metadata, placeholder, muted
--text-disabled:   #3A3D52   ← disabled state

--accent:          #5B6BF8   ← active item, link, indikator utama
--accent-dim:      #2A3080   ← accent background (badge, highlight bg)
--accent-text:     #8B97FF   ← teks di atas accent-dim bg

--status-draft:    #5C5F78   ← abu-abu, netral
--status-review:   #D4A017   ← amber, in progress
--status-final:    #3DAA6A   ← hijau, done

--danger:          #E05C6A
--danger-dim:      #3D1520
```

### Typography
```
Font family:
  UI:    "Geist", system-ui, sans-serif
  Mono:  "Geist Mono", monospace          ← slug, versi, timestamp, path

Scale:
  --text-xs:   11px / 1.4  weight 400    ← metadata, badge label
  --text-sm:   13px / 1.5  weight 400    ← sidebar item, secondary label
  --text-base: 14px / 1.6  weight 400    ← body, editor
  --text-md:   15px / 1.5  weight 500    ← section header, nav label
  --text-lg:   18px / 1.4  weight 600    ← plan title di detail view
  --text-xl:   22px / 1.3  weight 700    ← app name "Plannic" di header
```

### Spacing & Shape
```
--radius-sm:   3px    ← badge, chip
--radius-md:   6px    ← button, input, panel
--radius-lg:   10px   ← modal, popover

--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  24px
--space-6:  32px
```

### Motion
```
--ease-out:    cubic-bezier(0.16, 1, 0.3, 1)
--duration-sm: 120ms    ← hover, focus ring
--duration-md: 200ms    ← panel open/close, tab switch
--duration-lg: 320ms    ← modal, page transition
```

---

## 3. Layout

### Shell — Three Column Fixed

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (40px, full width)                                      │
│  [Plannic]  /  [project-name ▾]          [search...........]   │
├──────────────┬──────────────────────────────┬───────────────────┤
│              │                              │                   │
│  SIDEBAR     │  MAIN AREA                   │  HISTORY PANEL    │
│  240px fixed │  flex (min 500px)            │  280px, collapse  │
│              │                              │                   │
│  Plan list   │  Document viewer / editor    │  Changelog        │
│  + tree nav  │                              │  timeline         │
│              │                              │                   │
│              │                              │                   │
└──────────────┴──────────────────────────────┴───────────────────┘
```

- Header `border-bottom: 1px solid var(--base-border)`
- Sidebar `border-right: 1px solid var(--base-border)`
- History panel `border-left: 1px solid var(--base-border)` — collapsible ke kanan
- Tidak ada shadow. Semua pemisah pakai border 1px.

---

## 4. Components

### 4.1 Header

```
┌─────────────────────────────────────────────────────────────────┐
│  PLANNIC   /   my-fintech-app ▾                  [ ⌕ Search ]  │
└─────────────────────────────────────────────────────────────────┘
```

- "PLANNIC" — `--text-xl`, weight 700, color `--accent`
- Breadcrumb separator `/` — `--text-secondary`
- Project name — `--text-md`, clickable dropdown untuk ganti project
- Search — input 220px, placeholder "Search plans...", `--text-secondary`
- Height: 40px, `padding: 0 16px`
- Background: `--base-surface`

---

### 4.2 Sidebar

```
┌──────────────────────┐
│ Plans          [+ New]│
├──────────────────────┤
│ ▾ auth-system        │  ← active, indigo left border
│   scope              │
│   feature            │
│   phase-1            │
├──────────────────────┤
│ ► qris-integration   │  ← collapsed
├──────────────────────┤
│ ► onboarding-flow    │
└──────────────────────┘
```

**Plan item (collapsed):**
- `padding: 8px 12px`
- Icon `►` untuk collapsed, `▾` untuk expanded — `--text-secondary`
- Plan name — `--text-sm`, `--text-primary`
- Hover: background `--base-overlay`
- Active: `border-left: 2px solid var(--accent)`, background `--base-overlay`

**Sub-document item (expanded):**
- `padding: 5px 12px 5px 28px` (indent 28px)
- Icon per doc type — `--text-secondary`, 12px
  - PLAN.md → `◈`
  - scope → `◉`
  - feature → `⊞`
  - phase → `◷`
  - limitation → `⚠`
- Name — `--text-sm`, `--text-secondary`
- Active: color `--accent-text`

**[+ New] button:**
- Text button, `--text-secondary`, 12px
- Hover: `--accent-text`
- Klik → modal input nama plan + pilih mode

---

### 4.3 Plan Detail — Document Tree View (Deep Mode)

```
┌─────────────────────────────────────────────────────┐
│  auth-system                          v1.3  [draft] │
│  Last updated 2 hours ago via claude-code           │
├─────────────────────────────────────────────────────┤
│  [Preview]  [Edit]                     [⊞ Collapse] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ▾ PLAN                                             │
│  ─────────────────────────────────────────────────  │
│  [rendered markdown content]                        │
│                                                     │
│  ▾ Scope                                            │
│  ─────────────────────────────────────────────────  │
│  [rendered markdown content]                        │
│                                                     │
│  ► Feature                              [collapsed] │
│  ► Phase 1                              [collapsed] │
│  ► Limitation                           [collapsed] │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Title area:**
- Plan name — `--text-lg`
- Version badge — `v1.3`, Geist Mono, `--text-xs`, `--text-secondary`
- Status badge — pill, background `--accent-dim` / `--status-*`, `--text-xs`
- Metadata line — `--text-xs`, `--text-secondary`, Geist Mono

**Section header (collapsible):**
- `padding: 12px 0 8px`
- Icon `▾`/`►` — 10px, `--text-secondary`
- Section name — `--text-md`, `--text-primary`
- Divider `─────` — `--base-border`, 1px, full width
- Klik header → toggle collapse dengan `--duration-md` ease

**Toolbar:**
- Preview / Edit toggle — dua text button, active state underline `--accent`
- Collapse All — `--text-secondary`, 12px

---

### 4.4 Editor (Edit Mode)

- CodeMirror 6 dengan custom theme sesuai token
- Background: `--base-void`
- Cursor: `--accent`
- Selection: `--accent-dim`
- Active line highlight: `--base-overlay` (subtle)
- Syntax highlight — minimal: heading bold, code block Geist Mono, link `--accent-text`
- Auto-save indicator: muncul di kanan bawah editor — "Saving..." → "Saved" → fade out
  - Text `--text-xs`, `--text-secondary`, Geist Mono

---

### 4.5 History Panel

```
┌───────────────────────────────┐
│ History              [›› hide]│
├───────────────────────────────┤
│                               │
│  ● 14:32                      │
│    plan-auth.md  v1.3         │
│    via claude-code            │
│                               │
│  ○ 13:15                      │
│    feature-auth.md  v1.1      │
│    via desktop                │
│                               │
│  ○ 11:00                      │
│    Created                    │
│    via claude-code            │
│                               │
└───────────────────────────────┘
```

- Header: `--text-sm`, `--text-primary` + hide button `--text-secondary`
- Timeline: vertical line `--base-border`, 1px, di kiri
- Dot: `●` active/latest = `--accent`, `○` lama = `--base-border-hi`
- Timestamp: Geist Mono, `--text-xs`, `--text-secondary`
- File name: `--text-sm`, `--text-primary`
- Version: Geist Mono, `--text-xs`, `--accent-text`
- changedBy badge: `via claude-code` / `via desktop` / `via manual`
  - `--text-xs`, background `--base-overlay`, `--radius-sm`, `padding: 2px 6px`

---

### 4.6 Search Overlay

Trigger: `Cmd+K` atau klik search bar di header

```
┌─────────────────────────────────────────────┐
│  ⌕  Search plans...                         │
├─────────────────────────────────────────────┤
│  auth-system                          PLAN  │
│  Implementation auth dengan JWT...          │
│                                             │
│  qris-integration                    SCOPE  │
│  Payment gateway menggunakan QRIS...        │
│                                             │
│  onboarding-flow                   FEATURE  │
│  User onboarding step pertama...            │
└─────────────────────────────────────────────┘
```

- Overlay muncul di tengah atas: `top: 80px`, centered, width `560px`
- Background `--base-surface`, border `--base-border-hi`, `--radius-md`
- Input: 16px, no border, background transparent
- Result item: `padding: 10px 16px`, hover `--base-overlay`
- Plan name: `--text-sm`, `--text-primary`, weight 500
- Doc type badge: `--text-xs`, `--base-overlay`, right-aligned
- Excerpt: `--text-xs`, `--text-secondary`, satu baris, truncate
- Keyboard nav: `↑↓` pilih, `Enter` buka, `Esc` tutup

---

### 4.7 New Plan Modal

```
┌─────────────────────────────────────────┐
│  New Plan                               │
│                                         │
│  Name                                   │
│  ┌─────────────────────────────────┐    │
│  │ auth-system                     │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Mode                                   │
│  ┌──────────┐  ┌──────────────────┐     │
│  │  Quick   │  │  Deep            │     │
│  │ 1 file   │  │ full tree        │     │
│  └──────────┘  └──────────────────┘     │
│                                         │
│              [Cancel]  [Create Plan]    │
└─────────────────────────────────────────┘
```

- Modal width: `440px`, centered, `--radius-lg`
- Backdrop: `rgba(0,0,0,0.6)`, blur `4px`
- Input: full width, `--base-overlay` background, `--base-border` border
- Mode selector: dua card, border `--base-border`, selected = border `--accent`
- Selected mode card bg: `--accent-dim`
- Tombol "Create Plan": background `--accent`, text white, hover `#4A5AE8`
- Tombol "Cancel": text button, `--text-secondary`

---

### 4.8 Status Badge

```
draft   → background #1E2030, text #5C5F78
review  → background #2A2200, text #D4A017
final   → background #0D2A1A, text #3DAA6A
```

- Font: Geist Mono, 10px, weight 500
- Padding: `2px 8px`
- Border radius: `--radius-sm` (3px)
- No border

---

### 4.9 Empty States

**Tidak ada project dipilih:**
```
              Open a project to start

              [Open Project]
```
- Center di main area
- Text: `--text-secondary`, `--text-sm`
- Button: border `--base-border`, text `--text-primary`, hover border `--accent`

**Project dipilih tapi tidak ada plan:**
```
              No plans in .docs/ yet

              Ask your AI agent to run
              init_plan() to get started
```
- Instruksional — bukan motivational fluff
- Code inline `init_plan()`: Geist Mono, `--accent-text`

---

## 5. Micro-interactions

| Trigger | Behavior | Duration |
|---|---|---|
| Hover sidebar item | bg `--base-overlay` | 120ms |
| Click plan → expand | sub-items slide down | 200ms ease-out |
| Toggle section collapse | height animate 0 ↔ auto | 200ms ease-out |
| Auto-save | "Saving..." text muncul di corner, fade out 1s setelah "Saved" | — |
| Search overlay open | fade in + slide down 8px | 200ms |
| New plan modal open | fade in + scale 0.97 → 1 | 200ms |
| History panel collapse | slide kanan 280px | 200ms ease-out |

**Yang tidak ada animasi:**
- Ganti plan (immediate — ini tool, bukan app consumer)
- Toggle Preview/Edit (immediate)

---

## 6. Node Graph View (Phase 2 Spec — Draft)

Dicatat di sini sebagai design intent, belum diimplementasi Phase 1.

```
Layout: Canvas infinite, pan + zoom
Nodes:  PLAN di kiri, features/phases di tengah, sub-items di kanan
Edge:   Kurva bezier, stroke 1px --base-border-hi
        Active connection: stroke --accent, animated dash

Node anatomy:
┌─────────────────────┐
│ ◈  auth-system      │  ← icon + name, --text-sm
│    Direncanakan     │  ← status, --text-xs --text-secondary
└─────────────────────┘
  background: --base-surface
  border: 1px --base-border
  selected border: 1px --accent
  width: 200px, height: auto
  padding: 10px 14px

Library kandidat: @xyflow/svelte (Svelte port dari React Flow)
```

---

## 7. File Structure (Frontend)

```
apps/desktop/src/
├── lib/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.svelte
│   │   │   ├── Sidebar.svelte
│   │   │   └── HistoryPanel.svelte
│   │   ├── plan/
│   │   │   ├── PlanItem.svelte         ← sidebar item + tree
│   │   │   ├── PlanDetail.svelte       ← main area wrapper
│   │   │   ├── DocumentSection.svelte  ← collapsible section
│   │   │   └── StatusBadge.svelte
│   │   ├── editor/
│   │   │   ├── MarkdownPreview.svelte
│   │   │   └── CodeMirrorEditor.svelte
│   │   ├── search/
│   │   │   └── SearchOverlay.svelte
│   │   └── ui/
│   │       ├── Modal.svelte
│   │       ├── Button.svelte
│   │       └── Badge.svelte
│   ├── stores/
│   │   ├── project.svelte.ts    ← active project, project list
│   │   ├── plans.svelte.ts      ← plans dalam active project
│   │   └── ui.svelte.ts         ← search open, history collapsed, dll
│   └── api/
│       └── tauri.ts             ← wrapper Tauri invoke commands
├── routes/
│   └── +page.svelte             ← single page app
└── app.html
```

---

## 8. Accessibility Baseline

- Semua interactive element punya `:focus-visible` ring: `2px solid var(--accent)`, offset `2px`
- Color contrast minimum 4.5:1 untuk body text (`--text-primary` di atas `--base-void`)
- Keyboard nav: Tab untuk sidebar items, Enter untuk open, Esc untuk modal/overlay
- `prefers-reduced-motion`: semua transition di-set `0ms` kalau user prefer reduced motion

---

*GUI.md ini adalah living spec. Update seiring implementasi — document apa yang berubah dari spec awal di history.*
