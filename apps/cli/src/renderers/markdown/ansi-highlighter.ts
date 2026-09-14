const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",
  cyan: "\x1b[36m",
  brightCyan: "\x1b[96m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m",
  white: "\x1b[37m",
  bgCode: "\x1b[48;5;236m",
};

export function highlightMarkdownToAnsi(markdown: string): string[] {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block fences
    if (line.trim().startsWith("```")) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
        result.push(
          `${ANSI.gray}┌─── ${ANSI.brightCyan}${codeBlockLang || "code"}${ANSI.gray} ─${"─".repeat(40)}${ANSI.reset}`
        );
      } else {
        inCodeBlock = false;
        result.push(`${ANSI.gray}└──${"─".repeat(48)}${ANSI.reset}`);
      }
      continue;
    }

    if (inCodeBlock) {
      result.push(`${ANSI.gray}│${ANSI.reset} ${ANSI.yellow}${line}${ANSI.reset}`);
      continue;
    }

    // Headings
    if (line.startsWith("# ")) {
      result.push(
        `${ANSI.bold}${ANSI.brightCyan}${ANSI.underline}${line.slice(2)}${ANSI.reset}`
      );
      continue;
    }
    if (line.startsWith("## ")) {
      result.push(`${ANSI.bold}${ANSI.cyan}${line.slice(3)}${ANSI.reset}`);
      continue;
    }
    if (line.startsWith("### ")) {
      result.push(`${ANSI.bold}${ANSI.white}${line.slice(4)}${ANSI.reset}`);
      continue;
    }

    // Horizontal Rule
    if (line.trim() === "---" || line.trim() === "***" || line.trim() === "___") {
      result.push(`${ANSI.gray}${"─".repeat(50)}${ANSI.reset}`);
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      result.push(`${ANSI.gray}│ ${ANSI.italic}${line.slice(2)}${ANSI.reset}`);
      continue;
    }

    // Checklist items
    const checkMatch = line.match(/^(\s*)-\s*\[([a-zA-Z0-9_\-\/ ]*)\]\s*(.*)$/);
    if (checkMatch) {
      const indent = checkMatch[1];
      const marker = checkMatch[2].trim().toLowerCase();
      const content = checkMatch[3];

      let bullet = `${ANSI.gray}○${ANSI.reset}`;
      let style = ANSI.reset;

      if (marker === "x") {
        bullet = `${ANSI.green}●${ANSI.reset}`;
        style = `${ANSI.dim}${ANSI.green}`;
      } else if (marker === "/" || marker === "wip") {
        bullet = `${ANSI.yellow}◐${ANSI.reset}`;
        style = ANSI.yellow;
      } else if (marker !== "") {
        bullet = `${ANSI.magenta}[${marker}]${ANSI.reset}`;
      }

      result.push(`${indent}${bullet} ${style}${content}${ANSI.reset}`);
      continue;
    }

    // Unordered bullet lists
    if (/^\s*[-*]\s+/.test(line)) {
      const replaced = line.replace(/^(\s*)[-*]\s+/, `$1${ANSI.cyan}•${ANSI.reset} `);
      result.push(replaced);
      continue;
    }

    // Inline formatting: bold **text**, code `text`
    let formatted = line;
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, `${ANSI.bold}$1${ANSI.reset}`);
    formatted = formatted.replace(/`([^`]+)`/g, `${ANSI.yellow}$1${ANSI.reset}`);

    result.push(formatted);
  }

  return result;
}
