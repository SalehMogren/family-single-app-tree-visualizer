import { Page, expect } from "@playwright/test";

export class TestHelpers {
  constructor(private page: Page) {}

  async navigateToTreeEditor() {
    await this.page.click('[data-testid="tree-editor-link"]');
    await this.page.waitForURL("/tree-editor");
  }

  async addFamilyMember(
    name: string,
    birthDate: string,
    gender: "male" | "female"
  ) {
    await this.page.click('[data-testid="add-member-btn"]');
    await this.page.fill('[data-testid="name-input"]', name);
    await this.page.fill('[data-testid="birth-date-input"]', birthDate);
    await this.page.selectOption('[data-testid="gender-select"]', gender);
    await this.page.click('[data-testid="submit-btn"]');
  }

  async editFamilyMember(name: string, newName: string) {
    await this.page.click(`[data-testid="node-card"]:has-text("${name}")`);
    await this.page.click('[data-testid="edit-member-btn"]');
    await this.page.fill('[data-testid="name-input"]', newName);
    await this.page.click('[data-testid="submit-btn"]');
  }

  async deleteFamilyMember(name: string) {
    await this.page.click(`[data-testid="node-card"]:has-text("${name}")`);
    await this.page.click('[data-testid="delete-member-btn"]');
    await this.page.click('[data-testid="confirm-delete-btn"]');
  }

  async addParentRelationship(
    childName: string,
    parentName: string,
    parentBirthDate: string,
    parentGender: "male" | "female"
  ) {
    await this.page.click(`[data-testid="node-card"]:has-text("${childName}")`);
    await this.page.click('[data-testid="add-parent-btn"]');
    await this.page.fill('[data-testid="name-input"]', parentName);
    await this.page.fill('[data-testid="birth-date-input"]', parentBirthDate);
    await this.page.selectOption('[data-testid="gender-select"]', parentGender);
    await this.page.click('[data-testid="submit-btn"]');
  }

  async switchLanguage(language: "english" | "arabic") {
    await this.page.click('[data-testid="language-toggle"]');
    await this.page.click(`[data-testid="${language}-option"]`);
  }

  async toggleTheme() {
    await this.page.click('[data-testid="theme-toggle"]');
  }

  async waitForNotification(type: "success" | "error") {
    await this.page.waitForSelector(`[data-testid="${type}-notification"]`, {
      timeout: 5000,
    });
  }

  async expectNotification(type: "success" | "error", message?: string) {
    const notification = this.page.locator(
      `[data-testid="${type}-notification"]`
    );
    await expect(notification).toBeVisible();
    if (message) {
      await expect(notification).toContainText(message);
    }
  }

  async expectMemberVisible(name: string) {
    await expect(this.page.locator(`text=${name}`)).toBeVisible();
  }

  async expectMemberNotVisible(name: string) {
    await expect(this.page.locator(`text=${name}`)).not.toBeVisible();
  }

  async expectButtonVisible(buttonId: string) {
    await expect(
      this.page.locator(`[data-testid="${buttonId}"]`)
    ).toBeVisible();
  }

  async expectButtonNotVisible(buttonId: string) {
    await expect(
      this.page.locator(`[data-testid="${buttonId}"]`)
    ).not.toBeVisible();
  }

  async expectValidationError(fieldId: string) {
    await expect(
      this.page.locator(`[data-testid="${fieldId}-error"]`)
    ).toBeVisible();
  }

  async measurePerformance(
    operation: () => Promise<void>,
    maxTime: number = 5000
  ) {
    const startTime = Date.now();
    await operation();
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(maxTime);
    return duration;
  }

  async testKeyboardNavigation() {
    // Test tab navigation
    await this.page.keyboard.press("Tab");
    await expect(this.page.locator(":focus")).toBeVisible();

    // Test enter key
    await this.page.keyboard.press("Enter");

    // Test escape key
    await this.page.keyboard.press("Escape");
  }

  async testMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
    await expect(
      this.page.locator('[data-testid="mobile-menu-btn"]')
    ).toBeVisible();
  }

  async testRTLSupport() {
    await this.switchLanguage("arabic");
    await expect(this.page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(this.page.locator('[data-testid="navbar"]')).toHaveCSS(
      "text-align",
      "right"
    );
  }
}

export const createTestHelpers = (page: Page) => new TestHelpers(page);
