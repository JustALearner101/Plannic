import { createHeadless } from "@plannic/headless";

const args = process.argv.slice(2);
const cwd = process.env.PLANNIC_CWD ?? process.cwd();
const engine = createHeadless({ cwd });

if (args[0] === "--help" || args.length === 0) {
  console.log("plannic-headless — headless workspace engine");
  console.log("Usage: plannic-headless --json <operation> [args]");
  process.exit(0);
}

if (args[0] !== "--json") {
  console.error("Only --json mode is supported by the initial headless entrypoint.");
  process.exit(2);
}

const operation = args[1];
const fn = operation && (engine as Record<string, unknown>)[operation];
if (typeof fn !== "function") {
  console.error(`Unknown headless operation: ${operation ?? "(missing)"}`);
  process.exit(2);
}

try {
  const result = await fn(...args.slice(2).map((value) => JSON.parse(value)));
  console.log(JSON.stringify(result));
} catch (error) {
  console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
  process.exit(1);
}
