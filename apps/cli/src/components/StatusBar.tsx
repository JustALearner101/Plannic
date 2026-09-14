import type { CliState } from "../app/state.js";
import { theme } from "../theme/tokens.js";

interface StatusBarProps {
  state: CliState;
}

export function StatusBar(props: StatusBarProps) {
  const status = () => props.state.statusMessage();
  const plans = () => props.state.plans();

  return (
    <box
      flexDirection="row"
      width="100%"
      height={1}
      paddingLeft={1}
      paddingRight={1}
      alignItems="center"
      justifyContent="space-between"
      backgroundColor={theme.bg}
      flexShrink={0}
    >
      <box flexDirection="row" gap={1}>
        <text fg={theme.success}>●</text>
        <text fg={theme.textMuted}>{status()}</text>
      </box>

      <box flexDirection="row" gap={2}>
        <text fg={theme.textDim}>
          {plans().length} plans loaded
        </text>
        <text fg={theme.textDim}>
          <b>/help</b> for commands
        </text>
      </box>
    </box>
  );
}
