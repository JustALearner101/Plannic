# Plannic CLI Specification & User Guide

**Document Version:** 1.0  
**Status:** Approved  
**Scope:** Terminal UI (TUI), Command REPL, Slash Commands, Tab Autocomplete, and Keyboard Navigation  

---

## 1. Overview & Philosophy

Plannic CLI (`@plannic/cli`) adalah antarmuka terminal interaktif berbasis **OpenTUI** dan **SolidJS** yang dirancang khusus untuk solo developer dan AI engineer yang bekerja cepat langsung dari terminal.

Mengadopsi model **Command-Driven REPL** (terinspirasi dari [OpenCode](https://github.com/anomalyco/opencode) dan Claude Code), Plannic CLI mengedepankan:
- **Zero Bloat & Estetika Workshop**: Palet monochrome gelap (`#0F1117`), border 1px tipis, dan typography yang bersih.
- **Tahan Glitch Ukuran Terminal**: Menggunakan layout stream kronologis yang mengalir ke atas (*feed*) dan input bar terfokus di bagian bawah yang stabil di ukuran layar berapa pun.
- **Keyboard-First Ergonomics**: Seluruh operasi dikendalikan via slash commands (`/command`) dan didukung sistem **Tab Autocomplete** dinamis.

---

## 2. Cara Menjalankan CLI

### 2.1 Mode Interaktif (Interactive REPL)
Untuk membuka antarmuka TUI interaktif:
```bash
# Jalankan via Bun
bun run plan

# Atau buka langsung dengan plan tertentu
bun run plan open phase-3-interactive-kanban-board
```

### 2.2 Mode Non-Interaktif (Headless CLI)
Plannic CLI juga dapat dipanggil sebagai perintah baris terminal standar:
```bash
# Menampilkan daftar plan di terminal
bun run plan list
bun run plan list --json

# Melakukan fuzzy search dokumen
bun run plan search "kanban"

# Membuat plan baru tanpa membuka TUI
bun run plan create "Authentication Service" --mode deep

# Menampilkan cheatsheet help
bun run plan --help
```

---

## 3. Daftar Lengkap Slash Commands

Ketika berada di dalam sesi REPL interaktif, seluruh perintah diawali dengan karakter slash (`/`):

| Perintah | Alias | Argumen | Kategori | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| **`/list`** | `/ls` | - | Navigation | Menampilkan daftar seluruh plan di repositori dalam format tabel ringkas |
| **`/open`** | `/plan` | `<slug>` | Navigation | Memuat dan membuka dokumen plan ke dalam feed viewer |
| **`/doc`** | - | `<type>` | Navigation | Mengganti sub-dokumen aktif (`plan`, `scope`, `feature`, `phase`, `limitation`) |
| **`/new`** | `/create`, `/init` | `<name> [--mode quick\|deep]` | Planning | Menginisialisasi plan baru di folder `.docs/` |
| **`/search`** | `/find` | `<query>` | Planning | Melakukan in-memory fuzzy search pada judul dan isi markdown |
| **`/move`** | - | `<task-id> <status>` | Planning | Mengubah status checklist task pada roadmap phase (`todo`, `in_progress`, `done`) |
| **`/history`** | - | `[slug]` | Planning | Menampilkan 10 entri riwayat audit changelog terakhir dari plan |
| **`/desktop`** | - | - | System | Menampilkan panduan hand-off membuka aplikasi Plannic Desktop GUI |
| **`/clear`** | - | - | System | Membersihkan riwayat stream di feed terminal |
| **`/help`** | `/?` | - | System | Menampilkan cheatsheet panduan perintah dan keyboard shortcut |
| **`/exit`** | `/quit`, `/q` | - | System | Menutup sesi Plannic CLI dengan bersih |

---

## 4. Dynamic Tab Autocomplete Engine

Salah satu fitur unggulan Plannic CLI adalah sistem **Tab Autocomplete kontekstual** yang bekerja persis seperti perintah `cd <folder> [Tab]` pada shell modern:

```
┌── SUGGESTED PLANS (1 of 4) ─────────────────────── [Tab] Complete [Enter] Open [Esc] Close ──┐
│ › phase-3-interactive-kanban-board   Phase 3: Interactive Kanban Board    [deep] [draft]     │
│   plannic-cli-tui-revamp-opencode    Plannic CLI TUI Revamp OpenCode      [deep] [draft]     │
│   phase-2-node-graph-view            Phase 2: Node Graph View             [deep] [draft]     │
│   plannic-cli-opentui                Plannic CLI OpenTUI                  [deep] [draft]     │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
› /open phase-█
```

### 4.1 Tahapan Autocomplete:
1. **Perintah (`/`)**:
   - Ketik `/` di prompt bar untuk langsung membuka popover daftar ke-11 slash commands.
   - Ketik huruf awal (misal `/op`) untuk memfilter command secara real-time.
2. **Slug Plan (`/open ` atau `/history `)**:
   - Ketik `/open ` lalu tekan `Tab` atau `Panah Bawah`: popover otomatis menampilkan seluruh slug plan proyek beserta nama dan statusnya.
   - Anda tidak perlu menghafal atau mengetik slug panjang secara manual.
3. **Sub-Dokumen (`/doc `)**:
   - Ketik `/doc ` lalu tekan `Tab`: popover menyarankan sub-dokumen yang tersedia (`plan`, `scope`, `feature`, `phase`, `limitation`).
4. **Status Task (`/move <taskId> `)**:
   - Ketik `/move 1.1 ` lalu tekan `Tab`: popover menyarankan pilihan status valid (`todo`, `in_progress`, `done`).
5. **Mode Plan (`/new <name> --mode `)**:
   - Ketik `--mode ` lalu tekan `Tab`: popover menyarankan mode `deep` atau `quick`.

### 4.2 Smooth Scrolling Viewport:
- Popover autocomplete menampilkan 6 item per tampilan dengan sliding window dinamis.
- Terdapat indikator navigasi:
  - Header posisi: `SUGGESTED PLANS (1 of 11)`
  - Indikator atas: `▲ x more above...` jika ada item tersembunyi di atas.
  - Indikator bawah: `▼ x more below...` jika ada item tersembunyi di bawah.
- **Wrap-around**: Menekan panah bawah di item terakhir otomatis berputar ke item pertama, dan sebaliknya.

---

## 5. Keyboard Navigation & Shortcuts

| Shortcut | Konteks | Aksi |
| :--- | :--- | :--- |
| **`Tab`** | Autocomplete Terbuka | Melengkapi saran terpilih ke prompt bar |
| **`Enter`** | Autocomplete Terbuka | Menjalankan perintah langsung (jika executable) atau melengkapi argumen |
| **`Enter`** | Prompt Normal | Mengirim dan mengeksekusi perintah di input bar |
| **`Panah Atas / Bawah`** | Autocomplete Terbuka | Navigasi naik/turun pada daftar saran autocomplete |
| **`Panah Atas / Bawah`** | Prompt Kosong | Menjelajahi riwayat perintah sebelumnya (*command history*) |
| **`PageUp / PageDown`** | Autocomplete Terbuka | Melompat 5 item sekaligus pada daftar saran |
| **`Ctrl+K` / `Ctrl+P`** | Global | Toggle cepat menu slash commands di prompt bar |
| **`Esc`** | Autocomplete Terbuka | Menutup popover autocomplete |
| **`Esc`** | Prompt Berisi Teks | Mengosongkan teks di prompt bar |
| **`Esc`** | Prompt Kosong | **Keluar dari aplikasi Plannic CLI** |
| **`Ctrl+C`** | Global | Membatalkan baris ketikan prompt (tidak mematikan aplikasi; aman untuk copy terminal) |
| **`Ctrl+V`** | Global | Menempelkan teks dari clipboard sistem ke prompt bar |
