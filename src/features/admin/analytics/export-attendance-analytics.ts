import {
  exportStyledExcelReport,
  type ExcelReportColumn,
} from "@/lib/reports/excel-report-kit";
import { applyPdfCreditMetadata } from "@/lib/reports/pdf-metadata";
import {
  drawReportPdfFooter,
  drawReportPdfHeader,
  drawReportPdfPills,
  REPORT_PDF_MARGIN_X,
  REPORT_TABLE_STYLE,
} from "@/lib/reports/pdf-report-kit";
import type { ReportFormat } from "@/features/reports/shared/report-question-ui";
import type {
  AdminAnalyticsPerformance,
  AdminAttendanceAnalytics,
} from "@/types/admin";

type StudentRow = AdminAttendanceAnalytics["students"]["rows"][number];
type AnalyticsExportRow = Partial<StudentRow & AdminAnalyticsPerformance>;

export type AnalyticsExportScope =
  | "overall"
  | "classes"
  | "majors"
  | "grades";

export type AnalyticsExportSort = "attendance_desc" | "attendance_asc" | "name";
export type AnalyticsExportReportType = "daily" | "cumulative" | "all";

type AttendanceAnalyticsExportOptions = {
  analytics: AdminAttendanceAnalytics;
  students: StudentRow[];
  scope: AnalyticsExportScope;
  format: ReportFormat;
  includeStudentDetails: boolean;
  sort: AnalyticsExportSort;
  reportType: AnalyticsExportReportType;
};

type TableContent = {
  title: string;
  sheetName: string;
  rows: AnalyticsExportRow[];
  columns: Array<ExcelReportColumn<AnalyticsExportRow>>;
};

function percentage(value: number) {
  return `${value}%`;
}

function safeFilenameDate(value: string) {
  return value.replaceAll("-", "");
}

export function getAnalyticsExportScopeLabel(scope: AnalyticsExportScope) {
  if (scope === "classes") return "Per Kelas";
  if (scope === "majors") return "Per Jurusan";
  if (scope === "grades") return "Per Tingkat";
  return "Keseluruhan Cakupan";
}

const performanceColumns = [
  { header: "Nama", value: (row: AnalyticsExportRow) => row.name ?? "-", width: 28 },
  { header: "Total Siswa", value: (row: AnalyticsExportRow) => row.total_students ?? 0, kind: "number" as const, width: 14 },
  { header: "Hadir", value: (row: AnalyticsExportRow) => row.present ?? 0, kind: "attendance" as const, width: 11 },
  { header: "Izin", value: (row: AnalyticsExportRow) => row.permission ?? 0, kind: "attendance" as const, width: 10 },
  { header: "Sakit", value: (row: AnalyticsExportRow) => row.sick ?? 0, kind: "attendance" as const, width: 10 },
  { header: "Alfa", value: (row: AnalyticsExportRow) => row.alpha ?? 0, kind: "attendance" as const, width: 10 },
  { header: "Belum Absen", value: (row: AnalyticsExportRow) => row.not_attended ?? 0, kind: "status" as const, width: 15 },
  { header: "Kehadiran", value: (row: AnalyticsExportRow) => (row.attendance_percentage ?? 0) / 100, kind: "number" as const, numberFormat: "0.0%", width: 14 },
  { header: "Penggunaan Sistem", value: (row: AnalyticsExportRow) => (row.system_usage_percentage ?? 0) / 100, kind: "number" as const, numberFormat: "0.0%", width: 19 },
];

const studentColumns = [
  { header: "No", value: (_row: AnalyticsExportRow, index: number) => index + 1, kind: "number" as const, width: 7 },
  { header: "Nama Siswa", value: (row: AnalyticsExportRow) => row.student_name ?? "-", width: 30 },
  { header: "NIS", value: (row: AnalyticsExportRow) => row.nis ?? "-", width: 18 },
  { header: "Kelas", value: (row: AnalyticsExportRow) => row.class_name ?? "-", width: 23 },
  { header: "Tingkat", value: (row: AnalyticsExportRow) => row.grade ?? "-", width: 11 },
  { header: "Jurusan", value: (row: AnalyticsExportRow) => row.major_code ?? "-", width: 16 },
  { header: "Hadir", value: (row: AnalyticsExportRow) => row.present ?? 0, kind: "attendance" as const, width: 10 },
  { header: "Izin", value: (row: AnalyticsExportRow) => row.permission ?? 0, kind: "attendance" as const, width: 10 },
  { header: "Sakit", value: (row: AnalyticsExportRow) => row.sick ?? 0, kind: "attendance" as const, width: 10 },
  { header: "Alfa", value: (row: AnalyticsExportRow) => row.alpha ?? 0, kind: "attendance" as const, width: 10 },
  { header: "Belum Absen", value: (row: AnalyticsExportRow) => row.not_attended ?? 0, kind: "status" as const, width: 15 },
  { header: "Kehadiran", value: (row: AnalyticsExportRow) => (row.attendance_percentage ?? 0) / 100, kind: "number" as const, numberFormat: "0.0%", width: 14 },
  { header: "Penggunaan Sistem", value: (row: AnalyticsExportRow) => (row.system_usage_percentage ?? 0) / 100, kind: "number" as const, numberFormat: "0.0%", width: 19 },
];

export async function exportAttendanceAnalytics({ analytics, students, scope, format, includeStudentDetails, sort, reportType }: AttendanceAnalyticsExportOptions) {
  if (format === "pdf") {
    await exportAttendanceAnalyticsPdf(analytics, students, scope, includeStudentDetails, sort, reportType);
    return;
  }
  await exportAttendanceAnalyticsExcel(analytics, students, scope, includeStudentDetails, sort, reportType);
}

async function exportAttendanceAnalyticsExcel(analytics: AdminAttendanceAnalytics, students: StudentRow[], scope: AnalyticsExportScope, includeStudentDetails: boolean, sort: AnalyticsExportSort, reportType: AnalyticsExportReportType) {
  const scopeLabel = getAnalyticsExportScopeLabel(scope);
  const metadata = createMetadata(analytics, scopeLabel, reportType);
  const filename = `Analitik-Kehadiran-${toFilenamePart(scopeLabel)}-${safeFilenameDate(analytics.period.date_from)}-${safeFilenameDate(analytics.period.date_to)}`;
  const reportPerformanceColumns = withSummaryTotals(performanceColumns, analytics);
  const reportStudentColumns = withSummaryTotals(studentColumns, analytics);

  if (scope === "overall") {
    const overallRows = sortRows<AnalyticsExportRow>(includeStudentDetails ? students : analytics.classes, sort);
    const overallColumns = includeStudentDetails ? reportStudentColumns : reportPerformanceColumns;
    const overallSheetName = includeStudentDetails ? "Per Siswa" : "Per Kelas";
    const additionalSheets = [
      ...(includeStudentDetails ? [] : [{ name: "Per Jurusan", rows: sortRows(analytics.majors, sort), columns: reportPerformanceColumns, showColumnFilters: true }]),
      { name: "Per Tingkat", rows: sortRows(analytics.grades, sort), columns: reportPerformanceColumns, showColumnFilters: true },
      ...(includeStudentDetails ? [{ name: "Per Kelas", rows: sortRows(analytics.classes, sort), columns: reportPerformanceColumns, showColumnFilters: true }, { name: "Per Jurusan", rows: sortRows(analytics.majors, sort), columns: reportPerformanceColumns, showColumnFilters: true }] : []),
    ];
    await exportStyledExcelReport<AnalyticsExportRow>({
      filename,
      title: "ANALITIK KEHADIRAN SEKOLAH",
      subtitle: "Ringkasan performa absensi dan penggunaan Citra Negara Attendence System",
      metadata,
      metrics: createMetrics(analytics),
      dataSheetName: overallSheetName,
      showColumnFilters: true,
      includeStatisticsSheet: false,
      rows: overallRows,
      columns: overallColumns,
      additionalSheets,
      footerLabel: "Citra Negara Attendence System - Analitik Kehadiran",
      dataNote: getSortDescription(sort),
      summaryMetricsOnRight: true,
    });
    return;
  }

  const content = getTableContent(analytics, students, scope, reportStudentColumns, reportPerformanceColumns, sort);
  const additionalSheets = includeStudentDetails
    ? [{ name: "Detail Siswa", rows: sortRows(students, sort), columns: reportStudentColumns, showColumnFilters: true }]
    : undefined;
  await exportStyledExcelReport<AnalyticsExportRow>({
    filename,
    title: "ANALITIK KEHADIRAN SEKOLAH",
    subtitle: `Laporan ${scopeLabel} - Citra Negara Attendence System`,
    metadata,
    metrics: createMetrics(analytics),
    dataSheetName: content.sheetName,
    showColumnFilters: true,
    includeStatisticsSheet: false,
    rows: content.rows,
    columns: content.columns,
    additionalSheets,
    footerLabel: "Citra Negara Attendence System - Analitik Kehadiran",
    dataNote: getSortDescription(sort),
    summaryMetricsOnRight: true,
  });
}

async function exportAttendanceAnalyticsPdf(analytics: AdminAttendanceAnalytics, students: StudentRow[], scope: AnalyticsExportScope, includeStudentDetails: boolean, sort: AnalyticsExportSort, reportType: AnalyticsExportReportType) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const scopeLabel = getAnalyticsExportScopeLabel(scope);
  const mx = REPORT_PDF_MARGIN_X;

  applyPdfCreditMetadata(doc, "Laporan Analitik Kehadiran");
  const { metaY } = drawReportPdfHeader(doc, { title: "LAPORAN ANALITIK KEHADIRAN", subtitle: "Sekolah Citra Negara - Ringkasan Kehadiran" });
  drawReportPdfPills(doc, [
    `Cakupan: ${scopeLabel}`,
    `Tipe: ${getReportTypeLabel(reportType)}`,
    `Periode: ${analytics.period.date_from} s.d. ${analytics.period.date_to}`,
    `Tahun ajaran: ${analytics.filters.school_year_name}`,
    `Kehadiran: ${percentage(analytics.summary.attendance_percentage)}`,
  ], metaY);

  let startY = metaY + 9;
  if (scope === "overall") {
    autoTable(doc, {
      head: [["Indikator", "Nilai", "Indikator", "Nilai"]],
      body: [
        ["Total Siswa", String(analytics.summary.total_students), "Total Kelas", String(analytics.summary.total_classes)],
        ["Kehadiran", percentage(analytics.summary.attendance_percentage), "Penggunaan Sistem", percentage(analytics.summary.system_usage_percentage)],
        ["Belum Absen", String(analytics.summary.not_attended), "Alfa", String(analytics.summary.alpha)],
        ["Sesi Belum Divalidasi", String(analytics.operational.pending_subject_sessions), "Validasi Sesi", percentage(analytics.operational.validation_percentage)],
      ],
      startY,
      margin: { left: mx, right: mx },
      ...REPORT_TABLE_STYLE,
    });
    startY = getLastTableY(doc, startY) + 8;
    addPerformanceTable(doc, autoTable, "PERFORMA PER KELAS", sortRows(analytics.classes, sort), startY);
    startY = getLastTableY(doc, startY) + 8;
    addPerformanceTable(doc, autoTable, "PERFORMA PER JURUSAN", sortRows(analytics.majors, sort), startY);
    startY = getLastTableY(doc, startY) + 8;
    addPerformanceTable(doc, autoTable, "PERFORMA PER TINGKAT", sortRows(analytics.grades, sort), startY);
    if (includeStudentDetails) {
      startY = getLastTableY(doc, startY) + 8;
      addStudentTable(doc, autoTable, sortRows(students, sort), startY);
    }
  } else {
    const content = getTableContent(analytics, students, scope, studentColumns, performanceColumns, sort);
    addPerformanceTable(doc, autoTable, content.title.toUpperCase(), content.rows, startY);
    if (includeStudentDetails) {
      startY = getLastTableY(doc, startY) + 8;
      addStudentTable(doc, autoTable, sortRows(students, sort), startY);
    }
  }

  drawReportPdfFooter(doc, "Analitik Kehadiran - CITRA NEGARA ATTENDENCE SYSTEM");
  doc.save(`Analitik-Kehadiran-${toFilenamePart(scopeLabel)}-${safeFilenameDate(analytics.period.date_from)}-${safeFilenameDate(analytics.period.date_to)}.pdf`);
}

function createMetadata(analytics: AdminAttendanceAnalytics, scopeLabel: string, reportType: AnalyticsExportReportType) {
  const filters = [
    analytics.filters.grade ? `Tingkat ${analytics.filters.grade}` : "Semua tingkat",
    analytics.filters.major_id ? "Jurusan terpilih" : "Semua jurusan",
    analytics.filters.class_id ? "Kelas terpilih" : "Semua kelas",
  ].join(" - ");
  return [
    { label: "Periode", value: `${analytics.period.date_from} sampai ${analytics.period.date_to}` },
    { label: "Tahun ajaran", value: analytics.filters.school_year_name },
    { label: "Cakupan", value: scopeLabel },
    { label: "Tipe laporan", value: getReportTypeLabel(reportType) },
    { label: "Filter aktif", value: filters },
    { label: "Hari sekolah", value: analytics.period.school_days },
    { label: "Dibuat pada", value: new Date(analytics.period.generated_at).toLocaleString("id-ID") },
  ];
}

function getReportTypeLabel(reportType: AnalyticsExportReportType) {
  if (reportType === "daily") return "Periodik per hari";
  if (reportType === "all") return "Sepanjang periode";
  return "Rekap akumulatif";
}

function createMetrics(analytics: AdminAttendanceAnalytics) {
  return [
    {
      label: "Total Siswa / Kelas",
      value: `${analytics.summary.total_students.toLocaleString("id-ID")} / ${analytics.summary.total_classes.toLocaleString("id-ID")}`,
      tone: "sky" as const,
    },
    { label: "Kehadiran", value: percentage(analytics.summary.attendance_percentage), tone: "emerald" as const },
    { label: "Penggunaan Sistem", value: percentage(analytics.summary.system_usage_percentage), tone: "sky" as const },
    { label: "Belum Absen", value: analytics.summary.not_attended, tone: "amber" as const },
    { label: "Alfa", value: analytics.summary.alpha, tone: "rose" as const },
  ];
}

function getTableContent(
  analytics: AdminAttendanceAnalytics,
  students: StudentRow[],
  scope: Exclude<AnalyticsExportScope, "overall">,
  reportStudentColumns: Array<ExcelReportColumn<AnalyticsExportRow>>,
  reportPerformanceColumns: Array<ExcelReportColumn<AnalyticsExportRow>>,
  sort: AnalyticsExportSort,
): TableContent {
  if (scope === "classes") return { title: "Analitik Per Kelas", sheetName: "Per Kelas", rows: sortRows(analytics.classes, sort), columns: reportPerformanceColumns };
  if (scope === "majors") return { title: "Analitik Per Jurusan", sheetName: "Per Jurusan", rows: sortRows(analytics.majors, sort), columns: reportPerformanceColumns };
  if (scope === "grades") return { title: "Analitik Per Tingkat", sheetName: "Per Tingkat", rows: sortRows(analytics.grades, sort), columns: reportPerformanceColumns };
  throw new Error("Cakupan laporan tidak didukung.");
}

function sortRows<Row extends AnalyticsExportRow>(rows: Row[], sort: AnalyticsExportSort): Row[] {
  return [...rows].sort((left, right) => {
    if (sort === "name") {
      const majorDifference = majorOrder(left.major_code) - majorOrder(right.major_code);
      if (majorDifference !== 0) return majorDifference;
      return compareText(rowName(left), rowName(right));
    }

    const attendanceDifference = (right.attendance_percentage ?? 0) - (left.attendance_percentage ?? 0);
    if (attendanceDifference !== 0) {
      return sort === "attendance_desc" ? attendanceDifference : -attendanceDifference;
    }
    const usageDifference = (right.system_usage_percentage ?? 0) - (left.system_usage_percentage ?? 0);
    if (usageDifference !== 0) return sort === "attendance_desc" ? usageDifference : -usageDifference;
    return compareText(rowName(left), rowName(right));
  });
}

function rowName(row: AnalyticsExportRow) {
  return row.student_name ?? row.name ?? row.class_name ?? row.major_code ?? "";
}

function majorOrder(value?: string) {
  const order = ["DKV", "TJKT", "MPLB", "PM", "PPLG", "PH"];
  const normalized = value?.trim().toUpperCase() ?? "";
  const index = order.indexOf(normalized);
  return index === -1 ? order.length : index;
}

function compareText(left: string, right: string) {
  return left.localeCompare(right, "id", { sensitivity: "base", numeric: true });
}

function getSortDescription(sort: AnalyticsExportSort) {
  if (sort === "attendance_desc") return "Urutan: persentase kehadiran terbesar ke terkecil";
  if (sort === "attendance_asc") return "Urutan: persentase kehadiran terkecil ke terbesar";
  return "Urutan nama jurusan: DKV, TJKT, MPLB, PM, PPLG, PH";
}

function withSummaryTotals<Row>(
  columns: Array<ExcelReportColumn<Row>>,
  analytics: AdminAttendanceAnalytics,
): Array<ExcelReportColumn<Row>> {
  return columns.map((column) => {
    if (column.header === "Kehadiran") {
      return { ...column, totalValue: analytics.summary.attendance_percentage / 100 };
    }
    if (column.header === "Penggunaan Sistem") {
      return { ...column, totalValue: analytics.summary.system_usage_percentage / 100 };
    }
    return column;
  });
}

function addPerformanceTable(doc: any, autoTable: any, title: string, rows: AnalyticsExportRow[], startY: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(6, 78, 59);
  doc.text(title, REPORT_PDF_MARGIN_X, startY);
  autoTable(doc, {
    head: [["Nama", "Siswa", "Hadir", "Izin", "Sakit", "Alfa", "Belum", "Kehadiran", "Penggunaan"]],
    body: rows.map((row) => [row.name ?? "-", String(row.total_students ?? 0), String(row.present ?? 0), String(row.permission ?? 0), String(row.sick ?? 0), String(row.alpha ?? 0), String(row.not_attended ?? 0), percentage(row.attendance_percentage ?? 0), percentage(row.system_usage_percentage ?? 0)]),
    startY: startY + 4,
    margin: { left: REPORT_PDF_MARGIN_X, right: REPORT_PDF_MARGIN_X },
    ...REPORT_TABLE_STYLE,
  });
}

function addStudentTable(doc: any, autoTable: any, rows: StudentRow[], startY: number) {
  autoTable(doc, {
    head: [["No", "Nama Siswa", "NIS", "Kelas", "H", "I", "S", "A", "Kehadiran"]],
    body: rows.map((row, index) => [String(index + 1), row.student_name, row.nis, row.class_name, String(row.present), String(row.permission), String(row.sick), String(row.alpha), percentage(row.attendance_percentage)]),
    startY,
    margin: { left: REPORT_PDF_MARGIN_X, right: REPORT_PDF_MARGIN_X },
    ...REPORT_TABLE_STYLE,
  });
}

function getLastTableY(doc: unknown, fallback: number) {
  const finalY = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY;
  return typeof finalY === "number" ? finalY : fallback;
}

function toFilenamePart(value: string) {
  return value.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
}
