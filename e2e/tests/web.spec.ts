import { expect, test } from "@playwright/test";

const WEB = "http://localhost:3000";

test.describe("public site", () => {
  test("home shows the family story and stats", async ({ page }) => {
    await page.goto(WEB);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("عائلة فلان");
    await expect(page.locator("dl").getByText("47", { exact: true })).toBeVisible();
  });

  test("tree renders, searches and opens a person", async ({ page }) => {
    await page.goto(`${WEB}/tree`);
    await expect(page.locator('[data-node-key="b:m_001"]')).toBeAttached();
    await page.keyboard.press("/");
    await page.getByPlaceholder("ابحث عن فرد…").fill("ابراهيم");
    await page.getByRole("option").first().click();
    await expect(
      page.getByRole("complementary").getByRole("heading", { name: "إبراهيم" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/focus=m_005/);
  });

  test("directory filters and links to profiles", async ({ page }) => {
    await page.goto(`${WEB}/members`);
    await page.getByRole("searchbox").fill("سلمان");
    await page.getByRole("link", { name: /سلمان/ }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("سلمان");
    await expect(
      page.getByText("سلمان بن عبدالرحمن بن سليمان بن عبدالله", { exact: true }),
    ).toBeVisible();
  });

  test("switches to English (LTR)", async ({ page }) => {
    await page.goto(WEB);
    await page.getByRole("button", { name: "اللغة" }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("The Fulan Family");
  });
});
