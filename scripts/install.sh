#!/usr/bin/env sh
# Plannic Universal POSIX Installer (macOS & Linux)
# Usage: curl -fsSL https://raw.githubusercontent.com/JustALearner101/Plannic/main/scripts/install.sh | sh

set -e

REPO="${PLANNIC_REPO:-JustALearner101/Plannic}"
INSTALL_DIR="${PLANNIC_INSTALL_DIR:-$HOME/.local/bin}"

# 1. Detect OS
OS_RAW="$(uname -s)"
case "$OS_RAW" in
  Darwin*) OS="darwin" ;;
  Linux*)  OS="linux" ;;
  *)
    echo "Error: Unsupported operating system '$OS_RAW'." >&2
    echo "For Windows, use: iwr -useb https://raw.githubusercontent.com/$REPO/main/scripts/install.ps1 | iex" >&2
    exit 1
    ;;
esac

# 2. Detect Architecture
ARCH_RAW="$(uname -m)"
case "$ARCH_RAW" in
  x86_64|amd64) ARCH="x64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *)
    echo "Error: Unsupported CPU architecture '$ARCH_RAW'." >&2
    exit 1
    ;;
esac

ASSET="plannic-${OS}-${ARCH}.tar.gz"
API_URL="https://api.github.com/repos/$REPO/releases/latest"

echo "=== Plannic Universal Installer ==="
echo "Platform:     $OS ($ARCH)"
echo "Target asset: $ASSET"
echo "Install dir:  $INSTALL_DIR"
echo ""

# 3. Fetch latest release metadata
echo "Fetching latest release metadata from GitHub..."
RELEASE_JSON="$(curl -fsSL "$API_URL" || true)"
if [ -z "$RELEASE_JSON" ]; then
  echo "Error: Failed to fetch latest release from GitHub API ($API_URL)." >&2
  exit 1
fi

TAG_NAME="$(echo "$RELEASE_JSON" | grep -m1 '"tag_name":' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/')"
DOWNLOAD_URL="$(echo "$RELEASE_JSON" | grep '"browser_download_url":' | grep "$ASSET\"" | head -n1 | sed -E 's/.*"browser_download_url": *"([^"]+)".*/\1/')"
CHECKSUM_URL="$(echo "$RELEASE_JSON" | grep '"browser_download_url":' | grep "${ASSET}.sha256\"" | head -n1 | sed -E 's/.*"browser_download_url": *"([^"]+)".*/\1/')"

if [ -z "$DOWNLOAD_URL" ]; then
  echo "Error: Release $TAG_NAME does not have asset '$ASSET'." >&2
  echo "Available releases: https://github.com/$REPO/releases" >&2
  exit 1
fi

# 4. Download and verify
TEMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t 'plannic-install')"
cleanup() {
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT INT TERM

ARCHIVE_FILE="$TEMP_DIR/$ASSET"
CHECKSUM_FILE="$TEMP_DIR/$ASSET.sha256"

echo "Downloading Plannic $TAG_NAME..."
curl -fsSL "$DOWNLOAD_URL" -o "$ARCHIVE_FILE"

if [ -n "$CHECKSUM_URL" ]; then
  echo "Verifying SHA-256 checksum..."
  curl -fsSL "$CHECKSUM_URL" -o "$CHECKSUM_FILE"

  EXPECTED_HASH="$(awk '{print $1}' "$CHECKSUM_FILE" | tr '[:upper:]' '[:lower:]')"
  if command -v sha256sum >/dev/null 2>&1; then
    ACTUAL_HASH="$(sha256sum "$ARCHIVE_FILE" | awk '{print $1}' | tr '[:upper:]' '[:lower:]')"
  elif command -v shasum >/dev/null 2>&1; then
    ACTUAL_HASH="$(shasum -a 256 "$ARCHIVE_FILE" | awk '{print $1}' | tr '[:upper:]' '[:lower:]')"
  else
    echo "Warning: Neither sha256sum nor shasum found; skipping checksum verification."
    ACTUAL_HASH="$EXPECTED_HASH"
  fi

  if [ "$EXPECTED_HASH" != "$ACTUAL_HASH" ]; then
    echo "Error: SHA-256 verification failed!" >&2
    echo "Expected: $EXPECTED_HASH" >&2
    echo "Actual:   $ACTUAL_HASH" >&2
    exit 1
  fi
  echo "✔ Checksum verified."
fi

# 5. Extract and install
mkdir -p "$INSTALL_DIR"
tar -xzf "$ARCHIVE_FILE" -C "$TEMP_DIR"

EXTRACTED_BIN="$TEMP_DIR/plannic"
if [ ! -f "$EXTRACTED_BIN" ]; then
  echo "Error: Extracted archive did not contain 'plannic' binary." >&2
  exit 1
fi

chmod +x "$EXTRACTED_BIN"
mv -f "$EXTRACTED_BIN" "$INSTALL_DIR/plannic"

echo ""
echo "✔ Plannic $TAG_NAME successfully installed to $INSTALL_DIR/plannic!"
echo ""

# 6. Check PATH
case ":$PATH:" in
  *":$INSTALL_DIR:"*) ;;
  *)
    echo "Notice: $INSTALL_DIR is not in your current PATH."
    echo "Add it by adding the following line to your shell configuration file (~/.bashrc, ~/.zshrc, or ~/.profile):"
    echo ""
    echo "  export PATH=\"$INSTALL_DIR:\$PATH\""
    echo ""
    ;;
esac

echo "Next steps:"
echo "  1. Open a new terminal session (or reload your shell configuration)"
echo "  2. Run: plannic doctor"
echo "  3. Run: plannic init"
echo ""
