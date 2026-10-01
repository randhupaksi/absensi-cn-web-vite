import { test, expect, capturePhoto, syntheticCamera, json, deferredResponse, type MockApi } from "./fixture";
import { attendance, completedToday, dashboard, history, profile, sessions, today } from "./fixtures";

function successfulReport(api: MockApi, status: "hadir" | "izin" | "sakit" = "hadir") {
  const recorded = { ...completedToday, current_status: status, attendance: { ...attendance, status } };
  api.on("POST", "/student/daily-report", async (route) => {
    api.reads["/student/today"] = recorded;
    api.reads["/student/dashboard"] = { ...dashboard, today: recorded, recent_attendance: [recorded.attendance] };
    await json(route, recorded);
  });
}

test.beforeEach(async ({ signedIn }) => { await signedIn(sessions.student); });

for (const location of ["captured", "denied", "unavailable"] as const) {
  test(`attendance completes with synthetic photo and ${location} location`, async ({ page, api }) => {
    await syntheticCamera(page, location);
    successfulReport(api);
    await page.goto("/dashboard/student");
    await capturePhoto(page);
    await page.getByRole("button", { name: "Kirim Absensi", exact: true }).click();
    await expect(page.getByText("Absensi berhasil dicatat.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Absensi Sudah Tercatat", exact: true })).toBeDisabled();
    expect(api.count("POST", "/student/daily-report")).toBe(1);
    const call = api.last("POST", "/student/daily-report")!;
    expect(call.authorization).toBe(`Bearer ${sessions.student.accessToken}`);
    expect(call.body).toContain('name="type"\r\n\r\nHADIR');
    expect(call.body).toContain('name="photo"; filename="');
    expect(call.body).toContain("Content-Type: image/jpeg");
    expect(call.body).toContain(`name="location_client_status"\r\n\r\n${location === "denied" ? "permission_denied" : location}`);
    if (location === "captured") expect(call.body).toContain('name="location_latitude"\r\n\r\n0');
    else expect(call.body).not.toContain('name="location_latitude"');
    await page.reload();
    await expect(page.getByRole("button", { name: "Absensi Sudah Tercatat", exact: true })).toBeDisabled();
    expect(api.count("POST", "/student/daily-report")).toBe(1);
  });
}

test("camera permission denial explains recovery and does not submit", async ({ page, api }) => {
  await page.goto("/dashboard/student");
  await page.getByRole("button", { name: "Absen Hari Ini", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Ambil Foto Absensi", exact: true });
  await expect(dialog.getByText("Akses kamera belum tersedia", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Ambil Foto", exact: true })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Batal", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Absen Hari Ini", exact: true })).toBeEnabled();
  expect(api.count("POST", "/student/daily-report")).toBe(0);
});

test("photo can be cancelled and captured again without sending attendance", async ({ page, api }) => {
  await syntheticCamera(page);
  await page.goto("/dashboard/student");
  await capturePhoto(page);
  await page.getByRole("dialog").getByRole("button", { name: "Batal", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await capturePhoto(page);
  await expect(page.getByRole("button", { name: "Kirim Absensi", exact: true })).toBeEnabled();
  expect(api.count("POST", "/student/daily-report")).toBe(0);
});

for (const [label, value, status] of [["Izin", "IZIN", "izin"], ["Sakit", "SAKIT", "sakit"]] as const) {
  test(`${label} report requires a reason and sends it with the photo`, async ({ page, api }) => {
    await syntheticCamera(page, "denied");
    successfulReport(api, status);
    await page.goto("/dashboard/student");
    await capturePhoto(page);
    await page.getByRole("dialog").getByRole("combobox").click();
    await page.getByRole("option").filter({ has: page.getByText(label, { exact: true }) }).click();
    await page.getByRole("button", { name: "Kirim Absensi", exact: true }).click();
    await expect(page.getByText(`Alasan ${label.toLowerCase()} wajib diisi.`, { exact: true })).toBeVisible();
    expect(api.count("POST", "/student/daily-report")).toBe(0);
    await page.getByPlaceholder("Tuliskan keterangan singkat dan jelas").fill("Alasan sintetis untuk pengujian");
    await page.getByRole("button", { name: "Kirim Absensi", exact: true }).click();
    await expect(page.getByText("Absensi berhasil dicatat.", { exact: true })).toBeVisible();
    expect(api.last("POST", "/student/daily-report")!.body).toContain(`name="type"\r\n\r\n${value}`);
    expect(api.last("POST", "/student/daily-report")!.body).toContain("Alasan sintetis untuk pengujian");
  });
}

test("pending upload disables submit and cancellation", async ({ page, api }) => {
  await syntheticCamera(page);
  const release = deferredResponse(api, "POST", "/student/daily-report", completedToday);
  await page.goto("/dashboard/student");
  await capturePhoto(page);
  await page.getByRole("button", { name: "Kirim Absensi", exact: true }).click();
  await expect(page.getByRole("dialog").locator("button[data-modal-submit]")).toBeDisabled();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Batal", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(api.count("POST", "/student/daily-report")).toBe(1);
  api.reads["/student/today"] = completedToday;
  release();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("failed upload preserves the photo and user retry succeeds", async ({ page, api }) => {
  await syntheticCamera(page);
  api.error("POST", "/student/daily-report", 400, "Foto sintetis belum diterima");
  await page.goto("/dashboard/student");
  await capturePhoto(page);
  await page.getByRole("button", { name: "Kirim Absensi", exact: true }).click();
  await expect(page.getByRole("button", { name: "Coba Kirim Lagi", exact: true })).toBeEnabled();
  await expect(page.getByRole("dialog").locator("img")).toBeVisible();
  successfulReport(api);
  await page.getByRole("button", { name: "Coba Kirim Lagi", exact: true }).click();
  await expect(page.getByText("Absensi berhasil dicatat.", { exact: true })).toBeVisible();
  expect(api.count("POST", "/student/daily-report")).toBe(2);
});

test("duplicate conflict reconciles the recorded attendance without resubmitting", async ({ page, api }) => {
  await syntheticCamera(page);
  api.on("POST", "/student/daily-report", async (route) => {
    api.reads["/student/today"] = completedToday;
    await route.fulfill({ status: 409, json: { success: false, code: "ATTENDANCE_ALREADY_RECORDED", message: "Absensi sudah tercatat" } });
  });
  await page.goto("/dashboard/student");
  await capturePhoto(page);
  const todayCalls = api.count("GET", "/student/today");
  await page.getByRole("button", { name: "Kirim Absensi", exact: true }).click();
  await expect(page.getByText("Absensi berhasil dicatat.", { exact: true })).toBeVisible();
  expect(api.count("GET", "/student/today")).toBeGreaterThan(todayCalls);
  expect(api.count("POST", "/student/daily-report")).toBe(1);
});

test("busy admission retries then displays one successful attendance", async ({ page, api }) => {
  await syntheticCamera(page);
  api.on("POST", "/student/daily-report", async (route) => {
    if (api.count("POST", "/student/daily-report") === 1) {
      await route.fulfill({ status: 429, headers: { "retry-after": "1" }, json: { success: false, code: "SERVER_BUSY", message: "Antrean sintetis" } });
    } else {
      api.reads["/student/today"] = completedToday;
      await json(route, completedToday);
    }
  });
  await page.goto("/dashboard/student");
  await capturePhoto(page);
  await page.getByRole("button", { name: "Kirim Absensi", exact: true }).click();
  await expect(page.getByRole("button", { name: /Menunggu Giliran/ })).toBeDisabled();
  await expect(page.getByText("Absensi berhasil dicatat.", { exact: true })).toBeVisible();
  expect(api.count("POST", "/student/daily-report")).toBe(2);
});

test("holiday disables attendance without opening a camera", async ({ page, api }) => {
  const holidayToday = { ...today, can_submit: false, is_school_day: false, holiday_name: "Libur Sintetis", holiday_type: "SCHOOL" };
  api.reads["/student/today"] = holidayToday;
  api.reads["/student/dashboard"] = { ...dashboard, today: holidayToday };
  await page.goto("/dashboard/student");
  await expect(page.getByRole("button", { name: "Hari Libur", exact: true })).toBeDisabled();
  await expect(page.getByText(/Libur Sintetis tercatat sebagai hari libur sekolah/)).toBeVisible();
  expect(api.count("POST", "/student/daily-report")).toBe(0);
});

test("history search, empty results and protected photo work", async ({ page, api }) => {
  await page.goto("/dashboard/student/history");
  await page.getByRole("tab", { name: "Histori Absensi", exact: true }).click();
  const search = page.getByPlaceholder("Cari status, catatan, tanggal");
  await search.fill("Tidak ditemukan sintetis");
  await expect(page.getByText("Histori belum ditemukan", { exact: true })).toBeVisible();
  await search.fill("");
  await page.getByRole("button", { name: "Buka bukti absensi", exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect.poll(() => api.count("GET", "/uploads/e2e/photo.png")).toBe(1);
  expect(api.last("GET", "/uploads/e2e/photo.png")!.authorization).toBe(`Bearer ${sessions.student.accessToken}`);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("empty history disables export", async ({ page, api }) => {
  api.reads["/student/history"] = { ...history, attendance: [], submissions: [] };
  await page.goto("/dashboard/student/history");
  await expect(page.getByRole("button", { name: "Export Laporan", exact: true })).toBeDisabled();
  await page.getByRole("tab", { name: "Histori Absensi", exact: true }).click();
  await expect(page.getByText("Histori belum ditemukan", { exact: true })).toBeVisible();
});

test("profile renders API identity and offline feedback recovers", async ({ page, context }) => {
  await page.goto("/dashboard/student/profile");
  await expect(page.getByRole("heading", { name: profile.name, exact: true })).toBeVisible();
  await expect(page.getByText(profile.nis, { exact: true }).first()).toBeVisible();
  await context.setOffline(true);
  await expect(page.getByRole("alert")).toContainText("Koneksi internet terputus");
  await context.setOffline(false);
  await expect(page.getByText("Koneksi internet terputus", { exact: true })).toBeHidden();
});

test("profile loading waits for API identity and renders a rejected scope safely", async ({ page, api }) => {
  const release = deferredResponse(api, "GET", "/student/profile", profile);
  await page.goto("/dashboard/student/profile");
  await expect.poll(() => api.count("GET", "/student/profile")).toBe(1);
  await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible();
  await expect(page.getByRole("heading", { name: profile.name, exact: true })).toHaveCount(0);
  release();
  await expect(page.getByRole("heading", { name: profile.name, exact: true })).toBeVisible();
  api.error("GET", "/student/profile", 403, "Profil sintetis tidak diizinkan", "ACCESS_DENIED");
  await page.reload();
  await expect(page.getByText("Profil belum tersedia", { exact: true })).toBeVisible();
  await expect(page.getByText("Kamu tidak memiliki izin untuk melakukan tindakan ini.", { exact: true })).toBeVisible();
  await expect(page.getByText(profile.nis, { exact: true })).toHaveCount(0);
});

test("timed-out upload reconciles an accepted record without replaying the photo", async ({ page, api }) => {
  await syntheticCamera(page);
  api.on("POST", "/student/daily-report", async (route) => {
    api.reads["/student/today"] = completedToday;
    await route.abort("timedout");
  });
  await page.goto("/dashboard/student");
  await capturePhoto(page);
  const readsBeforeUpload = api.count("GET", "/student/today");
  await page.getByRole("button", { name: "Kirim Absensi", exact: true }).click();
  await expect(page.getByText("Absensi berhasil dicatat.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Absensi Sudah Tercatat", exact: true })).toBeDisabled();
  expect(api.count("GET", "/student/today")).toBeGreaterThan(readsBeforeUpload);
  expect(api.count("POST", "/student/daily-report")).toBe(1);
});
