# Headless Architecture Acceptance

- [x] Headless engine is available as `@plannic/headless`.
- [x] Unified binary builds with `bun run build:plannic` (also exposed as `build:headless`).
- [x] MCP adapters and CLI use the headless package boundary.
- [x] Existing `.docs` format remains compatible.
- [x] `bun run typecheck` passes all workspaces.
- [x] `bun run test:all` passes all unit suites, including the headless contract test.
- [x] Search and plan listing pass the standalone scale checks.
- [x] Windows installer is available through `irm .../scripts/install.ps1 | iex`.
- [x] GitHub release publishes the unified Windows archive and checksum.
- [ ] Full desktop Playwright suite passes in a clean environment via the CI Node runtime.

## Additional acceptance criterion

The headless installer must be non-interactive, install only under the selected install directory, fail clearly when the release asset or platform is unsupported, and never modify the project workspace.

Current verification: installer script implements these checks; remote artifact and desktop-browser verification remain CI/release gates.
