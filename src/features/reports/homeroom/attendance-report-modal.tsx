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
import { QuestionBlock, ReportCheckbox, ReportRadio } from "@/features/reports/shared/report-question-ui";
import { getTeacherHomeroomAttendanceOverview } from "@/services/staff.service";
import type { StaffAttendanceRecord, StaffHomeroomContext } from "@/types/staff";
import { Activity, ArrowUpDown, CalendarClock, ListChecks, Printer } from "lucide-react";
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
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

const todayStr = () => toDateInputValue(new Date());
const todayDisplay = () => formatDisplayDate(todayStr());

type DateMode = "today" | "specific" | "range";
type ReportType = "daily" | "cumulative";
type StatusFilter = "Semua" | "hadir" | "telat" | "alfa" | "izin" | "sakit";
type SortBy = "name" | "nis" | "status" | "checkin" | "h" | "i" | "s" | "a";
type Columns = { nis: boolean; status: boolean; checkin: boolean };
type CumulativeColumns = { nis: boolean };
type CumulativeRow = { student_id: string; student_name: string; nis: string; h: number; i: number; s: number; a: number };
type ReportTableCell = string | { content: string; colSpan?: number; styles?: Record<string, unknown> };
type SortOption = { value: SortBy; label: string };

const STATUS_LABELS: Record<StatusFilter, string> = {
  Semua: "Semua Status",
  hadir: "Hadir",
  telat: "Telat",
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

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan Walas Absensi");
  const mx = REPORT_PDF_MARGIN_X;
  const { metaY } = drawReportPdfHeader(doc, {
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
  drawReportPdfPills(doc, pills, metaY);

  const head: string[][] = [["No", "Nama Siswa", "Tanggal"]];
  if (columns.nis) head[0].push("NIS");
  if (columns.status) head[0].push("Status");
  if (columns.checkin) head[0].push("Absen Masuk");

  const body = records.map((record, index) => {
    const tanggal = record.attendance_date
      ? new Date(`${record.attendance_date}T00:00:00`).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
      : "-";
    const row: string[] = [String(index + 1), record.student_name, tanggal];
    if (columns.nis) row.push(record.nis);
    if (columns.status) {
      row.push(record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1).toLowerCase() : "-");
    }
    if (columns.checkin) {
      row.push(record.check_in_at ? new Date(record.check_in_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-");
    }
    return row;
  });

  autoTable(doc, {
    head,
    body,
    startY: metaY + 8,
    margin: { left: mx, right: mx },
    ...REPORT_TABLE_STYLE,
  });

  drawReportPdfFooter(doc, `Laporan Absensi Kelas - ${homeroom.class_name} - ABSENSI CN`);
  doc.save(`Laporan-Walas-Absensi-${homeroom.class_name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

async function generateCumulativeWalasAbsensiPdf(
  rows: CumulativeRow[],
  homeroom: StaffHomeroomContext,
  periodeLabel: string,
  sortLabel: string,
  columns: CumulativeColumns,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan Walas Rekap Absensi");
  const mx = REPORT_PDF_MARGIN_X;
  const { metaY } = drawReportPdfHeader(doc, {
    title: "REKAP ABSENSI KELAS",
    subtitle: "Laporan Akumulatif Wali Kelas",
  });
  const pills = [
    "Tipe: Rekap akumulatif",
    `Kelas: ${homeroom.class_name}`,
    `Periode: ${periodeLabel}`,
    `Total: ${rows.length} siswa`,
    `Urutan: ${sortLabel}`,
  ];
  drawReportPdfPills(doc, pills, metaY);

  const head: string[][] = [["No", "Nama Siswa"]];
  if (columns.nis) head[0].push("NIS");
  head[0].push("H", "I", "S", "A");

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
    );
    return cells;
  });
  body.push([
    {
      content: "Total Akumulatif",
      colSpan: columns.nis ? 3 : 2,
      styles: {
        fillColor: [236, 253, 245],
        fontStyle: "bold",
        halign: "center",
        textColor: [6, 78, 59],
      },
    },
    { content: String(totals.h), styles: { fillColor: [236, 253, 245], fontStyle: "bold", halign: "center", textColor: [6, 78, 59] } },
    { content: String(totals.i), styles: { fillColor: [236, 253, 245], fontStyle: "bold", halign: "center", textColor: [6, 78, 59] } },
    { content: String(totals.s), styles: { fillColor: [236, 253, 245], fontStyle: "bold", halign: "center", textColor: [6, 78, 59] } },
    { content: String(totals.a), styles: { fillColor: [236, 253, 245], fontStyle: "bold", halign: "center", textColor: [6, 78, 59] } },
  ]);

  autoTable(doc, {
    head,
    body,
    startY: metaY + 8,
    margin: { left: mx, right: mx },
    ...REPORT_TABLE_STYLE,
  });

  drawReportPdfFooter(doc, `Rekap Absensi Kelas - ${homeroom.class_name} - ABSENSI CN`);
  doc.save(`Laporan-Walas-Rekap-Absensi-${homeroom.class_name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`);
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
    };

    switch (record.status?.toLowerCase()) {
      case "hadir":
      case "telat":
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
    rowsByStudent.set(record.student_id, row);
  });

  return Array.from(rowsByStudent.values());
}

function getDailySortOptions(columns: Columns): SortOption[] {
  return [
    { value: "name", label: "Nama (A-Z)" },
    ...(columns.nis ? [{ value: "nis" as const, label: "NIS" }] : []),
    ...(columns.status ? [{ value: "status" as const, label: "Status" }] : []),
    ...(columns.checkin ? [{ value: "checkin" as const, label: "Waktu Absen Masuk" }] : []),
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

export function WalasAbsensiReportModal({ open, onOpenChange, homeroom }: Props) {
  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [dateMode, setDateMode] = useState<DateMode | null>(null);
  const [specificDate, setSpecificDate] = useState("");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [specificDateOpen, setSpecificDateOpen] = useState(false);
  const [rangeFromOpen, setRangeFromOpen] = useState(false);
  const [rangeToOpen, setRangeToOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter | null>(null);
  const [columns, setColumns] = useState<Columns>({ nis: true, status: true, checkin: false });
  const [cumulativeColumns, setCumulativeColumns] = useState<CumulativeColumns>({ nis: true });
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [generating, setGenerating] = useState(false);

  const rangeValid = !rangeFrom || !rangeTo || rangeFrom <= rangeTo;
  const typeAnswered = reportType !== null;
  const periodAnswered =
    dateMode === "today" ||
    (dateMode === "specific" && specificDate !== "") ||
    (dateMode === "range" && rangeFrom !== "" && rangeTo !== "" && rangeValid);

  const showPeriod = typeAnswered;
  const showStatus = periodAnswered && reportType === "daily";
  const showColumns = periodAnswered && (reportType === "cumulative" || statusFilter !== null);
  const canDownload = showColumns && sortBy !== null;
  const sortOptions = useMemo(
    () => (reportType === "cumulative" ? getCumulativeSortOptions(cumulativeColumns) : getDailySortOptions(columns)),
    [columns, cumulativeColumns, reportType],
  );

  useEffect(() => {
    if (sortBy && !sortOptions.some((option) => option.value === sortBy)) {
      setSortBy(null);
    }
  }, [sortBy, sortOptions]);

  function resetState() {
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
      const dateParam = dateMode === "today" ? todayStr() : dateMode === "specific" ? specificDate : "";
      const overview = await getTeacherHomeroomAttendanceOverview(
        dateMode === "range"
          ? { date_from: rangeFrom, date_to: rangeTo }
          : { date: dateParam },
      );
      const rawRecords = overview.records ?? [];

      const periodeLabel =
        dateMode === "today"
          ? `Hari ini (${todayDisplay()})`
          : dateMode === "specific"
            ? formatDisplayDate(specificDate)
            : `${formatDisplayDate(rangeFrom)} - ${formatDisplayDate(rangeTo)}`;

      if (reportType === "cumulative") {
        const cumulativeRows = buildCumulativeRows(rawRecords);
        if (cumulativeRows.length === 0) {
          toast.warning("Tidak ada data absensi yang sesuai filter.");
          return;
        }

        const sortedRows = [...cumulativeRows].sort((first, second) => {
          if (sortBy === "name") return first.student_name.localeCompare(second.student_name, "id");
          if (sortBy === "nis") return first.nis.localeCompare(second.nis, "id");
          if (sortBy === "h") return second.h - first.h;
          if (sortBy === "i") return second.i - first.i;
          if (sortBy === "s") return second.s - first.s;
          if (sortBy === "a") return second.a - first.a;
          return 0;
        });

        await generateCumulativeWalasAbsensiPdf(sortedRows, homeroom, periodeLabel, getSortLabel(sortBy), cumulativeColumns);
        return;
      }

      let records = rawRecords;
      if (statusFilter && statusFilter !== "Semua") {
        records = records.filter((record) => record.status?.toLowerCase() === statusFilter);
      }

      if (records.length === 0) {
        toast.warning("Tidak ada data absensi yang sesuai filter.");
        return;
      }

      const sorted = [...records].sort((first, second) => {
        if (sortBy === "name") return first.student_name.localeCompare(second.student_name, "id");
        if (sortBy === "nis") return first.nis.localeCompare(second.nis, "id");
        if (sortBy === "status") return (first.status ?? "").localeCompare(second.status ?? "", "id");
        if (sortBy === "checkin") return (first.check_in_at ?? "").localeCompare(second.check_in_at ?? "", "id");
        return 0;
      });

      const statusLabel = statusFilter ? STATUS_LABELS[statusFilter] : "Semua Status";
      await generateDailyWalasAbsensiPdf(sorted, homeroom, periodeLabel, statusLabel, getSortLabel(sortBy), columns);
    } catch {
      toast.error("Gagal membuat PDF. Silakan coba lagi.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <PremiumModal
      open={open}
      onOpenChange={handleClose}
      title="Cetak Laporan Absensi Kelas"
      description="Pilih tipe laporan, periode, dan kolom yang dibutuhkan sebelum mengunduh PDF."
      icon={Printer}
      className="sm:!max-w-[660px]"
    >
      <div className="space-y-4">
        <QuestionBlock icon={Printer} label="Pilih tipe laporan" answered={typeAnswered}>
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
            <motion.div key="period" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.26, ease: "easeOut" }}>
              <QuestionBlock icon={CalendarClock} label="Pilih periode absensi" answered={periodAnswered}>
                <div className="grid gap-2 sm:grid-cols-3">
                  <ReportRadio
                    selected={dateMode === "today"}
                    label="Hari ini"
                    badge={todayDisplay()}
                    onClick={() => { setDateMode("today"); setStatusFilter(null); setSortBy(null); }}
                  />
                  <ReportRadio
                    selected={dateMode === "specific"}
                    label="Tanggal tertentu"
                    onClick={() => { setDateMode("specific"); setSpecificDate(""); setStatusFilter(null); setSortBy(null); }}
                  />
                  <ReportRadio
                    selected={dateMode === "range"}
                    label="Rentang tanggal"
                    onClick={() => { setDateMode("range"); setRangeFrom(""); setRangeTo(""); setStatusFilter(null); setSortBy(null); }}
                  />
                </div>

                <AnimatePresence>
                  {dateMode === "specific" && (
                    <motion.div key="specific" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="overflow-hidden">
                      <div className="mt-3">
                        <Popover open={specificDateOpen} onOpenChange={setSpecificDateOpen}>
                          <PopoverTrigger
                            render={<Button type="button" variant="outline" />}
                            className="h-11 w-full justify-start rounded-[16px] border-slate-300/80 bg-white px-4 text-left text-slate-700"
                          >
                            <CalendarClock className="mr-2 size-4 text-emerald-600" />
                            {specificDate ? formatDisplayDate(specificDate) : "Pilih tanggal"}
                          </PopoverTrigger>
                          <PopoverContent sideOffset={8} className="w-auto rounded-[22px] border border-emerald-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] p-4 shadow-[0_24px_54px_rgba(15,23,42,0.12)]">
                            <PopoverHeader className="px-2 pt-1 pb-2">
                              <PopoverTitle className="text-sm font-semibold text-slate-900">Pilih tanggal absensi</PopoverTitle>
                            </PopoverHeader>
                            <Calendar
                              mode="single"
                              selected={parseDateValue(specificDate)}
                              onSelect={(date) => { setSpecificDate(date ? toDateInputValue(date) : ""); setStatusFilter(null); setSortBy(null); setSpecificDateOpen(false); }}
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
                  {dateMode === "range" && (
                    <motion.div key="range" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="overflow-hidden">
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <p className="mb-1.5 text-[0.74rem] font-semibold uppercase tracking-wide text-slate-500">Mulai</p>
                          <Popover open={rangeFromOpen} onOpenChange={setRangeFromOpen}>
                            <PopoverTrigger
                              render={<Button type="button" variant="outline" />}
                              className="h-11 w-full justify-start rounded-[16px] border-slate-300/80 bg-white px-3 text-left text-sm text-slate-700"
                            >
                              <CalendarClock className="mr-1.5 size-3.5 shrink-0 text-emerald-600" />
                              <span className="truncate">{rangeFrom ? formatDisplayDate(rangeFrom) : "Pilih tanggal"}</span>
                            </PopoverTrigger>
                            <PopoverContent sideOffset={8} className="w-auto rounded-[22px] border border-emerald-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] p-4 shadow-[0_24px_54px_rgba(15,23,42,0.12)]">
                              <PopoverHeader className="px-2 pt-1 pb-2">
                                <PopoverTitle className="text-sm font-semibold text-slate-900">Tanggal mulai</PopoverTitle>
                              </PopoverHeader>
                              <Calendar mode="single" selected={parseDateValue(rangeFrom)} onSelect={(date) => { setRangeFrom(date ? toDateInputValue(date) : ""); setStatusFilter(null); setSortBy(null); setRangeFromOpen(false); }} locale={localeID} buttonVariant="ghost" />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <p className="mb-1.5 text-[0.74rem] font-semibold uppercase tracking-wide text-slate-500">Sampai</p>
                          <Popover open={rangeToOpen} onOpenChange={setRangeToOpen}>
                            <PopoverTrigger
                              render={<Button type="button" variant="outline" />}
                              className="h-11 w-full justify-start rounded-[16px] border-slate-300/80 bg-white px-3 text-left text-sm text-slate-700"
                            >
                              <CalendarClock className="mr-1.5 size-3.5 shrink-0 text-emerald-600" />
                              <span className="truncate">{rangeTo ? formatDisplayDate(rangeTo) : "Pilih tanggal"}</span>
                            </PopoverTrigger>
                            <PopoverContent sideOffset={8} className="w-auto rounded-[22px] border border-emerald-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] p-4 shadow-[0_24px_54px_rgba(15,23,42,0.12)]">
                              <PopoverHeader className="px-2 pt-1 pb-2">
                                <PopoverTitle className="text-sm font-semibold text-slate-900">Tanggal akhir</PopoverTitle>
                              </PopoverHeader>
                              <Calendar mode="single" selected={parseDateValue(rangeTo)} onSelect={(date) => { setRangeTo(date ? toDateInputValue(date) : ""); setStatusFilter(null); setSortBy(null); setRangeToOpen(false); }} locale={localeID} buttonVariant="ghost" />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      {rangeFrom && rangeTo && !rangeValid && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 flex items-center gap-1.5 text-[0.8rem] font-medium text-rose-600">
                          <span className="inline-flex size-4 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold">!</span>
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
            <motion.div key="q2" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.26, ease: "easeOut" }}>
              <QuestionBlock icon={Activity} label="Filter berdasarkan status kehadiran" answered={statusFilter !== null}>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(["Semua", "hadir", "telat", "alfa", "izin", "sakit"] as StatusFilter[]).map((status) => (
                    <ReportRadio key={status} selected={statusFilter === status} label={STATUS_LABELS[status]} onClick={() => { setStatusFilter(status); setSortBy(null); }} />
                  ))}
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showColumns && (
            <motion.div key="q3" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.26, ease: "easeOut" }}>
              <QuestionBlock icon={ListChecks} label="Kolom yang ingin ditampilkan" answered>
                <div className="grid grid-cols-1 gap-2 min-[520px]:grid-cols-2">
                  {reportType === "cumulative" ? (
                    <>
                      <ReportCheckbox checked disabled label="Nama Siswa" badge="wajib" />
                      <ReportCheckbox checked={cumulativeColumns.nis} onChange={(value) => setCumulativeColumns((current) => ({ ...current, nis: value }))} label="NIS" />
                      <ReportCheckbox checked disabled label="Rekap H I S A" badge="wajib" />
                    </>
                  ) : (
                    <>
                      <ReportCheckbox checked disabled label="Nama & Tanggal" badge="wajib" />
                      <ReportCheckbox checked={columns.nis} onChange={(value) => setColumns((current) => ({ ...current, nis: value }))} label="NIS" />
                      <ReportCheckbox checked={columns.status} onChange={(value) => setColumns((current) => ({ ...current, status: value }))} label="Status" />
                      <ReportCheckbox checked={columns.checkin} onChange={(value) => setColumns((current) => ({ ...current, checkin: value }))} label="Waktu Absen Masuk" />
                    </>
                  )}
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showColumns && (
            <motion.div key="q4" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.26, ease: "easeOut", delay: 0.08 }}>
              <QuestionBlock icon={ArrowUpDown} label="Urutkan data berdasarkan" answered={sortBy !== null}>
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

        <ReportModalFooter
          canDownload={canDownload}
          generating={generating}
          onCancel={() => handleClose(false)}
          onDownload={handleDownload}
        />
      </div>
    </PremiumModal>
  );
}
