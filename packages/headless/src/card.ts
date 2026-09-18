import * as fs from "@plannic/fs";

export interface CardOptions {
  cwd: string;
  slug?: string;
  width?: number;
}

export async function renderPlanCard(options: CardOptions): Promise<string> {
  const { cwd } = options;
  const INNER_WIDTH = 60;
  const formatRow = (text: string) => {
    const truncated = text.length > INNER_WIDTH ? text.slice(0, INNER_WIDTH - 3) + "..." : text;
    return `│ ${truncated.padEnd(INNER_WIDTH)} │`;
  };

  const topBorder = `┌── Plannic Architecture Workbench ${"─".repeat(28)}┐`;
  const bottomBorder = `└${"─".repeat(62)}┘`;

  const plans = await fs.listPlans(cwd).catch(() => []);
  if (plans.length === 0) {
    return [
      topBorder,
      formatRow("No active plans found in .docs/."),
      formatRow("Run `/plannic init <name>` to start a new architecture plan."),
      bottomBorder,
    ].join("\n");
  }

  const targetSlug = options.slug || plans[0].slug;
  const plan = await fs.readPlan(cwd, targetSlug);
  if (!plan) {
    return `Plan "${targetSlug}" not found.`;
  }

  let progress = null;
  try {
    progress = await fs.getExecutionProgress(cwd, targetSlug);
  } catch {
    progress = null;
  }

  const adrs = await fs.listAdrs(cwd).catch(() => []);
  const specs = await fs.listSpecs(cwd).catch(() => []);

  const title = (plan.root.frontmatter as any).name || (plan.root.frontmatter as any).title || targetSlug;
  const truncatedTitle = title.length > 34 ? title.slice(0, 31) + "..." : title;

  const lines: string[] = [];
  lines.push(topBorder);
  lines.push(formatRow(`Plan: ${truncatedTitle} (v${plan.root.frontmatter.version || "1.0"})`));

  if (progress) {
    const activePhase = progress.phases.find((p) => p.isCurrent) || progress.phases[0];
    const phaseTitle = activePhase ? activePhase.title : "Phase 1";
    const truncPhase = phaseTitle.length > 24 ? phaseTitle.slice(0, 21) + "..." : phaseTitle;
    const pct = progress.aggregatePercentage;
    const filled = Math.min(10, Math.max(0, Math.round((pct / 100) * 10)));
    const bar = "■".repeat(filled) + "□".repeat(10 - filled);
    const total = activePhase ? activePhase.totalTasks : 0;
    const done = activePhase ? activePhase.completedTasks : 0;

    lines.push(formatRow(`Phase ${progress.activePhase}/${progress.totalPhases}: ${truncPhase} [${bar}] ${pct}%`));
    lines.push(formatRow(`Tasks: ${done}/${total} completed in active phase`));
  }

  lines.push(formatRow(`Linked: ${adrs.length} ADR(s) • ${specs.length} Living Spec(s)`));
  lines.push(bottomBorder);

  return lines.join("\n");
}
