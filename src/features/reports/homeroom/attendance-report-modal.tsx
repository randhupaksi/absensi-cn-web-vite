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
import { useState } from "react";
import { id as localeID } from "date-fns/locale";
import { toast } from "sonner";

// ─── helpers ──────────────────────────────────────────────────────────────────

function toDateInputValue(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateValue(v: string): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v + "T00:00:00");
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function formatDisplayDate(v: string) {
  const d = parseDateValue(v);
  if (!d) return "";
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

const todayStr = () => toDateInputValue(new Date());
const todayDisplay = () => formatDisplayDate(todayStr());

// ─── PDF generator ────────────────────────────────────────────────────────────

type DateMode = "today" | "specific" | "range";
type StatusFilter = "Semua" | "hadir" | "telat" | "alfa" | "izin" | "sakit";
type SortBy = "name" | "nis" | "status" | "checkin";
type Columns = { nis: boolean; status: boolean; checkin: boolean; catatan: boolean };

const STATUS_LABELS: Record<StatusFilter, string> = {
  Semua: "Semua Status",
  hadir: "Hadir",
  telat: "Telat",
  alfa: "Alfa",
  izin: "Izin",
  sakit: "Sakit",
};

async function generateWalasAbsensiPdf(
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
  if (columns.checkin) head[0].push("Check-in");
  if (columns.catatan) head[0].push("Catatan");

  const body = records.map((r, i) => {
    const tanggal = r.attendance_date
      ? new Date(r.attendance_date + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
      : "—";
    const row: string[] = [String(i + 1), r.student_name, tanggal];
    if (columns.nis) row.push(r.nis);
    if (columns.status) row.push(r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1).toLowerCase() : "—");
    if (columns.checkin) {
      row.push(r.check_in_at ? new Date(r.check_in_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—");
    }
    if (columns.catatan) row.push((r as unknown as Record<string, string>).verification_note ?? "—");
    return row;
  });

  autoTable(doc, {
    head,
    body,
    startY: metaY + 8,
    margin: { left: mx, right: mx },
    ...REPORT_TABLE_STYLE,
  });

  drawReportPdfFooter(doc, `Laporan Absensi Kelas — ${homeroom.class_name} — ABSENSI CN`);

  doc.save(`Laporan-Walas-Absensi-${homeroom.class_name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeroom: StaffHomeroomContext;
};

export function WalasAbsensiReportModal({ open, onOpenChange, homeroom }: Props) {
  const [dateMode, setDateMode] = useState<DateMode | null>(null);
  const [specificDate, setSpecificDate] = useState("");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [specificDateOpen, setSpecificDateOpen] = useState(false);
  const [rangeFromOpen, setRangeFromOpen] = useState(false);
  const [rangeToOpen, setRangeToOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter | null>(null);
  const [columns, setColumns] = useState<Columns>({ nis: true, status: true, checkin: false, catatan: false });
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [generating, setGenerating] = useState(false);

  const rangeValid = !rangeFrom || !rangeTo || rangeFrom <= rangeTo;
  const q1Answered =
    dateMode === "today" ||
    (dateMode === "specific" && specificDate !== "") ||
    (dateMode === "range" && rangeFrom !== "" && rangeTo !== "" && rangeValid);

  const showQ2 = q1Answered;
  const showQ3 = q1Answered && statusFilter !== null;
  const canDownload = showQ3 && sortBy !== null;

  function resetState() {
    setDateMode(null);
    setSpecificDate("");
    setRangeFrom("");
    setRangeTo("");
    setStatusFilter(null);
    setColumns({ nis: true, status: true, checkin: false, catatan: false });
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
      const statusParam = statusFilter === "Semua" ? "" : (statusFilter ?? "");

      const overview = await getTeacherHomeroomAttendanceOverview({ date: dateParam, status: statusParam });
      let records = overview.records ?? [];

      if (dateMode === "range" && rangeFrom && rangeTo) {
        records = records.filter((r) => r.attendance_date >= rangeFrom && r.attendance_date <= rangeTo);
      }

      if (statusFilter && statusFilter !== "Semua") {
        records = records.filter((r) => r.status?.toLowerCase() === statusFilter);
      }

      if (records.length === 0) {
        toast.warning("Tidak ada data absensi yang sesuai filter.");
        return;
      }

      const sorted = [...records].sort((a, b) => {
        if (sortBy === "name") return a.student_name.localeCompare(b.student_name, "id");
        if (sortBy === "nis") return a.nis.localeCompare(b.nis, "id");
        if (sortBy === "status") return (a.status ?? "").localeCompare(b.status ?? "", "id");
        if (sortBy === "checkin") return (a.check_in_at ?? "").localeCompare(b.check_in_at ?? "", "id");
        return 0;
      });

      const periodeLabel =
        dateMode === "today"
          ? `Hari ini (${todayDisplay()})`
          : dateMode === "specific"
          ? formatDisplayDate(specificDate)
          : `${formatDisplayDate(rangeFrom)} – ${formatDisplayDate(rangeTo)}`;

      const statusLabel = statusFilter ? STATUS_LABELS[statusFilter] : "Semua Status";
      const sortLabel =
        sortBy === "name" ? "Nama (A–Z)" :
        sortBy === "nis" ? "NIS" :
        sortBy === "status" ? "Status" : "Waktu Check-in";

      await generateWalasAbsensiPdf(sorted, homeroom, periodeLabel, statusLabel, sortLabel, columns);
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
      description="Pilih periode dan filter, lalu unduh PDF rekap absensi kelas siap cetak."
      icon={Printer}
      className="sm:!max-w-[660px]"
    >
      <div className="space-y-4">
        {/* Q1 — Periode */}
        <QuestionBlock icon={CalendarClock} label="Pilih periode absensi" answered={q1Answered}>
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

          {/* Specific date picker */}
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
                        onSelect={(d) => { setSpecificDate(d ? toDateInputValue(d) : ""); setStatusFilter(null); setSortBy(null); setSpecificDateOpen(false); }}
                        locale={localeID}
                        buttonVariant="ghost"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Range date picker */}
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
                        <PopoverHeader className="px-2 pt-1 pb-2"><PopoverTitle className="text-sm font-semibold text-slate-900">Tanggal mulai</PopoverTitle></PopoverHeader>
                        <Calendar mode="single" selected={parseDateValue(rangeFrom)} onSelect={(d) => { setRangeFrom(d ? toDateInputValue(d) : ""); setStatusFilter(null); setSortBy(null); setRangeFromOpen(false); }} locale={localeID} buttonVariant="ghost" />
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
                        <PopoverHeader className="px-2 pt-1 pb-2"><PopoverTitle className="text-sm font-semibold text-slate-900">Tanggal akhir</PopoverTitle></PopoverHeader>
                        <Calendar mode="single" selected={parseDateValue(rangeTo)} onSelect={(d) => { setRangeTo(d ? toDateInputValue(d) : ""); setStatusFilter(null); setSortBy(null); setRangeToOpen(false); }} locale={localeID} buttonVariant="ghost" />
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

        {/* Q2 — Status filter */}
        <AnimatePresence>
          {showQ2 && (
            <motion.div key="q2" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.26, ease: "easeOut" }}>
              <QuestionBlock icon={Activity} label="Filter berdasarkan status kehadiran" answered={statusFilter !== null}>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(["Semua", "hadir", "telat", "alfa", "izin", "sakit"] as StatusFilter[]).map((s) => (
                    <ReportRadio key={s} selected={statusFilter === s} label={STATUS_LABELS[s]} onClick={() => { setStatusFilter(s); setSortBy(null); }} />
                  ))}
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Q3 — Kolom */}
        <AnimatePresence>
          {showQ3 && (
            <motion.div key="q3" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.26, ease: "easeOut" }}>
              <QuestionBlock icon={ListChecks} label="Kolom yang ingin ditampilkan" answered>
                <div className="grid gap-2 sm:grid-cols-3">
                  <ReportCheckbox checked disabled label="Nama & Tanggal" badge="wajib" />
                  <ReportCheckbox checked={columns.nis} onChange={(v) => setColumns((c) => ({ ...c, nis: v }))} label="NIS" />
                  <ReportCheckbox checked={columns.status} onChange={(v) => setColumns((c) => ({ ...c, status: v }))} label="Status" />
                  <ReportCheckbox checked={columns.checkin} onChange={(v) => setColumns((c) => ({ ...c, checkin: v }))} label="Waktu Check-in" />
                  <ReportCheckbox checked={columns.catatan} onChange={(v) => setColumns((c) => ({ ...c, catatan: v }))} label="Catatan" />
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Q4 — Urutan */}
        <AnimatePresence>
          {showQ3 && (
            <motion.div key="q4" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.26, ease: "easeOut", delay: 0.08 }}>
              <QuestionBlock icon={ArrowUpDown} label="Urutkan data berdasarkan" answered={sortBy !== null}>
                <div className="grid gap-2 sm:grid-cols-2">
                  <ReportRadio selected={sortBy === "name"} label="Nama (A–Z)" onClick={() => setSortBy("name")} />
                  <ReportRadio selected={sortBy === "nis"} label="NIS" onClick={() => setSortBy("nis")} />
                  <ReportRadio selected={sortBy === "status"} label="Status" onClick={() => setSortBy("status")} />
                  <ReportRadio selected={sortBy === "checkin"} label="Waktu check-in" onClick={() => setSortBy("checkin")} />
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
