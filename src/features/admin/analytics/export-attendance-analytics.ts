import { exportStyledExcelReport } from "@/lib/reports/excel-report-kit";
import type {
  AdminAnalyticsPerformance,
  AdminAttendanceAnalytics,
} from "@/types/admin";

type StudentRow = AdminAttendanceAnalytics["students"]["rows"][number];
type AnalyticsExportRow = Partial<StudentRow & AdminAnalyticsPerformance>;

function percentage(value: number) {
  return `${value}%`;
}

function safeFilenameDate(value: string) {
  return value.replaceAll("-", "");
}

const performanceColumns = [
  {
    header: "Nama",
    value: (row: AnalyticsExportRow) => row.name ?? "-",
    width: 28,
  },
  {
    header: "Total Siswa",
    value: (row: AnalyticsExportRow) => row.total_students ?? 0,
    kind: "number" as const,
    width: 14,
  },
  {
    header: "Wajib Absen",
    value: (row: AnalyticsExportRow) => row.expected ?? 0,
    kind: "number" as const,
    width: 15,
  },
  {
    header: "Hadir",
    value: (row: AnalyticsExportRow) => row.present ?? 0,
    kind: "attendance" as const,
    width: 11,
  },
  {
    header: "Izin",
    value: (row: AnalyticsExportRow) => row.permission ?? 0,
    kind: "attendance" as const,
    width: 10,
  },
  {
    header: "Sakit",
    value: (row: AnalyticsExportRow) => row.sick ?? 0,
    kind: "attendance" as const,
    width: 10,
  },
  {
    header: "Alfa",
    value: (row: AnalyticsExportRow) => row.alpha ?? 0,
    kind: "attendance" as const,
    width: 10,
  },
  {
    header: "Belum Absen",
    value: (row: AnalyticsExportRow) => row.not_attended ?? 0,
    kind: "status" as const,
    width: 15,
  },
  {
    header: "Kehadiran",
    value: (row: AnalyticsExportRow) =>
      percentage(row.attendance_percentage ?? 0),
    width: 14,
  },
  {
    header: "Penggunaan Sistem",
    value: (row: AnalyticsExportRow) =>
      percentage(row.system_usage_percentage ?? 0),
    width: 19,
  },
];

export async function exportAttendanceAnalytics(
  analytics: AdminAttendanceAnalytics,
  allStudents: StudentRow[],
) {
  const period = `${analytics.period.date_from} sampai ${analytics.period.date_to}`;
  const filters = [
    analytics.filters.grade
      ? `Tingkat ${analytics.filters.grade}`
      : "Semua tingkat",
    analytics.filters.major_id ? "Jurusan terpilih" : "Semua jurusan",
    analytics.filters.class_id ? "Kelas terpilih" : "Semua kelas",
  ].join(" - ");

  await exportStyledExcelReport<AnalyticsExportRow>({
    filename: `analitik-kehadiran-${safeFilenameDate(analytics.period.date_from)}-${safeFilenameDate(analytics.period.date_to)}.xlsx`,
    title: "ANALITIK KEHADIRAN SEKOLAH",
    subtitle:
      "Ringkasan performa absensi dan penggunaan Citra Negara Attendence System",
    metadata: [
      { label: "Periode", value: period },
      { label: "Tahun ajaran", value: analytics.filters.school_year_name },
      { label: "Filter", value: filters },
      { label: "Hari sekolah", value: analytics.period.school_days },
      {
        label: "Dibuat pada",
        value: new Date(analytics.period.generated_at).toLocaleString("id-ID"),
      },
    ],
    metrics: [
      {
        label: "Total Siswa",
        value: analytics.summary.total_students,
        tone: "sky",
      },
      {
        label: "Total Kelas",
        value: analytics.summary.total_classes,
        tone: "violet",
      },
      {
        label: "Kehadiran",
        value: percentage(analytics.summary.attendance_percentage),
        tone: "emerald",
      },
      {
        label: "Penggunaan Sistem",
        value: percentage(analytics.summary.system_usage_percentage),
        tone: "sky",
      },
      {
        label: "Belum Absen",
        value: analytics.summary.not_attended,
        tone: "amber",
      },
      { label: "Alfa", value: analytics.summary.alpha, tone: "rose" },
      {
        label: "Sesi Belum Divalidasi",
        value: analytics.operational.pending_subject_sessions,
        tone: "amber",
      },
      {
        label: "Validasi Sesi",
        value: percentage(analytics.operational.validation_percentage),
        tone: "emerald",
      },
    ],
    dataSheetName: "Per Siswa",
    showColumnFilters: true,
    includeStatisticsSheet: false,
    rows: allStudents,
    columns: [
      {
        header: "No",
        value: (_row, index) => index + 1,
        kind: "number",
        width: 7,
      },
      {
        header: "Nama Siswa",
        value: (row) => row.student_name ?? "-",
        width: 30,
      },
      { header: "NIS", value: (row) => row.nis ?? "-", width: 18 },
      { header: "Kelas", value: (row) => row.class_name ?? "-", width: 23 },
      { header: "Tingkat", value: (row) => row.grade ?? "-", width: 11 },
      { header: "Jurusan", value: (row) => row.major_code ?? "-", width: 16 },
      {
        header: "Wajib Absen",
        value: (row) => row.expected ?? 0,
        kind: "number",
        width: 15,
      },
      {
        header: "Hadir",
        value: (row) => row.present ?? 0,
        kind: "attendance",
        width: 10,
      },
      {
        header: "Izin",
        value: (row) => row.permission ?? 0,
        kind: "attendance",
        width: 10,
      },
      {
        header: "Sakit",
        value: (row) => row.sick ?? 0,
        kind: "attendance",
        width: 10,
      },
      {
        header: "Alfa",
        value: (row) => row.alpha ?? 0,
        kind: "attendance",
        width: 10,
      },
      {
        header: "Belum Absen",
        value: (row) => row.not_attended ?? 0,
        kind: "status",
        width: 15,
      },
      {
        header: "Kehadiran",
        value: (row) => percentage(row.attendance_percentage ?? 0),
        width: 14,
      },
      {
        header: "Penggunaan Sistem",
        value: (row) => percentage(row.system_usage_percentage ?? 0),
        width: 19,
      },
    ],
    additionalSheets: [
      {
        name: "Per Kelas",
        rows: analytics.classes,
        columns: performanceColumns,
        showColumnFilters: true,
      },
      {
        name: "Per Jurusan",
        rows: analytics.majors,
        columns: performanceColumns,
        showColumnFilters: true,
      },
      {
        name: "Per Tingkat",
        rows: analytics.grades,
        columns: performanceColumns,
        showColumnFilters: true,
      },
    ],
    footerLabel: "Citra Negara Attendence System - Analitik Kehadiran",
  });
}
