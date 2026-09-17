import { For, Show } from "solid-js";
import type { CliState, FeedItem } from "../app/state.js";
import type { Plan, PlanSummary, SearchResult } from "@plannic/core";
import { theme } from "../theme/tokens.js";
import { COMMANDS } from "../commands/registry.js";
import { PLANNIC_ASCII_COMPACT } from "../banner.js";

interface FeedProps {
  state: CliState;
}

export function Feed(props: FeedProps) {
  const items = () => props.state.feedItems();

  return (
    <box
      flexDirection="column"
      flexGrow={1}
      width="100%"
      paddingLeft={1}
      paddingRight={1}
      paddingTop={1}
      paddingBottom={1}
      overflow="hidden"
    >
      <For each={items()}>
        {(item) => <FeedItemCard item={item} state={props.state} />}
      </For>
    </box>
  );
}

function FeedItemCard(props: { item: FeedItem; state: CliState }) {
  const item = props.item;

  switch (item.type) {
    case "system":
      return (
        <box
          flexDirection="column"
          borderColor={theme.border}
          borderStyle="single"
          paddingLeft={1}
          paddingRight={1}
          marginBottom={1}
        >
          <text fg={theme.accent}>
            {PLANNIC_ASCII_COMPACT}
          </text>
          <text fg={theme.accent}>
            <b>[ PLANNIC WORKSHOP ]</b>{" "}
            <span style={{ fg: theme.textMuted }}>
              Architecture, Living Specs &amp; Strategic Planning
            </span>
          </text>
          <text fg={theme.textDim}>
            Zero bloat, monochrome workshop aesthetic. Type <b>/</b> for commands or <b>Ctrl+K</b> for palette.
          </text>
          <text fg={theme.textMuted}>
            Try: <span style={{ fg: theme.text }}>/list</span> • <span style={{ fg: theme.text }}>/open &lt;slug&gt;</span> • <span style={{ fg: theme.text }}>/new &lt;name&gt;</span> • <span style={{ fg: theme.text }}>/help</span>
          </text>
        </box>
      );

    case "command_echo":
      return (
        <box flexDirection="row" gap={1} marginTop={0} marginBottom={1}>
          <text fg={theme.accent}>
            <b>›</b>
          </text>
          <text fg={theme.text}>
            <b>{item.content}</b>
          </text>
        </box>
      );

    case "plan_list": {
      const plans = (item.metadata?.plans as PlanSummary[]) || [];
      return (
        <box
          flexDirection="column"
          borderColor={theme.border}
          borderStyle="single"
          paddingLeft={1}
          paddingRight={1}
          marginBottom={1}
        >
          <box flexDirection="row" justifyContent="space-between" marginBottom={0}>
            <text fg={theme.text}>
              <b>PROJECT PLANS</b> ({plans.length})
            </text>
            <text fg={theme.textDim}>
              Type /open &lt;slug&gt; to load a plan
            </text>
          </box>

          <box flexDirection="column" marginTop={0}>
            <box flexDirection="row" justifyContent="space-between">
              <box flexDirection="row" gap={2}>
                <text fg={theme.textMuted}><b>SLUG</b></text>
                <text fg={theme.textMuted}><b>NAME</b></text>
              </box>
              <box flexDirection="row" gap={2}>
                <text fg={theme.textMuted}><b>MODE</b></text>
                <text fg={theme.textMuted}><b>STATUS</b></text>
                <text fg={theme.textMuted}><b>DOCS</b></text>
              </box>
            </box>

            <For each={plans}>
              {(p) => (
                <box flexDirection="row" justifyContent="space-between">
                  <box flexDirection="row" gap={2}>
                    <text fg={theme.accent}>
                      <b>{p.slug}</b>
                    </text>
                    <text fg={theme.text}>{p.name.slice(0, 30)}</text>
                  </box>
                  <box flexDirection="row" gap={2}>
                    <text fg={theme.textDim}>{p.mode}</text>
                    <text fg={p.status === "final" ? theme.success : theme.textMuted}>
                      {p.status}
                    </text>
                    <text fg={theme.textDim}>{p.documentCount}</text>
                  </box>
                </box>
              )}
            </For>
          </box>
        </box>
      );
    }

    case "plan_view": {
      const plan = item.metadata?.plan as Plan;
      const activeDocType = (item.metadata?.activeDocType as string) || "plan";
      if (!plan) return null;

      const activeDoc =
        plan.documents.find((d) => d.type === activeDocType) ?? plan.root;
      const docTypes = plan.documents.map((d) => d.type);

      // Simple markdown lines parser (preview up to 35 lines)
      const bodyLines = (activeDoc?.body || "").split("\n").slice(0, 35);

      return (
        <box
          flexDirection="column"
          borderColor={theme.border}
          borderStyle="single"
          paddingLeft={1}
          paddingRight={1}
          marginBottom={1}
        >
          <box flexDirection="row" justifyContent="space-between" marginBottom={0}>
            <text fg={theme.text}>
              <b>{plan.root?.frontmatter?.name || plan.slug}</b> <span style={{ fg: theme.textMuted }}>({plan.slug})</span>
            </text>
            <text fg={theme.accent}>
              Mode: {plan.mode.toUpperCase()} | Doc: <b>{activeDocType.toUpperCase()}</b>
            </text>
          </box>

          {/* Sub-document badges */}
          <box flexDirection="row" gap={1} marginTop={0} marginBottom={1}>
            <For each={docTypes}>
              {(type) => {
                const isActive = type === activeDocType;
                return (
                  <text fg={isActive ? theme.text : theme.textDim}>
                    {isActive ? `[● ${type}]` : `[ ${type} ]`}
                  </text>
                );
              }}
            </For>
            <text fg={theme.textMuted}>
              (Use <b>/doc &lt;type&gt;</b> to switch)
            </text>
          </box>

          {/* Document Content */}
          <box flexDirection="column" borderColor={theme.border} borderStyle="single" paddingLeft={1} paddingRight={1}>
            <For each={bodyLines}>
              {(line) => {
                const trimmed = line.trim();
                if (trimmed.startsWith("# ")) {
                  return <text fg={theme.accent}><b>{line}</b></text>;
                }
                if (trimmed.startsWith("## ")) {
                  return <text fg={theme.text}><b>{line}</b></text>;
                }
                if (trimmed.startsWith("### ")) {
                  return <text fg={theme.textMuted}><b>{line}</b></text>;
                }
                if (trimmed.startsWith("- [x]") || trimmed.startsWith("- [X]")) {
                  return (
                    <text fg={theme.success}>
                      {line}
                    </text>
                  );
                }
                if (trimmed.startsWith("- [ ]")) {
                  return (
                    <text fg={theme.textMuted}>
                      {line}
                    </text>
                  );
                }
                if (trimmed.startsWith("- ")) {
                  return <text fg={theme.text}>{line}</text>;
                }
                if (trimmed === "") {
                  return <text> </text>;
                }
                return <text fg={theme.text}>{line}</text>;
              }}
            </For>
            <Show when={(activeDoc?.body || "").split("\n").length > 35}>
              <text fg={theme.textDim}>... [output truncated for preview. Full doc in .docs/]</text>
            </Show>
          </box>
        </box>
      );
    }

    case "search_results": {
      const results = (item.metadata?.results as SearchResult[]) || [];
      const query = item.metadata?.query as string;
      return (
        <box
          flexDirection="column"
          borderColor={theme.border}
          borderStyle="single"
          paddingLeft={1}
          paddingRight={1}
          marginBottom={1}
        >
          <text fg={theme.text}>
            <b>SEARCH RESULTS</b> for "{query}" ({results.length})
          </text>
          <box flexDirection="column" marginTop={0}>
            <For each={results}>
              {(r) => (
                <box flexDirection="column" marginBottom={0}>
                  <box flexDirection="row" gap={1}>
                    <text fg={theme.accent}>
                      <b>{r.slug}</b>
                    </text>
                    <text fg={theme.textDim}>[{r.docType}]</text>
                    <text fg={theme.text}>{r.planName}</text>
                  </box>
                  <Show when={r.excerpt}>
                    <text fg={theme.textMuted}>
                      {"  "}↳ {r.excerpt}
                    </text>
                  </Show>
                </box>
              )}
            </For>
          </box>
        </box>
      );
    }

    case "help":
      return (
        <box
          flexDirection="column"
          borderColor={theme.border}
          borderStyle="single"
          paddingLeft={1}
          paddingRight={1}
          marginBottom={1}
        >
          <text fg={theme.accent}>
            <b>PLANNIC CLI — SLASH COMMANDS CHEATSHEET</b>
          </text>
          <box flexDirection="column" marginTop={0}>
            <For each={COMMANDS}>
              {(cmd) => (
                <box flexDirection="row" justifyContent="space-between">
                  <box flexDirection="row" gap={1}>
                    <text fg={theme.text}>
                      <b>/{cmd.name}</b>
                    </text>
                    <text fg={theme.textDim}>{cmd.usage}</text>
                  </box>
                  <text fg={theme.textMuted}>{cmd.description}</text>
                </box>
              )}
            </For>
          </box>
          <box
            flexDirection="row"
            justifyContent="space-between"
            marginTop={1}
            borderColor={theme.border}
            borderStyle="single"
            paddingLeft={1}
            paddingRight={1}
          >
            <text fg={theme.textDim}>
              <b>Ctrl+K</b> Command Palette • <b>Tab</b> Autocomplete • <b>Esc</b> Dismiss • <b>Ctrl+C</b> Exit
            </text>
          </box>
        </box>
      );

    case "error":
      return (
        <box
          flexDirection="column"
          borderColor={theme.error}
          borderStyle="single"
          paddingLeft={1}
          paddingRight={1}
          marginBottom={1}
        >
          <text fg={theme.error}>
            <b>{item.title || "ERROR"}</b>
          </text>
          <text fg={theme.text}>{item.content}</text>
        </box>
      );

    case "info":
    default:
      return (
        <box
          flexDirection="column"
          borderColor={theme.border}
          borderStyle="single"
          paddingLeft={1}
          paddingRight={1}
          marginBottom={1}
        >
          <Show when={item.title}>
            <text fg={theme.accent}>
              <b>{item.title}</b>
            </text>
          </Show>
          <text fg={theme.text}>{item.content}</text>
        </box>
      );
  }
}
