import { test, expect, json } from "./fixture";
import { assignment, attendance, counseling, DATE, homeroom, profile, sessions, subjectRecord, subjectSession, submission, summary, teacherMe } from "./fixtures";

const staffPages = [
  { role: "teacher", path: "homeroom/students", api: "/teacher/homeroom/students", empty: [], emptyText: "Belum ada siswa yang cocok", errorText: "Data siswa kelas belum bisa dimuat" },
  { role: "teacher", path: "homeroom/attendance", api: "/teacher/homeroom/attendance-overview", empty: { homeroom, date: DATE, summary, records: [] }, emptyText: "Belum ada data untuk filter ini", errorText: "Data absensi belum bisa dimuat" },
  { role: "teacher", path: "homeroom/submissions", api: "/teacher/homeroom/submissions-overview", empty: { homeroom, counts: { total: 0, pending: 0, approved: 0, rejected: 0, with_attachment: 0 }, records: [] }, emptyText: "Belum ada pengajuan untuk filter ini", errorText: "Data pengajuan belum bisa dimuat" },
  { role: "bk", path: "bk/students", api: "/bk/students-overview", empty: { counts: { total: 0, active: 0, need_attention: 0, total_alpha: 0, with_counseling_notes: 0 }, students: [], classes: [] }, emptyText: "Belum ada siswa untuk filter ini", errorText: "Data siswa BK belum bisa dimuat" },
  { role: "bk", path: "bk/attendance", api: "/bk/attendance-overview", empty: { date: DATE, summary, records: [], classes: [] }, emptyText: "Belum ada record absensi", errorText: "Absensi BK belum bisa dimuat" },
  { role: "bk", path: "bk/submissions", api: "/bk/submissions-overview", empty: { counts: { total: 0, pending: 0, approved: 0, rejected: 0, with_attachment: 0 }, records: [], classes: [] }, emptyText: "Belum ada pengajuan", errorText: "Pengajuan BK belum bisa dimuat" },
  { role: "bk", path: "bk/counseling", api: "/bk/counseling-overview", empty: { counts: { total_notes: 0, students_covered: 0, classes_covered: 0, recent_week_notes: 0 }, records: [], students: [], classes: [] }, emptyText: "Belum ada catatan konseling", errorText: "Catatan BK belum bisa dimuat" },
] as const;

for (const entry of staffPages) {
  test(`${entry.path}: empty and rejected API responses remain distinct`, async ({ page, api, signedIn }) => {
    await signedIn(sessions[entry.role]);
    api.reads[entry.api] = entry.empty;
    await page.goto(`/dashboard/teacher/${entry.path}`);
    await expect(page.getByText(entry.emptyText, { exact: true })).toBeVisible();
    api.error("GET", entry.api, 403, "Akses data sintetis ditolak", "ACCESS_DENIED");
    await page.reload();
    await expect(page.getByText(entry.errorText, { exact: true })).toBeVisible();
    await expect(page.getByText(profile.name, { exact: true }).filter({ visible: true })).toHaveCount(0);
  });
}

test("teacher dashboard shows assigned workspaces and hides unassigned capability", async ({ page, api, signedIn, isMobile }) => {
  await signedIn(sessions.teacher);
  api.reads["/teacher/me"] = { ...teacherMe, has_subject_assignments: false };
  await page.goto("/dashboard/teacher");
  await expect(page.getByRole("heading", { name: "Dashboard Guru", exact: true })).toBeVisible();
  if (isMobile) await page.locator("header").getByRole("button").first().click();
  await expect(page.getByRole("link", { name: /Siswa Kelas/ }).first()).toBeVisible();
  await expect(page.locator('a[href="/dashboard/teacher/subject/schedule"]')).toHaveCount(0);
  await expect(page.locator('a[href="/dashboard/teacher/bk/students"]')).toHaveCount(0);
  expect(api.count("GET", "/teacher/subject-assignments")).toBe(0);
  expect(api.count("GET", "/bk/dashboard")).toBe(0);
});

test("homeroom roster searches locally and opens scoped student detail", async ({ page, api, signedIn }) => {
  await signedIn(sessions.teacher);
  await page.goto("/dashboard/teacher/homeroom/students");
  const search = page.getByPlaceholder("Cari siswa, NIS, atau NISN");
  await search.fill("Nobody-E2E");
  await expect(page.getByText("Belum ada siswa yang cocok", { exact: true })).toBeVisible();
  await search.fill(profile.nis);
  await page.getByRole("button", { name: /detail/i }).filter({ visible: true }).first().click();
  await expect(page.getByRole("dialog")).toContainText(profile.name);
  await expect.poll(() => api.count("GET", `/teacher/homeroom/students/${profile.id}`)).toBe(1);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("homeroom attendance sends search/date filters and displays returned data", async ({ page, api, signedIn }) => {
  await signedIn(sessions.teacher);
  await page.goto("/dashboard/teacher/homeroom/attendance");
  await page.getByPlaceholder("Cari siswa, NIS, status, catatan").fill(profile.nis);
  await expect.poll(() => api.last("GET", "/teacher/homeroom/attendance-overview")?.url).toContain(`query=${profile.nis}`);
  expect(api.last("GET", "/teacher/homeroom/attendance-overview")!.url).toContain(`date=${DATE}`);
  // Mobile cards render the row number and name in the same text node.
  await expect(page.getByText(profile.name).filter({ visible: true }).first()).toBeVisible();
});

for (const outcome of ["success", "error"] as const) {
  test(`homeroom correction validates notes and handles ${outcome}`, async ({ page, api, signedIn }) => {
    await signedIn(sessions.teacher);
    const endpoint = `/teacher/homeroom/attendance/${attendance.id}/review`;
    if (outcome === "error") api.error("PATCH", endpoint, 400, "Koreksi sintetis ditolak");
    else api.on("PATCH", endpoint, async (route) => {
      api.reads["/teacher/homeroom/attendance-overview"] = { homeroom, date: DATE, summary: { ...summary, present: 0, permission: 1 }, records: [{ ...attendance, status: "izin", verification_note: "Koreksi sintetis", verified_at: "2026-09-30T08:00:00+07:00", verified_by: "teacher-e2e" }] };
      await json(route, null);
    });
    await page.goto("/dashboard/teacher/homeroom/attendance");
    await page.getByRole("button", { name: "Koreksi status absensi", exact: true }).filter({ visible: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("combobox").click();
    await page.getByRole("option", { name: "Izin", exact: true }).click();
    // The record has an initial note; clear it to exercise required validation.
    await page.getByPlaceholder("Tulis alasan koreksi singkat").fill("");
    await dialog.getByRole("button", { name: "Simpan Koreksi", exact: true }).click();
    await expect(dialog.getByText(/Catatan tinjauan wajib diisi/)).toBeVisible();
    expect(api.count("PATCH", endpoint)).toBe(0);
    await page.getByPlaceholder("Tulis alasan koreksi singkat").fill("Koreksi sintetis");
    await dialog.getByRole("button", { name: "Simpan Koreksi", exact: true }).click();
    expect(JSON.parse(api.last("PATCH", endpoint)!.body!)).toEqual({ status: "izin", verification_note: "Koreksi sintetis" });
    if (outcome === "success") {
      await expect(page.getByText("Status absensi berhasil diperbarui.", { exact: true })).toBeVisible();
      await expect(dialog).toBeHidden();
      await expect.poll(() => api.count("GET", "/teacher/homeroom/attendance-overview")).toBeGreaterThan(1);
    } else {
      await expect(page.getByText("Ada data yang belum sesuai. Periksa kembali isian kamu.", { exact: true })).toBeVisible();
      await expect(dialog).toBeVisible();
      await expect(page.getByPlaceholder("Tulis alasan koreksi singkat")).toHaveValue("Koreksi sintetis");
    }
  });
}

test("BK counseling searches server data, validates and creates a synthetic note", async ({ page, api, signedIn }) => {
  await signedIn(sessions.bk);
  const endpoint = `/bk/students/${profile.id}/counseling-notes`;
  api.on("POST", endpoint, async (route, request) => {
    const created = { ...counseling, ...request.postDataJSON(), id: "note-created-e2e" };
    api.reads["/bk/counseling-overview"] = {
      counts: { total_notes: 2, students_covered: 1, classes_covered: 1, recent_week_notes: 2 },
      records: [counseling, created], students: [profile], classes: [],
    };
    await json(route, created);
  });
  await page.goto("/dashboard/teacher/bk/counseling");
  await page.getByPlaceholder("Cari siswa, NIS, judul, catatan").fill("Sintetis");
  await expect.poll(() => api.last("GET", "/bk/counseling-overview")?.url).toContain("query=Sintetis");
  await page.getByRole("button", { name: /Tambah Catatan/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Simpan Catatan", exact: true }).click();
  await expect(dialog.getByText(/Judul catatan wajib diisi/)).toBeVisible();
  expect(api.count("POST", endpoint)).toBe(0);
  await dialog.getByRole("button", { name: "Pilih siswa", exact: true }).click();
  await page.getByRole("option", { name: new RegExp(profile.name) }).click();
  await page.getByPlaceholder("Contoh: Follow up alfa berulang").fill("Catatan E2E baru");
  await page.getByPlaceholder("Tulis catatan BK").fill("Catatan pembinaan sintetis yang jelas.");
  await dialog.getByRole("button", { name: "Simpan Catatan", exact: true }).click();
  await expect(page.getByText("Catatan BK berhasil dibuat.", { exact: true })).toBeVisible();
  await expect(page.getByText("Catatan E2E baru", { exact: true }).filter({ visible: true }).first()).toBeVisible();
  expect(JSON.parse(api.last("POST", endpoint)!.body!)).toEqual({ title: "Catatan E2E baru", note: "Catatan pembinaan sintetis yang jelas." });
});

test("subject schedule opens the active session", async ({ page, signedIn }) => {
  await signedIn(sessions.teacher);
  await page.goto("/dashboard/teacher/subject/schedule");
  await expect(page.getByText(assignment.subject_name, { exact: true }).filter({ visible: true }).first()).toBeVisible();
  await page.locator('a[href*="/subject/session"]').filter({ visible: true }).first().click();
  await expect(page).toHaveURL(/\/subject\/session\?session_id=session-e2e/);
  await expect(page.getByPlaceholder("Contoh: Persamaan kuadrat")).toHaveValue(subjectSession.topic!);
  await expect(page.getByText(profile.name, { exact: true }).filter({ visible: true }).first()).toBeVisible();
});

test("subject session can save a draft then finalize through the API", async ({ page, api, signedIn }) => {
  await signedIn(sessions.teacher);
  api.on("PUT", `/teacher/subject/sessions/${subjectSession.session_id}/draft`, async (route, request) => {
    const payload = request.postDataJSON();
    api.reads["/teacher/subject/attendance"] = { session: { ...subjectSession, topic: payload.topic, notes: payload.notes }, records: [subjectRecord] };
    await json(route, api.reads["/teacher/subject/attendance"]);
  });
  api.on("POST", "/teacher/subject/attendance/validate", async (route) => {
    api.reads["/teacher/subject/attendance"] = { session: { ...subjectSession, status: "sudah_divalidasi", topic: "Persamaan sintetis", notes: "Latihan E2E" }, records: [subjectRecord] };
    await json(route, api.reads["/teacher/subject/attendance"]);
  });
  await page.goto("/dashboard/teacher/subject/session?session_id=session-e2e");
  await page.getByPlaceholder("Contoh: Persamaan kuadrat").fill("Persamaan sintetis");
  await page.getByPlaceholder("Catatan materi, tugas, atau kendala kelas").fill("Latihan E2E");
  await page.getByRole("button", { name: "Simpan Draft", exact: true }).click();
  await expect(page.getByText("Draft sesi berhasil disimpan. Sesi belum masuk rekap resmi.", { exact: true })).toBeVisible();
  expect(JSON.parse(api.last("PUT", "/teacher/subject/sessions/session-e2e/draft")!.body!)).toEqual({ topic: "Persamaan sintetis", notes: "Latihan E2E", overrides: [] });
  await page.getByRole("button", { name: /Validasi/ }).filter({ visible: true }).click();
  await expect(page.getByText("Sesi berhasil divalidasi dan masuk rekap resmi.", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Contoh: Persamaan kuadrat")).toBeDisabled();
  expect(JSON.parse(api.last("POST", "/teacher/subject/attendance/validate")!.body!)).toMatchObject({ session_id: "session-e2e", topic: "Persamaan sintetis", overrides: [] });
});

test("subject draft error preserves editable teaching notes", async ({ page, api, signedIn }) => {
  await signedIn(sessions.teacher);
  api.error("PUT", "/teacher/subject/sessions/session-e2e/draft", 400, "Draft sintetis gagal disimpan");
  await page.goto("/dashboard/teacher/subject/session?session_id=session-e2e");
  await page.getByPlaceholder("Contoh: Persamaan kuadrat").fill("Topik yang belum tersimpan");
  await page.getByRole("button", { name: "Simpan Draft", exact: true }).click();
  await expect(page.getByText("Ada data yang belum sesuai. Periksa kembali isian kamu.", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Contoh: Persamaan kuadrat")).toHaveValue("Topik yang belum tersimpan");
});

test("subject no active session shows an empty state", async ({ page, api, signedIn }) => {
  await signedIn(sessions.teacher);
  api.reads["/teacher/subject/current-session"] = null;
  await page.goto("/dashboard/teacher/subject/session");
  await expect(page.getByText("Tidak ada sesi aktif", { exact: true })).toBeVisible();
  expect(api.count("GET", "/teacher/subject/attendance")).toBe(0);
});

test("subject schedule handles empty assignments and API rejection", async ({ page, api, signedIn }) => {
  await signedIn(sessions.teacher);
  api.reads["/teacher/subject-assignments"] = [];
  api.reads["/teacher/subject/current-session"] = null;
  await page.goto("/dashboard/teacher/subject/schedule");
  await expect(page.getByText(/Belum ada jadwal/, { exact: false }).first()).toBeVisible();
  api.error("GET", "/teacher/subject-assignments", 403, "Assignment sintetis tidak tersedia", "ACCESS_DENIED");
  await page.reload();
  await expect(page.getByText("Jadwal belum bisa dimuat", { exact: true })).toBeVisible();
});

test("subject history filters API sessions and opens their attendance", async ({ page, api, signedIn }) => {
  await signedIn(sessions.teacher);
  await page.goto("/dashboard/teacher/subject/history?assignment_id=assignment-e2e");
  await expect.poll(() => api.last("GET", "/teacher/subject/sessions")?.url).toContain("assignment_id=assignment-e2e");
  await page.getByRole("combobox").filter({ hasText: "Semua status" }).click();
  await page.getByRole("option", { name: "Belum Divalidasi", exact: true }).click();
  await expect.poll(() => api.last("GET", "/teacher/subject/sessions")?.url).toContain("status=belum_divalidasi");
  await page.getByRole("link", { name: /^Lihat sesi / }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/session_id=session-e2e/);
  await expect(page.getByPlaceholder("Contoh: Persamaan kuadrat")).toHaveValue(subjectSession.topic!);
  await page.goBack();
  await expect(page).toHaveURL(/\/subject\/history/);
});

for (const outcome of ["success", "error"] as const) {
  test(`homeroom submission review requires a note and handles ${outcome}`, async ({ page, api, signedIn }) => {
    await signedIn(sessions.teacher);
    const endpoint = `/teacher/homeroom/submissions/${submission.id}/review`;
    if (outcome === "error") api.error("PATCH", endpoint, 403, "Tidak dalam kelas sintetis", "ACCESS_DENIED");
    else api.on("PATCH", endpoint, async (route) => {
      const reviewed = { ...submission, status: "diterima", review_note: "Bukti sintetis ditinjau" };
      api.reads["/teacher/homeroom/submissions-overview"] = { homeroom, counts: { total: 1, pending: 0, approved: 1, rejected: 0, with_attachment: 0 }, records: [reviewed] };
      await json(route, reviewed);
    });
    await page.goto("/dashboard/teacher/homeroom/submissions");
    await page.getByRole("button", { name: `Tinjau pengajuan ${profile.name}`, exact: true }).filter({ visible: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("combobox").click();
    await page.getByRole("option", { name: "Diterima", exact: true }).click();
    await dialog.getByRole("button", { name: "Simpan Tanggapan", exact: true }).click();
    await expect(dialog.getByText("Catatan tanggapan wajib diisi.", { exact: true })).toBeVisible();
    expect(api.count("PATCH", endpoint)).toBe(0);
    await page.getByPlaceholder("Tulis tanggapan atau alasan keputusan walas").fill("Bukti sintetis ditinjau");
    await dialog.getByRole("button", { name: "Simpan Tanggapan", exact: true }).click();
    await expect(page.getByText(outcome === "success" ? "Pengajuan berhasil diperbarui." : "Kamu tidak memiliki izin untuk melakukan tindakan ini.", { exact: true })).toBeVisible();
    expect(JSON.parse(api.last("PATCH", endpoint)!.body!)).toEqual({ status: "diterima", review_note: "Bukti sintetis ditinjau" });
    if (outcome === "success") {
      await expect(dialog).toBeHidden();
      await expect(page.getByText("Bukti sintetis ditinjau", { exact: true }).filter({ visible: true }).first()).toBeVisible();
    }
    else await expect(dialog).toBeVisible();
  });
}

for (const state of ["populated", "empty", "error"] as const) {
  test(`subject recap ${state} respects assignment selection`, async ({ page, api, signedIn }) => {
    await signedIn(sessions.teacher);
    if (state === "empty") api.reads["/teacher/subject/recap"] = { assignment, total_pertemuan: 0, students: [] };
    if (state === "error") api.error("GET", "/teacher/subject/recap", 403, "Rekap sintetis di luar scope", "ACCESS_DENIED");
    await page.goto("/dashboard/teacher/subject/recap");
    await expect(page.getByText("Rekap siap ditampilkan", { exact: true })).toBeVisible();
    expect(api.count("GET", "/teacher/subject/recap")).toBe(0);
    await page.getByRole("combobox").filter({ hasText: "Pilih mata pelajaran" }).click();
    await page.getByRole("option", { name: /Matematika Sintetis/ }).click();
    await page.getByRole("button", { name: "Rentang", exact: true }).click();
    if (state === "populated") await expect(page.getByText(profile.name, { exact: true }).filter({ visible: true }).first()).toBeVisible();
    else await expect(page.getByText(state === "empty" ? "Belum ada data pertemuan" : "Rekap belum bisa dimuat", { exact: true })).toBeVisible();
    expect(api.last("GET", "/teacher/subject/recap")!.url).toContain("assignment_id=assignment-e2e");
  });
}
