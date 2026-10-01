import { test, expect } from "./fixture";
import { accessCode, NOW, PASSWORD, profile, sessions, ticket } from "./fixtures";

for (const portal of ["student", "staff"] as const) {
  test(`public ${portal} support validates identity and creates a tracked ticket`, async ({ page, api }) => {
    const result = { ...ticket, portal };
    api.data("POST", "/public/support/tickets", { ticket: result, access_code: accessCode });
    api.data("POST", `/public/support/tickets/${ticket.reference_code}/access`, result);
    await page.goto(`/support?portal=${portal}`);
    await page.getByRole("button", { name: "Kirim tiket ke admin", exact: true }).click();
    await expect(page.getByText("Nama minimal 3 karakter", { exact: true })).toBeVisible();
    await expect(page.getByText("Ceritakan kendala minimal 10 karakter", { exact: true })).toBeVisible();
    expect(api.count("POST", "/public/support/tickets")).toBe(0);
    await page.getByPlaceholder("Nama sesuai data sekolah").fill(profile.name);
    await page.getByPlaceholder(portal === "student" ? "Masukkan NIS (8–10 digit)" : "Masukkan username guru").fill(portal === "student" ? profile.nis : "guru.sintetis");
    await page.getByPlaceholder("Jelaskan kendala yang kamu alami secara singkat...").fill("Saya lupa password akun sintetis.");
    await page.getByRole("button", { name: "Kirim tiket ke admin", exact: true }).click();
    await page.getByRole("button", { name: "Nanti saja", exact: true }).click();
    await expect(page.getByText(ticket.reference_code, { exact: false }).filter({ visible: true }).first()).toBeVisible();
    expect(JSON.parse(api.last("POST", "/public/support/tickets")!.body!)).toMatchObject({ portal, requester_name: profile.name, message: "Saya lupa password akun sintetis." });
    await page.reload();
    await expect(page.getByText(ticket.subject, { exact: true }).first()).toBeVisible();
    expect(api.count("POST", "/public/support/tickets")).toBe(1);
  });
}

test("public ticket loading prevents duplicate submit; failure preserves the form", async ({ page, api }) => {
  let release!: () => void;
  const wait = new Promise<void>((resolve) => { release = resolve; });
  api.on("POST", "/public/support/tickets", async (route) => {
    await wait;
    await route.fulfill({ status: 400, json: { success: false, message: "Tiket sintetis ditolak", code: "VALIDATION_FAILED" } });
  });
  await page.goto("/support");
  await page.getByPlaceholder("Nama sesuai data sekolah").fill(profile.name);
  await page.getByPlaceholder("Masukkan NIS (8–10 digit)").fill(profile.nis);
  await page.getByPlaceholder("Jelaskan kendala yang kamu alami secara singkat...").fill("Kendala sintetis untuk tiket uji.");
  await page.getByRole("button", { name: "Kirim tiket ke admin", exact: true }).click();
  await expect(page.getByRole("button", { name: "Kirim tiket ke admin", exact: true })).toBeDisabled();
  release();
  await expect(page.getByText("Tiket belum berhasil dibuat", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Nama sesuai data sekolah")).toHaveValue(profile.name);
  expect(api.count("POST", "/public/support/tickets")).toBe(1);
});

test("track ticket checks access code, sends reply and renders updated conversation", async ({ page, api }) => {
  api.data("POST", "/public/support/tickets/access", ticket);
  api.data("POST", `/public/support/tickets/${ticket.reference_code}/access`, ticket);
  api.data("POST", `/public/support/tickets/${ticket.reference_code}/messages`, {
    ...ticket, messages: [...ticket.messages!, { id: "reply-e2e", sender_role: "REQUESTER", sender_name: profile.name, body: "Balasan sintetis tambahan", created_at: NOW }],
  });
  await page.goto("/support?mode=track");
  await expect(page.getByRole("button", { name: "Buka tiket", exact: true })).toBeDisabled();
  await page.getByPlaceholder("XXXX-XXXX-XXXX").fill(accessCode.toLowerCase());
  await page.getByRole("button", { name: "Buka tiket", exact: true }).click();
  await expect(page.getByText(ticket.subject, { exact: true }).first()).toBeVisible();
  expect(JSON.parse(api.last("POST", "/public/support/tickets/access")!.body!)).toMatchObject({ access_code: accessCode });
  await expect(page.getByRole("button", { name: "Kirim balasan", exact: true })).toBeDisabled();
  await page.getByLabel("Pesan balasan", { exact: true }).fill("Balasan sintetis tambahan");
  await page.getByRole("button", { name: "Kirim balasan", exact: true }).click();
  await expect(page.getByText("Balasan sintetis tambahan", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Pesan balasan", { exact: true })).toHaveValue("");
});

test("invalid ticket code shows error without private conversation", async ({ page, api }) => {
  api.error("POST", "/public/support/tickets/access", 404, "Kode tiket sintetis tidak ditemukan", "RESOURCE_NOT_FOUND");
  await page.goto("/support?mode=track");
  await page.getByPlaceholder("XXXX-XXXX-XXXX").fill("BAD-CODE-0001");
  await page.getByRole("button", { name: "Buka tiket", exact: true }).click();
  await expect(page.getByText("Tiket tidak ditemukan", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Pesan balasan", { exact: true })).toHaveCount(0);
  await expect(page.getByPlaceholder("XXXX-XXXX-XXXX")).toHaveValue("BAD-CODE-0001");
});

test("approved recovery ticket completes password reset and returns to login", async ({ page, api }) => {
  const approved = { ...ticket, password_reset: { status: "APPROVED", expires_at: "2026-10-02T07:30:00+07:00" } };
  api.data("POST", "/public/support/tickets/access", approved);
  api.data("POST", `/public/support/tickets/${ticket.reference_code}/access`, approved);
  api.data("POST", `/public/support/tickets/${ticket.reference_code}/reset-session`, { token: "synthetic-reset-token", portal: "student", expires_at: "2026-09-30T07:50:00+07:00" });
  api.data("POST", "/public/support/password/reset", { completed: true });
  await page.goto("/support?mode=track");
  await page.getByPlaceholder("XXXX-XXXX-XXXX").fill(accessCode);
  await page.getByRole("button", { name: "Buka tiket", exact: true }).click();
  await page.getByRole("button", { name: "Buat password baru", exact: true }).click();
  await expect(page).toHaveURL(/\/support\/reset-password\?portal=student$/);
  await page.getByLabel("Password baru", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Konfirmasi password", { exact: true }).fill("Berbeda-123");
  await page.getByRole("button", { name: /Simpan password/i }).click();
  await expect(page.getByText("Konfirmasi password belum sama", { exact: true })).toBeVisible();
  expect(api.count("POST", "/public/support/password/reset")).toBe(0);
  await page.getByLabel("Konfirmasi password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: /Simpan password/i }).click();
  await expect(page.getByRole("heading", { name: "Password berhasil diperbarui", exact: true })).toBeVisible();
  expect(JSON.parse(api.last("POST", "/public/support/password/reset")!.body!)).toEqual({ token: "synthetic-reset-token", new_password: PASSWORD });
  await page.getByRole("link", { name: "Kembali ke login", exact: true }).click();
  await expect(page).toHaveURL(/\/login\/student$/);
});

for (const state of ["missing", "expired"] as const) {
  test(`reset ${state} session cannot submit a password`, async ({ page, api }) => {
    await page.goto(`/support/reset-password?portal=staff${state === "expired" ? "#token=synthetic-expired&expires_at=2026-09-29T00%3A00%3A00Z" : ""}`);
    await expect(page.getByRole("heading", { name: state === "missing" ? "Sesi reset tidak ditemukan" : "Sesi reset telah kedaluwarsa", exact: true })).toBeVisible();
    await expect(page.getByLabel("Password baru", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Kembali ke halaman login", exact: true }).click();
    await expect(page).toHaveURL(/\/login\/staff$/);
    expect(api.count("POST", "/public/support/password/reset")).toBe(0);
  });
}

test("server-rejected reset token replaces the form with expiration feedback", async ({ page, api }) => {
  api.error("POST", "/public/support/password/reset", 400, "Token sintetis kedaluwarsa", "PASSWORD_RESET_TOKEN_INVALID");
  await page.goto("/support/reset-password?portal=student#token=synthetic-token&expires_at=2026-09-30T01%3A00%3A00Z");
  await page.getByLabel("Password baru", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Konfirmasi password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: /Simpan password/i }).click();
  await expect(page.getByRole("heading", { name: "Sesi reset telah kedaluwarsa", exact: true })).toBeVisible();
});

for (const role of ["student", "teacher"] as const) {
  test(`${role} support creates an authenticated ticket and displays its detail`, async ({ page, api, signedIn }) => {
    await signedIn(sessions[role]);
    const created = { ...ticket, category: "TECHNICAL", subject: "Kamera sintetis bermasalah", password_reset: { status: "NOT_APPLICABLE" } };
    api.data("POST", "/support/tickets", { ticket: created, access_code: "" });
    api.data("GET", `/support/tickets/${ticket.reference_code}`, created);
    await page.goto(`/dashboard/${role}/support`);
    await expect(page.getByText("Belum ada tiket", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Buat tiket", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Tiket bantuan baru", exact: true });
    await dialog.getByRole("button", { name: "Kirim tiket", exact: true }).click();
    await expect(dialog.getByText("Judul minimal 5 karakter", { exact: true })).toBeVisible();
    await page.getByPlaceholder("Contoh: Kamera tidak dapat dibuka").fill(created.subject);
    await page.getByPlaceholder("Jelaskan halaman, waktu kejadian, dan pesan yang tampil...").fill("Pesan kendala sintetis tanpa data pribadi.");
    await dialog.getByRole("button", { name: "Kirim tiket", exact: true }).click();
    await page.getByRole("button", { name: "Nanti saja", exact: true }).click();
    await expect(page.getByText(created.subject, { exact: true }).filter({ visible: true }).first()).toBeVisible();
    expect(api.last("POST", "/support/tickets")!.authorization).toBe(`Bearer ${sessions[role].accessToken}`);
    expect(JSON.parse(api.last("POST", "/support/tickets")!.body!)).toMatchObject({ subject: created.subject, message: "Pesan kendala sintetis tanpa data pribadi." });
  });
}
