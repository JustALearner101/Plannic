import fs from "node:fs/promises";
import path from "node:path";
import {
  ProjectConfigFrontmatterSchema,
  RulesetConfigSchema,
  GeneratedDocConfigSchema,
} from "../packages/core/src/index.js";

const ROOT_DIR = process.cwd();
const DOC_PATH = path.join(ROOT_DIR, "docs", "config-reference.md");

interface VerificationReport {
  schema: string;
  field: string;
  status: "ok" | "missing_doc" | "missing_schema";
  message?: string;
}

async function verifyConfigDocs() {
  console.log(`\n\x1b[1m\x1b[36m=== Plannic Schema Drift Linter ===\x1b[0m`);
  console.log(`Auditing @plannic/core Zod schemas against docs/config-reference.md...\n`);

  let content: string;
  try {
    content = await fs.readFile(DOC_PATH, "utf-8");
  } catch (err: any) {
    console.error(`\x1b[31m✖ Failed to read documentation file:\x1b[0m ${DOC_PATH}`);
    console.error(err.message);
    process.exit(1);
  }

  const reports: VerificationReport[] = [];

  // 1. Audit Root Config Properties
  const rootKeys = Object.keys(ProjectConfigFrontmatterSchema.shape);
  for (const key of rootKeys) {
    // Check for heading pattern: ## `ruleset` or ### `key`
    const pattern = new RegExp(`(##|###)\\s+[\`']?${key}[\`']?`, "i");
    if (pattern.test(content)) {
      reports.push({ schema: "ProjectConfig", field: key, status: "ok" });
    } else {
      reports.push({
        schema: "ProjectConfig",
        field: key,
        status: "missing_doc",
        message: `Root property '${key}' is defined in ProjectConfigFrontmatterSchema but missing documented section in docs/config-reference.md`,
      });
    }
  }

  // 2. Audit Ruleset Properties
  const rulesetKeys = Object.keys(RulesetConfigSchema.shape);
  for (const key of rulesetKeys) {
    // Check for: ### 1. `strict_kanban` or ### `strict_kanban` or | `strict_kanban` |
    const pattern = new RegExp(`(###|####)\\s+(?:\\d+\\.\\s+)?[\`']?${key}[\`']?|\\|\\s*[\`']?${key}[\`']?\\s*\\|`, "i");
    if (pattern.test(content)) {
      reports.push({ schema: "RulesetConfig", field: key, status: "ok" });
    } else {
      reports.push({
        schema: "RulesetConfig",
        field: key,
        status: "missing_doc",
        message: `Ruleset property '${key}' is defined in RulesetConfigSchema but missing documentation in docs/config-reference.md`,
      });
    }
  }

  // 3. Audit GeneratedDocConfig Properties
  const docKeys = Object.keys(GeneratedDocConfigSchema.shape);
  for (const key of docKeys) {
    // Check for: | `filename` | or ### `filename`
    const pattern = new RegExp(`(###|####)\\s+[\`']?${key}[\`']?|\\|\\s*[\`']?${key}[\`']?\\s*\\|`, "i");
    if (pattern.test(content)) {
      reports.push({ schema: "GeneratedDocConfig", field: key, status: "ok" });
    } else {
      reports.push({
        schema: "GeneratedDocConfig",
        field: key,
        status: "missing_doc",
        message: `Document config property '${key}' is defined in GeneratedDocConfigSchema but missing documentation in docs/config-reference.md`,
      });
    }
  }

  // Summary presentation
  const passed = reports.filter((r) => r.status === "ok");
  const failed = reports.filter((r) => r.status !== "ok");

  console.log(`Verified \x1b[1m${passed.length}/${reports.length}\x1b[0m schema properties in documentation:`);
  for (const item of passed) {
    console.log(`  \x1b[32m✔\x1b[0m [${item.schema}] ${item.field}`);
  }

  if (failed.length > 0) {
    console.error(`\n\x1b[31m✖ Documentation Drift Detected (${failed.length} anomalies):\x1b[0m`);
    for (const item of failed) {
      console.error(`  - \x1b[33m[${item.schema}]\x1b[0m ${item.message}`);
    }
    process.exit(1);
  }

  console.log(`\n\x1b[32m✔ Zero documentation drift detected. All schemas are fully documented.\x1b[0m\n`);
}

verifyConfigDocs().catch((err) => {
  console.error(err);
  process.exit(1);
});
