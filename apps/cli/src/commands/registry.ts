import type { CliState, FeedItem } from "../app/state.js";
import {
  listPlans,
  readPlan,
  searchPlans,
  initPlan,
  moveTask,
  readHistory,
  listAdrs,
  readAdr,
  listSpecs,
  readSpec,
  formatAdrNumber,
} from "@plannic/fs";

export interface CommandContext {
  state: CliState;
  appendFeed: (item: Omit<FeedItem, "id" | "timestamp">) => void;
  clearFeed: () => void;
  closeTui: () => void;
  openPalette: () => void;
}

export interface SlashCommand {
  name: string;
  aliases?: string[];
  description: string;
  usage: string;
  category: "planning" | "navigation" | "system";
  execute: (args: string[], ctx: CommandContext) => Promise<void> | void;
}

export const COMMANDS: SlashCommand[] = [
  {
    name: "list",
    aliases: ["ls"],
    description: "List all plans in current project (.docs/)",
    usage: "/list",
    category: "navigation",
    execute: async (_args, ctx) => {
      const plans = await listPlans(ctx.state.cwd);
      ctx.state.setPlans(plans);

      if (plans.length === 0) {
        ctx.appendFeed({
          type: "info",
          title: "No Plans Found",
          content: "No plans found in .docs/. Use `/new <name>` to create your first plan!",
        });
        return;
      }

      ctx.appendFeed({
        type: "plan_list",
        title: `Project Plans (${plans.length})`,
        metadata: { plans },
      });
    },
  },
  {
    name: "open",
    aliases: ["plan"],
    description: "Open and view a specific plan",
    usage: "/open <slug>",
    category: "navigation",
    execute: async (args, ctx) => {
      const slug = args[0]?.trim();
      if (!slug) {
        ctx.appendFeed({
          type: "error",
          title: "Missing Argument",
          content: "Usage: `/open <slug>` (e.g. `/open phase-3-interactive-kanban-board`). Type `/list` to see all available slugs.",
        });
        return;
      }

      const plan = await readPlan(ctx.state.cwd, slug);
      if (!plan) {
        ctx.appendFeed({
          type: "error",
          title: "Plan Not Found",
          content: `No plan found with slug "${slug}". Type \`/list\` to view available plans.`,
        });
        return;
      }

      ctx.state.setCurrentPlan(plan);
      ctx.state.setActiveDocType("plan");

      // Update activePlanIndex in state.plans
      const plans = ctx.state.plans();
      const idx = plans.findIndex((p) => p.slug === slug);
      if (idx !== -1) {
        ctx.state.setActivePlanIndex(idx);
      }

      ctx.appendFeed({
        type: "plan_view",
        title: `${plan.root?.frontmatter?.name || plan.slug} (${plan.slug})`,
        metadata: { plan, activeDocType: "plan" },
      });
    },
  },
  {
    name: "adrs",
    aliases: ["adr"],
    description: "List or view Architecture Decision Records (.docs/adrs/)",
    usage: "/adrs [number|slug]",
    category: "navigation",
    execute: async (args, ctx) => {
      const target = args[0]?.trim();
      if (target) {
        const adr = await readAdr(ctx.state.cwd, target);
        if (!adr) {
          ctx.appendFeed({
            type: "error",
            title: "ADR Not Found",
            content: `No ADR found matching "${target}". Type \`/adrs\` to see all ADRs.`,
          });
          return;
        }

        ctx.appendFeed({
          type: "info",
          title: `ADR #${formatAdrNumber(adr.number)}: ${adr.frontmatter.title} (${adr.frontmatter.status})`,
          content: `Date: ${adr.frontmatter.date}\nPath: \`${adr.path}\`\n\n${adr.body}`,
        });
      } else {
        const adrs = await listAdrs(ctx.state.cwd);
        if (adrs.length === 0) {
          ctx.appendFeed({
            type: "info",
            title: "No ADRs Found",
            content: "No Architecture Decision Records found in `.docs/adrs/`.",
          });
          return;
        }

        const lines = adrs.map(
          (a) => `• [ADR #${formatAdrNumber(a.number)}] \`${a.status}\`: **${a.title}** (${a.date})`
        );
        ctx.appendFeed({
          type: "info",
          title: `Architecture Decision Records (${adrs.length})`,
          content: lines.join("\n"),
        });
      }
    },
  },
  {
    name: "specs",
    aliases: ["spec"],
    description: "List or view Living Specifications (.docs/specs/)",
    usage: "/specs [slug]",
    category: "navigation",
    execute: async (args, ctx) => {
      const slug = args[0]?.trim();
      if (slug) {
        const spec = await readSpec(ctx.state.cwd, slug);
        if (!spec) {
          ctx.appendFeed({
            type: "error",
            title: "Specification Not Found",
            content: `No specification found with slug "${slug}". Type \`/specs\` to see all specs.`,
          });
          return;
        }

        ctx.appendFeed({
          type: "info",
          title: `Spec: ${spec.frontmatter.title} (v${spec.frontmatter.version}, ${spec.frontmatter.status})`,
          content: `Category: \`${spec.frontmatter.category ?? "general"}\`\nLast Updated: ${spec.frontmatter.lastUpdated}\n\n${spec.body}`,
        });
      } else {
        const specs = await listSpecs(ctx.state.cwd);
        if (specs.length === 0) {
          ctx.appendFeed({
            type: "info",
            title: "No Specifications Found",
            content: "No specifications found in `.docs/specs/`.",
          });
          return;
        }

        const lines = specs.map(
          (s) => `• **${s.title}** (\`${s.slug}\`) [${s.category ?? "general"}]: v${s.version} (\`${s.status}\`)`
        );
        ctx.appendFeed({
          type: "info",
          title: `Living Specifications & API Contracts (${specs.length})`,
          content: lines.join("\n"),
        });
      }
    },
  },
  {
    name: "doc",
    description: "Switch active sub-document in current plan",
    usage: "/doc <plan|scope|feature|phase|limitation>",
    category: "navigation",
    execute: async (args, ctx) => {
      const plan = ctx.state.currentPlan();
      if (!plan) {
        ctx.appendFeed({
          type: "error",
          title: "No Active Plan",
          content: "No plan is currently open. Use `/open <slug>` or `/list` first.",
        });
        return;
      }

      const docType = args[0]?.toLowerCase().trim();
      const validTypes = ["plan", "scope", "feature", "phase", "limitation"];
      if (!docType || !validTypes.includes(docType)) {
        ctx.appendFeed({
          type: "error",
          title: "Invalid Document Type",
          content: `Usage: \`/doc <${validTypes.join("|")}>\`. Available docs: ${plan.documents.map((d) => d.type).join(", ")}`,
        });
        return;
      }

      const targetDoc = plan.documents.find((d) => d.type === docType) ?? (docType === "plan" ? plan.root : null);
      if (!targetDoc) {
        ctx.appendFeed({
          type: "error",
          title: "Document Not Found",
          content: `Sub-document "${docType}" does not exist in plan "${plan.slug}".`,
        });
        return;
      }

      ctx.state.setActiveDocType(docType);
      ctx.appendFeed({
        type: "plan_view",
        title: `${plan.root?.frontmatter?.name || plan.slug} — ${targetDoc.type.toUpperCase()}`,
        metadata: { plan, activeDocType: docType },
      });
    },
  },
  {
    name: "new",
    aliases: ["create", "init"],
    description: "Create a new project plan in .docs/",
    usage: "/new <name> [--mode quick|deep]",
    category: "planning",
    execute: async (args, ctx) => {
      if (args.length === 0) {
        ctx.appendFeed({
          type: "error",
          title: "Missing Plan Name",
          content: "Usage: `/new <name> [--mode quick|deep]` (e.g. `/new Payment Gateway --mode deep`).",
        });
        return;
      }

      let mode: "quick" | "deep" = "deep";
      const nameParts: string[] = [];

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--mode" && i + 1 < args.length) {
          const m = args[i + 1].toLowerCase();
          if (m === "quick" || m === "deep") {
            mode = m;
          }
          i++;
        } else if (arg.startsWith("--mode=")) {
          const m = arg.split("=")[1].toLowerCase();
          if (m === "quick" || m === "deep") {
            mode = m;
          }
        } else {
          nameParts.push(arg);
        }
      }

      const planName = nameParts.join(" ").trim();
      if (!planName) {
        ctx.appendFeed({
          type: "error",
          title: "Missing Plan Name",
          content: "Usage: `/new <name> [--mode quick|deep]`",
        });
        return;
      }

      try {
        const res = await initPlan(ctx.state.cwd, planName, mode);
        await ctx.state.refreshPlans(res.slug);

        const newPlan = await readPlan(ctx.state.cwd, res.slug);
        if (newPlan) {
          ctx.state.setCurrentPlan(newPlan);
          ctx.state.setActiveDocType("plan");
        }

        ctx.appendFeed({
          type: "info",
          title: `Plan Created: "${planName}"`,
          content: `Mode: **${mode}** | Slug: \`${res.slug}\`\nFiles created:\n${res.filesCreated.map((f) => `• .docs/${f}`).join("\n")}`,
        });

        if (newPlan) {
          ctx.appendFeed({
            type: "plan_view",
            title: `${newPlan.root?.frontmatter?.name || newPlan.slug} (${newPlan.slug})`,
            metadata: { plan: newPlan, activeDocType: "plan" },
          });
        }
      } catch (err: any) {
        ctx.appendFeed({
          type: "error",
          title: "Failed to Create Plan",
          content: String(err?.message || err),
        });
      }
    },
  },
  {
    name: "search",
    aliases: ["find"],
    description: "Fuzzy search across plans and document content",
    usage: "/search <query>",
    category: "planning",
    execute: async (args, ctx) => {
      const query = args.join(" ").trim();
      if (!query) {
        ctx.appendFeed({
          type: "error",
          title: "Missing Search Query",
          content: "Usage: `/search <query>` (e.g. `/search kanban` or `/search auth`).",
        });
        return;
      }

      const results = await searchPlans(ctx.state.cwd, query, 10);
      if (results.length === 0) {
        ctx.appendFeed({
          type: "info",
          title: "No Results",
          content: `No documents matched search query: "${query}"`,
        });
        return;
      }

      ctx.appendFeed({
        type: "search_results",
        title: `Search Results for "${query}" (${results.length})`,
        metadata: { query, results },
      });
    },
  },
  {
    name: "move",
    description: "Move task checklist status in phase document",
    usage: "/move <task-id-or-text> <todo|in_progress|done>",
    category: "planning",
    execute: async (args, ctx) => {
      const plan = ctx.state.currentPlan();
      if (!plan) {
        ctx.appendFeed({
          type: "error",
          title: "No Active Plan",
          content: "Please open a plan first using `/open <slug>` before moving tasks.",
        });
        return;
      }

      if (args.length < 2) {
        ctx.appendFeed({
          type: "error",
          title: "Missing Arguments",
          content: "Usage: `/move <task-id-or-text> <todo|in_progress|done>` (e.g. `/move 1.1 in_progress` or `/move Task 1.1 done`).",
        });
        return;
      }

      const targetStatus = args[args.length - 1].toLowerCase();
      const taskIdentifier = args.slice(0, args.length - 1).join(" ");

      try {
        const res = await moveTask(ctx.state.cwd, plan.slug, taskIdentifier, targetStatus);
        // Reload plan
        const updatedPlan = await readPlan(ctx.state.cwd, plan.slug);
        if (updatedPlan) {
          ctx.state.setCurrentPlan(updatedPlan);
        }

        ctx.appendFeed({
          type: "info",
          title: "Task Moved",
          content: `Task "${res.taskTitle}" in \`${res.documentFile}\` moved: \`${res.previousStatus}\` ➔ \`${res.newStatus}\``,
        });
      } catch (err: any) {
        ctx.appendFeed({
          type: "error",
          title: "Failed to Move Task",
          content: String(err?.message || err),
        });
      }
    },
  },
  {
    name: "history",
    description: "View revision audit trail for active plan",
    usage: "/history [slug]",
    category: "planning",
    execute: async (args, ctx) => {
      const slug = args[0]?.trim() || ctx.state.currentPlan()?.slug;
      if (!slug) {
        ctx.appendFeed({
          type: "error",
          title: "Missing Plan Slug",
          content: "Usage: `/history [slug]` or open a plan first with `/open <slug>`.",
        });
        return;
      }

      try {
        const entries = await readHistory(ctx.state.cwd, slug);
        if (entries.length === 0) {
          ctx.appendFeed({
            type: "info",
            title: `History for "${slug}"`,
            content: "No history entries found in `.docs/.history/`.",
          });
          return;
        }

        const lines = entries.slice(-10).map((e) => {
          const d = new Date(e.timestamp).toLocaleTimeString();
          return `• \`v${e.version}\` [${d}] [${e.changedBy}]: ${e.summary} (${e.document})`;
        });

        ctx.appendFeed({
          type: "info",
          title: `Changelog History: ${slug} (${entries.length} revisions)`,
          content: lines.join("\n"),
        });
      } catch (err: any) {
        ctx.appendFeed({
          type: "error",
          title: "Failed to Read History",
          content: String(err?.message || err),
        });
      }
    },
  },
  {
    name: "desktop",
    description: "Open current plan in Plannic Desktop app",
    usage: "/desktop",
    category: "system",
    execute: async (_args, ctx) => {
      const plan = ctx.state.currentPlan();
      const planName = plan ? (plan.root?.frontmatter?.name || plan.slug) : "";
      ctx.appendFeed({
        type: "info",
        title: "Plannic Desktop Hand-off",
        content: `Run \`bun run dev:desktop\` in terminal to launch Plannic Desktop GUI with Interactive Kanban Board & Node Graph${planName ? ` for "${planName}"` : ""}.`,
      });
    },
  },
  {
    name: "clear",
    description: "Clear terminal output feed",
    usage: "/clear",
    category: "system",
    execute: (_args, ctx) => {
      ctx.clearFeed();
    },
  },
  {
    name: "help",
    aliases: ["?"],
    description: "Show list of available slash commands and shortcuts",
    usage: "/help",
    category: "system",
    execute: (_args, ctx) => {
      ctx.appendFeed({
        type: "help",
        title: "Plannic CLI — Cheatsheet & Keyboard Shortcuts",
      });
    },
  },
  {
    name: "exit",
    aliases: ["quit", "q"],
    description: "Exit Plannic CLI session",
    usage: "/exit",
    category: "system",
    execute: (_args, ctx) => {
      ctx.closeTui();
    },
  },
];

export function findCommand(commandName: string): SlashCommand | undefined {
  const clean = commandName.toLowerCase().replace(/^\//, "").trim();
  return COMMANDS.find((cmd) => cmd.name === clean || (cmd.aliases && cmd.aliases.includes(clean)));
}

export function filterCommands(query: string): SlashCommand[] {
  const clean = query.toLowerCase().replace(/^\//, "").trim();
  if (!clean) return COMMANDS;
  return COMMANDS.filter((cmd) => {
    if (cmd.name.includes(clean)) return true;
    if (cmd.description.toLowerCase().includes(clean)) return true;
    if (cmd.aliases && cmd.aliases.some((a) => a.includes(clean))) return true;
    return false;
  });
}
