import { onMount } from "solid-js";
import { render, useKeyboard } from "@opentui/solid";
import { createCliRenderer } from "@opentui/core";
import { createCliState, type CliState } from "./state.js";
import { handleKeyEvent } from "./keymaps.js";
import { Header } from "../components/Header.js";
import { Feed } from "../components/Feed.js";
import { PromptBar } from "../components/PromptBar.js";
import { AutocompletePopover } from "../components/AutocompletePopover.js";
import { StatusBar } from "../components/StatusBar.js";
import { theme } from "../theme/tokens.js";

interface AppProps {
  state: CliState;
  onExit: () => void;
}

export function App(props: AppProps) {
  const state = props.state;

  useKeyboard((key) => {
    handleKeyEvent(key, state, () => {
      props.onExit();
    });
  });

  onMount(() => {
    state.refreshPlans();
  });

  return (
    <box
      flexDirection="column"
      width="100%"
      height="100%"
      backgroundColor={theme.bg}
    >
      {/* 1. Header Bar */}
      <Header state={state} />

      {/* 2. Scrollable Output Feed */}
      <box flexGrow={1} width="100%" overflow="hidden">
        <Feed state={state} />
      </box>

      {/* 3. Autocomplete Popover (floats directly above PromptBar) */}
      <AutocompletePopover state={state} />

      {/* 4. Interactive Prompt Bar */}
      <PromptBar state={state} />

      {/* 5. Minimal Status Bar */}
      <StatusBar state={state} />
    </box>
  );
}

export async function startTui(cwd: string, initialSlug?: string): Promise<void> {
  const state = createCliState(cwd);
  if (initialSlug) {
    await state.refreshPlans(initialSlug);
    await state.executeInput(`/open ${initialSlug}`, () => {});
  }

  return new Promise<void>(async (resolve, reject) => {
    try {
      let isCleanedUp = false;
      let rendererInstance: any = null;

      const finish = () => {
        if (!isCleanedUp) {
          isCleanedUp = true;
          resolve();
        }
      };

      const cleanup = () => {
        try {
          if (rendererInstance) {
            rendererInstance.destroy();
          }
        } catch {
          // ignore
        }
        finish();
      };

      process.on("SIGINT", cleanup);
      process.on("SIGTERM", cleanup);

      rendererInstance = await createCliRenderer({
        onDestroy: () => {
          finish();
        },
      });

      await render(
        () => <App state={state} onExit={cleanup} />,
        rendererInstance
      );

      rendererInstance.start();
    } catch (err) {
      reject(err);
    }
  });
}
