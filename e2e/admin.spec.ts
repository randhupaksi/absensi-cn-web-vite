import { zipSync, strToU8 } from "fflate";
import { test, expect, json } from "./fixture";
import { adminUser, classroom, holiday, profile, sessions, subject, teacherUser, ticket } from "./fixtures";

test.beforeEach(async ({ signedIn }) => { await signedIn(sessions.admin); });

const managementPages = [
  { path: "students", api: "/admin/students", search: "Cari siswa, kelas, atau NIS", value: profile.name, empty: "Belum ada siswa", error: "Data student belum bisa dimuat" },
  { path: "teachers", api: "/admin/teacher-profiles", search: "Cari guru, mapel, kelas", value: teacherUser.name, empty: "Belum ada profil guru", error: "Data teacher belum bisa dimuat" },
  { path: "classes", api: "/admin/classes", search: "Cari kelas, jurusan, walas", value: classroom.display_name!, empty: "Kelas tidak ditemukan", error: "Data kelas belum bisa dimuat" },
  { path: "subjects", api: "/admin/subjects", search: "Cari kode, nama, atau kelompok mapel…", value: subject.name, empty: "Mapel tidak ditemukan", error: "Data mapel belum dapat dimuat" },
  { path: "holidays", api: "/admin/school-holidays", search: "Cari nama atau catatan libur", value: holiday.name, empty: "Periode libur tidak ditemukan", error: "Kalender libur belum bisa dimuat" },
  { path: "users", api: "/admin/users", search: "Cari nama, peran, username", value: teacherUser.name, empty: "Belum ada role staff", error: "Data admin belum bisa dimuat" },
  { path: "admins", api: "/admin/users", search: "Cari nama admin atau username", value: adminUser.name, empty: "Akun admin tidak ditemukan", error: "Data admin belum bisa dimuat" },
];
for (const entry of managementPages) {
  test(`admin ${entry.path}: list, search, no matches, API error`, async ({ page, api }) => {
    await page.goto(`/dashboard/admin/${entry.path}`);
    const search = page.getByPlaceholder(entry.search);
    await expect(search).toBeVisible();
    await search.fill("Tidak-ada-E2E");
    await expect(page.getByText(entry.empty, { exact: true })).toBeVisible();
    await search.fill("");
    await expect(page.getByText(entry.value, { exact: true }).filter({ visible: true }).first()).toBeVisible();
    api.error("GET", entry.api, 400, "Data sintetis belum dapat dimuat");
    await page.reload();
    await expect(page.getByText(entry.error, { exact: true })).toBeVisible();
    expect(api.calls.filter((call) => call.method !== "GET")).toEqual([]);
  });
}

test("admin dashboard displays server counts and analytics has an explicit empty scope", async ({ page, api }) => {
  await page.goto("/dashboard/admin");
  await expect(page.getByText("Pengumuman Sintetis", { exact: true })).toBeVisible();
  await page.goto("/dashboard/admin/analytics");
  await expect(page.getByText("Belum ada siswa pada cakupan ini", { exact: true })).toBeVisible();
  expect(api.count("GET", "/admin/analytics/attendance")).toBeGreaterThan(0);
  api.error("GET", "/admin/analytics/attendance", 400, "Analitik sintetis gagal dimuat");
  await page.reload();
  await expect(page.getByText("Analitik belum dapat dimuat", { exact: true })).toBeVisible();
});

test("admin academic tabs expose units/programs without changing their data", async ({ page, api }) => {
  await page.goto("/dashboard/admin/classes");
  await page.getByRole("tab", { name: "Unit Sekolah", exact: true }).click();
  await expect(page.getByText("Sekolah Sintetis", { exact: true }).filter({ visible: true }).first()).toBeVisible();
  await page.getByRole("tab", { name: "Jurusan", exact: true }).click();
  await expect(page.getByText("Program Sintetis", { exact: true }).filter({ visible: true }).first()).toBeVisible();
  await page.getByRole("tab", { name: "Kelas", exact: true }).click();
  await expect(page.getByPlaceholder("Cari kelas, jurusan, walas")).toBeVisible();
  expect(api.calls.every((call) => call.method === "GET")).toBe(true);
});

for (const outcome of ["success", "error"] as const) {
  test(`admin subject form validates and handles ${outcome}`, async ({ page, api }) => {
    if (outcome === "success") api.on("POST", "/admin/subjects", async (route, request) => {
      const created = { ...subject, ...request.postDataJSON(), id: "new-subject-e2e" };
      api.reads["/admin/subjects"] = [subject, created];
      await json(route, created, 201);
    });
    else api.error("POST", "/admin/subjects", 409, "Kode mapel sintetis sudah digunakan", "RESOURCE_CONFLICT");
    await page.goto("/dashboard/admin/subjects");
    await page.getByRole("button", { name: /Tambah Mapel/ }).click();
    const dialog = page.getByRole("dialog", { name: "Tambah Mapel", exact: true });
    await dialog.getByRole("button", { name: "Simpan Mapel", exact: true }).click();
    await expect(dialog.getByLabel("Kode Mapel", { exact: true })).toHaveAttribute("aria-invalid", "true");
    expect(api.count("POST", "/admin/subjects")).toBe(0);
    await dialog.getByLabel("Kode Mapel", { exact: true }).fill("E2E-NEW");
    await dialog.getByLabel("Nama Mapel", { exact: true }).fill("Mapel E2E Tambahan");
    await dialog.getByLabel("Kelompok Mapel", { exact: true }).fill("Umum");
    await dialog.getByRole("button", { name: "Simpan Mapel", exact: true }).click();
    if (outcome === "success") {
      await expect(page.getByText("Mapel berhasil ditambahkan.", { exact: true })).toBeVisible();
      await expect(dialog).toBeHidden();
      await expect(page.getByText("Mapel E2E Tambahan", { exact: true }).filter({ visible: true }).first()).toBeVisible();
    } else {
      await expect(page.getByText("Mata pelajaran tersebut sudah ada.", { exact: true })).toBeVisible();
      await expect(dialog.getByLabel("Nama Mapel", { exact: true })).toHaveValue("Mapel E2E Tambahan");
    }
    expect(JSON.parse(api.last("POST", "/admin/subjects")!.body!)).toMatchObject({ code: "E2E-NEW", name: "Mapel E2E Tambahan", group: "Umum" });
  });
}

test("holiday form required fields can be checked and cancelled safely", async ({ page, api }) => {
  await page.goto("/dashboard/admin/holidays");
  await page.getByRole("button", { name: /Tambah Hari Libur/ }).click();
  const dialog = page.getByRole("dialog", { name: "Tambah Periode Libur", exact: true });
  await dialog.getByRole("button", { name: "Simpan Libur", exact: true }).click();
  await expect(dialog.getByLabel("Nama Libur", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await dialog.getByRole("button", { name: "Batal", exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(api.calls.every((call) => call.method === "GET")).toBe(true);
});

// A tiny, valid OOXML workbook containing only invented identifiers. The
// browser posts this file to a mock; server import validation is out of scope.
function workbook() {
  return Buffer.from(zipSync({
    "[Content_Types].xml": strToU8('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'),
    "_rels/.rels": strToU8('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
    "xl/workbook.xml": strToU8('<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Data Sintetis" sheetId="1" r:id="rId1"/></sheets></workbook>'),
    "xl/_rels/workbook.xml.rels": strToU8('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'),
    "xl/worksheets/sheet1.xml": strToU8('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Siswa Sintetis</t></is></c></row></sheetData></worksheet>'),
  }));
}

for (const [path, kind, label] of [["students", "siswa", "Siswa"], ["teachers", "guru", "Guru"]]) {
  test(`${kind} import rejects invalid files then shows mock import results`, async ({ page, api }) => {
    api.data("POST", `/admin/import/${kind}`, { imported: 1, skipped: 1, errors: [{ row: 3, field: "name", message: "Nama sintetis belum lengkap" }] });
    await page.goto(`/dashboard/admin/${path}`);
    await page.getByRole("button", { name: /Import/ }).filter({ visible: true }).first().click();
    const dialog = page.getByRole("dialog", { name: `Import Data ${label} via Excel`, exact: true });
    await expect(dialog.getByRole("button", { name: `Import ${label}`, exact: true })).toBeDisabled();
    const file = dialog.locator('input[type="file"]');
    await file.setInputFiles({ name: "synthetic.txt", mimeType: "text/plain", buffer: Buffer.from("Synthetic E2E") });
    await expect(dialog.getByText("Hanya file .xlsx yang didukung.", { exact: true })).toBeVisible();
    await file.setInputFiles({ name: "oversized.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
    await expect(dialog.getByText("Ukuran file maksimal 5MB.", { exact: true })).toBeVisible();
    expect(api.count("POST", `/admin/import/${kind}`)).toBe(0);
    await file.setInputFiles({ name: "synthetic.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: workbook() });
    await dialog.getByRole("button", { name: `Import ${label}`, exact: true }).click();
    await expect(dialog.getByText("Nama sintetis belum lengkap", { exact: true })).toBeVisible();
    expect(api.last("POST", `/admin/import/${kind}`)!.body).toContain('filename="synthetic.xlsx"');
    expect(api.count("POST", `/admin/import/${kind}`)).toBe(1);
  });
}

test("admin support searches and opens only the returned synthetic ticket", async ({ page, api }) => {
  api.reads["/admin/support/tickets"] = { tickets: [ticket], total: 1 };
  api.data("GET", `/admin/support/tickets/${ticket.reference_code}`, ticket);
  await page.goto("/dashboard/admin/support");
  await page.getByPlaceholder("Mulai dari ID, nama, NIS, atau judul...").fill(profile.nis);
  await expect.poll(() => api.last("GET", "/admin/support/tickets")?.url).toContain(`q=${profile.nis}`);
  await page.getByText(ticket.subject, { exact: true }).first().click();
  await expect(page.getByLabel("Pesan balasan", { exact: true })).toBeVisible();
  expect(api.calls.every((call) => call.method === "GET")).toBe(true);
});
