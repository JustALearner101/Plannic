#!/usr/bin/env bun
import path from "node:path";
import { migrateAllPlans } from "../src/migrator.js";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  let slug: string | undefined;
  const slugArg = args.find((a) => a.startsWith("--slug="));
  if (slugArg) {
    slug = slugArg.split("=")[1];
  }

  let cwd = process.cwd();
  const cwdArg = args.find((a) => a.startsWith("--cwd="));
  if (cwdArg) {
    cwd = path.resolve(cwdArg.split("=")[1]);
  }

  console.log("==================================================");
  console.log("   PLANNIC DOCS MIGRATION ENGINE (.docs/ -> .docs/plans/)");
  console.log("==================================================");
  console.log(`Directory: ${cwd}`);
  console.log(`Mode     : ${dryRun ? "DRY RUN (simulation only)" : "LIVE MIGRATION"}`);
  if (slug) {
    console.log(`Target   : Single plan "${slug}"`);
  }
  console.log("--------------------------------------------------");

  const result = await migrateAllPlans({ cwd, slug, dryRun });

  if (result.totalPlans === 0) {
    console.log("ℹ️  No legacy flat plans found in .docs/. Nothing to migrate.");
    process.exit(0);
  }

  for (const m of result.migrated) {
    if (m.success) {
      console.log(`\n✅ Plan: ${m.slug}`);
      for (const f of m.filesMoved) {
        console.log(`   - ${path.relative(cwd, f.from)}  ➔  ${path.relative(cwd, f.to)}`);
      }
    } else {
      console.error(`\n❌ Plan: ${m.slug} FAILED`);
      console.error(`   Reason: ${m.error}`);
    }
  }

  console.log("\n==================================================");
  console.log(`Summary: ${result.successCount}/${result.totalPlans} plans successfully processed.`);
  if (dryRun) {
    console.log("💡 Run without '--dry-run' to apply these changes.");
  } else {
    console.log("✨ All plans migrated to hierarchical structure (.docs/plans/<slug>/)!");
  }
  console.log("==================================================");

  if (result.successCount < result.totalPlans) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal migration error:", err);
  process.exit(1);
});
