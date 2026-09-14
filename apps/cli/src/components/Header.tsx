import type { CliState } from "../app/state.js";
import { theme } from "../theme/tokens.js";

interface HeaderProps {
  state: CliState;
}

export function Header(props: HeaderProps) {
  const plan = () => props.state.currentPlan();
  const activeDoc = () => props.state.activeDocType();

  return (
    <box
      flexDirection="row"
      width="100%"
      height={3}
      borderStyle="single"
      borderColor={theme.border}
      backgroundColor={theme.bgPanel}
      paddingLeft={1}
      paddingRight={1}
      alignItems="center"
      justifyContent="space-between"
      flexShrink={0}
    >
      <box flexDirection="row" alignItems="center" gap={1}>
        <text fg={theme.accent}>
          <b>[PLANNIC]</b>
        </text>
        <text fg={theme.textDim}>│</text>
        <text fg={theme.textMuted}>
          {props.state.cwd}
        </text>
        {plan() && (
          <box flexDirection="row" gap={1} paddingLeft={1}>
            <text fg={theme.textDim}>›</text>
            <text fg={theme.text}>
              <b>{plan()?.root?.frontmatter?.name || plan()?.slug}</b>
            </text>
            <text fg={theme.accent}>
              [{activeDoc().toUpperCase()}]
            </text>
          </box>
        )}
      </box>

      <box flexDirection="row" gap={2}>
        <text fg={theme.textDim}>
          <b>Tab</b> Complete  <b>Ctrl+K</b> Commands  <b>Esc</b> Exit
        </text>
      </box>
    </box>
  );
}
