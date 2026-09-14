import { createSignal, createEffect, For, Show } from "solid-js";
import type { CliState } from "../app/state.js";
import { theme } from "../theme/tokens.js";

const MAX_VISIBLE = 6;

interface AutocompletePopoverProps {
  state: CliState;
}

export function AutocompletePopover(props: AutocompletePopoverProps) {
  const items = () => props.state.autocompleteItems();
  const category = () => props.state.autocompleteCategory();
  const selectedIdx = () => props.state.autocompleteSelectedIndex();

  const [scrollOffset, setScrollOffset] = createSignal(0);

  // Keep scrollOffset synchronized with selectedIdx
  createEffect(() => {
    const idx = selectedIdx();
    const offset = scrollOffset();
    const total = items().length;

    if (total <= MAX_VISIBLE) {
      setScrollOffset(0);
      return;
    }

    if (idx < offset) {
      setScrollOffset(idx);
    } else if (idx >= offset + MAX_VISIBLE) {
      setScrollOffset(idx - MAX_VISIBLE + 1);
    }
  });

  const visibleItems = () => {
    const offset = scrollOffset();
    return items().slice(offset, offset + MAX_VISIBLE);
  };

  const hasMoreAbove = () => scrollOffset() > 0;
  const hasMoreBelow = () => scrollOffset() + MAX_VISIBLE < items().length;

  return (
    <Show when={props.state.autocompleteOpen() && items().length > 0}>
      <box
        flexDirection="column"
        width="100%"
        backgroundColor={theme.bgPanel}
        borderColor={theme.border}
        borderStyle="single"
        paddingLeft={1}
        paddingRight={1}
        paddingTop={0}
        paddingBottom={0}
        marginBottom={0}
      >
        <box
          flexDirection="row"
          justifyContent="space-between"
          paddingTop={0}
          paddingBottom={0}
        >
          <text fg={theme.textMuted}>
            <b>SUGGESTED {category()}</b> ({selectedIdx() + 1} of {items().length})
          </text>
          <text fg={theme.textDim}>
            [Tab] Complete  [Enter] Select  [↑/↓] Scroll  [Esc] Close
          </text>
        </box>

        <Show when={hasMoreAbove()}>
          <box paddingLeft={1} paddingTop={0} paddingBottom={0}>
            <text fg={theme.textDim}>▲ {scrollOffset()} more above...</text>
          </box>
        </Show>

        <box flexDirection="column" gap={0} marginTop={0}>
          <For each={visibleItems()}>
            {(item, i) => {
              const actualIdx = () => scrollOffset() + i();
              const isSelected = () => actualIdx() === selectedIdx();
              return (
                <box
                  flexDirection="row"
                  backgroundColor={isSelected() ? theme.bgSelected : undefined}
                  paddingLeft={1}
                  paddingRight={1}
                  justifyContent="space-between"
                >
                  <box flexDirection="row" gap={1}>
                    <text fg={isSelected() ? theme.accent : theme.textDim}>
                      {isSelected() ? "›" : " "}
                    </text>
                    <text fg={isSelected() ? theme.text : theme.accent}>
                      <b>{item.title}</b>
                    </text>
                    <Show when={item.badge}>
                      <text fg={theme.textDim}>{item.badge}</text>
                    </Show>
                    <Show when={item.usageHint && item.usageHint !== item.title}>
                      <text fg={theme.textMuted}>{item.usageHint}</text>
                    </Show>
                  </box>
                  <Show when={item.description}>
                    <text fg={isSelected() ? theme.text : theme.textMuted}>
                      {item.description}
                    </text>
                  </Show>
                </box>
              );
            }}
          </For>
        </box>

        <Show when={hasMoreBelow()}>
          <box paddingLeft={1} paddingTop={0} paddingBottom={0}>
            <text fg={theme.textDim}>
              ▼ {items().length - (scrollOffset() + MAX_VISIBLE)} more below...
            </text>
          </box>
        </Show>
      </box>
    </Show>
  );
}
