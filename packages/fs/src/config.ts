import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type { ProjectConfig, PlanMode } from "@plannic/core";
import { getConfigPath } from "./slug.js";

export async function readConfig(cwd: string): Promise<{ found: boolean; config?: ProjectConfig; raw: string; path: string }> {
  const filePath = getConfigPath(cwd);
  try {
    const rawContent = await fs.readFile(filePath, "utf-8");
    const parsed = matter(rawContent);
    const data = parsed.data as Record<string, unknown>;

    const stackRaw = data.stack;
    const stack: string[] = Array.isArray(stackRaw)
      ? stackRaw.map(String)
      : typeof stackRaw === "string"
      ? stackRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const default_mode: PlanMode = data.default_mode === "quick" ? "quick" : "deep";
    const project = typeof data.project === "string" ? data.project : path.basename(cwd);
    const lang = typeof data.lang === "string" ? data.lang : undefined;

    const config: ProjectConfig = {
      rawContent,
      project,
      stack,
      default_mode,
      lang,
      body: parsed.content.trim(),
    };

    return {
      found: true,
      config,
      raw: rawContent,
      path: filePath,
    };
  } catch (error: unknown) {
    const isEnoent = (error as NodeJS.ErrnoException).code === "ENOENT";
    if (isEnoent) {
      return {
        found: false,
        raw: "",
        path: filePath,
      };
    }
    throw error;
  }
}

export async function writeConfig(
  cwd: string,
  config: { project: string; stack: string[]; default_mode: PlanMode; lang?: string; body?: string }
): Promise<string> {
  const filePath = getConfigPath(cwd);
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  const frontmatter = {
    project: config.project,
    stack: config.stack,
    default_mode: config.default_mode,
    ...(config.lang ? { lang: config.lang } : {}),
  };

  const body = config.body ?? "## Context\n\n## Planning Rules\n";
  const content = matter.stringify(body, frontmatter);
  await fs.writeFile(filePath, content, "utf-8");
  return filePath;
}
