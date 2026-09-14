import type { PlanSummary } from "@plannic/core";
import { COMMANDS } from "../commands/registry.js";

export interface AutocompleteItem {
  id: string;
  name: string;
  title: string;
  description?: string;
  badge?: string;
  usageHint?: string;
  completedText: string;
  isExecutableOnEnter?: boolean;
}

export interface AutocompleteResult {
  isOpen: boolean;
  category: string;
  items: AutocompleteItem[];
}

const DOC_TYPES = [
  { type: "plan", desc: "Root overview & vision document" },
  { type: "scope", desc: "Scope & MVP boundaries" },
  { type: "feature", desc: "Technical & functional specifications" },
  { type: "phase", desc: "Roadmap milestones & task checklists" },
  { type: "limitation", desc: "Known limitations & technical trade-offs" },
];

const TASK_STATUSES = [
  { status: "todo", desc: "Checklist task pending / not started" },
  { status: "in_progress", desc: "Task currently being worked on" },
  { status: "done", desc: "Task completed and verified" },
];

export function computeAutocomplete(
  rawInput: string,
  plans: PlanSummary[]
): AutocompleteResult {
  const trimmedLeft = rawInput.trimStart();
  if (!trimmedLeft.startsWith("/")) {
    return { isOpen: false, category: "", items: [] };
  }

  // 1. Command Phase (no space yet)
  if (!trimmedLeft.includes(" ")) {
    const cmdPrefix = trimmedLeft.slice(1).toLowerCase();
    const matched = COMMANDS.filter((cmd) => {
      if (cmd.name.toLowerCase().startsWith(cmdPrefix)) return true;
      if (cmd.aliases && cmd.aliases.some((a) => a.toLowerCase().startsWith(cmdPrefix))) return true;
      if (cmd.description.toLowerCase().includes(cmdPrefix)) return true;
      return false;
    });

    const items: AutocompleteItem[] = matched.map((cmd) => {
      const takesArgs = !["list", "help", "clear", "desktop", "exit", "quit"].includes(cmd.name);
      return {
        id: `cmd-${cmd.name}`,
        name: cmd.name,
        title: `/${cmd.name}`,
        description: cmd.description,
        badge: `[${cmd.category}]`,
        usageHint: cmd.usage,
        completedText: takesArgs ? `/${cmd.name} ` : `/${cmd.name}`,
        isExecutableOnEnter: !takesArgs,
      };
    });

    return {
      isOpen: items.length > 0,
      category: "COMMANDS",
      items,
    };
  }

  // 2. Argument Phase (after command name and a space)
  const parts = trimmedLeft.slice(1).split(/\s+/);
  const cmdName = parts[0]?.toLowerCase() || "";
  const args = parts.slice(1);

  // 2A: /open <slug> or /plan <slug>
  if (cmdName === "open" || cmdName === "plan") {
    const slugPrefix = (args[0] || "").toLowerCase().trim();
    const matchedPlans = plans.filter((p) => {
      if (!slugPrefix) return true;
      return (
        p.slug.toLowerCase().includes(slugPrefix) ||
        p.name.toLowerCase().includes(slugPrefix)
      );
    });

    const items: AutocompleteItem[] = matchedPlans.map((p) => ({
      id: `plan-${p.slug}`,
      name: p.slug,
      title: p.slug,
      description: p.name,
      badge: `[${p.mode}] [${p.status}]`,
      completedText: `/open ${p.slug}`,
      isExecutableOnEnter: true,
    }));

    return {
      isOpen: items.length > 0,
      category: "PLANS",
      items,
    };
  }

  // 2B: /history [slug]
  if (cmdName === "history") {
    const slugPrefix = (args[0] || "").toLowerCase().trim();
    const matchedPlans = plans.filter((p) => {
      if (!slugPrefix) return true;
      return (
        p.slug.toLowerCase().includes(slugPrefix) ||
        p.name.toLowerCase().includes(slugPrefix)
      );
    });

    const items: AutocompleteItem[] = matchedPlans.map((p) => ({
      id: `history-${p.slug}`,
      name: p.slug,
      title: p.slug,
      description: p.name,
      badge: `[${p.mode}]`,
      completedText: `/history ${p.slug}`,
      isExecutableOnEnter: true,
    }));

    return {
      isOpen: items.length > 0,
      category: "PLANS",
      items,
    };
  }

  // 2C: /doc <type>
  if (cmdName === "doc") {
    const typePrefix = (args[0] || "").toLowerCase().trim();
    const matchedDocs = DOC_TYPES.filter((d) => {
      if (!typePrefix) return true;
      return (
        d.type.toLowerCase().startsWith(typePrefix) ||
        d.desc.toLowerCase().includes(typePrefix)
      );
    });

    const items: AutocompleteItem[] = matchedDocs.map((d) => ({
      id: `doc-${d.type}`,
      name: d.type,
      title: d.type,
      description: d.desc,
      badge: "[doc]",
      completedText: `/doc ${d.type}`,
      isExecutableOnEnter: true,
    }));

    return {
      isOpen: items.length > 0,
      category: "DOCUMENTS",
      items,
    };
  }

  // 2D: /move <taskId> <status>
  if (cmdName === "move") {
    // If user has typed task identifier and is ready for status
    if (args.length >= 2 || (args.length === 1 && rawInput.endsWith(" "))) {
      const statusPrefix = (args[1] || "").toLowerCase().trim();
      const taskId = args[0] || "";
      const matchedStatuses = TASK_STATUSES.filter((s) => {
        if (!statusPrefix) return true;
        return s.status.toLowerCase().startsWith(statusPrefix);
      });

      const items: AutocompleteItem[] = matchedStatuses.map((s) => ({
        id: `status-${s.status}`,
        name: s.status,
        title: s.status,
        description: s.desc,
        badge: "[status]",
        completedText: `/move ${taskId} ${s.status}`,
        isExecutableOnEnter: true,
      }));

      return {
        isOpen: items.length > 0,
        category: "STATUSES",
        items,
      };
    }
  }

  // 2E: /new <name> --mode <quick|deep>
  if (cmdName === "new" || cmdName === "create") {
    const rawModeMatch = rawInput.match(/--mode(?:\s*=?\s*)(\w*)$/i);
    if (rawModeMatch) {
      const modePrefix = (rawModeMatch[1] || "").toLowerCase();
      const modes = [
        { mode: "deep", desc: "Full structured document tree (plan, scope, feature, phase, limitation)" },
        { mode: "quick", desc: "Single comprehensive plan document" },
      ];
      const matchedModes = modes.filter((m) => m.mode.startsWith(modePrefix));
      const baseBeforeMode = rawInput.replace(/--mode(?:\s*=?\s*)\w*$/i, "--mode ");

      const items: AutocompleteItem[] = matchedModes.map((m) => ({
        id: `mode-${m.mode}`,
        name: m.mode,
        title: `--mode ${m.mode}`,
        description: m.desc,
        badge: "[mode]",
        completedText: `${baseBeforeMode}${m.mode}`,
        isExecutableOnEnter: false,
      }));

      return {
        isOpen: items.length > 0,
        category: "MODES",
        items,
      };
    }
  }

  return { isOpen: false, category: "", items: [] };
}
