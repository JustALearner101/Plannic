import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(__dirname, '..');
const TAURI_CONF = path.join(ROOT_DIR, 'apps', 'desktop', 'src-tauri', 'tauri.conf.json');
const CARGO_TOML = path.join(ROOT_DIR, 'apps', 'desktop', 'src-tauri', 'Cargo.toml');
const DESKTOP_PKG = path.join(ROOT_DIR, 'apps', 'desktop', 'package.json');
const ROOT_PKG = path.join(ROOT_DIR, 'package.json');

function parseVersion(v: string): [number, number, number] {
  const parts = v.replace(/^v/, '').split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid semver version: "${v}". Expected format: x.y.z`);
  }
  return [parts[0], parts[1], parts[2]];
}

function getNextVersion(current: string, bumpType: string): string {
  const [major, minor, patch] = parseVersion(current);
  switch (bumpType.toLowerCase()) {
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'major':
      return `${major + 1}.0.0`;
    default:
      // If user passed exact version string like "0.2.1"
      parseVersion(bumpType);
      return bumpType.replace(/^v/, '');
  }
}

function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: bun run bump <patch|minor|major|x.y.z>');
    process.exit(1);
  }

  const tauriJson = JSON.parse(fs.readFileSync(TAURI_CONF, 'utf8'));
  const currentVersion = tauriJson.version || '0.2.0';
  const newVersion = getNextVersion(currentVersion, target);

  console.log(`Bumping version: ${currentVersion} -> ${newVersion}`);

  // 1. Update tauri.conf.json
  tauriJson.version = newVersion;
  fs.writeFileSync(TAURI_CONF, JSON.stringify(tauriJson, null, 2) + '\n', 'utf8');
  console.log(`✓ Updated ${path.relative(ROOT_DIR, TAURI_CONF)}`);

  // 2. Update Cargo.toml
  let cargoContent = fs.readFileSync(CARGO_TOML, 'utf8');
  cargoContent = cargoContent.replace(/^version\s*=\s*"[^"]+"/m, `version = "${newVersion}"`);
  fs.writeFileSync(CARGO_TOML, cargoContent, 'utf8');
  console.log(`✓ Updated ${path.relative(ROOT_DIR, CARGO_TOML)}`);

  // 3. Update apps/desktop/package.json
  const desktopPkg = JSON.parse(fs.readFileSync(DESKTOP_PKG, 'utf8'));
  desktopPkg.version = newVersion;
  fs.writeFileSync(DESKTOP_PKG, JSON.stringify(desktopPkg, null, 2) + '\n', 'utf8');
  console.log(`✓ Updated ${path.relative(ROOT_DIR, DESKTOP_PKG)}`);

  // 4. Update root package.json if present
  const rootPkg = JSON.parse(fs.readFileSync(ROOT_PKG, 'utf8'));
  rootPkg.version = newVersion;
  fs.writeFileSync(ROOT_PKG, JSON.stringify(rootPkg, null, 2) + '\n', 'utf8');
  console.log(`✓ Updated ${path.relative(ROOT_DIR, ROOT_PKG)}`);

  console.log('\nSuccess! To publish a new release:');
  console.log(`  git commit -am "chore: release v${newVersion}"`);
  console.log(`  git tag v${newVersion}`);
  console.log(`  git push origin main --tags`);
}

main();
