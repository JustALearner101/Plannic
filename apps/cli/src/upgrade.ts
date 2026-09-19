import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { PLANNIC_VERSION } from "@plannic/core";

const CURRENT_VERSION = PLANNIC_VERSION;
const REPO = process.env.PLANNIC_REPO || "JustALearner101/Plannic";

export interface UpgradeCheckResult {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseUrl?: string;
  assetName?: string;
  downloadUrl?: string;
  checksumUrl?: string;
  releaseNotes?: string;
}

export function resolvePlatformAsset(): string {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === "win32") {
    return "plannic-windows-x64.zip";
  } else if (platform === "darwin") {
    return arch === "arm64" ? "plannic-darwin-arm64.tar.gz" : "plannic-darwin-x64.tar.gz";
  } else if (platform === "linux") {
    return arch === "arm64" ? "plannic-linux-arm64.tar.gz" : "plannic-linux-x64.tar.gz";
  }
  throw new Error(`Unsupported platform/architecture: ${platform}/${arch}`);
}

export async function checkUpgrade(): Promise<UpgradeCheckResult> {
  const url = `https://api.github.com/repos/${REPO}/releases/latest`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": `Plannic-CLI/${CURRENT_VERSION}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to check latest release from GitHub API (HTTP ${response.status}): ${response.statusText}`);
  }

  const data: any = await response.json();
  const latestTag = (data.tag_name || "").replace(/^v/, "");
  const hasUpdate = latestTag !== "" && latestTag !== CURRENT_VERSION;

  const targetAsset = resolvePlatformAsset();
  const assetObj = data.assets?.find((a: any) => a.name === targetAsset);
  const checksumObj = data.assets?.find((a: any) => a.name === `${targetAsset}.sha256`);

  return {
    currentVersion: CURRENT_VERSION,
    latestVersion: latestTag || CURRENT_VERSION,
    hasUpdate,
    releaseUrl: data.html_url,
    assetName: targetAsset,
    downloadUrl: assetObj?.browser_download_url,
    checksumUrl: checksumObj?.browser_download_url,
    releaseNotes: data.body,
  };
}

export async function performUpgrade(): Promise<void> {
  console.log(`Memeriksa versi rilis terbaru dari ${REPO}...`);
  const check = await checkUpgrade();

  if (!check.hasUpdate) {
    console.log(`\x1b[32m✔\x1b[0m Plannic sudah berada pada versi terbaru (v${CURRENT_VERSION}).`);
    return;
  }

  console.log(`\x1b[36mVersi baru ditemukan:\x1b[0m v${check.latestVersion} (versi saat ini: v${CURRENT_VERSION})`);
  if (!check.downloadUrl) {
    throw new Error(`Asset ${check.assetName} tidak ditemukan di rilis v${check.latestVersion}. Kunjungi ${check.releaseUrl}`);
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "plannic-upgrade-"));
  try {
    const archivePath = path.join(tempDir, check.assetName!);
    console.log(`Mengunduh ${check.assetName}...`);

    const res = await fetch(check.downloadUrl);
    if (!res.ok) throw new Error(`Gagal mengunduh biner: HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(archivePath, buffer);

    // Verify checksum if available
    if (check.checksumUrl) {
      console.log("Memverifikasi SHA-256 checksum...");
      const sumRes = await fetch(check.checksumUrl);
      if (sumRes.ok) {
        const expected = (await sumRes.text()).trim().split(/\s+/)[0].toLowerCase();
        const actual = createHash("sha256").update(buffer).digest("hex").toLowerCase();
        if (expected !== actual) {
          throw new Error(`Verifikasi SHA-256 gagal! Diharapkan: ${expected}, Didapatkan: ${actual}`);
        }
        console.log(`\x1b[32m✔\x1b[0m Checksum SHA-256 valid.`);
      }
    }

    const currentExecPath = process.execPath;
    const isWindows = process.platform === "win32";

    // Extract archive
    if (isWindows) {
      // In Windows, use PowerShell Expand-Archive
      const { execFileSync } = await import("node:child_process");
      execFileSync("powershell", ["-NoProfile", "-Command", `Expand-Archive -LiteralPath '${archivePath}' -DestinationPath '${tempDir}' -Force`]);
      const extractedBin = path.join(tempDir, "plannic.exe");

      // Replace current binary
      if (path.basename(currentExecPath).toLowerCase().startsWith("plannic")) {
        const oldBackup = `${currentExecPath}.old`;
        try { await fs.unlink(oldBackup); } catch {}
        await fs.rename(currentExecPath, oldBackup);
        await fs.copyFile(extractedBin, currentExecPath);
        console.log(`\x1b[32m✔\x1b[0m Biner berhasil diperbarui: ${currentExecPath}`);
      } else {
        console.log(`\x1b[32m✔\x1b[0m Biner baru telah diunduh ke: ${extractedBin}`);
      }
    } else {
      // POSIX tar extraction
      const { execFileSync } = await import("node:child_process");
      execFileSync("tar", ["-xzf", archivePath, "-C", tempDir]);
      const extractedBin = path.join(tempDir, "plannic");
      await fs.chmod(extractedBin, 0o755);

      if (path.basename(currentExecPath).toLowerCase().startsWith("plannic")) {
        await fs.rename(extractedBin, currentExecPath);
        console.log(`\x1b[32m✔\x1b[0m Biner berhasil diperbarui: ${currentExecPath}`);
      } else {
        console.log(`\x1b[32m✔\x1b[0m Biner baru telah diunduh ke: ${extractedBin}`);
      }
    }

    console.log(`\x1b[1m\x1b[32mPlannic berhasil diperbarui ke v${check.latestVersion}!\x1b[0m`);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}
