import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import {
  type Plan,
  type PlanDocument,
  type PlanSummary,
  type DocFrontmatter,
  type DocType,
  type PlanMode,
  type HistoryEntry,
  getHierarchicalDocFilename,
  getLegacyDocFilename,
} from '@plannic/core';

// Low-level filesystem wrappers
export async function readTextFile(path: string): Promise<string> {
  return await invoke<string>('read_text_file', { path });
}

export async function writeTextFile(path: string, content: string): Promise<void> {
  await invoke<void>('write_text_file', { path, content });
}

export async function readDirectory(path: string): Promise<string[]> {
  return await invoke<string[]>('read_directory', { path });
}

export async function createDirectory(path: string): Promise<void> {
  await invoke<void>('create_directory', { path });
}

export async function fileExists(path: string): Promise<boolean> {
  return await invoke<boolean>('file_exists', { path });
}

export async function removeFile(path: string): Promise<void> {
  await invoke<void>('remove_file', { path });
}

export async function openDirectoryDialog(): Promise<string | null> {
  // 1. First priority: invoke direct native Rust command (uses Windows native dialog, no ACL restrictions)
  try {
    const selected = await invoke<string | null>('pick_project_folder');
    if (selected) return selected;
    if (selected === null) return null; // user canceled
  } catch (nativeErr) {
    console.warn('Native pick_project_folder failed, trying plugin-dialog:', nativeErr);
  }

  // 2. Second priority: try plugin-dialog
  try {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Select Project Folder',
    });
    if (typeof selected === 'string') return selected;
    if (selected === null) return null;
  } catch (pluginErr) {
    console.warn('plugin-dialog open failed:', pluginErr);
  }

  // 3. Fallback: prompt for path (works in web browser or if OS dialog fails)
  const manual = window.prompt('Enter project folder path (e.g. D:\\Project\\Plannic):');
  return manual ? manual.trim() : null;
}

// Simple YAML frontmatter parser and serializer for the browser/desktop
export function parseDoc(raw: string, filePath: string): PlanDocument | null {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;

  const yamlLines = match[1].split('\n');
  const body = match[2];
  const data: Record<string, unknown> = {};

  for (const line of yamlLines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();

    // Parse primitive arrays or strings
    if (val.startsWith('[') && val.endsWith(']')) {
      const inside = val.slice(1, -1).trim();
      data[key] = inside ? inside.split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')) : [];
    } else {
      val = val.replace(/^['"]|['"]$/g, '');
      data[key] = val;
    }
  }

  const fm = data as unknown as DocFrontmatter;
  return {
    slug: fm.slug || '',
    type: fm.type || 'plan',
    path: filePath,
    frontmatter: fm,
    body,
    rawContent: raw,
  };
}

export function stringifyDoc(data: Record<string, unknown>, body: string): string {
  const lines: string[] = ['---'];
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      lines.push(`${k}: [${v.map((item) => JSON.stringify(item)).join(', ')}]`);
    } else {
      lines.push(`${k}: ${v}`);
    }
  }
  lines.push('---');
  lines.push(body);
  return lines.join('\n');
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

function joinPath(...parts: string[]): string {
  return parts.map((p) => p.replace(/\\/g, '/').replace(/\/+$/, '')).join('/');
}

// High-level Plan API
export async function listProjectPlans(cwd: string): Promise<PlanSummary[]> {
  const docsDir = joinPath(cwd, '.docs');
  const plansDir = joinPath(docsDir, 'plans');
  const planSummaries = new Map<string, PlanSummary>();

  // 1. Scan hierarchical plans under .docs/plans/
  try {
    const entries = await readDirectory(plansDir);
    for (const slug of entries) {
      const planDirPath = joinPath(plansDir, slug);
      const planRootPath = joinPath(planDirPath, 'plan.md');
      try {
        const raw = await readTextFile(planRootPath);
        const doc = parseDoc(raw, planRootPath);
        if (doc) {
          const fm = doc.frontmatter;
          const mode = fm.mode ?? 'deep';
          let docCount = 1;
          try {
            const dirFiles = await readDirectory(planDirPath);
            docCount = dirFiles.filter((f) => f.endsWith('.md')).length;
          } catch {
            // ignore
          }

          planSummaries.set(slug, {
            slug: fm.slug || slug,
            name: fm.name || slug,
            mode,
            status: fm.status || 'draft',
            version: fm.version || '1.0',
            lastUpdated: fm.lastUpdated || fm.created || '',
            description: fm.description || '',
            documentCount: docCount,
            format: 'hierarchical',
          });
        }
      } catch {
        // ignore non-plan subfolder
      }
    }
  } catch {
    // .docs/plans does not exist or cannot be read
  }

  // 2. Scan legacy flat plans under .docs/
  try {
    const files = await readDirectory(docsDir);
    for (const file of files) {
      if (file.startsWith('plan-') && file.endsWith('.md')) {
        const filePath = joinPath(docsDir, file);
        try {
          const raw = await readTextFile(filePath);
          const doc = parseDoc(raw, filePath);
          if (doc) {
            const fm = doc.frontmatter;
            const slug = fm.slug;
            if (planSummaries.has(slug)) continue;

            const mode = fm.mode ?? 'quick';
            let docCount = 1;
            if (mode === 'deep') {
              docCount = files.filter(
                (f) => f.endsWith('.md') && f.includes(`-${slug}.md`)
              ).length;
            }

            planSummaries.set(slug, {
              slug,
              name: fm.name || slug,
              mode,
              status: fm.status || 'draft',
              version: fm.version || '1.0',
              lastUpdated: fm.lastUpdated || fm.created || '',
              description: fm.description || '',
              documentCount: docCount,
              format: 'legacy_flat',
            });
          }
        } catch {
          // ignore corrupted file
        }
      }
    }
  } catch {
    // ignore
  }

  const plans = Array.from(planSummaries.values());
  plans.sort(
    (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );
  return plans;
}

export async function readProjectPlan(cwd: string, slug: string): Promise<Plan | null> {
  const docsDir = joinPath(cwd, '.docs');
  const planDir = joinPath(docsDir, 'plans', slug);
  const hierarchicalRootPath = joinPath(planDir, 'plan.md');

  // 1. Try hierarchical plan first
  try {
    const raw = await readTextFile(hierarchicalRootPath);
    const rootDoc = parseDoc(raw, hierarchicalRootPath);
    if (rootDoc) {
      const mode = rootDoc.frontmatter.mode ?? 'deep';
      const documents: PlanDocument[] = [rootDoc];

      try {
        const files = await readDirectory(planDir);
        for (const file of files) {
          if (!file.endsWith('.md') || file === 'plan.md') continue;
          const docPath = joinPath(planDir, file);
          try {
            const docRaw = await readTextFile(docPath);
            const doc = parseDoc(docRaw, docPath);
            if (doc) {
              documents.push(doc);
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }

      return {
        slug,
        mode,
        format: 'hierarchical',
        root: rootDoc,
        documents,
      };
    }
  } catch {
    // Fall back to legacy flat
  }

  // 2. Try legacy flat plan
  const rootPath = joinPath(docsDir, `plan-${slug}.md`);
  try {
    const raw = await readTextFile(rootPath);
    const rootDoc = parseDoc(raw, rootPath);
    if (!rootDoc) return null;

    const mode = rootDoc.frontmatter.mode ?? 'quick';
    const documents: PlanDocument[] = [rootDoc];

    if (mode === 'deep') {
      const files = await readDirectory(docsDir);
      for (const file of files) {
        if (!file.endsWith('.md') || file === `plan-${slug}.md`) continue;
        if (file.includes(`-${slug}.md`)) {
          const docPath = joinPath(docsDir, file);
          try {
            const docRaw = await readTextFile(docPath);
            const doc = parseDoc(docRaw, docPath);
            if (doc && doc.frontmatter.plan === slug) {
              documents.push(doc);
            }
          } catch {
            // ignore
          }
        }
      }
    }

    return {
      slug,
      mode,
      format: 'legacy_flat',
      root: rootDoc,
      documents,
    };
  } catch {
    return null;
  }
}

export async function saveProjectDocument(
  cwd: string,
  slug: string,
  docType: DocType,
  body: string,
  changeSummary = 'Updated via desktop'
): Promise<{ success: boolean; version: string }> {
  const docsDir = joinPath(cwd, '.docs');
  const planDir = joinPath(docsDir, 'plans', slug);
  const hierarchicalFilename = getHierarchicalDocFilename(docType);
  const hierarchicalPath = joinPath(planDir, hierarchicalFilename);

  let targetPath = hierarchicalPath;
  let filename = hierarchicalFilename;

  // Determine whether it's hierarchical or legacy
  if (await fileExists(hierarchicalPath)) {
    targetPath = hierarchicalPath;
    filename = hierarchicalFilename;
  } else if (docType === 'phase' && (await fileExists(joinPath(planDir, 'phase.md')))) {
    targetPath = joinPath(planDir, 'phase.md');
    filename = 'phase.md';
  } else {
    // Check legacy flat file
    const legacyFilename = getLegacyDocFilename(slug, docType);
    const legacyPath = joinPath(docsDir, legacyFilename);
    if (await fileExists(legacyPath)) {
      targetPath = legacyPath;
      filename = legacyFilename;
    } else if (await fileExists(planDir)) {
      // Default to hierarchical if planDir exists
      targetPath = hierarchicalPath;
      filename = hierarchicalFilename;
    } else {
      targetPath = legacyPath;
      filename = legacyFilename;
    }
  }

  const raw = await readTextFile(targetPath);
  const doc = parseDoc(raw, targetPath);
  if (!doc) throw new Error(`Could not parse ${targetPath}`);

  const currentVersion = parseFloat(doc.frontmatter.version || '1.0');
  const nextVersion = (isNaN(currentVersion) ? 1.0 : currentVersion + 0.1).toFixed(1);
  const now = new Date().toISOString();

  const data = {
    ...doc.frontmatter,
    version: nextVersion,
    lastUpdated: now,
  };

  const newContent = stringifyDoc(data as unknown as Record<string, unknown>, body);
  await writeTextFile(targetPath, newContent);

  // Append history
  const historyPath = joinPath(docsDir, '.history', `plan-${slug}.jsonl`);
  const historyEntry: HistoryEntry = {
    timestamp: now,
    type: 'updated',
    version: nextVersion,
    summary: changeSummary,
    changedBy: 'desktop',
    document: filename,
    docType,
  };

  try {
    let existingHistory = '';
    if (await fileExists(historyPath)) {
      existingHistory = await readTextFile(historyPath);
    }
    const updatedHistory = existingHistory + JSON.stringify(historyEntry) + '\n';
    await writeTextFile(historyPath, updatedHistory);
  } catch {
    // Ignore history error
  }

  return { success: true, version: nextVersion };
}

export async function readProjectHistory(cwd: string, slug: string): Promise<HistoryEntry[]> {
  const historyPath = joinPath(cwd, '.docs', '.history', `plan-${slug}.jsonl`);
  let raw = '';
  try {
    raw = await readTextFile(historyPath);
  } catch {
    // Fallback: check without 'plan-' prefix
    const altPath = joinPath(cwd, '.docs', '.history', `${slug}.jsonl`);
    try {
      raw = await readTextFile(altPath);
    } catch {
      return [];
    }
  }

  const lines = raw.trim().split('\n').filter((l) => l.trim().length > 0);
  const entries: HistoryEntry[] = [];
  for (const line of lines) {
    try {
      entries.push(JSON.parse(line));
    } catch {
      // Skip
    }
  }
  return entries.reverse();
}

export async function initProjectPlan(cwd: string, name: string, mode: PlanMode): Promise<string> {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const docsDir = joinPath(cwd, '.docs');
  const planDir = joinPath(docsDir, 'plans', slug);
  await createDirectory(docsDir);
  await createDirectory(joinPath(docsDir, 'plans'));
  await createDirectory(planDir);
  await createDirectory(joinPath(docsDir, '.history'));

  const now = new Date().toISOString();

  if (mode === 'quick') {
    const rootPath = joinPath(planDir, 'plan.md');
    const fm = {
      id: crypto.randomUUID(),
      plan: slug,
      type: 'plan',
      name,
      slug,
      version: '1.0',
      status: 'draft',
      created: now,
      lastUpdated: now,
      tags: [],
      description: `${name} plan`,
      mode: 'quick',
    };
    const body = `# ${name}\n\n## Overview\n\n## Implementation Details\n`;
    await writeTextFile(rootPath, stringifyDoc(fm, body));
  } else {
    // Deep mode
    const rootPath = joinPath(planDir, 'plan.md');
    const scopePath = joinPath(planDir, 'scope.md');
    const featurePath = joinPath(planDir, 'feature.md');
    const phasePath = joinPath(planDir, 'phase-1.md');
    const limitPath = joinPath(planDir, 'limitation.md');

    const rootFm = {
      id: crypto.randomUUID(),
      plan: slug,
      type: 'plan',
      name,
      slug,
      version: '1.0',
      status: 'draft',
      created: now,
      lastUpdated: now,
      tags: [],
      description: `${name} plan`,
      mode: 'deep',
    };
    await writeTextFile(
      rootPath,
      stringifyDoc(
        rootFm,
        `# ${name}\n\n## Goal\n\n## Document Index\n- [Scope](./scope.md)\n- [Feature Breakdown](./feature.md)\n- [Phase 1 Implementation](./phase-1.md)\n- [Limitations](./limitation.md)\n`
      )
    );

    const makeFm = (type: DocType, title: string) => ({
      id: crypto.randomUUID(),
      plan: slug,
      type,
      name: `${name} — ${title}`,
      slug,
      version: '1.0',
      status: 'draft',
      created: now,
      lastUpdated: now,
      tags: [],
      description: `${title} for ${name}`,
    });

    await writeTextFile(
      scopePath,
      stringifyDoc(makeFm('scope', 'Scope'), `## In Scope\n\n- Core functionality\n\n## Out of Scope\n\n- Secondary features\n`)
    );
    await writeTextFile(
      featurePath,
      stringifyDoc(makeFm('feature', 'Features'), `## Core Features\n\n### Feature 1\nDescription and acceptance criteria.\n`)
    );
    await writeTextFile(
      phasePath,
      stringifyDoc(makeFm('phase', 'Phase 1'), `## Deliverables\n\n- Step 1\n- Step 2\n\n## Verification\n`)
    );
    await writeTextFile(
      limitPath,
      stringifyDoc(makeFm('limitation', 'Limitations'), `## Known Limitations\n\n- Edge cases not covered in this iteration\n`)
    );
  }

  // Initial history
  const historyPath = joinPath(docsDir, '.history', `plan-${slug}.jsonl`);
  const initialHistory: HistoryEntry = {
    timestamp: now,
    type: 'created',
    version: '1.0',
    summary: `Plan '${name}' created in ${mode} mode`,
    changedBy: 'desktop',
    document: 'plan.md',
    docType: 'plan',
  };
  await writeTextFile(historyPath, JSON.stringify(initialHistory) + '\n');

  return slug;
}

export async function deleteProjectPlan(cwd: string, slug: string): Promise<void> {
  const docsDir = joinPath(cwd, '.docs');
  const planDir = joinPath(docsDir, 'plans', slug);

  // 1. Delete hierarchical folder if exists
  try {
    if (await fileExists(planDir)) {
      const planFiles = await readDirectory(planDir);
      for (const file of planFiles) {
        await removeFile(joinPath(planDir, file));
      }
      try {
        await invoke('remove_directory', { path: planDir });
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }

  // 2. Delete legacy flat files if any
  try {
    const files = await readDirectory(docsDir);
    for (const file of files) {
      if (file.endsWith('.md') && (file === `plan-${slug}.md` || file.includes(`-${slug}.md`))) {
        await removeFile(joinPath(docsDir, file));
      }
    }
    const histPath = joinPath(docsDir, '.history', `plan-${slug}.jsonl`);
    if (await fileExists(histPath)) {
      await removeFile(histPath);
    }
  } catch (e) {
    console.error(`Failed to delete plan ${slug}:`, e);
    throw e;
  }
}

export async function readProjectAgentActivity(cwd: string): Promise<{
  events: any[];
  lastUpdated: string;
  activeAgent?: string;
}> {
  const activityPath = joinPath(cwd, '.plannic', '.agent_activity.json');
  try {
    if (await fileExists(activityPath)) {
      const raw = await readTextFile(activityPath);
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.events)) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return {
    events: [],
    lastUpdated: new Date().toISOString(),
  };
}
