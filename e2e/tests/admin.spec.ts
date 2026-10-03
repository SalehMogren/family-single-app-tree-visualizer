import { expect, test } from "@playwright/test";

const ADMIN = "http://localhost:3001";
const WEB = "http://localhost:3000";

test.describe("admin app", () => {
  test("rejects anonymous access and wrong passwords", async ({ page }) => {
    await page.goto(`${ADMIN}/members`);
    await expect(page).toHaveURL(/\/login\?next=%2Fmembers/);
    await page.getByLabel("كلمة المرور").fill("nope");
    await page.getByRole("button", { name: "دخول" }).click();
    await expect(page.getByText("كلمة المرور غير صحيحة")).toBeVisible();
  });

  test("adds a relative in the editor and it appears on the public site", async ({ page }) => {
    await page.goto(`${ADMIN}/login`);
    await page.getByLabel("كلمة المرور").fill("e2e-password");
    await page.getByRole("button", { name: "دخول" }).click();
    await expect(page.getByRole("heading", { name: "نظرة عامة" })).toBeVisible();

    await page.goto(`${ADMIN}/editor?focus=m_046`);
    await page.getByRole("button", { name: "إضافة ابن/ابنة" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("الاسم").fill("اختبار");
    await dialog.getByLabel("سنة الميلاد").fill("2030");
    await dialog.getByRole("button", { name: "إضافة", exact: true }).click();
    await expect(page.getByRole("status").first()).toHaveText(/كل التغييرات محفوظة/, {
      timeout: 10_000,
    });

    await page.goto(`${WEB}/members?q=اختبار`);
    await expect(page.getByRole("link", { name: /اختبار/ })).toBeVisible();

    // Clean up through the members table.
    await page.goto(`${ADMIN}/members`);
    await page.getByRole("searchbox").fill("اختبار");
    await page
      .getByRole("row", { name: /اختبار/ })
      .getByRole("button", { name: "إجراءات" })
      .click();
    await page.getByRole("menuitem", { name: "حذف" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "حذف" }).click();
    await expect(page.getByText("لا يوجد أفراد")).toBeVisible();
    await expect(page.getByRole("status").first()).toHaveText(/كل التغييرات محفوظة/, {
      timeout: 10_000,
    });
  });
});
