import { test, expect } from "@playwright/test";
import { setupDesktopTauriMock, getStandardMockFiles } from "./mock-tauri.js";

test.describe("Desktop Kanban Board E2E", () => {
  const projectPath = "D:/mock/plannic-project";

  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => console.log("[BROWSER CONSOLE]", msg.type(), msg.text()));
    page.on("pageerror", (err) => console.log("[BROWSER ERROR]", err.message));
    const files = getStandardMockFiles(projectPath);
    await setupDesktopTauriMock(page, { projectPath, files });
    await page.goto("/");
    await page.waitForFunction(() => (window as any).__UI_STORE__ !== undefined);
  });

  test("should switch to board view and render columns with task cards", async ({ page }) => {
    // 1. Click Board view mode switcher in Header
    const boardBtn = page.locator(".mode-btn", { hasText: "Board" });
    await expect(boardBtn).toBeVisible();

    const viewBefore = await page.evaluate(() => (window as any).__UI_STORE__?.mainView);
    console.log("VIEW BEFORE CLICK:", viewBefore);

    await boardBtn.click();

    const viewAfter = await page.evaluate(() => (window as any).__UI_STORE__?.mainView);
    console.log("VIEW AFTER CLICK:", viewAfter);

    await expect(boardBtn).toHaveClass(/active/);

    // 2. Verify columns render (Todo, In Progress, Done)
    const columns = page.locator(".kanban-column");
    await expect(columns).toHaveCount(3);

    const columnTitles = page.locator(".column-title");
    await expect(columnTitles.nth(0)).toHaveText("Todo");
    await expect(columnTitles.nth(1)).toHaveText("In Progress");
    await expect(columnTitles.nth(2)).toHaveText("Done");

    // 3. Verify task cards render from Phase 1 of active plan
    const cards = page.locator(".kanban-card");
    await expect(cards).toHaveCount(3);

    const firstCardTitle = page.locator(".card-title").first();
    await expect(firstCardTitle).toContainText("Setup OAuth endpoint");
  });

  test("should toggle task status via checkbox click and move card between columns", async ({ page }) => {
    // 1. Switch to Board
    await page.locator(".mode-btn", { hasText: "Board" }).click();

    // 2. Check initial counts
    const todoBadge = page.locator(".kanban-column").nth(0).locator(".column-badge");
    await expect(todoBadge).toHaveText("1");

    const inProgressBadge = page.locator(".kanban-column").nth(1).locator(".column-badge");
    await expect(inProgressBadge).toHaveText("1");

    // 3. Toggle checkbox on Todo task (moves from todo -> in_progress)
    const todoCardCheckbox = page.locator(".kanban-column").nth(0).locator(".card-checkbox");
    await todoCardCheckbox.click();

    // 4. Verify updated badge counts
    await expect(todoBadge).toHaveText("0");
    await expect(inProgressBadge).toHaveText("2");
  });
});
