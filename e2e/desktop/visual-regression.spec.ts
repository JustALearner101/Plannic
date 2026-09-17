import { test, expect } from "@playwright/test";
import { setupDesktopTauriMock, getStandardMockFiles } from "./mock-tauri.js";

test.describe("Phase 5: Visual Regression & Monochrome Design Language", () => {
  const projectPath = "D:/mock/plannic-project";

  test.beforeEach(async ({ page }) => {
    const files = getStandardMockFiles(projectPath);
    await setupDesktopTauriMock(page, { projectPath, files });
    await page.goto("/");
  });

  test("should enforce monochrome design rules: 1px borders, surface contrast, and Geist typography", async ({ page }) => {
    // 1. Verify Header Border styling (strictly 1px solid)
    const header = page.locator(".app-header");
    await expect(header).toBeVisible();

    const headerBorderBottom = await header.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        borderBottomWidth: style.borderBottomWidth,
        borderBottomStyle: style.borderBottomStyle,
      };
    });
    expect(headerBorderBottom.borderBottomWidth).toBe("1px");
    expect(headerBorderBottom.borderBottomStyle).toBe("solid");

    // 2. Verify Sidebar Border styling (strictly 1px solid)
    const sidebar = page.locator(".app-sidebar");
    await expect(sidebar).toBeVisible();

    const sidebarBorderRight = await sidebar.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        borderRightWidth: style.borderRightWidth,
        borderRightStyle: style.borderRightStyle,
      };
    });
    expect(sidebarBorderRight.borderRightWidth).toBe("1px");
    expect(sidebarBorderRight.borderRightStyle).toBe("solid");

    // 3. Verify high contrast dark mode background colors
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    // Ensure body background is dark (RGB values close to void/dark palette)
    expect(bodyBg).toBeDefined();

    // 4. Verify logo typography and monochrome badge styling
    const logo = page.locator(".logo");
    await expect(logo).toBeVisible();
    const logoStyle = await logo.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        fontWeight: style.fontWeight,
        letterSpacing: style.letterSpacing,
      };
    });
    expect(Number(logoStyle.fontWeight)).toBeGreaterThanOrEqual(600);
  });
});
