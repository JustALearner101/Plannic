import { spawnSync } from "node:child_process";
import { platform } from "node:os";

/**
 * Read plain text from system clipboard across Windows, macOS, and Linux
 */
export function readClipboardText(): string | null {
  try {
    const os = platform();
    if (os === "win32") {
      const res = spawnSync(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command", "Get-Clipboard"],
        {
          encoding: "utf-8",
          timeout: 1500,
          windowsHide: true,
        }
      );
      if (res.stdout) {
        return res.stdout.replace(/\r\n/g, "\n").trimEnd();
      }
    } else if (os === "darwin") {
      const res = spawnSync("pbpaste", {
        encoding: "utf-8",
        timeout: 1000,
      });
      if (res.stdout) {
        return res.stdout.trimEnd();
      }
    } else if (os === "linux") {
      const wayland = spawnSync("wl-paste", {
        encoding: "utf-8",
        timeout: 1000,
      });
      if (wayland.stdout) {
        return wayland.stdout.trimEnd();
      }
      const xclip = spawnSync("xclip", ["-selection", "clipboard", "-o"], {
        encoding: "utf-8",
        timeout: 1000,
      });
      if (xclip.stdout) {
        return xclip.stdout.trimEnd();
      }
    }
  } catch {
    // Fallback if clipboard tools are not available
  }
  return null;
}
