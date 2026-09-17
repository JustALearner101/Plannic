import { test, expect } from "@playwright/test";
import { setupDesktopTauriMock, getStandardMockFiles } from "./mock-tauri.js";

test.describe("Agent Ghost Cursor & Ambient Presence E2E", () => {
  const projectPath = "D:/mock/plannic-project";

  test("should display ambient glowing border and header HUD during agent activity", async ({ page }) => {
    const files = getStandardMockFiles(projectPath);

    // Add agent activity stream
    const activityData = {
      events: [
        {
          id: "act_test_123",
          timestamp: new Date().toISOString(),
          agent: "Antigravity",
          action: "move_task",
          status: "executing",
          planSlug: "auth-flow",
          taskTitle: "Setup OAuth endpoint",
          fromStatus: "todo",
          toStatus: "in_progress",
        },
      ],
      lastUpdated: new Date().toISOString(),
      activeAgent: "Antigravity",
    };

    files[`${projectPath}/.plannic/.agent_activity.json`] = JSON.stringify(activityData);

    await setupDesktopTauriMock(page, { projectPath, files });
    await page.goto("/");
    await page.waitForFunction(() => (window as any).__UI_STORE__ !== undefined);

    // 1. Verify ambient glowing border appears
    const border = page.locator(".ambient-agent-border");
    await expect(border).toBeVisible();

    // 2. Verify header HUD displays agent activity message
    const hud = page.locator(".agent-activity-hud");
    await expect(hud).toBeVisible();
    await expect(hud).toContainText("AI Agent [Antigravity]");
    await expect(hud).toContainText("Setup OAuth endpoint");

    // 3. Verify virtual ghost cursor is rendered with agent badge
    const cursor = page.locator(".agent-ghost-cursor");
    await expect(cursor).toBeVisible();
    const badge = cursor.locator(".agent-badge");
    await expect(badge).toContainText("Antigravity");
  });

  test("should render PhaseTabBar and MilestoneGraph on Kanban board", async ({ page }) => {
    const files = getStandardMockFiles(projectPath);

    // Add Phase 2 to auth-system
    const phase2Content = `---
id: phase2-uuid
plan: auth-system
type: phase
name: Auth System — Phase 2
slug: auth-system
version: "1.0"
status: draft
created: "2026-09-17T00:00:00.000Z"
lastUpdated: "2026-09-17T00:00:00.000Z"
tags: []
description: Phase 2 for auth system
---
# Phase 2: Token Refresh

## Deliverables

- [ ] Implement JWT refresh token rotation
- [x] Session blacklist in Redis
`;

    files[`${projectPath}/.docs/phase-2-auth-system.md`] = phase2Content;

    await setupDesktopTauriMock(page, { projectPath, files });
    await page.goto("/");
    await page.waitForFunction(() => (window as any).__UI_STORE__ !== undefined);

    // Switch to Board
    await page.locator(".mode-btn", { hasText: "Board" }).click();

    // 1. Verify PhaseTabBar is visible
    const phaseTabBar = page.locator(".phase-tab-bar");
    await expect(phaseTabBar).toBeVisible();

    const tabs = phaseTabBar.locator(".phase-tab");
    await expect(tabs).toHaveCount(3); // All Phases, Phase 1, Phase 2
    await expect(tabs.nth(0)).toContainText("All Phases");
    await expect(tabs.nth(1)).toContainText("Phase 1");
    await expect(tabs.nth(2)).toContainText("Phase 2");

    // 2. Verify MilestoneGraph is visible with 2 milestone nodes
    const milestoneTrack = page.locator(".milestone-track");
    await expect(milestoneTrack).toBeVisible();

    const nodes = milestoneTrack.locator(".milestone-node");
    await expect(nodes).toHaveCount(2);
    await expect(nodes.nth(0)).toContainText("Phase 1");
    await expect(nodes.nth(1)).toContainText("Phase 2");

    // 3. Click Phase 2 tab to filter tasks
    await tabs.nth(2).click();
    await expect(tabs.nth(2)).toHaveClass(/active/);
  });
});
