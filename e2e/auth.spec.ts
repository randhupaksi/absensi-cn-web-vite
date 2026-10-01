import { test, expect, deferredResponse } from "./fixture";
import { PASSWORD, sessions, studentUser, teacherUser, adminUser } from "./fixtures";

for (const portal of ["student", "staff"] as const) {
  const identifier = portal === "student" ? "NIS" : "Username Staff";
  const submit = portal === "student" ? "Masuk sebagai Siswa" : "Masuk ke Portal Staff";
  const value = portal === "student" ? studentUser.nis : teacherUser.username;
  test(`${portal}: empty credentials stay on login without an API call`, async ({ page, api }) => {
    await page.goto(`/login/${portal}`);
    await page.getByRole("button", { name: submit, exact: true }).click();
    await expect(page.getByText(portal === "student" ? "NIS wajib diisi" : "Nama pengguna wajib diisi", { exact: true })).toBeVisible();
    await expect(page.getByText("Password wajib diisi", { exact: true })).toBeVisible();
    expect(api.count("POST", "/auth/login")).toBe(0);
  });
  test(`${portal}: rejected credentials preserve input and allow retry`, async ({ page, api }) => {
    api.error("POST", "/auth/login", 401, "Identitas atau password sintetis salah", "INVALID_CREDENTIALS");
    await page.goto(`/login/${portal}`);
    await page.getByLabel(identifier, { exact: true }).fill(value);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: submit, exact: true }).click();
    await expect(page.getByText("Gagal masuk", { exact: true })).toBeVisible();
    await expect(page.getByLabel(identifier, { exact: true })).toHaveValue(value);
    await expect(page.getByRole("button", { name: submit, exact: true })).toBeEnabled();
    expect(api.count("POST", "/auth/login")).toBe(1);
    expect(await page.evaluate(() => sessionStorage.getItem("absensi-cn-auth"))).toBeNull();
  });
  test(`${portal}: pending login disables repeated submission`, async ({ page, api }) => {
    const user = portal === "student" ? studentUser : teacherUser;
    const release = deferredResponse(api, "POST", "/auth/login", { access_token: "synthetic-login-token", user });
    await page.goto(`/login/${portal}`);
    await page.getByLabel(identifier, { exact: true }).fill(value);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: submit, exact: true }).click();
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    await expect(page.locator('button[type="submit"]')).toHaveAttribute("aria-busy", "true");
    expect(api.count("POST", "/auth/login")).toBe(1);
    release();
    await expect(page).toHaveURL(new RegExp(`/dashboard/${portal === "student" ? "student" : "teacher"}$`));
  });
  test(`${portal}: gateway failure shows service feedback without creating a session`, async ({ page, api }) => {
    api.error("POST", "/auth/login", 503, "Layanan sintetis sedang tidak tersedia", "SERVER_UNAVAILABLE");
    await page.goto(`/login/${portal}`);
    await page.getByLabel(identifier, { exact: true }).fill(value);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: submit, exact: true }).click();
    await expect(page.getByText("Server sedang mengalami gangguan", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem("absensi-cn-auth"))).toBeNull();
    expect(api.count("POST", "/auth/login")).toBe(2);
  });
}

for (const user of [studentUser, teacherUser, adminUser]) {
  test(`${user.role}: login follows portal contract and survives reload`, async ({ page, api }) => {
    api.data("POST", "/auth/login", { access_token: `synthetic-${user.role}-token`, user });
    await page.goto(`/login/${user.portal}`);
    await page.getByLabel(user.role === "STUDENT" ? "NIS" : "Username Staff", { exact: true }).fill(user.role === "STUDENT" ? user.nis : user.username);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: user.role === "STUDENT" ? "Masuk sebagai Siswa" : "Masuk ke Portal Staff", exact: true }).click();
    const destination = `/dashboard/${user.role.toLowerCase()}`;
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
    const payload = JSON.parse(api.last("POST", "/auth/login")!.body!);
    expect(payload).toMatchObject({ portal: user.portal, password: PASSWORD });
    expect(payload[user.role === "STUDENT" ? "nis" : "username"]).toBe(user.role === "STUDENT" ? user.nis : user.username);
    await page.reload();
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
    await expect(page.getByRole("heading", { name: /Dashboard|Siswa Sintetis/ }).first()).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("absensi-cn-auth"))).toBeNull();
  });
}

test("student NIS format rejects incomplete digits without an API request", async ({ page, api }) => {
  await page.goto("/login/student");
  await page.getByLabel("NIS", { exact: true }).fill("abc123");
  await expect(page.getByLabel("NIS", { exact: true })).toHaveValue("123");
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Masuk sebagai Siswa", exact: true }).click();
  await expect(page.getByText("NIS harus berupa angka yang valid", { exact: true })).toBeVisible();
  expect(api.count("POST", "/auth/login")).toBe(0);
});

test("password visibility button is usable with a pointer", async ({ page }) => {
  await page.goto("/login/student");
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  // Regression: the input currently intercepts clicks on its trailing button.
  // Keep a real click here so the product defect remains visible.
  await page.getByRole("button", { name: "Tampilkan password", exact: true }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Sembunyikan password", exact: true }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "password");
});

for (const code of ["LOGIN_THROTTLED", "LOGIN_IN_PROGRESS"] as const) {
  test(`${code}: cooldown honors Retry-After without automatic replay`, async ({ page, api }) => {
    api.error("POST", "/auth/login", 429, "Tunggu sebentar", code, { "retry-after": "30" });
    await page.goto("/login/student");
    await page.getByLabel("NIS", { exact: true }).fill(studentUser.nis);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Masuk sebagai Siswa", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText(code === "LOGIN_THROTTLED" ? "Terlalu banyak percobaan login" : "Login akun ini sedang diproses");
    await expect(page.getByRole("button", { name: "Tunggu sebentar", exact: true })).toBeDisabled();
    expect(api.count("POST", "/auth/login")).toBe(1);
  });
}

test("transport timeout displays retryable login feedback", async ({ page, api }) => {
  api.on("POST", "/auth/login", (route) => route.abort("timedout"));
  await page.goto("/login/staff");
  await page.getByLabel("Username Staff").fill(teacherUser.username);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Masuk ke Portal Staff", exact: true }).click();
  await expect(page.getByText("Gagal masuk", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Masuk ke Portal Staff", exact: true })).toBeEnabled();
  expect(api.count("POST", "/auth/login")).toBe(1);
});

test("login request deadline releases the form without replaying credentials", async ({ page, api }) => {
  // Leave the request pending and let the real 20 second Axios timeout fire.
  api.on("POST", "/auth/login", async () => {});
  await page.goto("/login/staff");
  await page.getByLabel("Username Staff").fill(teacherUser.username);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Masuk ke Portal Staff", exact: true }).click();
  await expect(page.locator('button[type="submit"]')).toBeDisabled();
  await expect(page.getByText("Gagal masuk", { exact: true })).toBeVisible({ timeout: 25_000 });
  await expect(page.getByRole("button", { name: "Masuk ke Portal Staff", exact: true })).toBeEnabled();
  expect(api.count("POST", "/auth/login")).toBe(1);
  expect(await page.evaluate(() => sessionStorage.getItem("absensi-cn-auth"))).toBeNull();
});

for (const role of ["student", "teacher"] as const) {
  test(`${role}: initial password gate validates then opens the dashboard`, async ({ page, api, signedIn }) => {
    await signedIn({ ...sessions[role], user: { ...sessions[role].user, must_change_password: true } });
    api.data("POST", "/auth/change-password", { must_change_password: false });
    await page.goto(`/dashboard/${role}`);
    await expect(page).toHaveURL(/\/auth\/change-password$/);
    await page.getByRole("button", { name: "Simpan password pribadi", exact: true }).click();
    await expect(page.getByText("Password baru minimal 8 karakter.", { exact: true })).toBeVisible();
    await page.getByLabel("Password baru", { exact: true }).fill(PASSWORD);
    await page.getByLabel("Konfirmasi password baru", { exact: true }).fill("Tidak-sama-123");
    await page.getByRole("button", { name: "Simpan password pribadi", exact: true }).click();
    await expect(page.getByText("Konfirmasi password belum sama.", { exact: true })).toBeVisible();
    expect(api.count("POST", "/auth/change-password")).toBe(0);
    await page.getByLabel("Konfirmasi password baru", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Simpan password pribadi", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/dashboard/${role}$`));
    expect(JSON.parse(api.last("POST", "/auth/change-password")!.body!)).toEqual({ new_password: PASSWORD });
    expect(api.last("POST", "/auth/change-password")!.authorization).toBe(`Bearer ${sessions[role].accessToken}`);
  });
}

test("initial password API failure keeps the gate and form", async ({ page, api, signedIn }) => {
  await signedIn({ ...sessions.student, user: { ...studentUser, must_change_password: true } });
  api.error("POST", "/auth/change-password", 400, "Password sintetis ditolak");
  await page.goto("/auth/change-password");
  await page.getByLabel("Password baru", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Konfirmasi password baru", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Simpan password pribadi", exact: true }).click();
  await expect(page.getByText("Password belum diperbarui", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/change-password$/);
  await expect(page.getByLabel("Password baru", { exact: true })).toHaveValue(PASSWORD);
});
