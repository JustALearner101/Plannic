import { Show } from "solid-js";
import type { CliState } from "../app/state.js";
import { theme } from "../theme/tokens.js";

interface PromptBarProps {
  state: CliState;
}

export function PromptBar(props: PromptBarProps) {
  const input = () => props.state.promptInput();
  const isEmpty = () => input().length === 0;

  return (
    <box
      flexDirection="row"
      width="100%"
      height={3}
      backgroundColor={theme.bgPanel}
      borderColor={theme.border}
      borderStyle="single"
      paddingLeft={1}
      paddingRight={1}
      alignItems="center"
      justifyContent="space-between"
      flexShrink={0}
    >
      <box flexDirection="row" gap={1} alignItems="center" flexGrow={1}>
        <text fg={theme.accent}>
          <b>›</b>
        </text>

        <Show
          when={!isEmpty()}
          fallback={
            <text fg={theme.textDim}>
              Type <b>/</b> for commands, <b>Tab</b> for plan/doc autocomplete, <b>Esc</b> to quit...
            </text>
          }
        >
          <text fg={theme.text}>
            <b>{input()}</b>
            <span style={{ fg: theme.accent }}>█</span>
          </text>
        </Show>
      </box>

      <box flexDirection="row" gap={1} flexShrink={0}>
        <text fg={theme.textDim}>
          Esc <span style={{ fg: theme.textMuted }}>Quit</span>
        </text>
      </box>
    </box>
  );
}
