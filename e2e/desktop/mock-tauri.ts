import type { Page } from "@playwright/test";

export interface MockFilesystem {
  [filePath: string]: string;
}

/**
 * Injects a full Tauri IPC mock into the Playwright browser page before load.
 * This simulates the Tauri 2 Rust backend for filesystem operations and dialogs
 * entirely in-browser with zero native build overhead.
 */
export async function setupDesktopTauriMock(
  page: Page,
  options: {
    projectPath: string;
    files: MockFilesystem;
  }
) {
  const { projectPath, files } = options;

  // Set localStorage so projectStore immediately opens projectPath
  await page.addInitScript(
    ({ path }) => {
      const config = {
        lastPath: path,
        recentPaths: [path],
      };
      localStorage.setItem("plannic_projects_config", JSON.stringify(config));
    },
    { path: projectPath }
  );

  // Inject Tauri IPC internals mock
  await page.addInitScript(
    ({ initialFiles, defaultProjectPath }) => {
      const vfs: Record<string, string> = { ...initialFiles };

      const normalize = (p: string) => p.replace(/\\/g, "/").replace(/\/+$/, "");

      const mockInvoke = async (cmd: string, args: any) => {
        // console.log('[Tauri Mock IPC]', cmd, args);
        switch (cmd) {
          case "read_directory": {
            const reqDir = normalize(args.path);
            const filenames = new Set<string>();
            for (const key of Object.keys(vfs)) {
              const normKey = normalize(key);
              if (normKey.startsWith(reqDir + "/")) {
                const sub = normKey.slice(reqDir.length + 1);
                const firstPart = sub.split("/")[0];
                if (firstPart) filenames.add(firstPart);
              }
            }
            return Array.from(filenames);
          }

          case "read_text_file": {
            const normPath = normalize(args.path);
            for (const [k, content] of Object.entries(vfs)) {
              if (normalize(k) === normPath) {
                return content;
              }
            }
            throw new Error(`File not found: ${args.path}`);
          }

          case "write_text_file": {
            const normPath = normalize(args.path);
            vfs[normPath] = args.content;
            (window as any).__PLANNIC_VFS__ = vfs;
            return;
          }

          case "file_exists": {
            const normPath = normalize(args.path);
            const exists = Object.keys(vfs).some(
              (k) => normalize(k) === normPath || normalize(k).startsWith(normPath + "/")
            );
            return exists;
          }

          case "create_directory": {
            return;
          }

          case "remove_file": {
            const normPath = normalize(args.path);
            delete vfs[normPath];
            return;
          }

          case "pick_project_folder": {
            return defaultProjectPath;
          }

          default: {
            if (cmd.startsWith("plugin:")) return null;
            return null;
          }
        }
      };

      // Set up Tauri internals
      const callbacks = new Map();
      (window as any).__TAURI_INTERNALS__ = {
        invoke: mockInvoke,
        callbacks,
        transformCallback: (cb: any) => {
          const id = Math.floor(Math.random() * 1000000);
          callbacks.set(id, cb);
          return id;
        },
        unregisterCallback: (id: any) => callbacks.delete(id),
      };

      (window as any).__TAURI_EVENT_PLUGIN_INTERNALS__ = {
        unregisterListener: () => {},
      };

      (window as any).__PLANNIC_VFS__ = vfs;
    },
    { initialFiles: files, defaultProjectPath: projectPath }
  );
}

/**
 * Returns a standard set of mock documents (.docs/) for Desktop UI testing.
 */
export function getStandardMockFiles(projectPath: string): MockFilesystem {
  const norm = (p: string) => p.replace(/\\/g, "/").replace(/\/+$/, "");
  const base = norm(projectPath);
  return {
    [`${base}/.plannic/config.md`]: `---
project: Desktop Test
stack: [Tauri, Svelte 5, TypeScript, Bun]
default_mode: deep
lang: id
---
`,
    [`${base}/.docs/plan-auth-system.md`]: `---
id: auth-1
plan: auth-system
type: plan
name: Authentication System
slug: auth-system
version: "1.0"
status: accepted
mode: deep
documents: ["plan-auth-system.md", "scope-auth-system.md", "feature-auth-system.md", "phase-1-auth-system.md", "limitation-auth-system.md"]
---
# Authentication System
## Overview
Main auth plan.
`,
    [`${base}/.docs/scope-auth-system.md`]: `---
id: auth-scope-1
plan: auth-system
type: scope
name: Auth System Scope
slug: auth-system
version: "1.0"
status: draft
---
## In Scope
- OAuth2 and JWT
`,
    [`${base}/.docs/feature-auth-system.md`]: `---
id: auth-feat-1
plan: auth-system
type: feature
name: Auth Features
slug: auth-system
version: "1.0"
status: draft
---
## Features
- Google login
`,
    [`${base}/.docs/phase-1-auth-system.md`]: `---
id: auth-phase-1
plan: auth-system
type: phase
name: Auth Phase 1
slug: auth-system
version: "1.0"
status: draft
---
## Deliverables
- [ ] Task 1.1: Setup OAuth endpoint
- [/] Task 1.2: Refresh token service
- [x] Task 1.3: User profile schema
`,
    [`${base}/.docs/limitation-auth-system.md`]: `---
id: auth-limit-1
plan: auth-system
type: limitation
name: Auth Limitations
slug: auth-system
version: "1.0"
status: draft
---
## Limitations
- No SMS OTP
`,
    [`${base}/.docs/plan-kanban-board.md`]: `---
id: kanban-1
plan: kanban-board
type: plan
name: Kanban Board Initiative
slug: kanban-board
version: "1.0"
status: in_progress
mode: deep
documents: ["plan-kanban-board.md", "phase-1-kanban-board.md"]
---
# Kanban Board
`,
    [`${base}/.docs/phase-1-kanban-board.md`]: `---
id: kanban-phase-1
plan: kanban-board
type: phase
name: Kanban Board Phase
slug: kanban-board
version: "1.0"
status: draft
---
## Tasks
- [ ] Task K1: Drag drop animation
- [x] Task K2: Column styling
`,
  };
}
