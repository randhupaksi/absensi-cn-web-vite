import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const deploymentConfig = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8")) as {
  headers: { headers: { key: string; value: string }[] }[];
};
const contentSecurityPolicy = deploymentConfig.headers[0].headers.find(
  (header) => header.key === "Content-Security-Policy",
)?.value;

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

test("landing page boots under the deployment CSP", async ({ page }) => {
  expect(contentSecurityPolicy).toBeTruthy();
  await page.route("**/*", async (route) => {
    if (!route.request().isNavigationRequest()) {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), "content-security-policy": contentSecurityPolicy! } });
  });
  await page.goto("/");
  await expect(page.locator("#initial-loader")).toBeHidden({ timeout: 20_000 });
});

test("legacy admin dashboard alias also redirects to staff login", async ({
  page,
}) => {
  await page.goto("/admin/dashboard");

  await expect(page).toHaveURL(/\/login\/staff$/);
});
