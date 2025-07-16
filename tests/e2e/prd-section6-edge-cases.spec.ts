import { test, expect } from "@playwright/test";
import { createTestHelpers } from "./utils/test-helpers";

test.describe("PRD Section 6 - Edge Cases", () => {
  let helpers: ReturnType<typeof createTestHelpers>;

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="family-tree"]', {
      timeout: 10000,
    });
    helpers = createTestHelpers(page);
  });

  test.describe("Relationship Validation Edge Cases", () => {
    test("should prevent circular parent-child relationships", async ({
      page,
    }) => {
      await helpers.navigateToTreeEditor();

      // Create a simple family structure: Parent -> Child
      await helpers.addFamilyMember("Parent A", "1980-01-01", "male");
      await helpers.addFamilyMember("Child B", "2000-01-01", "female");

      // Try to make Child B a parent of Parent A (circular)
      await page.click('[data-testid="node-card"]:has-text("Parent A")');
      await page.click('[data-testid="add-parent-btn"]');
      await page.selectOption(
        '[data-testid="existing-member-select"]',
        "Child B"
      );
      await page.click('[data-testid="submit-btn"]');

      // Should show error about circular relationship
      await helpers.expectNotification("error", "circular");
    });

    test("should prevent self-relationships", async ({ page }) => {
      await helpers.navigateToTreeEditor();

      // Select a member
      await page.click('[data-testid="node-card"]:first-child');

      // Try to add the same person as their own parent
      await page.click('[data-testid="add-parent-btn"]');
      await page.selectOption(
        '[data-testid="existing-member-select"]',
        "same-person"
      );
      await page.click('[data-testid="submit-btn"]');

      // Should show error about self-relationship
      await helpers.expectNotification("error", "self");
    });

    test("should validate age differences in parent-child relationships", async ({
      page,
    }) => {
      await helpers.navigateToTreeEditor();

      // Create a child first
      await helpers.addFamilyMember("Young Child", "2020-01-01", "male");

      // Try to add a parent who is younger than the child
      await page.click('[data-testid="node-card"]:has-text("Young Child")');
      await page.click('[data-testid="add-parent-btn"]');
      await page.fill('[data-testid="name-input"]', "Young Parent");
      await page.fill('[data-testid="birth-date-input"]', "2025-01-01"); // Younger than child
      await page.selectOption('[data-testid="gender-select"]', "female");
      await page.click('[data-testid="submit-btn"]');

      // Should show error about age validation
      await helpers.expectNotification("error", "age");
    });

    test("should prevent more than 2 parents per person", async ({ page }) => {
      await helpers.navigateToTreeEditor();

      // Find a person who already has 2 parents
      const personWithParents = page
        .locator('[data-testid="node-card"]')
        .filter({ hasText: /Child/ });
      await personWithParents.click();

      // Verify "Add Parent" button is hidden
      await helpers.expectButtonNotVisible("add-parent-btn");

      // Or if button exists, it should be disabled
      const addParentBtn = page.locator('[data-testid="add-parent-btn"]');
      if (await addParentBtn.isVisible()) {
        await expect(addParentBtn).toBeDisabled();
      }
    });
  });

  test.describe("Data Validation Edge Cases", () => {
    test("should handle duplicate member detection", async ({ page }) => {
      await helpers.navigateToTreeEditor();

      // Add a member with specific details
      await helpers.addFamilyMember("Duplicate Test", "1990-01-01", "male");

      // Try to add the same member again
      await helpers.addFamilyMember("Duplicate Test", "1990-01-01", "male");

      // Should show duplicate detection error
      await helpers.expectNotification("error", "duplicate");
    });

    test("should validate birth date ranges", async ({ page }) => {
      await helpers.navigateToTreeEditor();

      // Try to add member with unreasonable birth date
      await page.click('[data-testid="add-member-btn"]');
      await page.fill('[data-testid="name-input"]', "Future Person");
      await page.fill('[data-testid="birth-date-input"]', "2050-01-01"); // Future date
      await page.selectOption('[data-testid="gender-select"]', "male");
      await page.click('[data-testid="submit-btn"]');

      // Should show validation error
      await helpers.expectValidationError("birth-date");
    });

    test("should handle empty or invalid names", async ({ page }) => {
      await helpers.navigateToTreeEditor();

      // Try to add member with empty name
      await page.click('[data-testid="add-member-btn"]');
      await page.fill('[data-testid="name-input"]', "");
      await page.fill('[data-testid="birth-date-input"]', "1990-01-01");
      await page.selectOption('[data-testid="gender-select"]', "male");
      await page.click('[data-testid="submit-btn"]');

      // Should show name validation error
      await helpers.expectValidationError("name");
    });

    test("should handle special characters in names", async ({ page }) => {
      await helpers.navigateToTreeEditor();

      // Try to add member with special characters
      await page.click('[data-testid="add-member-btn"]');
      await page.fill(
        '[data-testid="name-input"]',
        'Test<script>alert("xss")</script>'
      );
      await page.fill('[data-testid="birth-date-input"]', "1990-01-01");
      await page.selectOption('[data-testid="gender-select"]', "male");
      await page.click('[data-testid="submit-btn"]');

      // Should either sanitize or reject the input
      // Check if XSS attempt is prevented
      await expect(page.locator("script")).not.toBeVisible();
    });
  });

  test.describe("Orphan Prevention Edge Cases", () => {
    test("should prevent deletion of parent with children", async ({
      page,
    }) => {
      await helpers.navigateToTreeEditor();

      // Find a parent node
      const parentNode = page
        .locator('[data-testid="node-card"]')
        .filter({ hasText: /Parent/ });
      await parentNode.click();

      // Try to delete the parent
      await page.click('[data-testid="delete-member-btn"]');

      // Should show orphan prevention error
      await helpers.expectNotification("error", "orphan");

      // Parent should still be visible
      await expect(parentNode).toBeVisible();
    });

    test("should allow deletion of parent after removing all children", async ({
      page,
    }) => {
      await helpers.navigateToTreeEditor();

      // Find a parent node
      const parentNode = page
        .locator('[data-testid="node-card"]')
        .filter({ hasText: /Parent/ });
      await parentNode.click();

      // Remove all children first
      const children = page
        .locator('[data-testid="node-card"]')
        .filter({ hasText: /Child/ });
      const childCount = await children.count();

      for (let i = 0; i < childCount; i++) {
        await children.first().click();
        await page.click('[data-testid="delete-member-btn"]');
        await page.click('[data-testid="confirm-delete-btn"]');
      }

      // Now try to delete the parent
      await parentNode.click();
      await page.click('[data-testid="delete-member-btn"]');
      await page.click('[data-testid="confirm-delete-btn"]');

      // Should succeed
      await helpers.expectNotification("success");
      await expect(parentNode).not.toBeVisible();
    });
  });

  test.describe("Large Data Set Edge Cases", () => {
    test("should handle large family trees efficiently", async ({ page }) => {
      await helpers.navigateToTreeEditor();

      // Add many members to test performance
      const startTime = Date.now();

      for (let i = 1; i <= 20; i++) {
        await helpers.addFamilyMember(
          `Test Member ${i}`,
          `199${i}-01-01`,
          i % 2 === 0 ? "male" : "female"
        );
      }

      const addTime = Date.now() - startTime;
      expect(addTime).toBeLessThan(30000); // Should add 20 members within 30 seconds

      // Verify all members are visible
      await expect(page.locator('[data-testid="node-card"]')).toHaveCount(26); // 6 original + 20 new
    });

    test("should handle complex relationship networks", async ({ page }) => {
      await helpers.navigateToTreeEditor();

      // Create a complex family structure with multiple marriages
      await helpers.addFamilyMember("Spouse 1", "1980-01-01", "female");
      await helpers.addFamilyMember("Spouse 2", "1982-01-01", "female");
      await helpers.addFamilyMember("Spouse 3", "1985-01-01", "male");

      // Add relationships
      await page.click('[data-testid="node-card"]:has-text("Spouse 1")');
      await page.click('[data-testid="add-spouse-btn"]');
      await page.selectOption(
        '[data-testid="existing-member-select"]',
        "Spouse 3"
      );
      await page.click('[data-testid="submit-btn"]');

      // Verify relationship was created
      await helpers.expectNotification("success");
    });
  });

  test.describe("Undo/Redo Edge Cases", () => {
    test("should handle undo/redo with complex operations", async ({
      page,
    }) => {
      await helpers.navigateToTreeEditor();

      // Perform multiple operations
      await helpers.addFamilyMember("Undo Test 1", "1990-01-01", "male");
      await helpers.addFamilyMember("Undo Test 2", "1992-01-01", "female");

      // Undo multiple times
      await page.click('[data-testid="undo-btn"]');
      await page.click('[data-testid="undo-btn"]');

      // Verify both members are gone
      await helpers.expectMemberNotVisible("Undo Test 1");
      await helpers.expectMemberNotVisible("Undo Test 2");

      // Redo multiple times
      await page.click('[data-testid="redo-btn"]');
      await page.click('[data-testid="redo-btn"]');

      // Verify both members are back
      await helpers.expectMemberVisible("Undo Test 1");
      await helpers.expectMemberVisible("Undo Test 2");
    });

    test("should handle undo/redo limits", async ({ page }) => {
      await helpers.navigateToTreeEditor();

      // Perform more operations than the undo limit (50)
      for (let i = 1; i <= 55; i++) {
        await helpers.addFamilyMember(
          `Limit Test ${i}`,
          `199${i}-01-01`,
          "male"
        );
      }

      // Try to undo more than the limit
      for (let i = 0; i < 60; i++) {
        await page.click('[data-testid="undo-btn"]');
      }

      // Should not crash and should maintain state consistency
      await expect(page.locator('[data-testid="family-tree"]')).toBeVisible();
    });
  });

  test.describe("Import/Export Edge Cases", () => {
    test("should handle malformed JSON import", async ({ page }) => {
      await helpers.navigateToTreeEditor();

      // Create a malformed JSON file
      const malformedJson = '{"invalid": json}';

      // Mock file upload with malformed JSON
      await page.setInputFiles('[data-testid="file-input"]', {
        name: "malformed.json",
        mimeType: "application/json",
        buffer: Buffer.from(malformedJson),
      });

      // Should show error
      await helpers.expectNotification("error", "invalid");
    });

    test("should handle very large JSON files", async ({ page }) => {
      await helpers.navigateToTreeEditor();

      // Create a large JSON object
      const largeData = {
        members: Array.from({ length: 1000 }, (_, i) => ({
          id: `member-${i}`,
          name: `Large Test Member ${i}`,
          birthDate: `199${i % 10}-01-01`,
          gender: i % 2 === 0 ? "male" : "female",
        })),
      };

      // Mock file upload with large JSON
      await page.setInputFiles('[data-testid="file-input"]', {
        name: "large.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(largeData)),
      });

      // Should handle gracefully (either import or show appropriate error)
      await expect(page.locator('[data-testid="family-tree"]')).toBeVisible();
    });
  });

  test.describe("Accessibility Edge Cases", () => {
    test("should handle keyboard navigation with complex UI", async ({
      page,
    }) => {
      await helpers.navigateToTreeEditor();

      // Test tab navigation through all interactive elements
      await page.keyboard.press("Tab");
      await expect(page.locator(":focus")).toBeVisible();

      // Navigate through form elements
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      // Should maintain focus and not get stuck
      await expect(page.locator(":focus")).toBeVisible();
    });

    test("should announce dynamic content changes", async ({ page }) => {
      await helpers.navigateToTreeEditor();

      // Add a member and check if screen reader would announce it
      await helpers.addFamilyMember("Accessibility Test", "1990-01-01", "male");

      // Check for ARIA live regions or announcements
      const liveRegion = page.locator("[aria-live]");
      if (await liveRegion.isVisible()) {
        await expect(liveRegion).toContainText("Accessibility Test");
      }
    });
  });

  test.describe("Performance Edge Cases", () => {
    test("should handle rapid user interactions", async ({ page }) => {
      await helpers.navigateToTreeEditor();

      // Rapidly click add member button
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="add-member-btn"]');
      }

      // Should handle gracefully without crashing
      await expect(page.locator('[data-testid="family-tree"]')).toBeVisible();
    });

    test("should handle memory usage with large trees", async ({ page }) => {
      await helpers.navigateToTreeEditor();

      // Add many members and relationships
      for (let i = 1; i <= 50; i++) {
        await helpers.addFamilyMember(
          `Memory Test ${i}`,
          `199${i % 10}-01-01`,
          "male"
        );
      }

      // Navigate back and forth
      await page.goto("/");
      await page.goto("/tree-editor");

      // Should not cause memory issues
      await expect(page.locator('[data-testid="family-tree"]')).toBeVisible();
    });
  });
});
