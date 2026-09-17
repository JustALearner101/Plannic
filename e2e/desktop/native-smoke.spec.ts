import { test, expect } from "@playwright/test";
import { setupDesktopTauriMock } from "./mock-tauri.js";

test.describe("Desktop Native Smoke & Empty State", () => {
  test("should display initial welcome screen when no project is loaded", async ({ page }) => {
    // Clear localStorage to simulate fresh startup
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto("/");

    // Verify empty state
    const emptyTitle = page.locator(".empty-title");
    await expect(emptyTitle).toBeVisible();
    await expect(emptyTitle).toHaveText("Open a project to start");

    const openBtn = page.locator("button", { hasText: "Open Project" });
    await expect(openBtn).toBeVisible();
  });

  test("should open project dropdown menu and show open folder action", async ({ page }) => {
    const projectPath = "D:/test/sandbox-project";
    const files = {
      "D:/test/sandbox-project/.plannic/config.md": "---\nproject: Test\n---",
    };
    await setupDesktopTauriMock(page, { projectPath, files });

    await page.goto("/");
    await page.waitForFunction(() => (window as any).__UI_STORE__ !== undefined);

    // Open project dropdown
    const projectBtn = page.locator(".project-btn");
    await projectBtn.click();

    const openFolderBtn = page.locator(".action-item");
    await expect(openFolderBtn).toBeVisible();
    await expect(openFolderBtn).toContainText("Open Folder");
  });
});
