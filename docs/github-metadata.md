# 🚀 GitHub Repository Metadata & Discovery Guide (`docs/github-metadata.md`)

> **Optimization Kit for GitHub Repository SEO, Social Discovery, and Topics**

---

## 1. Repository "About" Section

Navigate to your repository homepage on GitHub: `https://github.com/JustALearner101/Plannic` → Click the ⚙️ icon next to **About** in the right sidebar.

### Description
> `Local-first planning workbench & workflow enforcement system for AI coding agents (Claude Code, Cursor, Windsurf) with ADRs, Living Specs, Kanban & Ghost Cursor.`

*(164 characters — fits cleanly within GitHub's 350-character limit and mobile preview cards).*

### Website
```text
https://github.com/JustALearner101/Plannic#readme
```
*(Or link to GitHub Releases if preferred: `https://github.com/JustALearner101/Plannic/releases`).*

---

## 2. Recommended Repository Topics (Tags)

Paste the following comma-separated list into the **Topics** field:

```text
mcp, claude-code, cursor, windsurf, tauri, svelte, local-first, architecture-decision-records, planning, ai-agents, opentui, workflow-enforcement
```

### Strategic Topic Breakdown:

| Topic | Primary Search Intent | Value |
| :--- | :--- | :--- |
| `mcp` | Developers looking for Model Context Protocol servers | 🔴 High volume |
| `claude-code` | Users searching for tools compatible with Anthropic's Claude Code CLI | 🔴 Trending |
| `cursor` | Cursor IDE users wanting persistent planning tools | 🔴 High volume |
| `windsurf` | Codeium Windsurf agent users | 🟠 Emerging |
| `tauri` | Rust + Tauri ecosystem developers | 🟠 Niche / High star affinity |
| `svelte` | Svelte 5 / runes showcase projects | 🟠 Community recognition |
| `local-first` | Privacy-conscious, offline-first developer tools | 🟠 Strong developer ethos |
| `architecture-decision-records` | Engineers wanting structured MADR / ADR management | 🟡 High enterprise value |
| `planning` | General agile, kanban, and sprint planning | 🟡 Broad discovery |
| `ai-agents` | Agentic workflows and developer tooling | 🔴 Maximum reach |
| `opentui` | Terminal UI showcase projects | 🟡 Terminal enthusiast discovery |
| `workflow-enforcement` | Guardrails and safe autonomous coding systems | 🟢 High uniqueness |

---

## 3. Social Preview Card

- **Recommended Dimensions**: 1280 × 640 px (PNG or JPEG under 1MB).
- **Design Elements**:
  - Dark background (`#0F1117`).
  - Plannic ASCII banner or SVG logo centered in white / cyan (`#38BDF8`).
  - Headline: *"The local-first planning workbench for AI coding agents."*
  - Badges: `Tauri 2` • `Svelte 5` • `19 MCP Tools` • `Zero Cloud`.
- **Upload Location**: Repository Settings → General → **Social preview**.

---

## 4. GitHub Release v0.3.2 Template

When tagging `v0.3.2`:

```markdown
## What's New in v0.3.2

### 📚 Dedicated Documentation Subsystem
- Added comprehensive [Configuration Reference](docs/config-reference.md) detailing all `.plannic/config.md` options, Zod schemas, and workflow guardrails (`strict_kanban`, `enforce_feedback_artifact`).
- Added [System Architecture Guide](docs/architecture.md) covering monorepo topology, IPC, and stdio MCP transport.
- Added [Internal Mechanics Guide](docs/internal-mechanics.md) explaining atomic file writing for the Ghost Cursor and Markdown task state transitions.

### 🌐 Cross-Platform POSIX Distribution
- Automated GitHub Actions matrix builds for:
  - `plannic-linux-x64.tar.gz`
  - `plannic-linux-arm64.tar.gz`
  - `plannic-darwin-x64.tar.gz`
  - `plannic-darwin-arm64.tar.gz`
- Universal POSIX curl installer now active: `curl -fsSL https://raw.githubusercontent.com/JustALearner101/Plannic/main/scripts/install.sh | sh`.

### 🩺 Reliability & Diagnostics
- `plannic doctor --mcp` verified with live stdio handshake and full workspace health checks.
- Cleaned all hardcoded paths from user runbooks.
```
