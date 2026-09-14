import type { CliState } from "./state.js";
import { readClipboardText } from "../utils/clipboard.js";

export function handleKeyEvent(key: any, state: CliState, closeTui: () => void) {
  const name = key.name || "";
  const ctrl = !!key.ctrl;
  const seq = key.sequence || "";

  // 1. Copy/Paste Handling (Ctrl+C and Ctrl+V)
  // Ctrl+C: Cancel current line instead of killing the app (allows text copy in terminal)
  if (name === "c" && ctrl) {
    if (state.promptInput().length > 0) {
      state.setPromptInput("");
      state.setAutocompleteOpen(false);
      state.setStatusMessage("Input cancelled");
    } else {
      state.setStatusMessage("Press Esc or type /exit to quit Plannic");
    }
    return;
  }

  // Ctrl+V: Paste plain text from system clipboard
  if (name === "v" && ctrl) {
    const text = readClipboardText();
    if (text) {
      const sanitized = text.replace(/[\r\n]+/g, " ");
      state.setPromptInput((prev) => prev + sanitized);
      state.checkAutocomplete();
      state.setStatusMessage("Pasted from clipboard");
    }
    return;
  }

  // 2. Global Toggle Commands Menu (Ctrl+K or Ctrl+P)
  if ((name === "k" && ctrl) || (name === "p" && ctrl)) {
    if (state.autocompleteOpen()) {
      state.setAutocompleteOpen(false);
      if (state.promptInput() === "/") {
        state.setPromptInput("");
      }
    } else {
      state.setPromptInput("/");
      state.checkAutocomplete();
    }
    return;
  }

  // 3. Escape: Close popover -> Clear input -> Exit app
  if (name === "escape") {
    if (state.autocompleteOpen()) {
      state.setAutocompleteOpen(false);
      return;
    }
    if (state.promptInput().length > 0) {
      state.setPromptInput("");
      return;
    }
    // Prompt is empty and popover closed: exit application cleanly
    closeTui();
    return;
  }

  // 4. Autocomplete Popover Navigation (Commands, Plan Slugs, Doc Types, Statuses)
  if (state.autocompleteOpen() && state.autocompleteItems().length > 0) {
    const items = state.autocompleteItems();

    if (name === "up") {
      state.setAutocompleteSelectedIndex((prev) =>
        prev <= 0 ? Math.max(0, items.length - 1) : prev - 1
      );
      return;
    }

    if (name === "down") {
      state.setAutocompleteSelectedIndex((prev) =>
        prev >= items.length - 1 ? 0 : prev + 1
      );
      return;
    }

    if (name === "pageup") {
      state.setAutocompleteSelectedIndex((prev) => Math.max(0, prev - 5));
      return;
    }

    if (name === "pagedown") {
      state.setAutocompleteSelectedIndex((prev) =>
        Math.min(Math.max(0, items.length - 1), prev + 5)
      );
      return;
    }

    // Tab key: Complete suggestion (like terminal cd <folder> Tab)
    if (name === "tab") {
      const sel = items[state.autocompleteSelectedIndex()];
      if (sel) {
        state.setPromptInput(sel.completedText);
        // Trigger next argument autocomplete if applicable (e.g. /open -> plan list)
        state.checkAutocomplete();
      }
      return;
    }

    // Enter key while autocomplete item highlighted
    if (name === "return") {
      const sel = items[state.autocompleteSelectedIndex()];
      if (sel) {
        if (sel.isExecutableOnEnter) {
          state.setAutocompleteOpen(false);
          state.setPromptInput("");
          state.executeInput(sel.completedText, closeTui);
        } else {
          state.setPromptInput(sel.completedText);
          state.checkAutocomplete();
        }
        return;
      }
    }
  }

  // 5. Input Bar Interaction (Submit, Backspace, History, Typing/Pasting)
  if (name === "return") {
    const raw = state.promptInput();
    state.setPromptInput("");
    state.setAutocompleteOpen(false);
    state.executeInput(raw, closeTui);
    return;
  }

  if (name === "backspace") {
    const current = state.promptInput();
    const next = current.slice(0, -1);
    state.setPromptInput(next);
    state.checkAutocomplete();
    return;
  }

  // Tab when autocomplete is closed: check if argument completion can be opened
  if (name === "tab" && !state.autocompleteOpen()) {
    state.checkAutocomplete();
    return;
  }

  // History navigation with Up/Down when prompt is empty or not in autocomplete
  if (name === "up" && !state.autocompleteOpen()) {
    const hist = state.inputHistory();
    if (hist.length > 0) {
      const newIdx =
        state.historyIndex() === -1
          ? hist.length - 1
          : Math.max(0, state.historyIndex() - 1);
      state.setHistoryIndex(newIdx);
      state.setPromptInput(hist[newIdx] || "");
    }
    return;
  }

  if (name === "down" && !state.autocompleteOpen()) {
    const hist = state.inputHistory();
    if (state.historyIndex() !== -1) {
      const newIdx = state.historyIndex() + 1;
      if (newIdx < hist.length) {
        state.setHistoryIndex(newIdx);
        state.setPromptInput(hist[newIdx] || "");
      } else {
        state.setHistoryIndex(-1);
        state.setPromptInput("");
      }
    }
    return;
  }

  // Printable characters and pasted strings (length >= 1, not ctrl, not control keys)
  if (
    seq.length > 0 &&
    !ctrl &&
    name !== "tab" &&
    name !== "return" &&
    name !== "escape" &&
    name !== "backspace" &&
    name !== "up" &&
    name !== "down" &&
    name !== "pageup" &&
    name !== "pagedown"
  ) {
    const sanitized = seq.replace(/[\r\n]+/g, " ");
    state.setPromptInput((prev) => prev + sanitized);
    state.checkAutocomplete();
    return;
  }
}
