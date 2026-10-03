import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { expect, test, type Page } from "@playwright/test";

const ADMIN = "http://localhost:3001";
const WEB = "http://localhost:3000";

const login = async (page: Page) => {
  await page.goto(`${ADMIN}/login`);
  await page.getByLabel("كلمة المرور").fill("e2e-password");
  await page.getByRole("button", { name: "دخول" }).click();
  await expect(page.getByRole("heading", { name: "نظرة عامة" })).toBeVisible();
};

/** Fit the whole (visible) tree on screen so viewport culling doesn't hide cards. */
const fit = async (page: Page) => {
  await page.getByRole("button", { name: "ملاءمة الشاشة" }).click();
  await page.waitForTimeout(700);
};

test.describe("focus view", () => {
  test.use({ viewport: { width: 2560, height: 1440 } });

  test("editor shows only the selected member's branch", async ({ page }) => {
    await login(page);
    // m_005 = إبراهيم (2 children); m_003 = محمد is outside his branch.
    await page.goto(`${ADMIN}/editor?focus=m_005`);
    await fit(page);
    await expect(page.locator('[data-node-key="b:m_003"]')).toBeAttached();
    await page.getByRole("button", { name: "عرض الفرع" }).click();
    await expect(page).toHaveURL(/root=m_005/);
    await expect(page.getByText("فرع إبراهيم")).toBeVisible();
    await fit(page);
    await expect(page.locator('[data-node-key="b:m_005"]')).toBeAttached();
    await expect(page.locator('[data-node-key="b:m_019"]')).toBeAttached(); // صالح (son)
    await expect(page.locator('[data-node-key="b:m_003"]')).toHaveCount(0);
    await expect(page.locator('[data-node-key="b:m_001"]')).toHaveCount(0);

    // Breadcrumb widens to the father's branch, then exit restores everything.
    await page.getByRole("button", { name: "عبدالله", exact: true }).click();
    await fit(page);
    await expect(page.locator('[data-node-key="b:m_003"]')).toBeAttached();
    await page.getByRole("button", { name: "الشجرة كاملة" }).click();
    await expect(page).not.toHaveURL(/root=/);
  });

  test("double-click opens a branch and the link is shareable on the public site", async ({
    page,
  }) => {
    await page.goto(`${WEB}/tree?root=m_012`);
    await expect(page.getByText("فرع عبدالله")).toBeVisible();
    await expect(page.locator('[data-node-key="b:m_005"]')).toHaveCount(0);
    await page.getByRole("button", { name: "الشجرة كاملة" }).click();
    await fit(page);
    await expect(page.locator('[data-node-key="b:m_005"]')).toBeAttached();
  });
});

test.describe("csv", () => {
  test("exports members as CSV and imports an edited file", async ({ page }) => {
    await login(page);
    await page.goto(`${ADMIN}/data`);
    const download = page.waitForEvent("download");
    await page.getByRole("link", { name: "تصدير الأفراد CSV" }).click();
    const file = join(tmpdir(), `members-${Date.now()}.csv`);
    await (await download).saveAs(file);
    const csv = readFileSync(file, "utf8");
    const original = join(tmpdir(), `members-original-${Date.now()}.csv`);
    writeFileSync(original, csv);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.split("\r\n")[0]).toContain("id,name,gender,birthYear");

    // Edit in "Excel": add a child of m_046 and one broken row.
    const edited = `${csv}new_1,سلطان,ذكر,2024,,,m_046,,,,,,,,,\r\nbad,خطأ,؟,,,,,,,,,,,,,\r\n`;
    writeFileSync(file, edited);
    await page.locator('input[type="file"]').setInputFiles(file);
    const preview = page.locator("#import-preview");
    await expect(preview).toContainText("48 فرد");
    await expect(preview).toContainText("الصف 50");
    await preview.getByRole("button", { name: "استبدال البيانات" }).click();
    await expect(page.getByText("تم استيراد البيانات")).toBeVisible();

    await page.goto(`${WEB}/members?q=سلطان`);
    await expect(page.getByText("سلطان بن ريان", { exact: false })).toBeVisible();

    // Restore the original data so other specs see the seed family.
    await page.goto(`${ADMIN}/data`);
    await page.locator('input[type="file"]').setInputFiles(original);
    await expect(page.locator("#import-preview")).toContainText("47 فرد");
    await page.locator("#import-preview").getByRole("button", { name: "استبدال البيانات" }).click();
    await expect(page.getByText("تم استيراد البيانات")).toBeVisible();
  });
});
