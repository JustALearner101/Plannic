export type ShellType = "bash" | "zsh" | "powershell";

const COMMANDS = [
  "init",
  "doctor",
  "mcp",
  "list",
  "ls",
  "search",
  "find",
  "create",
  "new",
  "open",
  "upgrade",
  "completion",
  "help",
  "version",
];

const GLOBAL_FLAGS = ["--help", "-h", "--version", "-v", "--json"];

export function generateCompletion(shell: ShellType): string {
  switch (shell) {
    case "bash":
      return `
# Plannic bash completion script
_plannic_completion() {
    local cur prev words cword
    _init_completion || return

    local commands="${COMMANDS.join(" ")}"
    local global_flags="${GLOBAL_FLAGS.join(" ")}"

    if [[ $cword -eq 1 ]]; then
        COMPREPLY=( $(compgen -W "$commands $global_flags" -- "$cur") )
        return 0
    fi

    case "\${words[1]}" in
        init)
            COMPREPLY=( $(compgen -W "--agent --diff --json" -- "$cur") )
            ;;
        doctor)
            COMPREPLY=( $(compgen -W "--json --mcp" -- "$cur") )
            ;;
        mcp)
            COMPREPLY=( $(compgen -W "--check --json" -- "$cur") )
            ;;
        create|new)
            COMPREPLY=( $(compgen -W "--mode quick deep" -- "$cur") )
            ;;
        upgrade)
            COMPREPLY=( $(compgen -W "--check" -- "$cur") )
            ;;
        completion)
            COMPREPLY=( $(compgen -W "bash zsh powershell" -- "$cur") )
            ;;
        *)
            COMPREPLY=( $(compgen -W "$global_flags" -- "$cur") )
            ;;
    esac
}
complete -F _plannic_completion plannic plan
`;

    case "zsh":
      return `
#compdef plannic plan

_plannic() {
    local -a commands
    commands=(
        'init:Initialize Plannic in workspace'
        'doctor:Diagnose installation, workspace, and MCP status'
        'mcp:Run or check Plannic MCP server'
        'list:List all plans in current project'
        'open:Open interactive TUI focused on a specific plan'
        'create:Create a new plan'
        'search:Search across all project plans and documents'
        'upgrade:Upgrade Plannic binary to latest release'
        'completion:Generate shell autocompletion script'
    )

    _arguments -C \\
        '1: :->command' \\
        '*:: :->args'

    case $state in
        command)
            _describe -t commands 'plannic commands' commands
            ;;
        args)
            case $line[1] in
                init)
                    _arguments '--agent[Target agent]:(all antigravity claude cursor)' '--diff[Show conflict diffs]' '--json[Output JSON]'
                    ;;
                doctor)
                    _arguments '--mcp[Run MCP handshake check]' '--json[Output JSON]'
                    ;;
                mcp)
                    _arguments '--check[Verify MCP server handshake]' '--json[Output JSON]'
                    ;;
                create|new)
                    _arguments '--mode[Plan mode]:(quick deep)'
                    ;;
                upgrade)
                    _arguments '--check[Check for available update without installing]'
                    ;;
                completion)
                    _arguments '1:shell:(bash zsh powershell)'
                    ;;
            esac
            ;;
    esac
}

_plannic "$@"
`;

    case "powershell":
      return `
# Plannic PowerShell completion script
Register-ArgumentCompleter -Native -CommandName @('plannic', 'plan') -ScriptBlock {
    param($wordToComplete, $commandAst, $cursorPosition)

    $commands = @('init', 'doctor', 'mcp', 'list', 'open', 'create', 'search', 'upgrade', 'completion', 'help', 'version')
    $initFlags = @('--agent', '--diff', '--json')
    $doctorFlags = @('--mcp', '--json')
    $mcpFlags = @('--check', '--json')
    $upgradeFlags = @('--check')
    $completionArgs = @('bash', 'zsh', 'powershell')

    $elements = $commandAst.CommandElements
    if ($elements.Count -eq 2) {
        $commands | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
            [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)
        }
    } elseif ($elements.Count -ge 3) {
        $sub = $elements[1].Extent.Text
        switch ($sub) {
            'init' { $initFlags | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) } }
            'doctor' { $doctorFlags | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) } }
            'mcp' { $mcpFlags | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) } }
            'upgrade' { $upgradeFlags | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) } }
            'completion' { $completionArgs | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) } }
        }
    }
}
`;
  }
}
