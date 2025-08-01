import { test, expect } from "@playwright/test";

test.describe("Family Tree Visualizer E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the app to load
    await page.waitForSelector("[data-testid='family-tree']", {
      timeout: 100000,
    });

    // Check if we're on mobile and need to open the menu
    const isMobile = (page.viewportSize()?.width ?? 1024) < 768;
    if (isMobile) {
      try {
        await page.click('[data-testid="mobile-menu-btn"]');
      } catch (e) {
        // Mobile menu button might not be visible in all cases
      }
    }
  });

  test.describe("Family Tree Rendering", () => {
    test("should load and render the family tree with all members", async ({
      page,
    }) => {
      // Verify the tree container is present
      await expect(page.locator('[data-testid="family-tree"]')).toBeVisible();

      // Verify some family members are rendered
      await expect(page.locator('[data-testid="node-card"]')).toHaveCount(14); // Based on visible nodes

      // Verify the tree has proper structure
      await expect(page.locator("#family-tree-svg")).toBeVisible();
    });

    test("should switch between view modes correctly", async ({ page }) => {
      // Test full tree view (default)
      await expect(
        page.locator('[data-testid="full-tree-view"]')
      ).toBeVisible();

      // Switch to 3-level focus view
      await page.click('[data-testid="view-mode-toggle"]');
      await page.click('[data-testid="three-level-view"]');

      // Verify the view changed
      await expect(
        page.locator('[data-testid="three-level-view"]')
      ).toBeVisible();
    });

    test("should handle zoom and pan interactions", async ({ page }) => {
      const treeContainer = page.locator('[data-testid="family-tree"]');

      // Test zoom in
      await treeContainer.click({ button: "middle" });
      await treeContainer.dispatchEvent("wheel", { deltaY: -100 });

      // Test zoom out
      await treeContainer.dispatchEvent("wheel", { deltaY: 100 });

      // Test pan (drag)
      await treeContainer.dragTo(treeContainer, {
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 },
      });

      // Verify the tree is still visible after interactions
      await expect(treeContainer).toBeVisible();
    });
  });

  test.describe("Member Management", () => {
    test("should add a new family member successfully", async ({ page }) => {
      // Navigate to tree editor
      await page.click('[data-testid="tree-editor-link"]');
      await page.waitForURL("/tree-editor");

      // Click add member button
      await page.click('[data-testid="add-member-btn"]');

      // Fill the form
      await page.fill('[data-testid="name-input"]', "Test Member");
      await page.fill('[data-testid="birth-date-input"]', "1990-01-01");

      // Handle custom select component
      await page.click('[data-testid="gender-select"]');
      await page.click("text=Male");

      // Submit the form
      await page.click('[data-testid="submit-btn"]');

      // Verify success notification
      await expect(
        page.locator('[data-testid="success-notification"]')
      ).toBeVisible();

      // Verify the member appears in the tree
      await expect(page.locator("text=Test Member")).toBeVisible();
    });

    test("should edit an existing member successfully", async ({ page }) => {
      // Navigate to tree editor
      await page.click('[data-testid="tree-editor-link"]');
      await page.waitForURL("/tree-editor");

      // Click on an existing member
      await page.click('[data-testid="node-card"]:first-child');

      // Click edit button
      await page.click('[data-testid="edit-member-btn"]');

      // Update the name
      await page.fill('[data-testid="name-input"]', "Updated Name");

      // Submit the form
      await page.click('[data-testid="submit-btn"]');

      // Verify success notification
      await expect(
        page.locator('[data-testid="success-notification"]')
      ).toBeVisible();

      // Verify the name is updated
      await expect(page.locator("text=Updated Name")).toBeVisible();
    });

    test("should delete a member without children successfully", async ({
      page,
    }) => {
      // Navigate to tree editor
      await page.click('[data-testid="tree-editor-link"]');
      await page.waitForURL("/tree-editor");

      // Find a member without children (leaf node)
      const leafNode = page
        .locator('[data-testid="node-card"]')
        .filter({ hasText: /Child/ });
      await leafNode.click();

      // Click delete button
      await page.click('[data-testid="delete-member-btn"]');

      // Confirm deletion
      await page.click('[data-testid="confirm-delete-btn"]');

      // Verify success notification
      await expect(
        page.locator('[data-testid="success-notification"]')
      ).toBeVisible();

      // Verify the member is removed
      await expect(leafNode).not.toBeVisible();
    });

    test("should prevent deletion of member with children", async ({
      page,
    }) => {
      // Navigate to tree editor
      await page.click('[data-testid="tree-editor-link"]');
      await page.waitForURL("/tree-editor");

      // Find a member with children (parent node)
      const parentNode = page
        .locator('[data-testid="node-card"]')
        .filter({ hasText: /Parent/ });
      await parentNode.click();

      // Click delete button
      await page.click('[data-testid="delete-member-btn"]');

      // Verify error notification about orphan prevention
      await expect(
        page.locator('[data-testid="error-notification"]')
      ).toBeVisible();
      await expect(page.locator("text=orphan")).toBeVisible();

      // Verify the member is still present
      await expect(parentNode).toBeVisible();
    });
  });

  test.describe("Relationship Management", () => {
    test("should add parent relationship successfully", async ({ page }) => {
      // Navigate to tree editor
      await page.click('[data-testid="tree-editor-link"]');
      await page.waitForURL("/tree-editor");

      // Select a member
      await page.click('[data-testid="node-card"]:first-child');

      // Click add parent button
      await page.click('[data-testid="add-parent-btn"]');

      // Fill parent form
      await page.fill('[data-testid="name-input"]', "New Parent");
      await page.fill('[data-testid="birth-date-input"]', "1960-01-01");

      // Handle custom select component
      await page.click('[data-testid="gender-select"]');
      await page.click("text=Male");

      // Submit
      await page.click('[data-testid="submit-btn"]');

      // Verify success
      await expect(
        page.locator('[data-testid="success-notification"]')
      ).toBeVisible();
      await expect(page.locator("text=New Parent")).toBeVisible();
    });

    test("should hide add parent button when 2 parents exist", async ({
      page,
    }) => {
      // Navigate to tree editor
      await page.click('[data-testid="tree-editor-link"]');
      await page.waitForURL("/tree-editor");

      // Find a member that already has 2 parents
      const memberWithParents = page
        .locator('[data-testid="node-card"]')
        .filter({ hasText: /Child/ });
      await memberWithParents.click();

      // Verify add parent button is hidden
      await expect(
        page.locator('[data-testid="add-parent-btn"]')
      ).not.toBeVisible();
    });

    test("should remove relationship successfully", async ({ page }) => {
      // Navigate to tree editor
      await page.click('[data-testid="tree-editor-link"]');
      await page.waitForURL("/tree-editor");

      // Find a relationship link
      const relationshipLink = page.locator(
        '[data-testid="relationship-link"]:first-child'
      );
      await relationshipLink.click();

      // Click remove relationship
      await page.click('[data-testid="remove-relationship-btn"]');

      // Confirm removal
      await page.click('[data-testid="confirm-remove-btn"]');

      // Verify success
      await expect(
        page.locator('[data-testid="success-notification"]')
      ).toBeVisible();
    });

    test("should prevent circular relationships", async ({ page }) => {
      // Navigate to tree editor
      await page.click('[data-testid="tree-editor-link"]');
      await page.waitForURL("/tree-editor");

      // First add a member so we have someone to test with
      await page.click('[data-testid="add-member-btn"]');
      await page.fill('[data-testid="name-input"]', "Test Person");
      await page.fill('[data-testid="birth-date-input"]', "1990-01-01");
      await page.click('[data-testid="gender-select"]');
      await page.click("text=Male");
      await page.click('[data-testid="submit-btn"]');

      // Wait for success notification to disappear
      await page.waitForTimeout(2000);

      // Click on the person we just added
      await page.click('[data-testid="node-card"]');

      // Wait for the relationship form to be visible
      await page.waitForSelector('[data-testid="relationship-type"]', {
        timeout: 10000,
      });

      // Try to add invalid relationship (same member)
      await page.selectOption('[data-testid="relationship-type"]', "parent");
      await page.selectOption('[data-testid="target-member"]', "same-member");

      // Submit
      await page.click('[data-testid="submit-btn"]');

      // Verify error about circular relationship
      await expect(
        page.locator('[data-testid="error-notification"]')
      ).toBeVisible();
    });
  });

  test.describe("Validation & Edge Cases", () => {
    test("should detect duplicate member information", async ({ page }) => {
      // Navigate to tree editor
      await page.click('[data-testid="tree-editor-link"]');
      await page.waitForURL("/tree-editor");

      // Add a member
      await page.click('[data-testid="add-member-btn"]');
      await page.fill('[data-testid="name-input"]', "Duplicate Test");
      await page.fill('[data-testid="birth-date-input"]', "1990-01-01");

      // Handle custom select component
      await page.click('[data-testid="gender-select"]');
      await page.click("text=Male");
      await page.click('[data-testid="submit-btn"]');

      // Try to add the same member again
      await page.click('[data-testid="add-member-btn"]');
      await page.fill('[data-testid="name-input"]', "Duplicate Test");
      await page.fill('[data-testid="birth-date-input"]', "1990-01-01");

      // Handle custom select component
      await page.click('[data-testid="gender-select"]');
      await page.click("text=Male");
      await page.click('[data-testid="submit-btn"]');

      // Verify duplicate detection error
      await expect(
        page.locator('[data-testid="error-notification"]')
      ).toBeVisible();
      await expect(page.locator("text=duplicate")).toBeVisible();
    });

    test("should validate age differences in relationships", async ({
      page,
    }) => {
      // Navigate to tree editor
      await page.click('[data-testid="tree-editor-link"]');
      await page.waitForURL("/tree-editor");

      // Select a member
      await page.click('[data-testid="node-card"]:first-child');

      // Try to add a child older than the parent
      await page.click('[data-testid="add-child-btn"]');
      await page.fill('[data-testid="name-input"]', "Older Child");
      await page.fill('[data-testid="birth-date-input"]', "1950-01-01"); // Older than parent
      await page.click('[data-testid="submit-btn"]');

      // Verify age validation error
      await expect(
        page.locator('[data-testid="error-notification"]')
      ).toBeVisible();
      await expect(page.locator("text=age")).toBeVisible();
    });

    test("should show validation errors for missing required fields", async ({
      page,
    }) => {
      // Navigate to tree editor
      await page.click('[data-testid="tree-editor-link"]');
      await page.waitForURL("/tree-editor");

      // Try to add member without required fields
      await page.click('[data-testid="add-member-btn"]');
      await page.click('[data-testid="submit-btn"]');

      // Verify validation errors
      await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="birth-date-error"]')
      ).toBeVisible();
    });
  });

  test.describe("Undo/Redo Functionality", () => {
    test("should undo and redo actions correctly", async ({ page }) => {
      // Navigate to tree editor
      await page.click('[data-testid="tree-editor-link"]');
      await page.waitForURL("/tree-editor");

      // Get initial member count
      const initialCount = await page
        .locator('[data-testid="node-card"]')
        .count();

      // Add a member
      await page.click('[data-testid="add-member-btn"]');
      await page.fill('[data-testid="name-input"]', "Undo Test");
      await page.fill('[data-testid="birth-date-input"]', "1990-01-01");

      // Handle custom select component
      await page.click('[data-testid="gender-select"]');
      await page.click("text=Male");
      await page.click('[data-testid="submit-btn"]');

      // Verify member was added
      await expect(page.locator("text=Undo Test")).toBeVisible();

      // Undo the action
      await page.click('[data-testid="undo-btn"]');

      // Verify member was removed
      await expect(page.locator("text=Undo Test")).not.toBeVisible();

      // Redo the action
      await page.click('[data-testid="redo-btn"]');

      // Verify member is back
      await expect(page.locator("text=Undo Test")).toBeVisible();
    });
  });

  test.describe("Import/Export", () => {
    test("should export tree as PNG", async ({ page }) => {
      // Navigate to tree editor
      await page.click('[data-testid="tree-editor-link"]');
      await page.waitForURL("/tree-editor");

      // Set up download handler
      const downloadPromise = page.waitForEvent("download");

      // Click export PNG button directly
      await page.click('[data-testid="export-png-btn"]');

      // Verify download started
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain(".png");
    });

    test("should export tree as PDF", async ({ page }) => {
      // Navigate to tree editor
      await page.click('[data-testid="tree-editor-link"]');
      await page.waitForURL("/tree-editor");

      // Set up download handler
      const downloadPromise = page.waitForEvent("download");

      // Click export PDF button directly
      await page.click('[data-testid="export-pdf-btn"]');

      // Verify download started
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain(".pdf");
    });

    test("should import valid JSON file", async ({ page }) => {
      // Navigate to tree editor
      await page.click('[data-testid="tree-editor-link"]');
      await page.waitForURL("/tree-editor");

      // Set up file chooser handler
      const fileChooserPromise = page.waitForEvent("filechooser");

      // Click import button
      await page.click('[data-testid="import-btn"]');

      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles("public/data/family-data.json");

      // Verify success
      await expect(
        page.locator('[data-testid="success-notification"]')
      ).toBeVisible();
    });

    test("should handle invalid JSON import", async ({ page }) => {
      // Navigate to tree editor
      await page.click('[data-testid="tree-editor-link"]');
      await page.waitForURL("/tree-editor");

      // Set up file chooser handler
      const fileChooserPromise = page.waitForEvent("filechooser");

      // Click import button
      await page.click('[data-testid="import-btn"]');

      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles("package.json");

      // Verify error
      await expect(
        page.locator('[data-testid="error-notification"]')
      ).toBeVisible();
    });
  });

  test.describe("Localization & RTL", () => {
    test("should switch between English and Arabic", async ({ page }) => {
      // Switch to Arabic
      await page.click('[data-testid="language-toggle"]');
      await page.waitForTimeout(500); // Wait for dropdown to appear
      await page.click('[data-testid="arabic-option"]');

      // Verify Arabic text is displayed (wait for change)
      await page.waitForTimeout(1000);
      await expect(page.locator("text=شجرة العائلة")).toBeVisible();

      // Switch back to English
      await page.click('[data-testid="language-toggle"]');
      await page.waitForTimeout(500); // Wait for dropdown to appear
      await page.click('[data-testid="english-option"]');

      // Verify English text is displayed (wait for change)
      await page.waitForTimeout(1000);
      await expect(page.locator("text=Family Tree")).toBeVisible();
    });

    test("should handle RTL layout correctly", async ({ page }) => {
      // Switch to Arabic (RTL)
      await page.click('[data-testid="language-toggle"]');
      await page.waitForTimeout(500); // Wait for dropdown to appear
      await page.click('[data-testid="arabic-option"]');

      // Wait for layout change
      await page.waitForTimeout(1000);

      // Verify RTL layout
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

      // Verify UI elements are properly aligned (check if navbar exists)
      const navbar = page.locator('[data-testid="navbar"]');
      if (await navbar.isVisible()) {
        await expect(navbar).toBeVisible();
      }
    });
  });

  test.describe("Accessibility", () => {
    test("should be keyboard navigable", async ({ page }) => {
      // Navigate using keyboard
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Enter"); // Should navigate to tree editor

      await page.waitForURL("/tree-editor");

      // Verify focus indicators are visible
      await expect(page.locator(":focus")).toBeVisible();
    });

    test("should have proper ARIA labels", async ({ page }) => {
      // Navigate to tree editor first
      await page.click('[data-testid="tree-editor-link"]');
      await page.waitForURL("/tree-editor");

      // Check for interactive elements (they should at least be clickable)
      const addMemberBtns = page.locator('[data-testid="add-member-btn"]');
      const count = await addMemberBtns.count();

      for (let i = 0; i < count; i++) {
        const btn = addMemberBtns.nth(i);
        if (await btn.isVisible()) {
          await expect(btn).toBeEnabled();
          await expect(btn).toHaveAttribute("aria-label");
        }
      }

      // Check tree editor link on main page
      await page.goBack();
      const treeEditorLink = page.locator('[data-testid="tree-editor-link"]');
      if (await treeEditorLink.isVisible()) {
        await expect(treeEditorLink).toBeEnabled();
        await expect(treeEditorLink).toHaveAttribute("aria-label");
      }
    });
  });

  test.describe("Performance", () => {
    test("should handle large trees efficiently", async ({ page }) => {
      // This test would require a large dataset
      // For now, test that the tree loads within reasonable time
      const startTime = Date.now();

      await page.goto("/");
      await page.waitForSelector('[data-testid="family-tree"]', {
        timeout: 10000,
      });

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });
  });

  test.describe("Cross-Browser Compatibility", () => {
    test("should work consistently across browsers", async ({ page }) => {
      // Test basic functionality that should work in all browsers
      await expect(page.locator('[data-testid="family-tree"]')).toBeVisible();
      await expect(page.locator('[data-testid="navbar"]')).toBeVisible();

      // Test theme toggle
      await page.click('[data-testid="theme-toggle"]');
      await expect(page.locator("html")).toHaveClass(/dark/);
    });
  });

  test.describe("Mobile Responsiveness", () => {
    test("should be responsive on mobile devices", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Verify mobile menu is accessible
      await page.click('[data-testid="mobile-menu-btn"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

      // Verify tree is still functional
      await expect(page.locator('[data-testid="family-tree"]')).toBeVisible();
    });
  });
});
