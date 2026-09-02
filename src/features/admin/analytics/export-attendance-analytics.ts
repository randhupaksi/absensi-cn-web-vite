import {
  exportStyledExcelReport,
  type ExcelReportColumn,
} from "@/lib/reports/excel-report-kit";
import { applyPdfCreditMetadata } from "@/lib/reports/pdf-metadata";
import {
  drawReportPdfFooter,
  drawReportPdfHeader,
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

export type AnalyticsExportScope = "overall" | "classes" | "majors" | "grades";

export type AnalyticsExportSort =
  | "consistency_desc"
  | "consistency_asc"
  | "attendance_desc"
  | "attendance_asc"
  | "name";
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

type PdfContext = {
  scopeLabel: string;
  periodLabel: string;
  schoolYearLabel: string;
  filterLabel: string;
  reportTypeLabel: string;
};

type PdfTone = {
  fill: [number, number, number];
  border: [number, number, number];
  text: [number, number, number];
};

const PDF_METRIC_TONES: Record<
  "emerald" | "sky" | "amber" | "rose" | "slate",
  PdfTone
> = {
  emerald: {
    fill: [236, 253, 245],
    border: [110, 231, 183],
    text: [6, 95, 70],
  },
  sky: { fill: [240, 249, 255], border: [125, 211, 252], text: [3, 105, 161] },
  amber: { fill: [255, 251, 235], border: [253, 230, 138], text: [180, 83, 9] },
  rose: { fill: [255, 241, 242], border: [253, 164, 175], text: [190, 24, 93] },
  slate: { fill: [248, 250, 252], border: [203, 213, 225], text: [51, 65, 85] },
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
    value: (row: AnalyticsExportRow) => (row.attendance_percentage ?? 0) / 100,
    kind: "number" as const,
    numberFormat: "0.0%",
    width: 14,
  },
  {
    header: "Pengguna Sistem",
    value: (row: AnalyticsExportRow) => row.system_users ?? 0,
    kind: "number" as const,
    width: 17,
  },
  {
    header: "Adopsi Sistem",
    value: (row: AnalyticsExportRow) =>
      (row.system_usage_percentage ?? 0) / 100,
    kind: "number" as const,
    numberFormat: "0.0%",
    width: 15,
  },
  {
    header: "Konsistensi Penggunaan",
    value: (row: AnalyticsExportRow) =>
      (row.system_usage_consistency_percentage ?? 0) / 100,
    kind: "number" as const,
    numberFormat: "0.0%",
    width: 23,
  },
];

const studentColumns = [
  {
    header: "No",
    value: (_row: AnalyticsExportRow, index: number) => index + 1,
    kind: "number" as const,
    width: 7,
  },
  {
    header: "Nama Siswa",
    value: (row: AnalyticsExportRow) => row.student_name ?? "-",
    width: 30,
  },
  {
    header: "NIS",
    value: (row: AnalyticsExportRow) => row.nis ?? "-",
    width: 18,
  },
  {
    header: "Kelas",
    value: (row: AnalyticsExportRow) => row.class_name ?? "-",
    width: 23,
  },
  {
    header: "Tingkat",
    value: (row: AnalyticsExportRow) => row.grade ?? "-",
    width: 11,
  },
  {
    header: "Jurusan",
    value: (row: AnalyticsExportRow) => row.major_code ?? "-",
    width: 16,
  },
  {
    header: "Hadir",
    value: (row: AnalyticsExportRow) => row.present ?? 0,
    kind: "attendance" as const,
    width: 10,
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
    value: (row: AnalyticsExportRow) => (row.attendance_percentage ?? 0) / 100,
    kind: "number" as const,
    numberFormat: "0.0%",
    width: 14,
  },
  {
    header: "Pengguna Sistem",
    value: (row: AnalyticsExportRow) => row.system_users ?? 0,
    kind: "number" as const,
    width: 17,
  },
  {
    header: "Adopsi Sistem",
    value: (row: AnalyticsExportRow) =>
      (row.system_usage_percentage ?? 0) / 100,
    kind: "number" as const,
    numberFormat: "0.0%",
    width: 15,
  },
  {
    header: "Konsistensi Penggunaan",
    value: (row: AnalyticsExportRow) =>
      (row.system_usage_consistency_percentage ?? 0) / 100,
    kind: "number" as const,
    numberFormat: "0.0%",
    width: 23,
  },
];

export async function exportAttendanceAnalytics({
  analytics,
  students,
  scope,
  format,
  includeStudentDetails,
  sort,
  reportType,
}: AttendanceAnalyticsExportOptions) {
  if (format === "pdf") {
    await exportAttendanceAnalyticsPdf(
      analytics,
      students,
      scope,
      includeStudentDetails,
      sort,
      reportType,
    );
    return;
  }
  await exportAttendanceAnalyticsExcel(
    analytics,
    students,
    scope,
    includeStudentDetails,
    sort,
    reportType,
  );
}

async function exportAttendanceAnalyticsExcel(
  analytics: AdminAttendanceAnalytics,
  students: StudentRow[],
  scope: AnalyticsExportScope,
  includeStudentDetails: boolean,
  sort: AnalyticsExportSort,
  reportType: AnalyticsExportReportType,
) {
  const scopeLabel = getAnalyticsExportScopeLabel(scope);
  const metadata = createMetadata(analytics, scopeLabel, reportType);
  const filename = `Analitik-Kehadiran-${toFilenamePart(scopeLabel)}-${safeFilenameDate(analytics.period.date_from)}-${safeFilenameDate(analytics.period.date_to)}`;
  const reportPerformanceColumns = withSummaryTotals(
    performanceColumns,
    analytics,
  );
  const reportStudentColumns = withSummaryTotals(studentColumns, analytics);

  if (scope === "overall") {
    const overallRows = sortRows<AnalyticsExportRow>(
      includeStudentDetails ? students : analytics.classes,
      sort,
    );
    const overallColumns = includeStudentDetails
      ? reportStudentColumns
      : reportPerformanceColumns;
    const overallSheetName = includeStudentDetails ? "Per Siswa" : "Per Kelas";
    const additionalSheets = [
      ...(includeStudentDetails
        ? []
        : [
            {
              name: "Per Jurusan",
              rows: sortRows(analytics.majors, sort),
              columns: reportPerformanceColumns,
              showColumnFilters: true,
            },
          ]),
      {
        name: "Per Tingkat",
        rows: sortRows(analytics.grades, sort),
        columns: reportPerformanceColumns,
        showColumnFilters: true,
      },
      ...(includeStudentDetails
        ? [
            {
              name: "Per Kelas",
              rows: sortRows(analytics.classes, sort),
              columns: reportPerformanceColumns,
              showColumnFilters: true,
            },
            {
              name: "Per Jurusan",
              rows: sortRows(analytics.majors, sort),
              columns: reportPerformanceColumns,
              showColumnFilters: true,
            },
          ]
        : []),
    ];
    await exportStyledExcelReport<AnalyticsExportRow>({
      filename,
      title: "ANALITIK KEHADIRAN SEKOLAH",
      subtitle:
        "Ringkasan performa absensi dan penggunaan Citra Negara Attendance System",
      metadata,
      metrics: createMetrics(analytics),
      dataSheetName: overallSheetName,
      showColumnFilters: true,
      includeStatisticsSheet: false,
      rows: overallRows,
      columns: overallColumns,
      additionalSheets,
      footerLabel: "Citra Negara Attendance System - Analitik Kehadiran",
      dataNote: getSortDescription(sort),
      summaryMetricsOnRight: true,
    });
    return;
  }

  const content = getTableContent(
    analytics,
    students,
    scope,
    reportStudentColumns,
    reportPerformanceColumns,
    sort,
  );
  const additionalSheets = includeStudentDetails
    ? [
        {
          name: "Detail Siswa",
          rows: sortRows(students, sort),
          columns: reportStudentColumns,
          showColumnFilters: true,
        },
      ]
    : undefined;
  await exportStyledExcelReport<AnalyticsExportRow>({
    filename,
    title: "ANALITIK KEHADIRAN SEKOLAH",
    subtitle: `Laporan ${scopeLabel} - Citra Negara Attendance System`,
    metadata,
    metrics: createMetrics(analytics),
    dataSheetName: content.sheetName,
    showColumnFilters: true,
    includeStatisticsSheet: false,
    rows: content.rows,
    columns: content.columns,
    additionalSheets,
    footerLabel: "Citra Negara Attendance System - Analitik Kehadiran",
    dataNote: getSortDescription(sort),
    summaryMetricsOnRight: true,
  });
}

async function exportAttendanceAnalyticsPdf(
  analytics: AdminAttendanceAnalytics,
  students: StudentRow[],
  scope: AnalyticsExportScope,
  includeStudentDetails: boolean,
  sort: AnalyticsExportSort,
  reportType: AnalyticsExportReportType,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const context = createPdfContext(analytics, scope, reportType);

  applyPdfCreditMetadata(doc, "Laporan Analitik Kehadiran");
  await drawAnalyticsPdfHeader(
    doc,
    context,
    "LAPORAN ANALITIK KEHADIRAN",
    "Ringkasan kehadiran dan tindak lanjut absensi",
  );
  drawAnalyticsOverview(doc, analytics);

  if (scope === "overall") {
    let startY = await startAnalyticsPdfSection(
      doc,
      context,
      "PERINGKAT PERFORMA KELAS",
      `${getSortDescription(sort)}. Gunakan urutan ini untuk menentukan kelas yang perlu ditindaklanjuti.`,
    );
    addPerformanceTable(doc, autoTable, {
      title: "Peringkat performa kelas",
      entityLabel: "Kelas",
      rows: sortRows(analytics.classes, sort),
      summary: analytics.summary,
      startY,
      context,
      sectionLabel: "Peringkat performa kelas",
    });

    startY = await startAnalyticsPdfSection(
      doc,
      context,
      "RINGKASAN JURUSAN DAN TINGKAT",
      "Perbandingan agregat untuk membantu melihat pola pada kelompok yang lebih besar.",
    );
    addPerformanceTable(doc, autoTable, {
      title: "Performa per jurusan",
      entityLabel: "Jurusan",
      rows: sortRows(analytics.majors, sort),
      summary: analytics.summary,
      startY,
      context,
      sectionLabel: "Performa per jurusan",
    });
    startY = getLastTableY(doc, startY) + 10;
    addPerformanceTable(doc, autoTable, {
      title: "Performa per tingkat",
      entityLabel: "Tingkat",
      rows: sortRows(analytics.grades, sort),
      summary: analytics.summary,
      startY,
      context,
      sectionLabel: "Performa per tingkat",
    });
    if (includeStudentDetails) {
      startY = await startAnalyticsPdfSection(
        doc,
        context,
        "LAMPIRAN DETAIL SISWA",
        "Rincian status kehadiran setiap siswa pada periode dan filter yang dipilih.",
      );
      addStudentTable(
        doc,
        autoTable,
        sortRows(students, sort),
        analytics,
        startY,
        context,
      );
    }
  } else {
    const content = getTableContent(
      analytics,
      students,
      scope,
      studentColumns,
      performanceColumns,
      sort,
    );
    const startY = await startAnalyticsPdfSection(
      doc,
      context,
      content.title.toUpperCase(),
      `${getSortDescription(sort)}. Angka total pada baris terakhir digunakan untuk mencocokkan ringkasan laporan.`,
    );
    addPerformanceTable(doc, autoTable, {
      title: content.title,
      entityLabel:
        scope === "classes"
          ? "Kelas"
          : scope === "majors"
            ? "Jurusan"
            : "Tingkat",
      rows: content.rows,
      summary: analytics.summary,
      startY,
      context,
      sectionLabel: content.title,
    });
    if (includeStudentDetails) {
      const detailStartY = await startAnalyticsPdfSection(
        doc,
        context,
        "LAMPIRAN DETAIL SISWA",
        "Rincian status kehadiran setiap siswa pada periode dan filter yang dipilih.",
      );
      addStudentTable(
        doc,
        autoTable,
        sortRows(students, sort),
        analytics,
        detailStartY,
        context,
      );
    }
  }

  drawReportPdfFooter(
    doc,
    "Analitik Kehadiran - CITRA NEGARA ATTENDANCE SYSTEM",
  );
  doc.save(
    `Analitik-Kehadiran-${toFilenamePart(context.scopeLabel)}-${safeFilenameDate(analytics.period.date_from)}-${safeFilenameDate(analytics.period.date_to)}.pdf`,
  );
}

function createPdfContext(
  analytics: AdminAttendanceAnalytics,
  scope: AnalyticsExportScope,
  reportType: AnalyticsExportReportType,
): PdfContext {
  return {
    scopeLabel: getAnalyticsExportScopeLabel(scope),
    periodLabel: `${formatPdfDate(analytics.period.date_from)} - ${formatPdfDate(analytics.period.date_to)}`,
    schoolYearLabel:
      analytics.filters.school_year_name || "Tahun ajaran tidak tersedia",
    filterLabel: createFilterLabel(analytics),
    reportTypeLabel: getReportTypeLabel(reportType),
  };
}

async function drawAnalyticsPdfHeader(
  doc: any,
  context: PdfContext,
  title: string,
  subtitle: string,
) {
  const { metaY } = await drawReportPdfHeader(doc, { title, subtitle });
  return drawWrappedPdfPills(
    doc,
    [
      `Periode: ${context.periodLabel}`,
      `Tahun ajaran: ${context.schoolYearLabel}`,
      `Cakupan: ${context.scopeLabel}`,
      `Filter: ${context.filterLabel}`,
      `Laporan: ${context.reportTypeLabel}`,
    ],
    metaY,
  );
}

async function startAnalyticsPdfSection(
  doc: any,
  context: PdfContext,
  title: string,
  subtitle: string,
) {
  doc.addPage();
  return (await drawAnalyticsPdfHeader(doc, context, title, subtitle)) + 3;
}

function drawWrappedPdfPills(doc: any, values: string[], initialY: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const rightEdge = pageWidth - REPORT_PDF_MARGIN_X;
  let x = REPORT_PDF_MARGIN_X;
  let y = initialY;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(6, 95, 70);
  values.forEach((rawValue) => {
    const value = truncatePdfText(doc, rawValue, 78);
    const width = doc.getTextWidth(value) + 8;
    if (x > REPORT_PDF_MARGIN_X && x + width > rightEdge) {
      x = REPORT_PDF_MARGIN_X;
      y += 7;
    }
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(110, 231, 183);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, width, 5, 1.2, 1.2, "FD");
    doc.text(value, x + 4, y + 3.55);
    x += width + 3;
  });
  return y + 6;
}

function drawAnalyticsContinuationHeader(
  doc: any,
  context: PdfContext,
  sectionLabel: string,
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(6, 78, 59);
  doc.rect(0, 0, pageWidth, 18, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(236, 253, 245);
  doc.text("CITRA NEGARA ATTENDANCE SYSTEM", REPORT_PDF_MARGIN_X, 8.5);
  doc.text(
    truncatePdfText(doc, sectionLabel.toUpperCase(), 72),
    pageWidth - REPORT_PDF_MARGIN_X,
    8.5,
    { align: "right" },
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(167, 243, 208);
  doc.text(
    `Periode: ${context.periodLabel} | ${context.scopeLabel}`,
    REPORT_PDF_MARGIN_X,
    14,
  );
}

function drawAnalyticsOverview(doc: any, analytics: AdminAttendanceAnalytics) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const metricsY = 56;
  const gap = 4;
  const cardWidth = (pageWidth - REPORT_PDF_MARGIN_X * 2 - gap * 2) / 3;
  const metrics = [
    {
      label: "TOTAL SISWA / KELAS",
      value: `${formatNumber(analytics.summary.total_students)} / ${formatNumber(analytics.summary.total_classes)}`,
      detail: `${formatNumber(analytics.period.school_days)} hari sekolah`,
      tone: "slate" as const,
    },
    {
      label: "KEHADIRAN",
      value: percentage(analytics.summary.attendance_percentage),
      detail: `${formatNumber(analytics.summary.recorded_attendance)} status tercatat`,
      tone: "emerald" as const,
    },
    {
      label: "CAKUPAN SISWA",
      value: `${formatNumber(analytics.summary.system_users ?? 0)} siswa (${percentage(analytics.summary.system_usage_percentage)})`,
      detail: "pernah melakukan absensi",
      tone: "sky" as const,
    },
    {
      label: "KONSISTENSI ABSENSI",
      value: percentage(
        analytics.summary.system_usage_consistency_percentage ?? 0,
      ),
      detail: "hari-siswa dengan aksi absensi",
      tone: "sky" as const,
    },
    {
      label: "BELUM TERCATAT",
      value: formatNumber(analytics.summary.not_attended),
      detail: "kewajiban absensi belum berstatus",
      tone: "amber" as const,
    },
    {
      label: "ALFA",
      value: formatNumber(analytics.summary.alpha),
      detail: "status alfa yang tersimpan",
      tone: "rose" as const,
    },
  ];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(6, 78, 59);
  doc.text("RINGKASAN UTAMA", REPORT_PDF_MARGIN_X, 51);

  metrics.forEach((metric, index) => {
    const row = Math.floor(index / 3);
    const column = index % 3;
    drawPdfMetricCard(
      doc,
      REPORT_PDF_MARGIN_X + column * (cardWidth + gap),
      metricsY + row * 24,
      cardWidth,
      metric,
    );
  });

  const insightY = metricsY + 52;
  const statusWidth = 108;
  drawStatusSummary(doc, analytics, REPORT_PDF_MARGIN_X, insightY, statusWidth);
  drawTrendChart(
    doc,
    analytics,
    REPORT_PDF_MARGIN_X + statusWidth + 8,
    insightY,
    pageWidth - REPORT_PDF_MARGIN_X * 2 - statusWidth - 8,
    54,
  );
  drawPdfDefinitionNote(
    doc,
    insightY + 60,
    pageWidth - REPORT_PDF_MARGIN_X * 2,
  );
}

function drawPdfMetricCard(
  doc: any,
  x: number,
  y: number,
  width: number,
  metric: {
    label: string;
    value: string;
    detail: string;
    tone: keyof typeof PDF_METRIC_TONES;
  },
) {
  const tone = PDF_METRIC_TONES[metric.tone];
  doc.setFillColor(...tone.fill);
  doc.setDrawColor(...tone.border);
  doc.setLineWidth(0.35);
  doc.roundedRect(x, y, width, 20, 2.5, 2.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(...tone.text);
  doc.text(metric.label, x + 4, y + 5.5);
  doc.setFontSize(13);
  doc.text(metric.value, x + 4, y + 12.8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.9);
  doc.setTextColor(71, 85, 105);
  doc.text(truncatePdfText(doc, metric.detail, width - 8), x + 4, y + 17);
}

function drawStatusSummary(
  doc: any,
  analytics: AdminAttendanceAnalytics,
  x: number,
  y: number,
  width: number,
) {
  const denominator = analytics.summary.attendance_opportunities;
  const statuses = [
    {
      label: "Hadir",
      value: analytics.status_breakdown.present,
      color: [5, 150, 105] as [number, number, number],
    },
    {
      label: "Izin",
      value: analytics.status_breakdown.permission,
      color: [2, 132, 199] as [number, number, number],
    },
    {
      label: "Sakit",
      value: analytics.status_breakdown.sick,
      color: [139, 92, 246] as [number, number, number],
    },
    {
      label: "Alfa",
      value: analytics.status_breakdown.alpha,
      color: [225, 29, 72] as [number, number, number],
    },
    {
      label: "Belum tercatat",
      value: analytics.status_breakdown.not_attended,
      color: [217, 119, 6] as [number, number, number],
    },
  ];

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, y, width, 54, 2.5, 2.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(6, 78, 59);
  doc.text("RINCIAN STATUS", x + 4, y + 6);

  statuses.forEach((status, index) => {
    const rowY = y + 12 + index * 7.4;
    doc.setFillColor(...status.color);
    doc.circle(x + 5.2, rowY - 1.2, 1.5, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.6);
    doc.setTextColor(51, 65, 85);
    doc.text(status.label, x + 9, rowY);
    doc.setFont("helvetica", "bold");
    doc.text(formatNumber(status.value), x + width - 25, rowY, {
      align: "right",
    });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(
      denominator > 0 ? percentage((status.value / denominator) * 100) : "0%",
      x + width - 4,
      rowY,
      { align: "right" },
    );
  });
}

function drawTrendChart(
  doc: any,
  analytics: AdminAttendanceAnalytics,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, y, width, height, 2.5, 2.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(6, 78, 59);
  doc.text("TREN KEHADIRAN DAN KONSISTENSI", x + 4, y + 6);

  const chartX = x + 10;
  const chartY = y + 15;
  const chartWidth = width - 16;
  const chartHeight = height - 27;
  const trend = analytics.trend;
  if (!trend.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "Tidak ada hari sekolah pada periode ini.",
      x + width / 2,
      y + height / 2,
      { align: "center" },
    );
    return;
  }

  [0, 50, 100].forEach((value) => {
    const lineY = chartY + chartHeight - (value / 100) * chartHeight;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.line(chartX, lineY, chartX + chartWidth, lineY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${value}%`, chartX - 2, lineY + 1.8, { align: "right" });
  });

  const drawSeries = (values: number[], color: [number, number, number]) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.9);
    values.forEach((value, index) => {
      if (index === 0) return;
      const previousX =
        chartX + ((index - 1) / Math.max(values.length - 1, 1)) * chartWidth;
      const previousY =
        chartY +
        chartHeight -
        (Math.max(0, Math.min(values[index - 1] ?? 0, 100)) / 100) *
          chartHeight;
      const pointX =
        chartX + (index / Math.max(values.length - 1, 1)) * chartWidth;
      const pointY =
        chartY +
        chartHeight -
        (Math.max(0, Math.min(value, 100)) / 100) * chartHeight;
      doc.line(previousX, previousY, pointX, pointY);
    });
  };

  drawSeries(
    trend.map((item) => item.attendance_percentage),
    [5, 150, 105],
  );
  drawSeries(
    trend.map(
      (item) =>
        item.system_usage_consistency_percentage ??
        item.system_usage_percentage,
    ),
    [2, 132, 199],
  );

  const labelIndexes = [
    ...new Set([0, Math.floor((trend.length - 1) / 2), trend.length - 1]),
  ];
  labelIndexes.forEach((index) => {
    const pointX =
      chartX + (index / Math.max(trend.length - 1, 1)) * chartWidth;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      truncatePdfText(doc, trend[index].label, 18),
      pointX,
      chartY + chartHeight + 6.5,
      { align: "center" },
    );
  });

  drawTrendLegend(doc, x + 5, y + height - 4.5, [5, 150, 105], "Kehadiran");
  drawTrendLegend(doc, x + 42, y + height - 4.5, [2, 132, 199], "Konsistensi");
}

function drawTrendLegend(
  doc: any,
  x: number,
  y: number,
  color: [number, number, number],
  label: string,
) {
  doc.setFillColor(...color);
  doc.circle(x, y - 1.3, 1.2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text(label, x + 3, y);
}

function drawPdfDefinitionNote(doc: any, y: number, width: number) {
  const text =
    "Cakupan siswa = siswa yang pernah melakukan absensi minimal satu kali. Konsistensi absensi = hari-siswa dengan aksi absensi dibandingkan seluruh kewajiban absensi. Belum tercatat adalah kewajiban absensi yang belum memiliki status, bukan jumlah siswa unik.";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.7);
  const lines = doc.splitTextToSize(text, width - 8);
  const height = Math.max(13, lines.length * 3.4 + 5);
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(REPORT_PDF_MARGIN_X, y, width, height, 2, 2, "FD");
  doc.setTextColor(6, 95, 70);
  doc.text(lines, REPORT_PDF_MARGIN_X + 4, y + 4.2);
}

function createMetadata(
  analytics: AdminAttendanceAnalytics,
  scopeLabel: string,
  reportType: AnalyticsExportReportType,
) {
  const filters = [
    analytics.filters.grade
      ? `Tingkat ${analytics.filters.grade}`
      : "Semua tingkat",
    analytics.filters.major_id ? "Jurusan terpilih" : "Semua jurusan",
    analytics.filters.class_id ? "Kelas terpilih" : "Semua kelas",
  ].join(" - ");
  return [
    {
      label: "Periode",
      value: `${analytics.period.date_from} sampai ${analytics.period.date_to}`,
    },
    { label: "Tahun ajaran", value: analytics.filters.school_year_name },
    { label: "Cakupan", value: scopeLabel },
    { label: "Tipe laporan", value: getReportTypeLabel(reportType) },
    { label: "Filter aktif", value: filters },
    { label: "Hari sekolah", value: analytics.period.school_days },
    {
      label: "Dibuat pada",
      value: new Date(analytics.period.generated_at).toLocaleString("id-ID"),
    },
  ];
}

function createFilterLabel(analytics: AdminAttendanceAnalytics) {
  if (analytics.filters.class_id) return "Kelas terpilih";
  if (analytics.filters.major_id)
    return analytics.filters.grade
      ? `Tingkat ${analytics.filters.grade}, jurusan terpilih`
      : "Jurusan terpilih";
  if (analytics.filters.grade) return `Tingkat ${analytics.filters.grade}`;
  return "Semua kelas";
}

function formatPdfDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatNumber(value: number) {
  return value.toLocaleString("id-ID");
}

function truncatePdfText(doc: any, value: string, maxWidth: number) {
  if (doc.getTextWidth(value) <= maxWidth) return value;
  const suffix = "...";
  let result = value;
  while (result.length > 1 && doc.getTextWidth(result + suffix) > maxWidth) {
    result = result.slice(0, -1);
  }
  return result + suffix;
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
    {
      label: "Kehadiran",
      value: percentage(analytics.summary.attendance_percentage),
      tone: "emerald" as const,
    },
    {
      label: "Adopsi Sistem",
      value: `${(analytics.summary.system_users ?? 0).toLocaleString("id-ID")} siswa (${percentage(analytics.summary.system_usage_percentage)})`,
      tone: "sky" as const,
    },
    {
      label: "Konsistensi Penggunaan",
      value: percentage(
        analytics.summary.system_usage_consistency_percentage ?? 0,
      ),
      tone: "sky" as const,
    },
    {
      label: "Belum Absen",
      value: analytics.summary.not_attended,
      tone: "amber" as const,
    },
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
  if (scope === "classes")
    return {
      title: "Analitik Per Kelas",
      sheetName: "Per Kelas",
      rows: sortRows(analytics.classes, sort),
      columns: reportPerformanceColumns,
    };
  if (scope === "majors")
    return {
      title: "Analitik Per Jurusan",
      sheetName: "Per Jurusan",
      rows: sortRows(analytics.majors, sort),
      columns: reportPerformanceColumns,
    };
  if (scope === "grades")
    return {
      title: "Analitik Per Tingkat",
      sheetName: "Per Tingkat",
      rows: sortRows(analytics.grades, sort),
      columns: reportPerformanceColumns,
    };
  throw new Error("Cakupan laporan tidak didukung.");
}

function sortRows<Row extends AnalyticsExportRow>(
  rows: Row[],
  sort: AnalyticsExportSort,
): Row[] {
  return [...rows].sort((left, right) => {
    if (sort === "name") {
      return compareText(rowName(left), rowName(right));
    }

    if (sort === "consistency_desc" || sort === "consistency_asc") {
      const consistencyDifference =
        (right.system_usage_consistency_percentage ?? 0) -
        (left.system_usage_consistency_percentage ?? 0);
      if (consistencyDifference !== 0) {
        return sort === "consistency_desc"
          ? consistencyDifference
          : -consistencyDifference;
      }
      const coverageDifference =
        (right.system_usage_percentage ?? 0) -
        (left.system_usage_percentage ?? 0);
      if (coverageDifference !== 0) {
        return sort === "consistency_desc"
          ? coverageDifference
          : -coverageDifference;
      }
      const attendanceDifference =
        (right.attendance_percentage ?? 0) - (left.attendance_percentage ?? 0);
      if (attendanceDifference !== 0) {
        return sort === "consistency_desc"
          ? attendanceDifference
          : -attendanceDifference;
      }
      return compareText(rowName(left), rowName(right));
    }

    const attendanceDifference =
      (right.attendance_percentage ?? 0) - (left.attendance_percentage ?? 0);
    if (attendanceDifference !== 0) {
      return sort === "attendance_desc"
        ? attendanceDifference
        : -attendanceDifference;
    }
    const usageDifference =
      (right.system_usage_consistency_percentage ?? 0) -
      (left.system_usage_consistency_percentage ?? 0);
    if (usageDifference !== 0)
      return sort === "attendance_desc" ? usageDifference : -usageDifference;
    return compareText(rowName(left), rowName(right));
  });
}

function rowName(row: AnalyticsExportRow) {
  return row.student_name ?? row.name ?? row.class_name ?? row.major_code ?? "";
}

function compareText(left: string, right: string) {
  return left.localeCompare(right, "id", {
    sensitivity: "base",
    numeric: true,
  });
}

function getSortDescription(sort: AnalyticsExportSort) {
  if (sort === "consistency_desc")
    return "Urutan: konsistensi absensi tertinggi ke terendah";
  if (sort === "consistency_asc")
    return "Urutan: konsistensi absensi terendah ke tertinggi";
  if (sort === "attendance_desc")
    return "Urutan: persentase kehadiran terbesar ke terkecil";
  if (sort === "attendance_asc")
    return "Urutan: persentase kehadiran terkecil ke terbesar";
  return "Urutan: nama A-Z";
}

function withSummaryTotals<Row>(
  columns: Array<ExcelReportColumn<Row>>,
  analytics: AdminAttendanceAnalytics,
): Array<ExcelReportColumn<Row>> {
  return columns.map((column) => {
    if (column.header === "Kehadiran") {
      return {
        ...column,
        totalValue: analytics.summary.attendance_percentage / 100,
      };
    }
    if (column.header === "Adopsi Sistem") {
      return {
        ...column,
        totalValue: analytics.summary.system_usage_percentage / 100,
      };
    }
    if (column.header === "Konsistensi Penggunaan") {
      return {
        ...column,
        totalValue:
          (analytics.summary.system_usage_consistency_percentage ?? 0) / 100,
      };
    }
    return column;
  });
}

function addPerformanceTable(
  doc: any,
  autoTable: any,
  {
    title,
    entityLabel,
    rows,
    summary,
    startY,
    context,
    sectionLabel,
  }: {
    title: string;
    entityLabel: string;
    rows: AnalyticsExportRow[];
    summary: AdminAttendanceAnalytics["summary"];
    startY: number;
    context: PdfContext;
    sectionLabel: string;
  },
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(6, 78, 59);
  doc.text(title.toUpperCase(), REPORT_PDF_MARGIN_X, startY);

  const body: any[][] = rows.map((row, index) => [
    String(index + 1),
    row.name ?? "-",
    formatNumber(row.total_students ?? 0),
    percentage(row.attendance_percentage ?? 0),
    `${formatNumber(row.system_users ?? 0)} (${percentage(row.system_usage_percentage ?? 0)})`,
    percentage(row.system_usage_consistency_percentage ?? 0),
    formatNumber(row.not_attended ?? 0),
    formatNumber(row.alpha ?? 0),
  ]);
  body.push([
    "",
    "TOTAL / RATA-RATA",
    formatNumber(summary.total_students),
    percentage(summary.attendance_percentage),
    `${formatNumber(summary.system_users ?? 0)} (${percentage(summary.system_usage_percentage)})`,
    percentage(summary.system_usage_consistency_percentage ?? 0),
    formatNumber(summary.not_attended),
    formatNumber(summary.alpha),
  ]);

  autoTable(doc, {
    head: [
      [
        "Peringkat",
        entityLabel,
        "Siswa",
        "Kehadiran",
        "Cakupan siswa",
        "Konsistensi",
        "Belum tercatat",
        "Alfa",
      ],
    ],
    body,
    startY: startY + 4,
    margin: {
      top: 25,
      right: REPORT_PDF_MARGIN_X,
      bottom: 14,
      left: REPORT_PDF_MARGIN_X,
    },
    showHead: "everyPage",
    ...REPORT_TABLE_STYLE,
    styles: {
      ...REPORT_TABLE_STYLE.styles,
      fontSize: 7.4,
      cellPadding: { horizontal: 2.8, vertical: 3.1 },
    },
    headStyles: { ...REPORT_TABLE_STYLE.headStyles, fontSize: 7.1 },
    columnStyles: {
      0: { cellWidth: 17, halign: "center", fontStyle: "bold" },
      1: { cellWidth: 52 },
      2: { cellWidth: 17, halign: "center" },
      3: { cellWidth: 24, halign: "center" },
      4: { cellWidth: 33, halign: "center" },
      5: { cellWidth: 26, halign: "center" },
      6: { cellWidth: 28, halign: "center" },
      7: { cellWidth: 16, halign: "center" },
    },
    didParseCell: (data: any) => {
      if (data.section === "body" && data.row.index === rows.length) {
        data.cell.styles.fillColor = [236, 253, 245];
        data.cell.styles.textColor = [6, 95, 70];
        data.cell.styles.fontStyle = "bold";
      }
    },
    willDrawPage: (data: any) => {
      if (data.pageNumber > 1)
        drawAnalyticsContinuationHeader(doc, context, sectionLabel);
    },
  });
}

function addStudentTable(
  doc: any,
  autoTable: any,
  rows: StudentRow[],
  analytics: AdminAttendanceAnalytics,
  startY: number,
  context: PdfContext,
) {
  const { summary, status_breakdown: status } = analytics;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.3);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Lampiran ini berfokus pada status kehadiran siswa. Metrik cakupan dan konsistensi dijelaskan pada halaman ringkasan.",
    REPORT_PDF_MARGIN_X,
    startY,
  );

  const body: any[][] = rows.map((row, index) => [
    String(index + 1),
    row.student_name,
    row.nis,
    row.class_name,
    formatNumber(row.present),
    formatNumber(row.permission),
    formatNumber(row.sick),
    formatNumber(row.alpha),
    formatNumber(row.not_attended),
    percentage(row.attendance_percentage),
  ]);
  body.push([
    "",
    "TOTAL / RATA-RATA",
    "",
    "",
    formatNumber(status.present),
    formatNumber(status.permission),
    formatNumber(status.sick),
    formatNumber(summary.alpha),
    formatNumber(summary.not_attended),
    percentage(summary.attendance_percentage),
  ]);

  autoTable(doc, {
    head: [
      [
        "No",
        "Nama siswa",
        "NIS",
        "Kelas",
        "H",
        "I",
        "S",
        "A",
        "Belum",
        "Kehadiran",
      ],
    ],
    body,
    startY: startY + 4,
    margin: {
      top: 25,
      right: REPORT_PDF_MARGIN_X,
      bottom: 14,
      left: REPORT_PDF_MARGIN_X,
    },
    showHead: "everyPage",
    ...REPORT_TABLE_STYLE,
    styles: {
      ...REPORT_TABLE_STYLE.styles,
      fontSize: 7.2,
      cellPadding: { horizontal: 2.3, vertical: 2.9 },
    },
    headStyles: { ...REPORT_TABLE_STYLE.headStyles, fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 12, halign: "center", fontStyle: "bold" },
      1: { cellWidth: 49 },
      2: { cellWidth: 28 },
      3: { cellWidth: 33 },
      4: { cellWidth: 12, halign: "center" },
      5: { cellWidth: 12, halign: "center" },
      6: { cellWidth: 12, halign: "center" },
      7: { cellWidth: 12, halign: "center" },
      8: { cellWidth: 20, halign: "center" },
      9: { cellWidth: 24, halign: "center" },
    },
    didParseCell: (data: any) => {
      if (data.section === "body" && data.row.index === rows.length) {
        data.cell.styles.fillColor = [236, 253, 245];
        data.cell.styles.textColor = [6, 95, 70];
        data.cell.styles.fontStyle = "bold";
      }
    },
    willDrawPage: (data: any) => {
      if (data.pageNumber > 1)
        drawAnalyticsContinuationHeader(doc, context, "Lampiran detail siswa");
    },
  });
}

function getLastTableY(doc: unknown, fallback: number) {
  const finalY = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable
    ?.finalY;
  return typeof finalY === "number" ? finalY : fallback;
}

function toFilenamePart(value: string) {
  return value.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
}
