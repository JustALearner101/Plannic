import { test, expect } from "@playwright/test";
import { setupDesktopTauriMock, getStandardMockFiles } from "./mock-tauri.js";

test.describe("Desktop Navigation & CodeMirror Editor", () => {
  const projectPath = "D:/mock/plannic-project";

  test.beforeEach(async ({ page }) => {
    const files = getStandardMockFiles(projectPath);
    await setupDesktopTauriMock(page, { projectPath, files });
    await page.goto("/");
  });

  test("should render header, logo, and active project name", async ({ page }) => {
    // 1. Verify Header
    const logo = page.locator(".logo");
    await expect(logo).toBeVisible();
    await expect(logo).toHaveText("PLANNIC");

    const projectName = page.locator(".project-name");
    await expect(projectName).toBeVisible();
    await expect(projectName).toHaveText("plannic-project");
  });

  test("should display plans list in sidebar and support expanding subdocuments", async ({ page }) => {
    // 2. Verify Plans in Sidebar
    const planItems = page.locator(".plan-root-item");
    await expect(planItems).toHaveCount(2);

    const firstPlanName = page.locator(".plan-name").first();
    await expect(firstPlanName).toHaveText("Authentication System");

    // Click to expand subdocs
    await firstPlanName.click();

    // Verify subdocs (plan, scope, feature, phase-1, limitation)
    const subdocItems = page.locator(".sub-doc-item");
    await expect(subdocItems.first()).toBeVisible();
    await expect(subdocItems).toHaveCount(5);

    // Click 'scope' subdoc
    const scopeSubdoc = page.locator(".sub-doc-item", { hasText: "scope" });
    await scopeSubdoc.click();
    await expect(scopeSubdoc).toHaveClass(/sub-active/);
  });

  test("should switch to Edit mode and display CodeMirror editor", async ({ page }) => {
    // Switch to edit mode via Toolbar Edit button
    const editBtn = page.locator(".toggle-btn", { hasText: "Edit" });
    await expect(editBtn).toBeVisible();
    await editBtn.click();
    await expect(editBtn).toHaveClass(/active/);

    // Verify CodeMirror editor content
    const editor = page.locator(".cm-content");
    await expect(editor.first()).toBeVisible();
    await expect(editor.first()).toContainText("Authentication System");
  });
});
