import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(__dirname, '..');
const TAURI_CONF = path.join(ROOT_DIR, 'apps', 'desktop', 'src-tauri', 'tauri.conf.json');
const CARGO_TOML = path.join(ROOT_DIR, 'apps', 'desktop', 'src-tauri', 'Cargo.toml');
const CORE_INDEX = path.join(ROOT_DIR, 'packages', 'core', 'src', 'index.ts');

const PKG_JSON_PATHS = [
  path.join(ROOT_DIR, 'package.json'),
  path.join(ROOT_DIR, 'apps', 'desktop', 'package.json'),
  path.join(ROOT_DIR, 'apps', 'cli', 'package.json'),
  path.join(ROOT_DIR, 'apps', 'mcp-server', 'package.json'),
  path.join(ROOT_DIR, 'packages', 'core', 'package.json'),
  path.join(ROOT_DIR, 'packages', 'fs', 'package.json'),
  path.join(ROOT_DIR, 'packages', 'headless', 'package.json'),
];

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
  const currentVersion = tauriJson.version || '0.3.1';
  const newVersion = getNextVersion(currentVersion, target);

  console.log(`\n\x1b[1m\x1b[36m=== Plannic Version Bump ===\x1b[0m`);
  console.log(`Bumping monorepo version: \x1b[33m${currentVersion}\x1b[0m -> \x1b[32m${newVersion}\x1b[0m\n`);

  // 1. Update tauri.conf.json
  tauriJson.version = newVersion;
  fs.writeFileSync(TAURI_CONF, JSON.stringify(tauriJson, null, 2) + '\n', 'utf8');
  console.log(`✓ Updated ${path.relative(ROOT_DIR, TAURI_CONF)}`);

  // 2. Update Cargo.toml
  let cargoContent = fs.readFileSync(CARGO_TOML, 'utf8');
  cargoContent = cargoContent.replace(/^version\s*=\s*"[^"]+"/m, `version = "${newVersion}"`);
  fs.writeFileSync(CARGO_TOML, cargoContent, 'utf8');
  console.log(`✓ Updated ${path.relative(ROOT_DIR, CARGO_TOML)}`);

  // 3. Update packages/core/src/index.ts (PLANNIC_VERSION)
  if (fs.existsSync(CORE_INDEX)) {
    let coreIndex = fs.readFileSync(CORE_INDEX, 'utf8');
    coreIndex = coreIndex.replace(
      /export const PLANNIC_VERSION = "[^"]+";/,
      `export const PLANNIC_VERSION = "${newVersion}";`
    );
    fs.writeFileSync(CORE_INDEX, coreIndex, 'utf8');
    console.log(`✓ Updated ${path.relative(ROOT_DIR, CORE_INDEX)}`);
  }

  // 4. Update all package.json files across monorepo
  for (const pkgPath of PKG_JSON_PATHS) {
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      pkg.version = newVersion;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
      console.log(`✓ Updated ${path.relative(ROOT_DIR, pkgPath)}`);
    }
  }

  console.log('\n\x1b[32m✔ Version bump completed successfully across all monorepo targets.\x1b[0m');
  console.log('\nNext steps to publish release:');
  console.log(`  git commit -am "chore: release v${newVersion}"`);
  console.log(`  git tag v${newVersion}`);
  console.log(`  git push origin main --tags\n`);
}

main();
