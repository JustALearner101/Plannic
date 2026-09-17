import { test, expect } from "@playwright/test";
import { setupDesktopTauriMock, getStandardMockFiles } from "./mock-tauri.js";

test.describe("Desktop Search Overlay E2E", () => {
  const projectPath = "D:/mock/plannic-project";

  test.beforeEach(async ({ page }) => {
    const files = getStandardMockFiles(projectPath);
    await setupDesktopTauriMock(page, { projectPath, files });
    await page.goto("/");
    await page.waitForFunction(() => (window as any).__UI_STORE__ !== undefined);
  });

  test("should open search modal on search-trigger click, filter plans, and close on Escape", async ({ page }) => {
    // 1. Click search trigger in Header or press Control+K
    const searchTrigger = page.locator(".search-trigger");
    await expect(searchTrigger).toBeVisible();
    await searchTrigger.click();

    // 2. Verify search modal is visible and input focused
    const searchModal = page.locator(".search-modal");
    await expect(searchModal).toBeVisible();

    const searchInput = page.locator(".search-input");
    await expect(searchInput).toBeFocused();

    // 3. Type search query
    await searchInput.fill("Auth");

    // 4. Verify results display
    const results = page.locator(".result-item");
    await expect(results.first()).toBeVisible();

    const firstTitle = await page.locator(".item-name").first().innerText();
    expect(firstTitle.toLowerCase()).toContain("auth");

    // 5. Press Escape to close
    await page.keyboard.press("Escape");
    await expect(searchModal).not.toBeVisible();
  });
});
