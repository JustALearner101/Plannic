import { createSignal, createMemo } from "solid-js";
import type { Plan, PlanSummary, PlanDocument } from "@plannic/core";
import { listPlans, readPlan } from "@plannic/headless";
import { findCommand, filterCommands, type SlashCommand } from "../commands/registry.js";
import { computeAutocomplete, type AutocompleteItem, type AutocompleteResult } from "./autocomplete.js";

export type FeedItemType =
  | "system"
  | "command_echo"
  | "plan_view"
  | "plan_list"
  | "search_results"
  | "help"
  | "error"
  | "info";

export interface FeedItem {
  id: string;
  type: FeedItemType;
  title?: string;
  content?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export function createCliState(cwd: string) {
  // Feed items
  const initialGreeting: FeedItem = {
    id: "banner-0",
    type: "system",
    title: "Plannic CLI — Terminal Planning Workbench",
    content: "Type `/` to explore commands, or `Tab` for argument autocomplete (e.g. `/open <slug>`).\nPress `Esc` to quit Plannic. Copy/paste with standard Ctrl+C / Ctrl+V.",
    timestamp: new Date(),
  };

  const [feedItems, setFeedItems] = createSignal<FeedItem[]>([initialGreeting]);
  const [feedScroll, setFeedScroll] = createSignal<number>(0);

  // Prompt input
  const [promptInput, setPromptInput] = createSignal<string>("");
  const [cursorPosition, setCursorPosition] = createSignal<number>(0);
  const [inputHistory, setInputHistory] = createSignal<string[]>([]);
  const [historyIndex, setHistoryIndex] = createSignal<number>(-1);

  // Autocomplete popover
  const [autocompleteOpen, setAutocompleteOpen] = createSignal<boolean>(false);
  const [autocompleteSelectedIndex, setAutocompleteSelectedIndex] = createSignal<number>(0);

  // Plans data
  const [plans, setPlans] = createSignal<PlanSummary[]>([]);
  const [activePlanIndex, setActivePlanIndex] = createSignal<number>(0);
  const [currentPlan, setCurrentPlan] = createSignal<Plan | null>(null);
  const [activeDocType, setActiveDocType] = createSignal<string>("plan");
  const [statusMessage, setStatusMessage] = createSignal<string>("Ready. Press / for commands, Esc to quit");

  let idCounter = 1;
  function nextId() {
    return `item-${Date.now()}-${idCounter++}`;
  }

  function appendFeed(item: Omit<FeedItem, "id" | "timestamp">) {
    const fullItem: FeedItem = {
      ...item,
      id: nextId(),
      timestamp: new Date(),
    };
    setFeedItems((prev) => [...prev, fullItem]);
    setFeedScroll(0);
  }

  function clearFeed() {
    setFeedItems([initialGreeting]);
    setFeedScroll(0);
  }

  async function refreshPlans(selectSlug?: string) {
    const list = await listPlans(cwd);
    setPlans(list);

    if (list.length > 0) {
      let idx = 0;
      if (selectSlug) {
        const found = list.findIndex((p) => p.slug === selectSlug);
        if (found !== -1) idx = found;
      }
      setActivePlanIndex(idx);
      await loadPlan(list[idx].slug);
    }
  }

  async function loadPlan(slug: string) {
    const p = await readPlan(cwd, slug);
    setCurrentPlan(p);
    if (p) {
      setActiveDocType("plan");
    }
  }

  const activePlan = createMemo(() => {
    const list = plans();
    const idx = activePlanIndex();
    return list[idx] ?? null;
  });

  const activeDocument = createMemo((): PlanDocument | null => {
    const p = currentPlan();
    if (!p) return null;
    const docType = activeDocType();
    const doc = p.documents.find((d) => d.type === docType);
    return doc ?? p.root;
  });

  // Dynamic Autocomplete Computation (Commands or Arguments)
  const autocompleteResult = createMemo((): AutocompleteResult => {
    return computeAutocomplete(promptInput(), plans());
  });

  const autocompleteItems = createMemo((): AutocompleteItem[] => {
    return autocompleteResult().items;
  });

  const autocompleteCategory = createMemo((): string => {
    return autocompleteResult().category;
  });

  function checkAutocomplete() {
    const res = computeAutocomplete(promptInput(), plans());
    if (res.isOpen && res.items.length > 0) {
      setAutocompleteOpen(true);
      setAutocompleteSelectedIndex(0);
    } else {
      setAutocompleteOpen(false);
    }
  }

  // Execute command string
  async function executeInput(rawInput: string, closeTui: () => void) {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    // Save to history
    setInputHistory((prev) => [...prev.filter((h) => h !== trimmed), trimmed]);
    setHistoryIndex(-1);

    // Echo user command in feed
    appendFeed({
      type: "command_echo",
      content: trimmed,
    });

    // Check strict command rule: must start with '/'
    if (!trimmed.startsWith("/")) {
      appendFeed({
        type: "error",
        title: "Unknown Command (Strict Command Mode)",
        content: `"${trimmed}" is not a valid slash command.\nAll commands must start with \`/\` (e.g. \`/list\`, \`/open <slug>\`, \`/new <name>\`).\nType \`/help\` or press \`Ctrl+K\` for available commands.`,
      });
      return;
    }

    const withoutSlash = trimmed.slice(1);
    const tokens = withoutSlash.split(/\s+/).filter(Boolean);
    const cmdName = tokens[0] || "";
    const cmdArgs = tokens.slice(1);

    const command = findCommand(cmdName);
    if (!command) {
      appendFeed({
        type: "error",
        title: "Command Not Found",
        content: `No slash command found for \`/${cmdName}\`. Type \`/help\` to view available commands.`,
      });
      return;
    }

    try {
      await command.execute(cmdArgs, {
        state: cliState,
        appendFeed,
        clearFeed,
        closeTui,
        openPalette: () => {
          setPromptInput("/");
          checkAutocomplete();
        },
      });
    } catch (err: any) {
      appendFeed({
        type: "error",
        title: `Error Running /${cmdName}`,
        content: String(err?.message || err),
      });
    }
  }

  const cliState = {
    cwd,
    feedItems,
    setFeedItems,
    feedScroll,
    setFeedScroll,
    promptInput,
    setPromptInput,
    cursorPosition,
    setCursorPosition,
    inputHistory,
    setInputHistory,
    historyIndex,
    setHistoryIndex,
    autocompleteOpen,
    setAutocompleteOpen,
    autocompleteSelectedIndex,
    setAutocompleteSelectedIndex,
    autocompleteResult,
    autocompleteItems,
    autocompleteCategory,
    checkAutocomplete,
    plans,
    setPlans,
    activePlanIndex,
    setActivePlanIndex,
    currentPlan,
    setCurrentPlan,
    activeDocType,
    setActiveDocType,
    statusMessage,
    setStatusMessage,
    appendFeed,
    clearFeed,
    refreshPlans,
    loadPlan,
    activePlan,
    activeDocument,
    executeInput,
  };

  return cliState;
}

export type CliState = ReturnType<typeof createCliState>;
export type { AutocompleteItem };
