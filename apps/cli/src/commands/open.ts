import { readPlan } from "@plannic/fs";

export async function openCommand(
  cwd: string,
  args: string[],
  startTui: (cwd: string, initialSlug?: string) => Promise<void>
) {
  const slug = args[0]?.trim();
  if (!slug) {
    console.error("\x1b[31mError:\x1b[0m Please specify a plan slug to open.");
    console.error("Usage: plan open <slug>");
    process.exit(1);
  }

  const plan = await readPlan(cwd, slug);
  if (!plan) {
    console.error(`\x1b[31mError:\x1b[0m Plan "${slug}" was not found in ${cwd}/.docs/`);
    process.exit(1);
  }

  await startTui(cwd, slug);
}
