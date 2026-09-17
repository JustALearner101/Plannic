import { test, expect } from "@playwright/test";
import { setupDesktopTauriMock, getStandardMockFiles } from "./mock-tauri.js";

test.describe("Desktop Node Graph XYFlow E2E", () => {
  const projectPath = "D:/mock/plannic-project";

  test.beforeEach(async ({ page }) => {
    const files = getStandardMockFiles(projectPath);
    await setupDesktopTauriMock(page, { projectPath, files });
    await page.goto("/");
    await page.waitForFunction(() => (window as any).__UI_STORE__ !== undefined);
  });

  test("should switch to graph view and render XYFlow canvas and nodes", async ({ page }) => {
    // 1. Click Graph view mode in Header
    const graphBtn = page.locator(".mode-btn", { hasText: "Graph" });
    await expect(graphBtn).toBeVisible();
    await page.waitForTimeout(200);
    await graphBtn.click();
    if (!(await graphBtn.evaluate((el) => el.classList.contains("active")))) {
      await graphBtn.click();
    }
    await expect(graphBtn).toHaveClass(/active/);

    // 2. Verify graph canvas container and svelte flow
    const flowContainer = page.locator(".graph-canvas-container");
    await expect(flowContainer).toBeVisible();

    const svelteFlow = page.locator(".svelte-flow");
    await expect(svelteFlow).toBeVisible();

    // 3. Verify graph nodes exist (root + subdocs)
    const nodes = page.locator(".svelte-flow__node");
    await expect(nodes.first()).toBeVisible();
    const count = await nodes.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
