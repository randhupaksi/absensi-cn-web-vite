import { test, expect } from "./fixture";
import { sessions, studentUser } from "./fixtures";

test("public journey: landing to student login, help, and browser back", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Satu langkah hadir/ })).toBeVisible();
  await page.getByRole("link", { name: "Mulai Absensi Sekarang", exact: true }).click();
  await expect(page).toHaveURL(/\/login\/student$/);
  await expect(page.getByLabel("NIS", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Lupa password? klik di sini", exact: true }).click();
  await expect(page).toHaveURL(/\/support\?portal=student$/);
  await expect(page.getByPlaceholder("Masukkan NIS (8–10 digit)")).toBeVisible();
  await page.goBack();
  await expect(page.getByLabel("NIS", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("theme switch persists through reload on a public form", async ({ page }) => {
  await page.goto("/login/student");
  await page.getByRole("switch", { name: "Gunakan tema terang" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.getByRole("switch", { name: "Gunakan tema gelap" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("staff recovery navigation uses the staff portal", async ({ page }) => {
  await page.goto("/login/staff");
  await page.getByRole("link", { name: "Lupa password? klik di sini", exact: true }).click();
  await expect(page).toHaveURL(/\/support\?portal=staff$/);
  await expect(page.getByPlaceholder("Masukkan username guru")).toBeVisible();
  await page.goBack();
  await expect(page.getByLabel("Username Staff", { exact: true })).toBeVisible();
});

test("public developer pages render without private API calls", async ({ page, api }) => {
  await page.goto("/deveran");
  await expect(page.locator("main pre")).toContainText('"route": "/deveran"');
  await page.goto("/randhu");
  await expect(page.getByRole("heading", { name: /Randhu Paksi.*Membumi/ })).toBeVisible();
  await page.getByRole("link", { name: "CITRA NEGARA ATTENDANCE SYSTEM", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:4173/");
  expect(api.calls.filter((call) => /^\/(student|teacher|bk|admin)\//.test(call.path))).toEqual([]);
});

for (const [path, destination] of [["/login", "/login/student"], ["/dashboard", "/login/student"], ["/auth/change-password", "/login/student"], ["/route-that-does-not-exist-e2e", "/"]]) {
  test(`public redirect ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(`http://127.0.0.1:4173${destination}`);
  });
}

const protectedRoutes = {
  student: ["", "/history", "/profile", "/support"],
  teacher: ["", "/support", "/homeroom/students", "/homeroom/attendance", "/homeroom/submissions", "/subject/schedule", "/subject/history", "/subject/session", "/subject/recap", "/bk/students", "/bk/attendance", "/bk/submissions", "/bk/counseling"],
  admin: ["", "/analytics", "/admins", "/classes", "/holidays", "/students", "/subjects", "/teachers", "/users", "/support"],
};
for (const [role, paths] of Object.entries(protectedRoutes)) {
  test(`${role}: every registered protected route rejects an absent session`, async ({ page, api }) => {
    for (const path of paths) {
      await test.step(`/dashboard/${role}${path}`, async () => {
        await page.goto(`/dashboard/${role}${path}`);
        await expect(page).toHaveURL(new RegExp(`/login/${role === "student" ? "student" : "staff"}$`));
        await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
      });
    }
    expect(api.calls.filter((call) => /^\/(student|teacher|bk|admin)\//.test(call.path))).toEqual([]);
  });
}

for (const [role, destination] of [["student", "teacher"], ["student", "admin"], ["teacher", "student"], ["teacher", "admin"], ["admin", "student"], ["admin", "teacher"]] as const) {
  test(`${role} cannot render ${destination} workspace`, async ({ page, api, signedIn }) => {
    await signedIn(sessions[role]);
    await page.goto(`/dashboard/${destination}`);
    await expect(page).toHaveURL(new RegExp(`/dashboard/${role}$`));
    expect(api.calls.filter((call) => call.path.startsWith(`/${destination}/`))).toEqual([]);
  });
}

test("teacher without BK capability cannot render BK student data", async ({ page, api, signedIn }) => {
  await signedIn(sessions.teacher);
  api.error("GET", "/bk/students-overview", 403, "Cakupan BK tidak tersedia", "ACCESS_DENIED");
  await page.goto("/dashboard/teacher/bk/students");
  await expect(page).toHaveURL(/\/dashboard\/teacher$/);
  await expect(page.getByText("Pemantauan Siswa", { exact: true })).toHaveCount(0);
});

test("expired student session clears private session and redirects", async ({ page, api, signedIn }) => {
  await signedIn(sessions.student);
  api.error("GET", "/student/profile", 401, "Sesi sintetis kedaluwarsa", "AUTHENTICATION_REQUIRED");
  await page.goto("/login/student");
  await expect(page).toHaveURL(/\/dashboard\/student$/);
  await page.goto("/dashboard/student/profile");
  await expect(page).toHaveURL(/\/login\/student$/);
  expect(await page.evaluate(() => sessionStorage.getItem("absensi-cn-auth"))).toBeNull();
  await expect(page.getByText(studentUser.name, { exact: true })).toHaveCount(0);
  await page.goBack();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
});

test("corrupt session and legacy persistent session do not grant access", async ({ page, context }) => {
  await context.addInitScript(() => {
    sessionStorage.setItem("absensi-cn-auth", "{malformed");
    localStorage.setItem("absensi-cn-auth", "{legacy");
  });
  await page.goto("/dashboard/student/profile");
  await expect(page).toHaveURL(/\/login\/student$/);
  expect(await page.evaluate(() => [localStorage.getItem("absensi-cn-auth"), sessionStorage.getItem("absensi-cn-auth")])).toEqual([null, null]);
});

test("teacher logout removes access, including browser back and reload", async ({ page, signedIn, isMobile }) => {
  await signedIn(sessions.teacher);
  await page.goto("/dashboard/teacher/homeroom/students");
  await expect(page.getByText(studentUser.name, { exact: true }).filter({ visible: true }).first()).toBeVisible();
  if (isMobile) await page.locator("header").getByRole("button").first().click();
  await page.getByRole("button", { name: "Keluar", exact: true }).click();
  await expect(page).toHaveURL(/\/login\/staff$/);
  expect(await page.evaluate(() => sessionStorage.getItem("absensi-cn-auth"))).toBeNull();
  await page.goto("/dashboard/teacher");
  await expect(page).toHaveURL(/\/login\/staff$/);
  await page.goBack();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText(studentUser.name, { exact: true })).toHaveCount(0);
});

test("network isolation aborts external and other local-service requests", async ({ page, api }) => {
  await page.goto("/login/student");
  const outcomes = await page.evaluate(async () => Promise.all([
    "https://example.invalid/e2e-network-probe", "http://127.0.0.1:8080/api/v1/health",
  ].map(async (url) => { try { await fetch(url); return "unexpected success"; } catch { return "blocked"; } })));
  expect(outcomes).toEqual(["blocked", "blocked"]);
  expect(api.blocked).toEqual(expect.arrayContaining([expect.stringContaining("example.invalid"), expect.stringContaining("127.0.0.1:8080")]));
});
