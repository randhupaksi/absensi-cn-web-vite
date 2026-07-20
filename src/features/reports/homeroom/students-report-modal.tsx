"use client";

import { AnimatePresence, motion } from "motion/react";
import { PremiumModal } from "@/components/modals/premium-modal";
import { ReportModalFooter } from "@/features/reports/shared/report-modal-footer";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { applyPdfCreditMetadata } from "@/lib/reports/pdf-metadata";
import {
  drawReportPdfFooter,
  drawReportPdfHeader,
  drawReportPdfPills,
  REPORT_PDF_MARGIN_X,
  REPORT_TABLE_STYLE,
} from "@/lib/reports/pdf-report-kit";
import { QuestionBlock, ReportCheckbox, ReportFormatQuestion, ReportRadio, type ReportFormat } from "@/features/reports/shared/report-question-ui";
import { exportStyledExcelReport } from "@/lib/reports/excel-report-kit";
import { getTeacherHomeroomAttendanceOverview, getTeacherHomeroomStudents } from "@/services/staff.service";
import type { StaffAttendanceRecord, StaffHomeroomContext, StaffStudentSummary } from "@/types/staff";
import { ArrowUpDown, CalendarClock, ListChecks, Printer, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { id as localeID } from "date-fns/locale";
import { toast } from "sonner";

type ConditionFilter = "Semua" | "aktif" | "perlu_perhatian" | "stabil";
type ReportType = "daily" | "cumulative";
type DateMode = "today" | "specific" | "range";
type CumulativeSortBy = "name" | "nis" | "alpha";
type DailySortBy = "name" | "nis" | "status" | "checkin";
type SortBy = CumulativeSortBy | DailySortBy;
type CumulativeColumns = {
  nis: boolean;
  gender: boolean;
  identitas: boolean;
  hadir: boolean;
  alfa: boolean;
  izin: boolean;
  sakit: boolean;
  status: boolean;
};
type DailyColumns = {
  nis: boolean;
  gender: boolean;
  nisn: boolean;
  status: boolean;
  checkin: boolean;
};
type DailyStudentRecord = StaffAttendanceRecord & Pick<StaffStudentSummary, "gender" | "nisn" | "is_active">;

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateValue(value: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDisplayDate(value: string) {
  const date = parseDateValue(value);
  return date ? date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "";
}

const todayStr = () => toDateInputValue(new Date());
const todayDisplay = () => formatDisplayDate(todayStr());

const CONDITION_LABELS: Record<ConditionFilter, string> = {
  Semua: "Semua Siswa",
  aktif: "Aktif Saja",
  perlu_perhatian: "Perlu Perhatian",
  stabil: "Stabil",
};

async function generateWalasSiswaPdf(
  data: StaffStudentSummary[],
  homeroom: StaffHomeroomContext,
  periodLabel: string,
  conditionLabel: string,
  sortLabel: string,
  columns: CumulativeColumns,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan Walas Siswa");
  const mx = REPORT_PDF_MARGIN_X;
  const { metaY } = drawReportPdfHeader(doc, {
    title: "LAPORAN SISWA KELAS",
    subtitle: "Laporan Wali Kelas",
  });
  const pills = [
    `Kelas: ${homeroom.class_name}`,
    `T.A.: ${homeroom.school_year_name}`,
    `Periode: ${periodLabel}`,
    `Filter: ${conditionLabel}`,
    `Total: ${data.length} siswa`,
    `Urutan: ${sortLabel}`,
  ];
  drawReportPdfPills(doc, pills, metaY);

  // Table
  const head: string[][] = [["No", "Nama Siswa"]];
  if (columns.nis) head[0].push("NIS / NISN");
  if (columns.gender) head[0].push("Gender");
  if (columns.identitas) head[0].push("Telepon");
  if (columns.hadir) head[0].push("Hadir");
  if (columns.izin) head[0].push("Izin");
  if (columns.sakit) head[0].push("Sakit");
  if (columns.alfa) head[0].push("Alfa");
  if (columns.status) head[0].push("Status");

  const body = data.map((s, i) => {
    const row: string[] = [String(i + 1), s.name];
    if (columns.nis) row.push(`${s.nis}\n${s.nisn ?? "—"}`);
    if (columns.gender) {
      const g = (s.gender ?? "").toUpperCase();
      row.push(g === "MALE" ? "Laki-laki" : g === "FEMALE" ? "Perempuan" : "—");
    }
    if (columns.identitas) row.push(s.nisn || "—");
    if (columns.hadir) row.push(String(s.present_count));
    if (columns.izin) row.push(String(s.permission_count));
    if (columns.sakit) row.push(String(s.sick_count));
    if (columns.alfa) row.push(String(s.alpha_count));
    if (columns.status) row.push(s.is_active ? "Aktif" : "Nonaktif");
    return row;
  });

  const hasCountColumns = columns.hadir || columns.alfa || columns.izin || columns.sakit;
  if (hasCountColumns) {
    const totals = {
      Hadir: data.reduce((sum, student) => sum + student.present_count, 0),
      Alfa: data.reduce((sum, student) => sum + student.alpha_count, 0),
      Izin: data.reduce((sum, student) => sum + student.permission_count, 0),
      Sakit: data.reduce((sum, student) => sum + student.sick_count, 0),
    };
    body.push(head[0].map((header, index) => {
      if (index === 1) return "Total";
      return String(totals[header as keyof typeof totals] ?? "");
    }));
  }

  autoTable(doc, {
    head,
    body,
    startY: metaY + 8,
    margin: { left: mx, right: mx },
    ...REPORT_TABLE_STYLE,
    didParseCell: (hook) => {
      if (hasCountColumns && hook.section === "body" && hook.row.index === body.length - 1) {
        hook.cell.styles.fillColor = [236, 253, 245];
        hook.cell.styles.textColor = [6, 78, 59];
        hook.cell.styles.fontStyle = "bold";
        hook.cell.styles.halign = "center";
      }
    },
  });

  drawReportPdfFooter(doc, `Laporan Siswa Kelas — ${homeroom.class_name} — ABSENSI CN`);

  doc.save(`Laporan-Walas-Siswa-${homeroom.class_name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

async function generateWalasSiswaExcel(
  data: StaffStudentSummary[],
  homeroom: StaffHomeroomContext,
  periodLabel: string,
  conditionLabel: string,
  sortLabel: string,
  columns: CumulativeColumns,
) {
  await exportStyledExcelReport({
    filename: `Laporan-Walas-Siswa-${homeroom.class_name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}`,
    title: "LAPORAN SISWA KELAS",
    subtitle: "Sekolah Citra Negara - Laporan Wali Kelas",
    metadata: [
      { label: "Kelas", value: homeroom.class_name },
      { label: "Tahun ajaran", value: homeroom.school_year_name },
      { label: "Periode", value: periodLabel },
      { label: "Filter", value: conditionLabel },
      { label: "Urutan", value: sortLabel },
    ],
    rows: data,
    dataSheetName: "Rekap Siswa",
    showColumnFilters: false,
    columns: [
      { header: "No", value: (_student, index) => index + 1, width: 7, kind: "number" },
      { header: "Nama Siswa", value: (student) => student.name, width: 28 },
      ...(columns.nis ? [
        { header: "NIS", value: (student: StaffStudentSummary) => student.nis, width: 17 },
        { header: "NISN", value: (student: StaffStudentSummary) => student.nisn, width: 17 },
      ] : []),
      ...(columns.gender ? [{ header: "Jenis Kelamin", value: (student: StaffStudentSummary) => student.gender === "MALE" ? "Laki-laki" : student.gender === "FEMALE" ? "Perempuan" : "—", width: 18 }] : []),
      ...(columns.identitas ? [{ header: "Identitas", value: (student: StaffStudentSummary) => student.nisn, width: 18 }] : []),
      ...(columns.hadir ? [{ header: "H", value: (student: StaffStudentSummary) => student.present_count, width: 8, kind: "attendance" as const }] : []),
      ...(columns.izin ? [{ header: "I", value: (student: StaffStudentSummary) => student.permission_count, width: 8, kind: "attendance" as const }] : []),
      ...(columns.sakit ? [{ header: "S", value: (student: StaffStudentSummary) => student.sick_count, width: 8, kind: "attendance" as const }] : []),
      ...(columns.alfa ? [{ header: "A", value: (student: StaffStudentSummary) => student.alpha_count, width: 8, kind: "attendance" as const }] : []),
      ...(columns.status ? [{ header: "Status", value: (student: StaffStudentSummary) => student.is_active ? "Aktif" : "Non-aktif", width: 15, kind: "status" as const }] : []),
    ],
  });
}

function formatStatus(status: string) {
  return status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : "â€”";
}

async function generateDailyWalasSiswaPdf(
  data: DailyStudentRecord[],
  homeroom: StaffHomeroomContext,
  periodLabel: string,
  conditionLabel: string,
  sortLabel: string,
  columns: DailyColumns,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan Walas Siswa Harian");
  const mx = REPORT_PDF_MARGIN_X;
  const { metaY } = drawReportPdfHeader(doc, {
    title: "LAPORAN SISWA KELAS",
    subtitle: "Laporan Periodik Wali Kelas",
  });
  drawReportPdfPills(doc, [
    "Tipe: Periodik per hari",
    `Kelas: ${homeroom.class_name}`,
    `Periode: ${periodLabel}`,
    `Filter: ${conditionLabel}`,
    `Total: ${data.length} record`,
    `Urutan: ${sortLabel}`,
  ], metaY);

  const head: string[][] = [["No", "Nama Siswa", "Tanggal"]];
  if (columns.nis) head[0].push("NIS");
  if (columns.gender) head[0].push("Gender");
  if (columns.nisn) head[0].push("NISN");
  if (columns.status) head[0].push("Status");
  if (columns.checkin) head[0].push("Absen Masuk");

  const body = data.map((student, index) => {
    const row: string[] = [
      String(index + 1),
      student.student_name,
      formatDisplayDate(student.attendance_date),
    ];
    if (columns.nis) row.push(student.nis);
    if (columns.gender) {
      const gender = student.gender?.toUpperCase();
      row.push(gender === "MALE" ? "Laki-laki" : gender === "FEMALE" ? "Perempuan" : "â€”");
    }
    if (columns.nisn) row.push(student.nisn ?? "â€”");
    if (columns.status) row.push(formatStatus(student.status));
    if (columns.checkin) {
      row.push(student.check_in_at ? new Date(student.check_in_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "â€”");
    }
    return row;
  });

  autoTable(doc, { head, body, startY: metaY + 8, margin: { left: mx, right: mx }, ...REPORT_TABLE_STYLE });
  drawReportPdfFooter(doc, `Laporan Siswa Kelas â€” ${homeroom.class_name} â€” ABSENSI CN`);
  doc.save(`Laporan-Walas-Siswa-Harian-${homeroom.class_name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

async function generateDailyWalasSiswaExcel(
  data: DailyStudentRecord[],
  homeroom: StaffHomeroomContext,
  periodLabel: string,
  conditionLabel: string,
  sortLabel: string,
  columns: DailyColumns,
) {
  await exportStyledExcelReport({
    filename: `Laporan-Walas-Siswa-Harian-${homeroom.class_name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}`,
    title: "LAPORAN SISWA KELAS",
    subtitle: "Sekolah Citra Negara - Laporan Periodik Wali Kelas",
    metadata: [
      { label: "Kelas", value: homeroom.class_name },
      { label: "Tahun ajaran", value: homeroom.school_year_name },
      { label: "Periode", value: periodLabel },
      { label: "Filter", value: conditionLabel },
      { label: "Urutan", value: sortLabel },
    ],
    rows: data,
    dataSheetName: "Detail Harian",
    columns: [
      { header: "No", value: (_student, index) => index + 1, width: 7, kind: "number" },
      { header: "Nama Siswa", value: (student) => student.student_name, width: 28 },
      { header: "Tanggal", value: (student) => new Date(`${student.attendance_date}T00:00:00`), width: 16, kind: "date" },
      ...(columns.nis ? [{ header: "NIS", value: (student: DailyStudentRecord) => student.nis, width: 17 }] : []),
      ...(columns.gender ? [{ header: "Jenis Kelamin", value: (student: DailyStudentRecord) => student.gender === "MALE" ? "Laki-laki" : student.gender === "FEMALE" ? "Perempuan" : "â€”", width: 18 }] : []),
      ...(columns.nisn ? [{ header: "NISN", value: (student: DailyStudentRecord) => student.nisn, width: 17 }] : []),
      ...(columns.status ? [{ header: "Status", value: (student: DailyStudentRecord) => formatStatus(student.status), width: 15, kind: "status" as const }] : []),
      ...(columns.checkin ? [{ header: "Absen Masuk", value: (student: DailyStudentRecord) => student.check_in_at ? new Date(student.check_in_at) : null, width: 20, kind: "date" as const, numberFormat: "hh:mm" }] : []),
    ],
  });
}

function buildCumulativeStudents(students: StaffStudentSummary[], records: StaffAttendanceRecord[]) {
  const rows = new Map(students.map((student) => [student.id, {
    ...student,
    present_count: 0,
    permission_count: 0,
    sick_count: 0,
    alpha_count: 0,
  }]));

  records.forEach((record) => {
    const student = rows.get(record.student_id);
    if (!student) return;
    switch (record.status.toLowerCase()) {
      case "hadir": student.present_count += 1; break;
      case "izin": student.permission_count += 1; break;
      case "sakit": student.sick_count += 1; break;
      case "alfa": student.alpha_count += 1; break;
    }
  });

  return Array.from(rows.values());
}

function getSortLabel(sortBy: SortBy | null) {
  if (sortBy === "name") return "Nama (Aâ€“Z)";
  if (sortBy === "nis") return "NIS";
  if (sortBy === "alpha") return "Alfa (terbanyak)";
  if (sortBy === "status") return "Status";
  if (sortBy === "checkin") return "Waktu Absen Masuk";
  return "â€”";
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeroom: StaffHomeroomContext;
};

export function WalasSiswaReportModal({ open, onOpenChange, homeroom }: Props) {
  const [format, setFormat] = useState<ReportFormat | null>(null);
  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [dateMode, setDateMode] = useState<DateMode | null>(null);
  const [specificDate, setSpecificDate] = useState("");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [specificDateOpen, setSpecificDateOpen] = useState(false);
  const [rangeFromOpen, setRangeFromOpen] = useState(false);
  const [rangeToOpen, setRangeToOpen] = useState(false);
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter | null>(null);
  const [columns, setColumns] = useState<CumulativeColumns>({ nis: true, gender: false, identitas: false, hadir: true, alfa: true, izin: false, sakit: false, status: false });
  const [dailyColumns, setDailyColumns] = useState<DailyColumns>({ nis: true, gender: false, nisn: false, status: true, checkin: false });
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [generating, setGenerating] = useState(false);

  const rangeValid = !rangeFrom || !rangeTo || rangeFrom <= rangeTo;
  const periodAnswered = dateMode === "today" || (dateMode === "specific" && Boolean(specificDate)) || (dateMode === "range" && Boolean(rangeFrom) && Boolean(rangeTo) && rangeValid);
  const showPeriod = reportType !== null;
  const showFilter = showPeriod && periodAnswered;
  const showColumns = showFilter && conditionFilter !== null;
  const canDownload = format !== null && showColumns && sortBy !== null;
  const sortOptions = useMemo(() => reportType === "daily"
    ? [
      { value: "name" as const, label: "Nama (A-Z)" },
      { value: "nis" as const, label: "NIS" },
      { value: "status" as const, label: "Status absensi" },
      { value: "checkin" as const, label: "Waktu absen masuk" },
    ]
    : [
      { value: "name" as const, label: "Nama (A-Z)" },
      { value: "nis" as const, label: "NIS" },
      { value: "alpha" as const, label: "Alfa (terbanyak)" },
    ], [reportType]);

  useEffect(() => {
    if (sortBy && !sortOptions.some((option) => option.value === sortBy)) setSortBy(null);
  }, [sortBy, sortOptions]);

  function resetState() {
    setFormat(null);
    setReportType(null);
    setDateMode(null);
    setSpecificDate("");
    setRangeFrom("");
    setRangeTo("");
    setSpecificDateOpen(false);
    setRangeFromOpen(false);
    setRangeToOpen(false);
    setConditionFilter(null);
    setColumns({ nis: true, gender: false, identitas: false, hadir: true, alfa: true, izin: false, sakit: false, status: false });
    setDailyColumns({ nis: true, gender: false, nisn: false, status: true, checkin: false });
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
      const selectedDate = dateMode === "today" ? todayStr() : dateMode === "specific" ? specificDate : "";
      const [periodStudents, overview] = await Promise.all([
        getTeacherHomeroomStudents(),
        getTeacherHomeroomAttendanceOverview(dateMode === "range"
          ? { date_from: rangeFrom, date_to: rangeTo }
          : { date: selectedDate }),
      ]);
      const periodLabel = dateMode === "today"
        ? `Hari ini (${todayDisplay()})`
        : dateMode === "specific"
          ? formatDisplayDate(specificDate)
          : `${formatDisplayDate(rangeFrom)} - ${formatDisplayDate(rangeTo)}`;
      const conditionLabel = conditionFilter ? CONDITION_LABELS[conditionFilter] : "Semua Siswa";
      const sortLabel = getSortLabel(sortBy);

      if (reportType === "daily") {
        const studentById = new Map((periodStudents ?? []).map((student) => [student.id, student]));
        let filtered: DailyStudentRecord[] = (overview.records ?? []).map((record) => {
          const student = studentById.get(record.student_id);
          return { ...record, gender: student?.gender, nisn: student?.nisn, is_active: student?.is_active ?? true };
        });

        if (conditionFilter === "aktif") filtered = filtered.filter((student) => student.is_active);
        if (conditionFilter === "perlu_perhatian") filtered = filtered.filter((student) => student.status.toLowerCase() === "alfa");
        if (conditionFilter === "stabil") filtered = filtered.filter((student) => student.status.toLowerCase() !== "alfa");

        if (filtered.length === 0) {
          toast.warning("Tidak ada data absensi yang sesuai periode dan filter.");
          return;
        }

        const sorted = [...filtered].sort((a, b) => {
          if (sortBy === "name") return a.student_name.localeCompare(b.student_name, "id");
          if (sortBy === "nis") return a.nis.localeCompare(b.nis, "id");
          if (sortBy === "status") return a.status.localeCompare(b.status, "id");
          if (sortBy === "checkin") return (a.check_in_at ?? "").localeCompare(b.check_in_at ?? "");
          return 0;
        });

        if (format === "excel") await generateDailyWalasSiswaExcel(sorted, homeroom, periodLabel, conditionLabel, sortLabel, dailyColumns);
        else await generateDailyWalasSiswaPdf(sorted, homeroom, periodLabel, conditionLabel, sortLabel, dailyColumns);
        return;
      }

      let cumulative = buildCumulativeStudents(periodStudents ?? [], overview.records ?? []);
      if (conditionFilter === "aktif") cumulative = cumulative.filter((student) => student.is_active);
      if (conditionFilter === "perlu_perhatian") cumulative = cumulative.filter((student) => student.alpha_count > 0);
      if (conditionFilter === "stabil") cumulative = cumulative.filter((student) => student.alpha_count === 0);

      if (cumulative.length === 0) {
        toast.warning("Tidak ada siswa yang sesuai periode dan filter.");
        return;
      }

      const sortedCumulative = [...cumulative].sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name, "id");
        if (sortBy === "nis") return a.nis.localeCompare(b.nis, "id");
        if (sortBy === "alpha") return b.alpha_count - a.alpha_count;
        return 0;
      });

      if (format === "excel") await generateWalasSiswaExcel(sortedCumulative, homeroom, periodLabel, conditionLabel, sortLabel, columns);
      else await generateWalasSiswaPdf(sortedCumulative, homeroom, periodLabel, conditionLabel, sortLabel, columns);
      return;

      /* Legacy implementation retained temporarily during the transition.
      const students = await getTeacherHomeroomStudents();
      let filtered = students ?? [];

      if (conditionFilter === "aktif") {
        filtered = filtered.filter((s) => s.is_active);
      } else if (conditionFilter === "perlu_perhatian") {
        filtered = filtered.filter((s) => s.alpha_count > 0);
      } else if (conditionFilter === "stabil") {
        filtered = filtered.filter((s) => s.alpha_count === 0);
      }

      if (filtered.length === 0) {
        toast.warning("Tidak ada siswa yang sesuai filter.");
        return;
      }

      const sorted = [...filtered].sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name, "id");
        if (sortBy === "nis") return a.nis.localeCompare(b.nis, "id");
        if (sortBy === "alpha") return b.alpha_count - a.alpha_count;
        return 0;
      });

      const conditionLabel = conditionFilter ? CONDITION_LABELS[conditionFilter] : "Semua Siswa";
      const sortLabel = sortBy === "name" ? "Nama (A–Z)" : sortBy === "nis" ? "NIS" : "Alfa (terbanyak)";

      if (format === "excel") {
        await generateWalasSiswaExcel(sorted, homeroom, conditionLabel, sortLabel, columns);
      } else {
        await generateWalasSiswaPdf(sorted, homeroom, conditionLabel, sortLabel, columns);
      }
      */
    } catch {
      toast.error(`Gagal membuat ${format === "excel" ? "Excel" : "PDF"}. Silakan coba lagi.`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <PremiumModal
      open={open}
      onOpenChange={handleClose}
      title="Export Laporan Siswa Kelas"
      description="Pilih PDF siap cetak atau Excel bergaya untuk rekap wali kelas."
      icon={Printer}
      className="sm:!max-w-[620px]"
    >
      <div className="space-y-4">
        <ReportFormatQuestion value={format} onChange={setFormat} />
        {/* Q1 — Filter kondisi */}
        <QuestionBlock icon={Printer} label="Pilih tipe laporan" answered={reportType !== null}>
          <div className="grid gap-2 sm:grid-cols-2">
            <ReportRadio selected={reportType === "daily"} label="Periodik per hari" badge="Per tanggal" onClick={() => { setReportType("daily"); setDateMode(null); setConditionFilter(null); setSortBy(null); }} />
            <ReportRadio selected={reportType === "cumulative"} label="Rekap akumulatif" badge="Total periode" onClick={() => { setReportType("cumulative"); setDateMode(null); setConditionFilter(null); setSortBy(null); }} />
          </div>
        </QuestionBlock>

        <AnimatePresence>
          {showPeriod && (
            <motion.div key="period" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.26, ease: "easeOut" }}>
              <QuestionBlock icon={CalendarClock} label="Pilih periode absensi" answered={periodAnswered}>
                <div className="grid gap-2 sm:grid-cols-3">
                  <ReportRadio selected={dateMode === "today"} label="Hari ini" badge={todayDisplay()} onClick={() => { setDateMode("today"); setConditionFilter(null); setSortBy(null); }} />
                  <ReportRadio selected={dateMode === "specific"} label="Tanggal tertentu" onClick={() => { setDateMode("specific"); setConditionFilter(null); setSortBy(null); }} />
                  <ReportRadio selected={dateMode === "range"} label="Rentang tanggal" onClick={() => { setDateMode("range"); setConditionFilter(null); setSortBy(null); }} />
                </div>
                {dateMode === "specific" && (
                  <div className="mt-3">
                    <Popover open={specificDateOpen} onOpenChange={setSpecificDateOpen}>
                      <PopoverTrigger render={<Button type="button" variant="outline" />} className="h-10 w-full justify-start"><CalendarClock className="mr-2 size-4 text-emerald-600" />{specificDate ? formatDisplayDate(specificDate) : "Pilih tanggal"}</PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start"><PopoverHeader><PopoverTitle>Pilih tanggal absensi</PopoverTitle></PopoverHeader><Calendar mode="single" selected={parseDateValue(specificDate)} onSelect={(date) => { if (date) { setSpecificDate(toDateInputValue(date)); setConditionFilter(null); setSortBy(null); setSpecificDateOpen(false); } }} locale={localeID} /></PopoverContent>
                    </Popover>
                  </div>
                )}
                {dateMode === "range" && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Popover open={rangeFromOpen} onOpenChange={setRangeFromOpen}>
                      <PopoverTrigger render={<Button type="button" variant="outline" />} className="h-10 w-full justify-start"><CalendarClock className="mr-2 size-4 text-emerald-600" />{rangeFrom ? formatDisplayDate(rangeFrom) : "Tanggal mulai"}</PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start"><PopoverHeader><PopoverTitle>Tanggal mulai</PopoverTitle></PopoverHeader><Calendar mode="single" selected={parseDateValue(rangeFrom)} onSelect={(date) => { if (date) { setRangeFrom(toDateInputValue(date)); setConditionFilter(null); setSortBy(null); setRangeFromOpen(false); } }} locale={localeID} /></PopoverContent>
                    </Popover>
                    <Popover open={rangeToOpen} onOpenChange={setRangeToOpen}>
                      <PopoverTrigger render={<Button type="button" variant="outline" />} className="h-10 w-full justify-start"><CalendarClock className="mr-2 size-4 text-emerald-600" />{rangeTo ? formatDisplayDate(rangeTo) : "Tanggal sampai"}</PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start"><PopoverHeader><PopoverTitle>Tanggal sampai</PopoverTitle></PopoverHeader><Calendar mode="single" selected={parseDateValue(rangeTo)} onSelect={(date) => { if (date) { setRangeTo(toDateInputValue(date)); setConditionFilter(null); setSortBy(null); setRangeToOpen(false); } }} locale={localeID} /></PopoverContent>
                    </Popover>
                    {!rangeValid && <p className="text-xs text-rose-600 sm:col-span-2">Tanggal mulai tidak boleh setelah tanggal sampai.</p>}
                  </div>
                )}
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showFilter && (
            <motion.div key="filter" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.26, ease: "easeOut" }}>
              <QuestionBlock icon={TriangleAlert} label="Filter berdasarkan kondisi siswa" answered={conditionFilter !== null}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["Semua", "aktif", "perlu_perhatian", "stabil"] as ConditionFilter[]).map((condition) => (
                    <ReportRadio key={condition} selected={conditionFilter === condition} label={CONDITION_LABELS[condition]} onClick={() => { setConditionFilter(condition); setSortBy(null); }} />
                  ))}
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Q2 — Kolom */}
        <AnimatePresence>
          {showColumns && (
            <motion.div key="q2" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.26, ease: "easeOut" }}>
              <QuestionBlock icon={ListChecks} label="Kolom yang ingin ditampilkan" answered>
                {reportType === "daily" ? (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <ReportCheckbox checked disabled label="Nama & tanggal" badge="wajib" />
                    <ReportCheckbox checked={dailyColumns.nis} onChange={(value) => setDailyColumns((current) => ({ ...current, nis: value }))} label="NIS" />
                    <ReportCheckbox checked={dailyColumns.gender} onChange={(value) => setDailyColumns((current) => ({ ...current, gender: value }))} label="Gender" />
                    <ReportCheckbox checked={dailyColumns.nisn} onChange={(value) => setDailyColumns((current) => ({ ...current, nisn: value }))} label="NISN" />
                    <ReportCheckbox checked={dailyColumns.status} onChange={(value) => setDailyColumns((current) => ({ ...current, status: value }))} label="Status absensi" />
                    <ReportCheckbox checked={dailyColumns.checkin} onChange={(value) => setDailyColumns((current) => ({ ...current, checkin: value }))} label="Waktu masuk" />
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <ReportCheckbox checked disabled label="Nama" badge="wajib" />
                    <ReportCheckbox checked={columns.nis} onChange={(value) => setColumns((current) => ({ ...current, nis: value }))} label="NIS" />
                    <ReportCheckbox checked={columns.gender} onChange={(value) => setColumns((current) => ({ ...current, gender: value }))} label="Gender" />
                    <ReportCheckbox checked={columns.identitas} onChange={(value) => setColumns((current) => ({ ...current, identitas: value }))} label="NISN" />
                    <ReportCheckbox checked={columns.hadir} onChange={(value) => setColumns((current) => ({ ...current, hadir: value }))} label="Hadir" />
                    <ReportCheckbox checked={columns.izin} onChange={(value) => setColumns((current) => ({ ...current, izin: value }))} label="Izin" />
                    <ReportCheckbox checked={columns.sakit} onChange={(value) => setColumns((current) => ({ ...current, sakit: value }))} label="Sakit" />
                    <ReportCheckbox checked={columns.alfa} onChange={(value) => setColumns((current) => ({ ...current, alfa: value }))} label="Alfa" />
                    <ReportCheckbox checked={columns.status} onChange={(value) => setColumns((current) => ({ ...current, status: value }))} label="Status" />
                  </div>
                )}
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Q3 — Urutan */}
        <AnimatePresence>
          {showColumns && (
            <motion.div key="q3" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.26, ease: "easeOut", delay: 0.08 }}>
              <QuestionBlock icon={ArrowUpDown} label="Urutkan data berdasarkan" answered={sortBy !== null}>
                <div className="grid gap-2 sm:grid-cols-2">
                  <ReportRadio selected={sortBy === "name"} label="Nama (A–Z)" onClick={() => setSortBy("name")} />
                  <ReportRadio selected={sortBy === "nis"} label="NIS" onClick={() => setSortBy("nis")} />
                  {reportType !== "daily" && <ReportRadio selected={sortBy === "alpha"} label="Alfa (terbanyak)" onClick={() => setSortBy("alpha")} />}
                  {reportType === "daily" && <ReportRadio selected={sortBy === "status"} label="Status absensi" onClick={() => setSortBy("status")} />}
                  {reportType === "daily" && <ReportRadio selected={sortBy === "checkin"} label="Waktu absen masuk" onClick={() => setSortBy("checkin")} />}
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        <ReportModalFooter
          canDownload={canDownload}
          generating={generating}
          onCancel={() => handleClose(false)}
          onDownload={handleDownload}
          format={format}
          generatingLabel={`Membuat ${format === "excel" ? "Excel" : "PDF"}...`}
          downloadLabel={format ? `Download ${format === "excel" ? "Excel" : "PDF"}` : "Pilih format laporan"}
        />
      </div>
    </PremiumModal>
  );
}
