# Headless Architecture Acceptance

- [x] Headless engine is available as `@plannic/headless`.
- [x] Headless binary builds with `bun run build:headless`.
- [x] MCP adapters and CLI use the headless package boundary.
- [x] Existing `.docs` format remains compatible.
- [x] `bun run typecheck` passes all workspaces.
- [x] `bun run test:all` passes all unit suites, including the headless contract test.
- [x] Search and plan listing pass the standalone scale checks.
- [x] Unix installer is available through `curl | sh`.
- [ ] GitHub release publishes every installer asset referenced by the installer.
- [ ] Full desktop Playwright suite passes in a clean environment via the CI Node runtime.

## Additional acceptance criterion

The headless installer must be non-interactive, install only under the selected install directory, fail clearly when the release asset or platform is unsupported, and never modify the project workspace.

Current verification: installer script implements these checks; remote artifact and desktop-browser verification remain CI/release gates.
