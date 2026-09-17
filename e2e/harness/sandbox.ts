import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export interface TempWorkspace {
  path: string;
  docsPath: string;
  configPath: string;
  historyPath: string;
  adrsPath: string;
  specsPath: string;
  cleanup: () => Promise<void>;
}

/**
 * Creates an isolated temporary directory for testing Plannic without touching
 * the project repository's actual .docs/ or .plannic/ directories.
 */
export async function createTempWorkspace(prefix = "plannic-e2e-"): Promise<TempWorkspace> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  const docsPath = path.join(tmpDir, ".docs");
  const configPath = path.join(tmpDir, ".plannic", "config.md");
  const historyPath = path.join(docsPath, ".history");
  const adrsPath = path.join(docsPath, "adrs");
  const specsPath = path.join(docsPath, "specs");

  // Create standard directories
  await fs.mkdir(path.join(tmpDir, ".plannic"), { recursive: true });
  await fs.mkdir(docsPath, { recursive: true });
  await fs.mkdir(historyPath, { recursive: true });
  await fs.mkdir(adrsPath, { recursive: true });
  await fs.mkdir(specsPath, { recursive: true });

  // Write default config
  const defaultConfig = `---
project: Plannic E2E Test
stack: [Tauri, Svelte 5, TypeScript, Bun]
default_mode: deep
lang: id
---

## Context
E2E Sandbox isolated testing repository.
`;
  await fs.writeFile(configPath, defaultConfig, "utf-8");

  const cleanup = async () => {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error if already removed
    }
  };

  return {
    path: tmpDir,
    docsPath,
    configPath,
    historyPath,
    adrsPath,
    specsPath,
    cleanup,
  };
}

/**
 * Executes an async test function within an isolated workspace and guarantees cleanup.
 */
export async function withTempWorkspace<T>(
  fn: (workspace: TempWorkspace) => Promise<T>,
  prefix = "plannic-e2e-"
): Promise<T> {
  const workspace = await createTempWorkspace(prefix);
  try {
    return await fn(workspace);
  } finally {
    await workspace.cleanup();
  }
}
