import fs from "node:fs/promises";
import path from "node:path";
import {
  initPlan,
  initAdr,
  initSpec,
  updateDocument,
} from "../../packages/fs/src/index.js";

export interface SeedTestDataOptions {
  planCount?: number;
  taskCount?: number;
}

/**
 * Seeds a minimal test repository (1 quick plan, 1 ADR, 1 Spec).
 */
export async function seedMinimalRepo(cwd: string): Promise<void> {
  // 1. Minimal Quick Plan
  await initPlan(cwd, "Quick Prototype", "quick");

  // 2. Initial ADR
  await initAdr(cwd, {
    title: "Adopt Modern Monorepo Architecture",
    status: "accepted",
    description: "Architectural decision on monorepo tooling with Bun.",
  });

  // 3. Initial Spec
  await initSpec(cwd, {
    title: "Core Protocols",
    category: "architecture",
    description: "Baseline protocol specifications.",
  });
}

/**
 * Seeds a standard realistic repository (3 deep plans with multiple tasks, 3 ADRs, 2 specs).
 */
export async function seedStandardRepo(cwd: string): Promise<void> {
  // Plan 1: Authentication Engine (deep mode)
  await initPlan(cwd, "Authentication Engine", "deep");
  const authPhaseTasks = `## Implementation Deliverables

- [ ] Task 1.1: Setup JWT signing key rotation
- [/] Task 1.2: Implement OAuth2 Github callback
- [x] Task 1.3: User session database schema
- [ ] Task 1.4: Rate limiter for login endpoint
- [x] Task 1.5: Secure cookie configuration

## Verification
1. Run auth unit tests
2. Verify token revocation
`;
  await updateDocument(cwd, "authentication-engine", "phase", authPhaseTasks, "Add initial authentication tasks", "test-fixture");

  // Plan 2: Kanban Workspace Revamp (deep mode)
  await initPlan(cwd, "Kanban Workspace Revamp", "deep");
  const kanbanPhaseTasks = `## Kanban Deliverables

- [x] Task 2.1: Implement smooth dnd-action transitions
- [/] Task 2.2: Column drag reordering
- [ ] Task 2.3: Task search & filter input
- [ ] Task 2.4: Empty state illustration
`;
  await updateDocument(cwd, "kanban-workspace-revamp", "phase", kanbanPhaseTasks, "Populate kanban tasks", "test-fixture");

  // Plan 3: Live File Watcher (deep mode)
  await initPlan(cwd, "Live File Watcher", "deep");

  // ADRs
  await initAdr(cwd, {
    title: "Use Tauri 2 for Desktop App",
    status: "accepted",
    description: "Decision to use Tauri 2 + Svelte 5 for the desktop workbench.",
  });
  await initAdr(cwd, {
    title: "Use Svelte 5 Runes for State Management",
    status: "accepted",
    description: "Adopt $state and $derived runes for fine-grained reactivity.",
  });
  await initAdr(cwd, {
    title: "Adopt SQLite Embedded Storage",
    status: "proposed",
    description: "Alternative local cache storage evaluation.",
  });

  // Specs
  await initSpec(cwd, {
    title: "MCP Stdio Transport Specification",
    category: "protocol",
    description: "Specification for Model Context Protocol stdio transport.",
  });
  await initSpec(cwd, {
    title: "Document Tree Markdown Format",
    category: "data-model",
    description: "Standard gray-matter YAML frontmatter and document relations.",
  });
}

/**
 * Seeds a high-load stress testing repository:
 * - 50 plans
 * - 1 plan with 100+ tasks in Phase 1
 * - 1 plan with a massive 1000-line markdown body
 * - 10 ADRs and 5 Specs
 */
export async function seedStressRepo(
  cwd: string,
  options: SeedTestDataOptions = {}
): Promise<{ massivePlanSlug: string; stressPlanSlug: string }> {
  const planCount = options.planCount ?? 50;
  const taskCount = options.taskCount ?? 100;

  // 1. Create a massive plan with 100+ tasks
  const stressPlan = await initPlan(cwd, "Massive Stress Scale Plan", "deep");
  const taskLines: string[] = ["## High Volume Tasks\n"];
  for (let i = 1; i <= taskCount; i++) {
    const status = i % 3 === 0 ? "x" : i % 3 === 1 ? " " : "/";
    taskLines.push(`- [${status}] Task ${i}: Process batch item #${i} with scale verification`);
  }
  taskLines.push("\n## Verification\nEnsure 100+ items render without UI degradation.");
  await updateDocument(
    cwd,
    stressPlan.slug,
    "phase",
    taskLines.join("\n"),
    "Seeded 100+ stress tasks",
    "stress-tester"
  );

  // 2. Create a massive markdown body plan (1000+ lines)
  const massivePlan = await initPlan(cwd, "Massive Markdown Document", "deep");
  const massiveLines: string[] = ["# Massive Markdown Document\n\n"];
  for (let i = 1; i <= 1000; i++) {
    massiveLines.push(`### Section ${i}\nParagraph content line ${i}: Plannic local-first workbench performance audit.\n`);
  }
  await updateDocument(
    cwd,
    massivePlan.slug,
    "feature",
    massiveLines.join("\n"),
    "Seeded 1000 lines markdown content",
    "stress-tester"
  );

  // 3. Batch generate additional plans up to planCount
  for (let i = 1; i <= planCount - 2; i++) {
    const name = `Batch Scaled Plan ${i.toString().padStart(3, "0")}`;
    await initPlan(cwd, name, i % 2 === 0 ? "deep" : "quick");
  }

  // 4. Seed multiple ADRs
  for (let i = 1; i <= 8; i++) {
    await initAdr(cwd, {
      title: `Architectural Decision Number ${i}`,
      status: i % 2 === 0 ? "accepted" : "proposed",
      description: `Description for automated ADR ${i}`,
    });
  }

  // 5. Seed multiple Specs
  for (let i = 1; i <= 5; i++) {
    await initSpec(cwd, {
      title: `System Specification ${i}`,
      category: "spec",
      description: `Living contract and model specification ${i}`,
    });
  }

  return {
    stressPlanSlug: stressPlan.slug,
    massivePlanSlug: massivePlan.slug,
  };
}
