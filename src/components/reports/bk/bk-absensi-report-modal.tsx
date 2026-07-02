"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  PremiumModal,
  premiumModalActionsClassName,
} from "@/components/modals/premium-modal";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { applyPdfCreditMetadata } from "@/lib/reports/pdf-metadata";
import { cn } from "@/lib/utils";
import {
  QuestionBlock,
  ReportCheckbox,
  ReportRadio,
} from "@/components/reports/admin/guru-report-modal";
import { getBKAttendanceOverview } from "@/services/staff.service";
import type { StaffAttendanceRecord, StaffBKClassSummary } from "@/types/staff";
import {
  Activity,
  ArrowUpDown,
  CalendarClock,
  GraduationCap,
  ListChecks,
  Printer,
} from "lucide-react";
import { id as localeID } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function todayDisplay() {
  return new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function parseDateValue(value: string): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? undefined : date;
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(value: string): string {
  const date = parseDateValue(value);
  if (!date) return "Pilih tanggal";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatTime(isoStr?: string) {
  if (!isoStr) return "—";
  try {
    return new Date(isoStr).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

const STATUS_LABEL: Record<string, string> = {
  hadir: "Hadir",
  telat: "Telat",
  izin: "Izin",
  sakit: "Sakit",
  alfa: "Alfa",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type DateMode = "today" | "specific" | "range";
type ClassFilter = "all" | "specific";
type StatusFilter = "Semua" | "hadir" | "telat" | "izin" | "sakit" | "alfa";
type SortBy = "name" | "nis" | "class" | "checkin";

type Columns = {
  kelas: boolean;
  tanggal: boolean;
  checkIn: boolean;
  status: boolean;
  diverifikasi: boolean;
  catatan: boolean;
};

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "Semua", label: "Semua Status" },
  { value: "hadir", label: "Hadir" },
  { value: "telat", label: "Telat" },
  { value: "alfa", label: "Alfa" },
  { value: "izin", label: "Izin" },
  { value: "sakit", label: "Sakit" },
];

// ─── PDF generator ────────────────────────────────────────────────────────────

async function generateBKAbsensiPdf(
  records: StaffAttendanceRecord[],
  meta: {
    tanggal: string;
    kelas: string;
    status: string;
    urutan: string;
  },
  columns: Columns,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan Absensi BK");
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const mx = 14;

  const now = new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Header band
  doc.setFillColor(6, 78, 59);
  doc.roundedRect(mx, 10, W - mx * 2, 22, 2.5, 2.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(236, 253, 245);
  doc.text("ABSENSI CN", mx + 5, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(167, 243, 208);
  doc.text("Laporan Guru Bimbingan Konseling", mx + 5, 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("LAPORAN ABSENSI LINTAS KELAS", W - mx - 5, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(167, 243, 208);
  doc.text(`Dicetak: ${now}`, W - mx - 5, 24, { align: "right" });

  // Meta pills
  const metaY = 37;
  const pills = [
    `Tanggal: ${meta.tanggal}`,
    `Kelas: ${meta.kelas}`,
    `Status: ${meta.status}`,
    `Total: ${records.length} record`,
    `Urutan: ${meta.urutan}`,
  ];
  let pillX = mx;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(6, 95, 70);
  pills.forEach((text) => {
    const tw = doc.getTextWidth(text);
    const pw = tw + 8;
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(110, 231, 183);
    doc.setLineWidth(0.3);
    doc.roundedRect(pillX, metaY, pw, 5, 1.2, 1.2, "FD");
    doc.text(text, pillX + 4, metaY + 3.6);
    pillX += pw + 4;
  });

  // Build table
  const head: string[][] = [["No", "Nama Siswa", "NIS"]];
  if (columns.kelas) head[0].push("Kelas");
  if (columns.tanggal) head[0].push("Tanggal");
  if (columns.checkIn) head[0].push("Check-in");
  if (columns.status) head[0].push("Status");
  if (columns.diverifikasi) head[0].push("Verifikasi");
  if (columns.catatan) head[0].push("Catatan");

  const body = records.map((r, i) => {
    const row: string[] = [String(i + 1), r.student_name, r.nis];
    if (columns.kelas) row.push(r.class_name || "—");
    if (columns.tanggal) row.push(formatDate(r.attendance_date));
    if (columns.checkIn) row.push(formatTime(r.check_in_at));
    if (columns.status) row.push(STATUS_LABEL[r.status.toLowerCase()] ?? r.status);
    if (columns.diverifikasi) row.push(r.verified_at ? "Sudah" : "Belum");
    if (columns.catatan) row.push(r.verification_note || r.notes || "—");
    return row;
  });

  autoTable(doc, {
    head,
    body,
    startY: metaY + 8,
    margin: { left: mx, right: mx },
    styles: {
      fontSize: 8,
      cellPadding: { horizontal: 4, vertical: 4 },
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: "helvetica",
      textColor: [51, 65, 85],
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [6, 78, 59],
      textColor: [236, 253, 245],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 14, halign: "center", fontStyle: "bold" },
    },
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(mx, H - 8, W - mx, H - 8);
    doc.text("Laporan Absensi Lintas Kelas — BK ABSENSI CN", mx, H - 4);
    doc.text(`Halaman ${i} / ${totalPages}`, W - mx, H - 4, { align: "right" });
  }

  doc.save(`Laporan-Absensi-BK-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: StaffBKClassSummary[];
};

export function BKAbsensiReportModal({ open, onOpenChange, classes }: Props) {
  const [dateMode, setDateMode] = useState<DateMode | null>(null);
  const [specificDate, setSpecificDate] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [classFilter, setClassFilter] = useState<ClassFilter | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter | null>(null);
  const [columns, setColumns] = useState<Columns>({
    kelas: true,
    tanggal: true,
    checkIn: true,
    status: true,
    diverifikasi: false,
    catatan: false,
  });
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [generating, setGenerating] = useState(false);
  const [specificDateOpen, setSpecificDateOpen] = useState(false);
  const [rangeFromOpen, setRangeFromOpen] = useState(false);
  const [rangeToOpen, setRangeToOpen] = useState(false);

  const dateValue = dateMode === "today"
    ? todayStr()
    : dateMode === "specific" && specificDate
    ? specificDate
    : "";

  const rangeValid =
    !dateRange.from || !dateRange.to || dateRange.from.getTime() <= dateRange.to.getTime();

  const q1Answered =
    dateMode === "today" ||
    (dateMode === "specific" && specificDate !== "") ||
    (dateMode === "range" && !!dateRange.from && !!dateRange.to && rangeValid);
  const q2FullyAnswered =
    classFilter === "all" || (classFilter === "specific" && selectedClassId !== null);
  const showQ2 = q1Answered;
  const showQ3 = q1Answered && q2FullyAnswered;
  const showQ4 = showQ3 && statusFilter !== null;
  const canDownload = showQ4 && sortBy !== null;

  const selectedClass = useMemo(
    () => classes.find((c) => c.class_id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );

  function reset() {
    setDateMode(null);
    setSpecificDate("");
    setDateRange({ from: undefined, to: undefined });
    setSpecificDateOpen(false);
    setRangeFromOpen(false);
    setRangeToOpen(false);
    setClassFilter(null);
    setSelectedClassId(null);
    setStatusFilter(null);
    setColumns({ kelas: true, tanggal: true, checkIn: true, status: true, diverifikasi: false, catatan: false });
    setSortBy(null);
  }

  function handleClose(isOpen: boolean) {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  }

  async function handleDownload() {
    if (!canDownload) return;
    setGenerating(true);
    try {
      const overview = await getBKAttendanceOverview({
        date: dateMode === "range" ? "" : dateValue,
        status: statusFilter === "Semua" ? "" : (statusFilter ?? ""),
        class_id: classFilter === "specific" && selectedClassId ? selectedClassId : "",
      });

      let records = overview.records ?? [];

      // Client-side range filter (API doesn't support range natively)
      if (dateMode === "range" && dateRange.from && dateRange.to) {
        const fromStr = toDateInputValue(dateRange.from);
        const toStr = toDateInputValue(dateRange.to);
        records = records.filter((r) => r.attendance_date >= fromStr && r.attendance_date <= toStr);
      }

      if (records.length === 0) {
        toast.warning("Tidak ada record absensi yang sesuai filter.");
        return;
      }

      const sorted = [...records].sort((a, b) => {
        if (sortBy === "name") return a.student_name.localeCompare(b.student_name, "id");
        if (sortBy === "nis") return a.nis.localeCompare(b.nis, "id");
        if (sortBy === "class") return (a.class_name || "").localeCompare(b.class_name || "", "id");
        if (sortBy === "checkin") {
          return (a.check_in_at ?? "").localeCompare(b.check_in_at ?? "");
        }
        return 0;
      });

      const meta = {
        tanggal: dateMode === "today"
          ? todayDisplay()
          : dateMode === "specific" && specificDate
          ? formatDisplayDate(specificDate)
          : dateMode === "range" && dateRange.from && dateRange.to
          ? `${formatDisplayDate(toDateInputValue(dateRange.from))} — ${formatDisplayDate(toDateInputValue(dateRange.to))}`
          : "Semua",
        kelas: classFilter === "specific" && selectedClass
          ? selectedClass.class_name
          : "Semua Kelas",
        status: statusFilter ? (STATUS_LABEL[statusFilter] ?? "Semua Status") : "Semua Status",
        urutan:
          sortBy === "name" ? "Nama (A–Z)" :
          sortBy === "nis" ? "NIS" :
          sortBy === "class" ? "Kelas" : "Waktu Check-in",
      };

      await generateBKAbsensiPdf(sorted, meta, columns);
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
      title="Cetak Laporan Absensi BK"
      description="Filter tanggal, kelas, dan status — unduh PDF absensi lintas kelas siap cetak."
      icon={Printer}
      className="sm:!max-w-[640px]"
    >
      <div className="space-y-4">
        {/* Q1 — Tanggal */}
        <QuestionBlock icon={CalendarClock} label="Pilih tanggal absensi" answered={q1Answered}>
          <div className="grid gap-2 sm:grid-cols-3">
            <ReportRadio
              selected={dateMode === "today"}
              label="Hari ini"
              badge={todayDisplay()}
              onClick={() => {
                setDateMode("today");
                setSpecificDate("");
                setDateRange({ from: undefined, to: undefined });
                setClassFilter(null);
                setSelectedClassId(null);
                setStatusFilter(null);
                setSortBy(null);
              }}
            />
            <ReportRadio
              selected={dateMode === "specific"}
              label="Tanggal tertentu"
              onClick={() => {
                setDateMode("specific");
                setDateRange({ from: undefined, to: undefined });
                setClassFilter(null);
                setSelectedClassId(null);
                setStatusFilter(null);
                setSortBy(null);
              }}
            />
            <ReportRadio
              selected={dateMode === "range"}
              label="Rentang tanggal"
              onClick={() => {
                setDateMode("range");
                setSpecificDate("");
                setDateRange({ from: undefined, to: undefined });
                setClassFilter(null);
                setSelectedClassId(null);
                setStatusFilter(null);
                setSortBy(null);
              }}
            />
          </div>
          <AnimatePresence>
            {dateMode === "range" && (
              <motion.div
                key="date-range"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {/* From */}
                  <div>
                    <p className="mb-1.5 text-[0.75rem] font-semibold uppercase tracking-wide text-slate-500">
                      Mulai tanggal
                    </p>
                    <Popover open={rangeFromOpen} onOpenChange={setRangeFromOpen}>
                      <PopoverTrigger
                        render={<Button type="button" variant="outline" />}
                        className={cn(
                          "h-12 w-full justify-start rounded-[18px] border border-slate-300/80 bg-white/90 px-3 text-left text-sm transition hover:border-emerald-400 hover:bg-emerald-50/25",
                          dateRange.from ? "text-slate-700" : "text-slate-400",
                        )}
                      >
                        <CalendarClock className="mr-2 size-4 shrink-0 text-emerald-600" />
                        {dateRange.from ? formatDisplayDate(toDateInputValue(dateRange.from)) : "dd/mm/yyyy"}
                      </PopoverTrigger>
                      <PopoverContent
                        sideOffset={10}
                        className="w-auto rounded-[24px] border border-emerald-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] p-4 shadow-[0_24px_54px_rgba(15,23,42,0.12)]"
                      >
                        <PopoverHeader className="px-2 pb-2 pt-1">
                          <PopoverTitle className="text-sm font-semibold text-slate-900">Mulai tanggal</PopoverTitle>
                        </PopoverHeader>
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) => {
                            setDateRange((prev) => ({ ...prev, from: date ?? undefined }));
                            setRangeFromOpen(false);
                          }}
                          locale={localeID}
                          buttonVariant="ghost"
                          captionLayout="dropdown"
                          startMonth={new Date(2020, 0)}
                          endMonth={new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* To */}
                  <div>
                    <p className="mb-1.5 text-[0.75rem] font-semibold uppercase tracking-wide text-slate-500">
                      Sampai tanggal
                    </p>
                    <Popover open={rangeToOpen} onOpenChange={setRangeToOpen}>
                      <PopoverTrigger
                        render={<Button type="button" variant="outline" />}
                        className={cn(
                          "h-12 w-full justify-start rounded-[18px] border border-slate-300/80 bg-white/90 px-3 text-left text-sm transition hover:border-emerald-400 hover:bg-emerald-50/25",
                          dateRange.to ? "text-slate-700" : "text-slate-400",
                        )}
                      >
                        <CalendarClock className="mr-2 size-4 shrink-0 text-emerald-600" />
                        {dateRange.to ? formatDisplayDate(toDateInputValue(dateRange.to)) : "dd/mm/yyyy"}
                      </PopoverTrigger>
                      <PopoverContent
                        sideOffset={10}
                        className="w-auto rounded-[24px] border border-emerald-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] p-4 shadow-[0_24px_54px_rgba(15,23,42,0.12)]"
                      >
                        <PopoverHeader className="px-2 pb-2 pt-1">
                          <PopoverTitle className="text-sm font-semibold text-slate-900">Sampai tanggal</PopoverTitle>
                        </PopoverHeader>
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(date) => {
                            setDateRange((prev) => ({ ...prev, to: date ?? undefined }));
                            setRangeToOpen(false);
                          }}
                          locale={localeID}
                          buttonVariant="ghost"
                          captionLayout="dropdown"
                          startMonth={new Date(2020, 0)}
                          endMonth={new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Validation error */}
                {dateRange.from && dateRange.to && dateRange.from > dateRange.to && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 flex items-center gap-1.5 text-[0.8rem] font-medium text-rose-600"
                  >
                    <span className="inline-flex size-4 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold">!</span>
                    Tanggal mulai tidak boleh lebih dari tanggal akhir.
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {dateMode === "specific" && (
              <motion.div
                key="date-input"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mt-3">
                  <Popover open={specificDateOpen} onOpenChange={setSpecificDateOpen}>
                    <PopoverTrigger
                      render={<Button type="button" variant="outline" />}
                      className={cn(
                        "h-12 w-full justify-start rounded-[18px] border border-slate-300/80 bg-white/90 px-4 text-left text-sm transition hover:border-emerald-400 hover:bg-emerald-50/25",
                        specificDate ? "text-slate-700" : "text-slate-400",
                      )}
                    >
                      <CalendarClock className="mr-2 size-4 shrink-0 text-emerald-600" />
                      {specificDate ? formatDisplayDate(specificDate) : "Pilih tanggal absensi"}
                    </PopoverTrigger>
                    <PopoverContent
                      sideOffset={10}
                      className="w-auto rounded-[24px] border border-emerald-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] p-4 shadow-[0_24px_54px_rgba(15,23,42,0.12)]"
                    >
                      <PopoverHeader className="px-2 pb-2 pt-1">
                        <PopoverTitle className="text-sm font-semibold text-slate-900">
                          Pilih tanggal absensi
                        </PopoverTitle>
                      </PopoverHeader>
                      <Calendar
                        mode="single"
                        selected={parseDateValue(specificDate)}
                        onSelect={(date) => {
                          const val = date ? toDateInputValue(date) : "";
                          setSpecificDate(val);
                          setSpecificDateOpen(false);
                          setClassFilter(null);
                          setSelectedClassId(null);
                          setStatusFilter(null);
                          setSortBy(null);
                        }}
                        locale={localeID}
                        buttonVariant="ghost"
                        captionLayout="dropdown"
                        startMonth={new Date(2020, 0)}
                        endMonth={new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </QuestionBlock>

        {/* Q2 — Kelas */}
        <AnimatePresence>
          {showQ2 && (
            <motion.div
              key="q2"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
            >
              <QuestionBlock icon={GraduationCap} label="Filter per kelas" answered={q2FullyAnswered}>
                <div className="grid gap-2 sm:grid-cols-2">
                  <ReportRadio
                    selected={classFilter === "all"}
                    label="Semua Kelas"
                    badge={`${classes.length} kelas`}
                    onClick={() => { setClassFilter("all"); setSelectedClassId(null); setStatusFilter(null); setSortBy(null); }}
                  />
                  <ReportRadio
                    selected={classFilter === "specific"}
                    label="Per Kelas Tertentu"
                    onClick={() => { setClassFilter("specific"); setSelectedClassId(null); setStatusFilter(null); setSortBy(null); }}
                  />
                </div>
                <AnimatePresence>
                  {classFilter === "specific" && (
                    <motion.div
                      key="class-chips"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p className="mb-2 mt-3 text-[0.78rem] font-semibold uppercase tracking-wide text-slate-500">
                        Pilih kelas:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {classes.map((cls) => (
                          <button
                            key={cls.class_id}
                            type="button"
                            onClick={() => { setSelectedClassId(cls.class_id); setStatusFilter(null); setSortBy(null); }}
                            className={cn(
                              "rounded-full border px-4 py-2 text-sm font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500/30",
                              selectedClassId === cls.class_id
                                ? "border-emerald-400 bg-emerald-600 text-white shadow-[0_4px_10px_rgba(5,150,105,0.28)]"
                                : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50",
                            )}
                          >
                            {cls.class_name}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Q3 — Status */}
        <AnimatePresence>
          {showQ3 && (
            <motion.div
              key="q3"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
            >
              <QuestionBlock icon={Activity} label="Filter status kehadiran" answered={statusFilter !== null}>
                <div className="grid gap-2 sm:grid-cols-3">
                  {STATUS_OPTIONS.map((opt) => (
                    <ReportRadio
                      key={opt.value}
                      selected={statusFilter === opt.value}
                      label={opt.label}
                      onClick={() => { setStatusFilter(opt.value); setSortBy(null); }}
                    />
                  ))}
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Q4 — Kolom */}
        <AnimatePresence>
          {showQ4 && (
            <motion.div
              key="q4"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
            >
              <QuestionBlock icon={ListChecks} label="Kolom yang ingin ditampilkan" answered>
                <div className="grid gap-2 sm:grid-cols-3">
                  <ReportCheckbox checked disabled label="Nama & NIS" badge="wajib" />
                  <ReportCheckbox checked={columns.kelas} onChange={(v) => setColumns((c) => ({ ...c, kelas: v }))} label="Kelas" />
                  <ReportCheckbox checked={columns.tanggal} onChange={(v) => setColumns((c) => ({ ...c, tanggal: v }))} label="Tanggal" />
                  <ReportCheckbox checked={columns.checkIn} onChange={(v) => setColumns((c) => ({ ...c, checkIn: v }))} label="Jam Check-in" />
                  <ReportCheckbox checked={columns.status} onChange={(v) => setColumns((c) => ({ ...c, status: v }))} label="Status" />
                  <ReportCheckbox checked={columns.diverifikasi} onChange={(v) => setColumns((c) => ({ ...c, diverifikasi: v }))} label="Diverifikasi" />
                  <ReportCheckbox checked={columns.catatan} onChange={(v) => setColumns((c) => ({ ...c, catatan: v }))} label="Catatan" />
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Q5 — Urutan */}
        <AnimatePresence>
          {showQ4 && (
            <motion.div
              key="q5"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: "easeOut", delay: 0.09 }}
            >
              <QuestionBlock icon={ArrowUpDown} label="Urutkan data berdasarkan" answered={sortBy !== null}>
                <div className="grid gap-2 sm:grid-cols-2">
                  <ReportRadio selected={sortBy === "name"} label="Nama (A–Z)" onClick={() => setSortBy("name")} />
                  <ReportRadio selected={sortBy === "nis"} label="NIS" onClick={() => setSortBy("nis")} />
                  <ReportRadio selected={sortBy === "class"} label="Kelas" onClick={() => setSortBy("class")} />
                  <ReportRadio selected={sortBy === "checkin"} label="Waktu Check-in" onClick={() => setSortBy("checkin")} />
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className={premiumModalActionsClassName}>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-[0.8rem] border border-slate-200 px-5 text-[0.88rem] text-slate-600 transition hover:bg-slate-50"
            onClick={() => handleClose(false)}
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!canDownload || generating}
            onClick={handleDownload}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-[0.8rem] px-6 text-[0.88rem] font-semibold text-white transition-all duration-200",
              canDownload && !generating
                ? "bg-emerald-600 shadow-[0_4px_14px_rgba(5,150,105,0.3)] hover:bg-emerald-700 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(5,150,105,0.38)]"
                : "cursor-not-allowed bg-slate-300",
            )}
          >
            {generating ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Memuat data & membuat PDF...
              </>
            ) : (
              <>
                <Printer className="size-4" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </PremiumModal>
  );
}
