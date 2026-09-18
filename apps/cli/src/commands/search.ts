import { searchPlans } from "@plannic/headless";

export async function searchCommand(cwd: string, args: string[]) {
  const queryArgs = args.filter((a) => !a.startsWith("--"));
  const query = queryArgs.join(" ").trim();

  if (!query) {
    console.error("\x1b[31mError:\x1b[0m Please provide a search query.");
    console.error("Usage: plan search <query>");
    process.exit(1);
  }

  const results = await searchPlans(cwd, query, 15);

  if (results.length === 0) {
    console.log(`\x1b[90mNo matching plans found for query: "${query}"\x1b[0m`);
    return;
  }

  console.log(`\x1b[1m\x1b[36mSearch Results for:\x1b[0m "\x1b[33m${query}\x1b[0m"`);
  console.log("\x1b[90m" + "─".repeat(78) + "\x1b[0m");

  for (const r of results) {
    console.log(`\x1b[1m\x1b[32m◈\x1b[0m \x1b[1m${r.slug}\x1b[0m \x1b[90m(${r.docType})\x1b[0m`);
    if (r.excerpt) {
      console.log(`  \x1b[90m${r.excerpt.trim()}\x1b[0m`);
    }
  }

  console.log("\x1b[90m" + "─".repeat(78) + "\x1b[0m");
  console.log(`\x1b[90mFound ${results.length} result(s)\x1b[0m\n`);
}
