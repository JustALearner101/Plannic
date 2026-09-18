#!/usr/bin/env sh
set -eu

repo="${PLANNIC_REPO:-JustALearner101/Plannic}"
install_dir="${PLANNIC_INSTALL_DIR:-$HOME/.local/bin}"
api="https://api.github.com/repos/$repo/releases/latest"

command -v curl >/dev/null 2>&1 || { echo "curl is required" >&2; exit 1; }
command -v tar >/dev/null 2>&1 || { echo "tar is required" >&2; exit 1; }
if command -v sha256sum >/dev/null 2>&1; then
  checksum_cmd="sha256sum"
elif command -v shasum >/dev/null 2>&1; then
  checksum_cmd="shasum -a 256"
else
  echo "sha256sum or shasum is required" >&2
  exit 1
fi

os="$(uname -s | tr '[:upper:]' '[:lower:]')"
arch="$(uname -m)"
case "$os:$arch" in
  linux:x86_64|linux:amd64) asset="plannic-headless-linux-x64.tar.gz" ;;
  linux:aarch64|linux:arm64) asset="plannic-headless-linux-arm64.tar.gz" ;;
  darwin:x86_64|darwin:amd64) asset="plannic-headless-darwin-x64.tar.gz" ;;
  darwin:arm64) asset="plannic-headless-darwin-arm64.tar.gz" ;;
  *) echo "Unsupported platform: $os/$arch" >&2; exit 1 ;;
esac

url="$(curl -fsSL "$api" | sed -n 's/.*"browser_download_url": "\([^"]*\)".*/\1/p' | grep "/$asset" | head -n 1)"
[ -n "$url" ] || { echo "Latest release does not contain $asset" >&2; exit 1; }

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
curl -fsSL "$url" -o "$tmp/$asset"
checksum_url="${url}.sha256"
curl -fsSL "$checksum_url" -o "$tmp/$asset.sha256"
(cd "$tmp" && $checksum_cmd -c "$asset.sha256")
mkdir -p "$install_dir"
tar -xzf "$tmp/$asset" -C "$tmp"
install "$tmp/plannic-headless" "$install_dir/plannic-headless"
ln -sf "plannic-headless" "$install_dir/plannic"
echo "Installed plannic and plannic-headless to $install_dir"
case ":${PATH}:" in *:"$install_dir":*) ;; *) echo "Add $install_dir to PATH to use it." ;; esac
