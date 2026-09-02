"use client";

import { AnimatePresence, motion } from "motion/react";
import { PremiumModal } from "@/components/modals/premium-modal";
import { ReportModalFooter } from "@/features/reports/shared/report-modal-footer";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { applyPdfCreditMetadata } from "@/lib/reports/pdf-metadata";
import {
  drawReportPdfFooter,
  drawReportPdfHeader,
  drawReportPdfPills,
  REPORT_PDF_MARGIN_X,
  REPORT_TABLE_STYLE,
} from "@/lib/reports/pdf-report-kit";
import {
  QuestionBlock,
  ReportCheckbox,
  ReportFormatQuestion,
  ReportRadio,
  type ReportFormat,
} from "@/features/reports/shared/report-question-ui";
import { exportStyledExcelReport } from "@/lib/reports/excel-report-kit";
import { getTeacherHomeroomAttendanceOverview } from "@/services/staff.service";
import type {
  StaffAttendanceRecord,
  StaffHomeroomContext,
} from "@/types/staff";
import {
  Activity,
  ArrowUpDown,
  CalendarClock,
  ListChecks,
  Printer,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { id as localeID } from "date-fns/locale";
import { toast } from "sonner";

function toDateInputValue(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateValue(v: string): Date | undefined {
  if (!v) return undefined;
  const d = new Date(`${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function formatDisplayDate(v: string) {
  const d = parseDateValue(v);
  if (!d) return "";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatGender(value?: string) {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "l" || normalized === "laki-laki" || normalized === "male") {
    return "L";
  }
  if (normalized === "p" || normalized === "perempuan" || normalized === "female") {
    return "P";
  }
  return "-";
}

const todayStr = () => toDateInputValue(new Date());
const todayDisplay = () => formatDisplayDate(todayStr());
// The attendance web app went live on this date. Keeping the report boundary
// here also stays within the API's maximum 370-day range validation.
const AVAILABLE_DATA_START_DATE = "2026-08-18";

type DateMode = "today" | "specific" | "range";
type ReportType = "daily" | "cumulative" | "all";
type StatusFilter = "Semua" | "hadir" | "izin" | "sakit" | "alfa";
type SortBy = "name" | "nis" | "status" | "checkin" | "h" | "i" | "s" | "a";
type Columns = { nis: boolean; status: boolean; checkin: boolean };
type CumulativeColumns = { nis: boolean };
type CumulativeRow = {
  student_id: string;
  student_name: string;
  nis: string;
  h: number;
  i: number;
  s: number;
  a: number;
  attendance_percentage: number;
};
type ReportTableCell =
  | string
  | { content: string; colSpan?: number; styles?: Record<string, unknown> };
type SortOption = { value: SortBy; label: string };

function getLastTableY(doc: unknown, fallback: number) {
  const finalY = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable
    ?.finalY;
  return typeof finalY === "number" ? finalY : fallback;
}

const STATUS_LABELS: Record<StatusFilter, string> = {
  Semua: "Semua Status",
  hadir: "Hadir",
  alfa: "Alfa",
  izin: "Izin",
  sakit: "Sakit",
};

async function generateDailyWalasAbsensiPdf(
  records: StaffAttendanceRecord[],
  homeroom: StaffHomeroomContext,
  periodeLabel: string,
  statusLabel: string,
  sortLabel: string,
  columns: Columns,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan Walas Absensi");
  const mx = REPORT_PDF_MARGIN_X;
  const { metaY } = await drawReportPdfHeader(doc, {
    title: "LAPORAN ABSENSI KELAS",
    subtitle: "Laporan Wali Kelas",
  });
  const pills = [
    "Tipe: Periodik per hari",
    `Kelas: ${homeroom.class_name}`,
    `Periode: ${periodeLabel}`,
    `Status: ${statusLabel}`,
    `Total: ${records.length} record`,
    `Urutan: ${sortLabel}`,
  ];
  const pillsBottomY = drawReportPdfPills(doc, pills, metaY);

  const head: string[][] = [["No", "Nama Siswa", "Tanggal"]];
  if (columns.nis) head[0].push("NIS");
  if (columns.status) head[0].push("Status");
  if (columns.checkin) head[0].push("Absen Masuk");

  const buildBody = (dateRecords: StaffAttendanceRecord[]) =>
    dateRecords.map((record, index) => {
      const tanggal = record.attendance_date
        ? new Date(`${record.attendance_date}T00:00:00`).toLocaleDateString(
            "id-ID",
            { day: "2-digit", month: "short", year: "numeric" },
          )
        : "-";
      const row: string[] = [String(index + 1), record.student_name, tanggal];
      if (columns.nis) row.push(record.nis);
      if (columns.status) {
        row.push(
          record.status
            ? record.status.charAt(0).toUpperCase() +
                record.status.slice(1).toLowerCase()
            : "-",
        );
      }
      if (columns.checkin) {
        row.push(
          record.check_in_at
            ? new Date(record.check_in_at).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-",
        );
      }
      return row;
    });

  const recordsByDate = new Map<string, StaffAttendanceRecord[]>();
  for (const record of records) {
    const date = record.attendance_date || "-";
    const group = recordsByDate.get(date) ?? [];
    group.push(record);
    recordsByDate.set(date, group);
  }

  let startY = pillsBottomY + 3;
  const groupedDates = Array.from(recordsByDate.entries());
  const contentWidth = doc.internal.pageSize.getWidth() - mx * 2;
  const isPortrait = contentWidth < 220;
  const dailyFixedWidths = {
    no: isPortrait ? 10 : 12,
    date: isPortrait ? 25 : 32,
    nis: columns.nis ? (isPortrait ? 25 : 36) : 0,
    status: columns.status ? (isPortrait ? 30 : 43) : 0,
    checkin: columns.checkin ? (isPortrait ? 30 : 45) : 0,
  };
  const dailyNameWidth =
    contentWidth -
    dailyFixedWidths.no -
    dailyFixedWidths.date -
    dailyFixedWidths.nis -
    dailyFixedWidths.status -
    dailyFixedWidths.checkin;

  groupedDates.forEach(([date, dateRecords], groupIndex) => {
    if (groupedDates.length > 1) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(6, 95, 70);
      doc.text(
        `Tanggal: ${date === "-" ? "Tidak tersedia" : formatDisplayDate(date)}`,
        mx,
        startY,
      );
      startY += 4;
    }

    autoTable(doc, {
      head,
      body: buildBody(dateRecords),
      startY,
      margin: { left: mx, right: mx },
      tableWidth: "auto",
      ...REPORT_TABLE_STYLE,
      styles: {
        ...REPORT_TABLE_STYLE.styles,
        fontSize: 8,
        cellPadding: { horizontal: 2.4, vertical: 2.8 },
      },
      columnStyles: {
        0: {
          cellWidth: dailyFixedWidths.no,
          halign: "center",
          fontStyle: "bold",
        },
        1: { cellWidth: dailyNameWidth },
        2: { cellWidth: dailyFixedWidths.date, halign: "center" },
        ...(columns.nis
          ? { 3: { cellWidth: dailyFixedWidths.nis, halign: "center" } }
          : {}),
        ...(columns.status
          ? {
              [columns.nis ? 4 : 3]: {
                cellWidth: dailyFixedWidths.status,
                halign: "center",
              },
            }
          : {}),
        ...(columns.checkin
          ? {
              [2 + Number(columns.nis) + Number(columns.status)]: {
                cellWidth: dailyFixedWidths.checkin,
                halign: "center",
              },
            }
          : {}),
      },
    });
    startY =
      getLastTableY(doc, startY) +
      (groupIndex < groupedDates.length - 1 ? 9 : 0);
  });

  drawReportPdfFooter(
    doc,
    `Laporan Absensi Kelas - ${homeroom.class_name} - CITRA NEGARA ATTENDANCE SYSTEM`,
  );
  doc.save(
    `Laporan-Walas-Absensi-${homeroom.class_name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`,
  );
}

async function generateRangeWalasAbsensiPdf(
  records: StaffAttendanceRecord[],
  homeroom: StaffHomeroomContext,
  periodeLabel: string,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan Walas Absensi per Tanggal");
  const mx = REPORT_PDF_MARGIN_X;
  const { metaY } = await drawReportPdfHeader(doc, {
    title: "LAPORAN ABSENSI KELAS",
    subtitle: "Laporan Wali Kelas per Tanggal",
  });
  const pillsBottomY = drawReportPdfPills(
    doc,
    [
      "Tipe: Per tanggal",
      `Kelas: ${homeroom.class_name}`,
      `Periode: ${periodeLabel}`,
      `Total: ${records.length} record`,
      "Urutan: Nama (A-Z)",
    ],
    metaY,
  );

  const recordsByDate = new Map<string, StaffAttendanceRecord[]>();
  for (const record of records) {
    const date = record.attendance_date || "-";
    recordsByDate.set(date, [...(recordsByDate.get(date) ?? []), record]);
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const tableWidth = pageWidth - mx * 2;
  const nameWidth = tableWidth - 10 - 31 - 15 - 31;
  let startY = pillsBottomY + 5;

  Array.from(recordsByDate.entries()).forEach(([date, dateRecords], index) => {
    const sortedDateRecords = [...dateRecords].sort((first, second) =>
      first.student_name.localeCompare(second.student_name, "id"),
    );
    if (index > 0) startY = getLastTableY(doc, startY) + 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(6, 95, 70);
    doc.text(
      `Tanggal: ${date === "-" ? "Tidak tersedia" : formatDisplayDate(date)}`,
      mx,
      startY,
    );

    autoTable(doc, {
      head: [["No", "Nama Siswa", "NIS", "JK", "Kehadiran"]],
      body: sortedDateRecords.map((record, recordIndex) => [
        String(recordIndex + 1),
        record.student_name,
        record.nis,
        formatGender(record.gender),
        record.status
          ? record.status.charAt(0).toUpperCase() +
            record.status.slice(1).toLowerCase()
          : "-",
      ]),
      startY: startY + 3,
      margin: { left: mx, right: mx },
      tableWidth: "auto",
      ...REPORT_TABLE_STYLE,
      styles: {
        ...REPORT_TABLE_STYLE.styles,
        fontSize: 8,
        cellPadding: { horizontal: 2.5, vertical: 2.8 },
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
        1: { cellWidth: nameWidth },
        2: { cellWidth: 31, halign: "center" },
        3: { cellWidth: 15, halign: "center" },
        4: { cellWidth: 31, halign: "center" },
      },
    });
  });

  drawReportPdfFooter(
    doc,
    `Laporan Absensi Kelas - ${homeroom.class_name} - CITRA NEGARA ATTENDANCE SYSTEM`,
  );
  doc.save(
    `Laporan-Walas-Absensi-Per-Tanggal-${homeroom.class_name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`,
  );
}

async function generateCumulativeWalasAbsensiPdf(
  rows: CumulativeRow[],
  homeroom: StaffHomeroomContext,
  periodeLabel: string,
  sortLabel: string,
  columns: CumulativeColumns,
  reportTypeLabel = "Rekap akumulatif",
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan Walas Rekap Absensi");
  const mx = REPORT_PDF_MARGIN_X;
  const { metaY } = await drawReportPdfHeader(doc, {
    title: "REKAP ABSENSI KELAS",
    subtitle: "Laporan Akumulatif Wali Kelas",
  });
  const pills = [
    `Tipe: ${reportTypeLabel}`,
    `Kelas: ${homeroom.class_name}`,
    `Periode: ${periodeLabel}`,
    `Total: ${rows.length} siswa`,
    `Urutan: ${sortLabel}`,
  ];
  const pillsBottomY = drawReportPdfPills(doc, pills, metaY);

  const head: string[][] = [["No", "Nama Siswa"]];
  if (columns.nis) head[0].push("NIS");
  head[0].push("H", "I", "S", "A", "Kehadiran");

  const totals = rows.reduce(
    (acc, row) => ({
      h: acc.h + row.h,
      i: acc.i + row.i,
      s: acc.s + row.s,
      a: acc.a + row.a,
    }),
    { h: 0, i: 0, s: 0, a: 0 },
  );

  const body: ReportTableCell[][] = rows.map((row, index) => {
    const cells: ReportTableCell[] = [String(index + 1), row.student_name];
    if (columns.nis) cells.push(row.nis);
    cells.push(
      { content: String(row.h), styles: { halign: "center" } },
      { content: String(row.i), styles: { halign: "center" } },
      { content: String(row.s), styles: { halign: "center" } },
      { content: String(row.a), styles: { halign: "center" } },
      {
        content: `${row.attendance_percentage}%`,
        styles: { halign: "center" },
      },
    );
    return cells;
  });
  const totalByHeader: Record<string, number> = {
    H: totals.h,
    I: totals.i,
    S: totals.s,
    A: totals.a,
  };
  body.push(
    head[0].map((header, index) => ({
      content:
        index === 1
          ? "Total"
          : totalByHeader[header] !== undefined
            ? String(totalByHeader[header])
            : header === "Kehadiran"
              ? `${rows.length > 0 ? Math.round(rows.reduce((sum, row) => sum + row.attendance_percentage, 0) / rows.length) : 0}%`
              : "",
      styles: {
        fillColor: [236, 253, 245],
        fontStyle: "bold",
        halign: "center",
        textColor: [6, 78, 59],
      },
    })),
  );

  autoTable(doc, {
    head,
    body,
    startY: pillsBottomY + 3,
    margin: { left: mx, right: mx },
    tableWidth: "auto",
    ...REPORT_TABLE_STYLE,
    styles: {
      ...REPORT_TABLE_STYLE.styles,
      fontSize: 8,
      cellPadding: { horizontal: 2.5, vertical: 3 },
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
      1: {
        cellWidth: columns.nis ? 57 : 90,
      },
      ...(columns.nis ? { 2: { cellWidth: 25, halign: "center" } } : {}),
      [columns.nis ? 3 : 2]: {
        cellWidth: columns.nis ? 14 : 12,
        halign: "center",
      },
      [columns.nis ? 4 : 3]: {
        cellWidth: columns.nis ? 14 : 12,
        halign: "center",
      },
      [columns.nis ? 5 : 4]: {
        cellWidth: columns.nis ? 14 : 12,
        halign: "center",
      },
      [columns.nis ? 6 : 5]: {
        cellWidth: columns.nis ? 14 : 12,
        halign: "center",
      },
      [columns.nis ? 7 : 6]: {
        cellWidth: 34,
        halign: "center",
      },
    },
  });

  drawReportPdfFooter(
    doc,
    `Rekap Absensi Kelas - ${homeroom.class_name} - CITRA NEGARA ATTENDANCE SYSTEM`,
  );
  doc.save(
    `Laporan-Walas-Rekap-Absensi-${homeroom.class_name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`,
  );
}

async function generateDailyWalasAbsensiExcel(
  records: StaffAttendanceRecord[],
  homeroom: StaffHomeroomContext,
  periodeLabel: string,
  statusLabel: string,
  sortLabel: string,
  columns: Columns,
) {
  await exportStyledExcelReport({
    filename: `Laporan-Walas-Absensi-${homeroom.class_name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}`,
    title: "LAPORAN ABSENSI KELAS",
    subtitle: "Sekolah Citra Negara - Laporan Periodik Wali Kelas",
    metadata: [
      { label: "Kelas", value: homeroom.class_name },
      { label: "Tahun ajaran", value: homeroom.school_year_name },
      { label: "Periode", value: periodeLabel },
      { label: "Status", value: statusLabel },
      { label: "Urutan", value: sortLabel },
    ],
    rows: records,
    dataSheetName: "Detail Harian",
    columns: [
      {
        header: "No",
        value: (_record, index) => index + 1,
        width: 7,
        kind: "number",
      },
      {
        header: "Nama Siswa",
        value: (record) => record.student_name,
        width: 28,
      },
      {
        header: "Tanggal",
        value: (record) =>
          record.attendance_date
            ? new Date(`${record.attendance_date}T00:00:00`)
            : null,
        width: 16,
        kind: "date",
      },
      ...(columns.nis
        ? [
            {
              header: "NIS",
              value: (record: StaffAttendanceRecord) => record.nis,
              width: 17,
            },
          ]
        : []),
      ...(columns.status
        ? [
            {
              header: "Status",
              value: (record: StaffAttendanceRecord) => record.status,
              width: 15,
              kind: "status" as const,
            },
          ]
        : []),
      ...(columns.checkin
        ? [
            {
              header: "Absen Masuk",
              value: (record: StaffAttendanceRecord) =>
                record.check_in_at ? new Date(record.check_in_at) : null,
              width: 20,
              kind: "date" as const,
              numberFormat: "hh:mm",
            },
          ]
        : []),
    ],
  });
}

async function generateCumulativeWalasAbsensiExcel(
  rows: CumulativeRow[],
  homeroom: StaffHomeroomContext,
  periodeLabel: string,
  sortLabel: string,
  columns: CumulativeColumns,
  reportTypeLabel = "Rekap akumulatif",
) {
  await exportStyledExcelReport({
    filename: `Laporan-Walas-Rekap-Absensi-${homeroom.class_name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}`,
    title: "REKAP ABSENSI KELAS",
    subtitle: `Sekolah Citra Negara - ${reportTypeLabel} Wali Kelas`,
    metadata: [
      { label: "Kelas", value: homeroom.class_name },
      { label: "Tahun ajaran", value: homeroom.school_year_name },
      { label: "Periode", value: periodeLabel },
      { label: "Urutan", value: sortLabel },
    ],
    rows,
    dataSheetName: "Rekap Siswa",
    showColumnFilters: false,
    columns: [
      {
        header: "No",
        value: (_row, index) => index + 1,
        width: 7,
        kind: "number",
      },
      { header: "Nama Siswa", value: (row) => row.student_name, width: 28 },
      ...(columns.nis
        ? [{ header: "NIS", value: (row: CumulativeRow) => row.nis, width: 17 }]
        : []),
      { header: "H", value: (row) => row.h, width: 9, kind: "attendance" },
      { header: "I", value: (row) => row.i, width: 9, kind: "attendance" },
      { header: "S", value: (row) => row.s, width: 9, kind: "attendance" },
      { header: "A", value: (row) => row.a, width: 9, kind: "attendance" },
      {
        header: "Persentase Kehadiran",
        value: (row) => {
          const total = row.h + row.i + row.s + row.a;
          return total > 0 ? row.h / total : 0;
        },
        width: 22,
        kind: "number",
        numberFormat: "0%",
      },
    ],
  });
}

function buildCumulativeRows(records: StaffAttendanceRecord[]) {
  const rowsByStudent = new Map<string, CumulativeRow>();

  records.forEach((record) => {
    const row = rowsByStudent.get(record.student_id) ?? {
      student_id: record.student_id,
      student_name: record.student_name,
      nis: record.nis,
      h: 0,
      i: 0,
      s: 0,
      a: 0,
      attendance_percentage: 0,
    };

    switch (record.status?.toLowerCase()) {
      case "hadir":
        row.h += 1;
        break;
      case "izin":
        row.i += 1;
        break;
      case "sakit":
        row.s += 1;
        break;
      case "alfa":
        row.a += 1;
        break;
    }
    const total = row.h + row.i + row.s + row.a;
    row.attendance_percentage =
      total > 0 ? Math.round((row.h / total) * 100) : 0;
    rowsByStudent.set(record.student_id, row);
  });

  return Array.from(rowsByStudent.values());
}

function getDailySortOptions(columns: Columns): SortOption[] {
  return [
    { value: "name", label: "Nama (A-Z)" },
    ...(columns.nis ? [{ value: "nis" as const, label: "NIS" }] : []),
    ...(columns.status ? [{ value: "status" as const, label: "Status" }] : []),
    ...(columns.checkin
      ? [{ value: "checkin" as const, label: "Waktu Absen Masuk" }]
      : []),
  ];
}

function getCumulativeSortOptions(columns: CumulativeColumns): SortOption[] {
  return [
    { value: "name", label: "Nama (A-Z)" },
    ...(columns.nis ? [{ value: "nis" as const, label: "NIS" }] : []),
    { value: "h", label: "Hadir terbanyak" },
    { value: "i", label: "Izin terbanyak" },
    { value: "s", label: "Sakit terbanyak" },
    { value: "a", label: "Alfa terbanyak" },
  ];
}

function getSortLabel(sortBy: SortBy | null) {
  if (sortBy === "name") return "Nama (A-Z)";
  if (sortBy === "nis") return "NIS";
  if (sortBy === "status") return "Status";
  if (sortBy === "checkin") return "Waktu Absen Masuk";
  if (sortBy === "h") return "Hadir terbanyak";
  if (sortBy === "i") return "Izin terbanyak";
  if (sortBy === "s") return "Sakit terbanyak";
  if (sortBy === "a") return "Alfa terbanyak";
  return "-";
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeroom: StaffHomeroomContext;
};

export function WalasAbsensiReportModal({
  open,
  onOpenChange,
  homeroom,
}: Props) {
  const [format, setFormat] = useState<ReportFormat | null>(null);
  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [dateMode, setDateMode] = useState<DateMode | null>(null);
  const [specificDate, setSpecificDate] = useState("");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [specificDateOpen, setSpecificDateOpen] = useState(false);
  const [rangeFromOpen, setRangeFromOpen] = useState(false);
  const [rangeToOpen, setRangeToOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter | null>(null);
  const [columns, setColumns] = useState<Columns>({
    nis: true,
    status: true,
    checkin: false,
  });
  const [cumulativeColumns, setCumulativeColumns] = useState<CumulativeColumns>(
    { nis: true },
  );
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [generating, setGenerating] = useState(false);

  const rangeValid = !rangeFrom || !rangeTo || rangeFrom <= rangeTo;
  const typeAnswered = reportType !== null;
  const periodAnswered =
    reportType === "all" ||
    (reportType === "daily" &&
      (dateMode === "today" ||
        (dateMode === "specific" && specificDate !== ""))) ||
    (reportType === "cumulative" &&
      dateMode === "range" &&
      rangeFrom !== "" &&
      rangeTo !== "" &&
      rangeValid);

  const showPeriod = typeAnswered;
  const showStatus = periodAnswered && reportType === "daily";
  const showColumns =
    periodAnswered &&
    (reportType === "cumulative" ||
      reportType === "all" ||
      statusFilter !== null);
  const canDownload = format !== null && showColumns && sortBy !== null;
  const sortOptions = useMemo(
    () =>
      reportType === "cumulative" || reportType === "all"
        ? getCumulativeSortOptions(cumulativeColumns)
        : getDailySortOptions(columns),
    [columns, cumulativeColumns, reportType],
  );

  useEffect(() => {
    if (sortBy && !sortOptions.some((option) => option.value === sortBy)) {
      setSortBy(null);
    }
  }, [sortBy, sortOptions]);

  function resetState() {
    setFormat(null);
    setReportType(null);
    setDateMode(null);
    setSpecificDate("");
    setRangeFrom("");
    setRangeTo("");
    setStatusFilter(null);
    setColumns({ nis: true, status: true, checkin: false });
    setCumulativeColumns({ nis: true });
    setSortBy(null);
  }

  function handleClose(isOpen: boolean) {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  }

  async function handleDownload() {
    if (!canDownload) return;
    setGenerating(true);
    try {
      const dateParam =
        dateMode === "today"
          ? todayStr()
          : dateMode === "specific"
            ? specificDate
            : "";
      const isFullPeriod = reportType === "all";
      const overview = await getTeacherHomeroomAttendanceOverview(
        isFullPeriod || dateMode === "range"
          ? {
              date_from: isFullPeriod ? AVAILABLE_DATA_START_DATE : rangeFrom,
              date_to: isFullPeriod ? todayStr() : rangeTo,
            }
          : { date: dateParam },
      );
      const rawRecords = overview.records ?? [];
      const firstAvailableDate = rawRecords.reduce((earliest, record) => {
        const date = record.attendance_date?.trim();
        if (!date) return earliest;
        return !earliest || date < earliest ? date : earliest;
      }, "");
      const lastAvailableDate = rawRecords.reduce((latest, record) => {
        const date = record.attendance_date?.trim();
        if (!date) return latest;
        return !latest || date > latest ? date : latest;
      }, "");
      const effectivePeriodEnd =
        lastAvailableDate || (isFullPeriod ? todayStr() : rangeTo);

      const periodeLabel =
        dateMode === "today"
          ? `Hari ini (${todayDisplay()})`
          : dateMode === "specific"
            ? formatDisplayDate(specificDate)
              : `${formatDisplayDate(
                  firstAvailableDate ||
                    (isFullPeriod ? AVAILABLE_DATA_START_DATE : rangeFrom),
                )} - ${formatDisplayDate(effectivePeriodEnd)}`;

      if (reportType === "cumulative" || reportType === "all") {
        if (reportType === "cumulative" && dateMode === "range" && format === "pdf") {
          if (rawRecords.length === 0) {
            toast.warning("Tidak ada data absensi yang sesuai filter.");
            return;
          }
          await generateRangeWalasAbsensiPdf(
            rawRecords,
            homeroom,
            periodeLabel,
          );
          return;
        }
        const cumulativeRows = buildCumulativeRows(rawRecords);
        if (cumulativeRows.length === 0) {
          toast.warning("Tidak ada data absensi yang sesuai filter.");
          return;
        }

        const sortedRows = [...cumulativeRows].sort((first, second) => {
          if (sortBy === "name")
            return first.student_name.localeCompare(second.student_name, "id");
          if (sortBy === "nis")
            return first.nis.localeCompare(second.nis, "id");
          if (sortBy === "h") return second.h - first.h;
          if (sortBy === "i") return second.i - first.i;
          if (sortBy === "s") return second.s - first.s;
          if (sortBy === "a") return second.a - first.a;
          return 0;
        });

        if (format === "excel") {
          await generateCumulativeWalasAbsensiExcel(
            sortedRows,
            homeroom,
            periodeLabel,
            getSortLabel(sortBy),
            cumulativeColumns,
            reportType === "all" ? "Sepanjang periode" : "Rekap akumulatif",
          );
        } else {
          await generateCumulativeWalasAbsensiPdf(
            sortedRows,
            homeroom,
            periodeLabel,
            getSortLabel(sortBy),
            cumulativeColumns,
            reportType === "all" ? "Sepanjang periode" : "Rekap akumulatif",
          );
        }
        return;
      }

      let records = rawRecords;
      if (statusFilter && statusFilter !== "Semua") {
        records = records.filter(
          (record) => record.status?.toLowerCase() === statusFilter,
        );
      }

      if (records.length === 0) {
        toast.warning("Tidak ada data absensi yang sesuai filter.");
        return;
      }

      const sorted = [...records].sort((first, second) => {
        if (sortBy === "name")
          return first.student_name.localeCompare(second.student_name, "id");
        if (sortBy === "nis") return first.nis.localeCompare(second.nis, "id");
        if (sortBy === "status")
          return (first.status ?? "").localeCompare(second.status ?? "", "id");
        if (sortBy === "checkin")
          return (first.check_in_at ?? "").localeCompare(
            second.check_in_at ?? "",
            "id",
          );
        return 0;
      });

      const statusLabel = statusFilter
        ? STATUS_LABELS[statusFilter]
        : "Semua Status";
      if (format === "excel") {
        await generateDailyWalasAbsensiExcel(
          sorted,
          homeroom,
          periodeLabel,
          statusLabel,
          getSortLabel(sortBy),
          columns,
        );
      } else {
        await generateDailyWalasAbsensiPdf(
          sorted,
          homeroom,
          periodeLabel,
          statusLabel,
          getSortLabel(sortBy),
          columns,
        );
      }
    } catch {
      toast.error(
        `Gagal membuat ${format === "excel" ? "Excel" : "PDF"}. Silakan coba lagi.`,
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <PremiumModal
      open={open}
      onOpenChange={handleClose}
      title="Export Laporan Absensi Kelas"
      description="Pilih PDF siap cetak atau Excel bergaya, lalu tentukan tipe dan periode laporan."
      icon={Printer}
      className="walas-modal-surface sm:!max-w-[660px]"
      footer={
        <ReportModalFooter
          canDownload={canDownload}
          generating={generating}
          onCancel={() => handleClose(false)}
          onDownload={handleDownload}
          format={format}
          generatingLabel={`Membuat ${format === "excel" ? "Excel" : "PDF"}...`}
          downloadLabel={
            format
              ? `Unduh ${format === "excel" ? "Excel" : "PDF"}`
              : "Pilih format laporan"
          }
        />
      }
    >
      <div className="space-y-4">
        <ReportFormatQuestion value={format} onChange={setFormat} />
        <QuestionBlock
          icon={Printer}
          label="Pilih tipe laporan"
          answered={typeAnswered}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <ReportRadio
              selected={reportType === "daily"}
              label="Periodik per hari"
              badge="Per tanggal"
              onClick={() => {
                setReportType("daily");
                setDateMode(null);
                setSpecificDate("");
                setRangeFrom("");
                setRangeTo("");
                setStatusFilter(null);
                setSortBy(null);
              }}
            />
            <ReportRadio
              selected={reportType === "cumulative"}
              label="Rekap akumulatif"
              badge="Total periode"
              onClick={() => {
                setReportType("cumulative");
                setDateMode("range");
                setSpecificDate("");
                setRangeFrom("");
                setRangeTo("");
                setStatusFilter(null);
                setSortBy(null);
              }}
            />
            <ReportRadio
              selected={reportType === "all"}
              label="Sepanjang periode"
              badge="Ringkasan lengkap"
              onClick={() => {
                setReportType("all");
                setDateMode(null);
                setSpecificDate("");
                setRangeFrom("");
                setRangeTo("");
                setStatusFilter(null);
                setSortBy(null);
              }}
            />
          </div>
        </QuestionBlock>

        <AnimatePresence>
          {showPeriod && (
            <motion.div
              key="period"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
            >
              <QuestionBlock
                icon={CalendarClock}
                label={
                  reportType === "cumulative"
                    ? "Pilih rentang tanggal"
                    : "Pilih periode absensi"
                }
                answered={periodAnswered}
              >
                {reportType === "all" ? (
                  <p className="rounded-[0.9rem] border border-emerald-200/80 bg-emerald-50/70 px-4 py-3 text-sm leading-5 text-emerald-900">
                    Seluruh data tahun ajaran dirangkum dalam satu tabel dengan
                    persentase kehadiran dan rincian HISA.
                  </p>
                ) : reportType === "cumulative" ? null : (
          <div className="grid gap-2 sm:grid-cols-2">
                    <ReportRadio
                      selected={dateMode === "today"}
                      label="Hari ini"
                      badge={todayDisplay()}
                      onClick={() => {
                        setDateMode("today");
                        setStatusFilter(null);
                        setSortBy(null);
                      }}
                    />
                    <ReportRadio
                      selected={dateMode === "specific"}
                      label="Tanggal tertentu"
                      onClick={() => {
                        setDateMode("specific");
                        setSpecificDate("");
                        setStatusFilter(null);
                        setSortBy(null);
                      }}
                    />
                  </div>
                )}

                <AnimatePresence>
                  {reportType !== "all" && dateMode === "specific" && (
                    <motion.div
                      key="specific"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3">
                        <Popover
                          open={specificDateOpen}
                          onOpenChange={setSpecificDateOpen}
                        >
                          <PopoverTrigger
                            render={<Button type="button" variant="outline" />}
                            className="h-11 w-full justify-start rounded-[16px] border-slate-300/80 bg-white px-4 text-left text-slate-700"
                          >
                            <CalendarClock className="mr-2 size-4 text-emerald-600" />
                            {specificDate
                              ? formatDisplayDate(specificDate)
                              : "Pilih tanggal"}
                          </PopoverTrigger>
                          <PopoverContent
                            sideOffset={8}
                            className="w-auto rounded-[22px] border border-emerald-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] p-4 shadow-[0_24px_54px_rgba(15,23,42,0.12)]"
                          >
                            <PopoverHeader className="px-2 pt-1 pb-2">
                              <PopoverTitle className="text-sm font-semibold text-slate-900">
                                Pilih tanggal absensi
                              </PopoverTitle>
                            </PopoverHeader>
                            <Calendar
                              mode="single"
                              selected={parseDateValue(specificDate)}
                              onSelect={(date) => {
                                setSpecificDate(
                                  date ? toDateInputValue(date) : "",
                                );
                                setStatusFilter(null);
                                setSortBy(null);
                                setSpecificDateOpen(false);
                              }}
                              locale={localeID}
                              buttonVariant="ghost"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {reportType === "cumulative" && dateMode === "range" && (
                    <motion.div
                      key="range"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <p className="mb-1.5 text-[0.74rem] font-semibold uppercase tracking-wide text-slate-500">
                            Mulai
                          </p>
                          <Popover
                            open={rangeFromOpen}
                            onOpenChange={setRangeFromOpen}
                          >
                            <PopoverTrigger
                              render={
                                <Button type="button" variant="outline" />
                              }
                              className="h-11 w-full justify-start rounded-[16px] border-slate-300/80 bg-white px-3 text-left text-sm text-slate-700"
                            >
                              <CalendarClock className="mr-1.5 size-3.5 shrink-0 text-emerald-600" />
                              <span className="truncate">
                                {rangeFrom
                                  ? formatDisplayDate(rangeFrom)
                                  : "Pilih tanggal"}
                              </span>
                            </PopoverTrigger>
                            <PopoverContent
                              sideOffset={8}
                              className="w-auto rounded-[22px] border border-emerald-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] p-4 shadow-[0_24px_54px_rgba(15,23,42,0.12)]"
                            >
                              <PopoverHeader className="px-2 pt-1 pb-2">
                                <PopoverTitle className="text-sm font-semibold text-slate-900">
                                  Tanggal mulai
                                </PopoverTitle>
                              </PopoverHeader>
                              <Calendar
                                mode="single"
                                selected={parseDateValue(rangeFrom)}
                                onSelect={(date) => {
                                  setRangeFrom(
                                    date ? toDateInputValue(date) : "",
                                  );
                                  setStatusFilter(null);
                                  setSortBy(null);
                                  setRangeFromOpen(false);
                                }}
                                locale={localeID}
                                buttonVariant="ghost"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <p className="mb-1.5 text-[0.74rem] font-semibold uppercase tracking-wide text-slate-500">
                            Sampai
                          </p>
                          <Popover
                            open={rangeToOpen}
                            onOpenChange={setRangeToOpen}
                          >
                            <PopoverTrigger
                              render={
                                <Button type="button" variant="outline" />
                              }
                              className="h-11 w-full justify-start rounded-[16px] border-slate-300/80 bg-white px-3 text-left text-sm text-slate-700"
                            >
                              <CalendarClock className="mr-1.5 size-3.5 shrink-0 text-emerald-600" />
                              <span className="truncate">
                                {rangeTo
                                  ? formatDisplayDate(rangeTo)
                                  : "Pilih tanggal"}
                              </span>
                            </PopoverTrigger>
                            <PopoverContent
                              sideOffset={8}
                              className="w-auto rounded-[22px] border border-emerald-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] p-4 shadow-[0_24px_54px_rgba(15,23,42,0.12)]"
                            >
                              <PopoverHeader className="px-2 pt-1 pb-2">
                                <PopoverTitle className="text-sm font-semibold text-slate-900">
                                  Tanggal akhir
                                </PopoverTitle>
                              </PopoverHeader>
                              <Calendar
                                mode="single"
                                selected={parseDateValue(rangeTo)}
                                onSelect={(date) => {
                                  setRangeTo(
                                    date ? toDateInputValue(date) : "",
                                  );
                                  setStatusFilter(null);
                                  setSortBy(null);
                                  setRangeToOpen(false);
                                }}
                                locale={localeID}
                                buttonVariant="ghost"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      {rangeFrom && rangeTo && !rangeValid && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-2 flex items-center gap-1.5 text-[0.8rem] font-medium text-rose-600"
                        >
                          <span className="inline-flex size-4 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold">
                            !
                          </span>
                          Tanggal mulai tidak boleh lebih dari tanggal akhir.
                        </motion.p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showStatus && (
            <motion.div
              key="q2"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
            >
              <QuestionBlock
                icon={Activity}
                label="Filter berdasarkan status kehadiran"
                answered={statusFilter !== null}
              >
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      "Semua",
                      "hadir",
                      "izin",
                      "sakit",
                      "alfa",
                    ] as StatusFilter[]
                  ).map((status) => (
                    <ReportRadio
                      key={status}
                      selected={statusFilter === status}
                      label={STATUS_LABELS[status]}
                      onClick={() => {
                        setStatusFilter(status);
                        setSortBy(null);
                      }}
                    />
                  ))}
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showColumns && (
            <motion.div
              key="q3"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
            >
              <QuestionBlock
                icon={ListChecks}
                label="Kolom yang ingin ditampilkan"
                answered
              >
                <div className="grid grid-cols-1 gap-2 min-[520px]:grid-cols-2">
                  {reportType === "cumulative" || reportType === "all" ? (
                    <>
                      <ReportCheckbox
                        checked
                        disabled
                        label="Nama Siswa"
                        badge="wajib"
                      />
                      <ReportCheckbox
                        checked={cumulativeColumns.nis}
                        onChange={(value) =>
                          setCumulativeColumns((current) => ({
                            ...current,
                            nis: value,
                          }))
                        }
                        label="NIS"
                      />
                      <ReportCheckbox
                        checked
                        disabled
                        label="Rekap H I S A"
                        badge="wajib"
                      />
                    </>
                  ) : (
                    <>
                      <ReportCheckbox
                        checked
                        disabled
                        label="Nama & Tanggal"
                        badge="wajib"
                      />
                      <ReportCheckbox
                        checked={columns.nis}
                        onChange={(value) =>
                          setColumns((current) => ({ ...current, nis: value }))
                        }
                        label="NIS"
                      />
                      <ReportCheckbox
                        checked={columns.status}
                        onChange={(value) =>
                          setColumns((current) => ({
                            ...current,
                            status: value,
                          }))
                        }
                        label="Status"
                      />
                      <ReportCheckbox
                        checked={columns.checkin}
                        onChange={(value) =>
                          setColumns((current) => ({
                            ...current,
                            checkin: value,
                          }))
                        }
                        label="Waktu Absen Masuk"
                      />
                    </>
                  )}
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showColumns && (
            <motion.div
              key="q4"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: "easeOut", delay: 0.08 }}
            >
              <QuestionBlock
                icon={ArrowUpDown}
                label="Urutkan data berdasarkan"
                answered={sortBy !== null}
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  {sortOptions.map((option) => (
                    <ReportRadio
                      key={option.value}
                      selected={sortBy === option.value}
                      label={option.label}
                      onClick={() => setSortBy(option.value)}
                    />
                  ))}
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </PremiumModal>
  );
}
