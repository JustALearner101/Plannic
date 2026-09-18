import { listPlans } from "@plannic/headless";

export async function listCommand(cwd: string, args: string[]) {
  const isJson = args.includes("--json");
  const plans = await listPlans(cwd);

  if (isJson) {
    console.log(JSON.stringify(plans, null, 2));
    return;
  }

  if (plans.length === 0) {
    console.log("\x1b[90mNo plans found in .docs/\x1b[0m");
    return;
  }

  console.log("\x1b[1m\x1b[36mPlannic Project Plans\x1b[0m");
  console.log("\x1b[90m" + "─".repeat(78) + "\x1b[0m");
  console.log(
    `\x1b[1m${"SLUG".padEnd(32)} ${"MODE".padEnd(8)} ${"STATUS".padEnd(10)} ${"UPDATED".padEnd(20)}\x1b[0m`
  );
  console.log("\x1b[90m" + "─".repeat(78) + "\x1b[0m");

  for (const p of plans) {
    const slugStr = p.slug.length > 30 ? p.slug.slice(0, 29) + "…" : p.slug;
    const modeBadge = p.mode === "deep" ? "\x1b[35mdeep\x1b[0m" : "\x1b[34mquick\x1b[0m";
    const statusBadge =
      p.status === "final"
        ? "\x1b[32mfinal\x1b[0m"
        : p.status === "review"
        ? "\x1b[35mreview\x1b[0m"
        : "\x1b[33mdraft\x1b[0m";
    const dateStr = p.lastUpdated ? new Date(p.lastUpdated).toLocaleDateString() : "-";

    console.log(
      `${slugStr.padEnd(32)} ${modeBadge.padEnd(17)} ${statusBadge.padEnd(19)} \x1b[90m${dateStr}\x1b[0m`
    );
  }

  console.log("\x1b[90m" + "─".repeat(78) + "\x1b[0m");
  console.log(`\x1b[90mTotal: ${plans.length} plan(s)\x1b[0m\n`);
}
