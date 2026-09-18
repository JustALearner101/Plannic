import * as fs from "@plannic/fs";

export interface StatusLineOptions {
  cwd: string;
  maxWidth?: number;
  useColor?: boolean;
}

export async function renderStatusLine(options: StatusLineOptions): Promise<string> {
  const { cwd, useColor = true } = options;

  // Check if workspace has .docs or .plannic
  const cfg = await fs.readConfig(cwd).catch(() => ({ found: false }));
  const plans = await fs.listPlans(cwd).catch(() => []);
  if (!cfg.found && plans.length === 0) {
    return "";
  }

  const c = useColor
    ? {
        cyan: "\x1b[36m",
        cyanBold: "\x1b[1;36m",
        yellow: "\x1b[33m",
        yellowBold: "\x1b[1;33m",
        green: "\x1b[32m",
        greenBold: "\x1b[1;32m",
        magenta: "\x1b[35m",
        blue: "\x1b[34m",
        gray: "\x1b[90m",
        white: "\x1b[37m",
        reset: "\x1b[0m",
      }
    : {
        cyan: "",
        cyanBold: "",
        yellow: "",
        yellowBold: "",
        green: "",
        greenBold: "",
        magenta: "",
        blue: "",
        gray: "",
        white: "",
        reset: "",
      };

  if (plans.length === 0) {
    return `${c.cyanBold}[Plannic]${c.reset} ${c.gray}│${c.reset} ${c.white}Ready (.docs)${c.reset}`;
  }

  // Find active or latest plan
  const activePlan = plans[0];
  let progressText = "";

  try {
    const progress = await fs.getExecutionProgress(cwd, activePlan.slug);
    const activePhase = progress.phases.find((p) => p.isCurrent) || progress.phases[0];
    const total = activePhase ? activePhase.totalTasks : 0;
    const completed = activePhase ? activePhase.completedTasks : 0;
    const pct = activePhase ? activePhase.percentage : progress.aggregatePercentage;

    // Mini progress bar: 6 chars: [■■■□□□]
    const barLength = 6;
    const filled = Math.min(barLength, Math.max(0, Math.round((pct / 100) * barLength)));
    const empty = Math.max(0, barLength - filled);
    const bar = "■".repeat(filled) + "□".repeat(empty);

    const phaseNum = activePhase ? activePhase.phaseNumber : 1;
    progressText = `${c.green}Ph${phaseNum}${c.reset} ${c.gray}(${c.white}${completed}/${total}${c.gray})${c.reset} ${c.cyan}[${bar}]${c.reset} ${c.greenBold}${pct}%${c.reset}`;
  } catch {
    progressText = `${c.gray}v${activePlan.version}${c.reset}`;
  }

  // ADR & Spec counts
  let countsText = "";
  try {
    const adrs = await fs.listAdrs(cwd);
    const specs = await fs.listSpecs(cwd);
    const parts = [];
    if (adrs.length > 0) parts.push(`${c.magenta}${adrs.length} ADRs${c.reset}`);
    if (specs.length > 0) parts.push(`${c.blue}${specs.length} Specs${c.reset}`);
    if (parts.length > 0) {
      countsText = ` ${c.gray}│${c.reset} ${parts.join(` ${c.gray}•${c.reset} `)}`;
    }
  } catch {}

  // Truncate slug if too long
  let slugDisplay = activePlan.slug;
  if (slugDisplay.length > 25) {
    slugDisplay = slugDisplay.slice(0, 22) + "...";
  }

  return `${c.cyanBold}[Plannic]${c.reset} ${c.gray}│${c.reset} ${c.yellowBold}${slugDisplay}${c.reset} ${progressText}${countsText}`;
}
