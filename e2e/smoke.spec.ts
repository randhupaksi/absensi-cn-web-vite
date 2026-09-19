import { expect, test } from "@playwright/test";

test("landing page boots without the initial error state", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Citra Negara Attendance System/i);
  await expect(page.locator("#initial-loader")).toBeHidden({ timeout: 20_000 });
  await expect(page.getByText("Halaman belum berhasil dimuat")).toHaveCount(0);
});

test("unauthenticated admin route redirects to staff login", async ({
  page,
}) => {
  await page.goto("/dashboard/admin");

  await expect(page).toHaveURL(/\/login\/staff$/);
});

test("legacy admin dashboard alias also redirects to staff login", async ({
  page,
}) => {
  await page.goto("/admin/dashboard");

  await expect(page).toHaveURL(/\/login\/staff$/);
});
