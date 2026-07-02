"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  PremiumModal,
  premiumModalActionsClassName,
} from "@/components/modals/premium-modal";
import { applyPdfCreditMetadata } from "@/lib/reports/pdf-metadata";
import { cn } from "@/lib/utils";
import {
  QuestionBlock,
  ReportCheckbox,
  ReportRadio,
} from "@/components/reports/admin/guru-report-modal";
import { getBKSubmissionsOverview } from "@/services/staff.service";
import type { StaffBKClassSummary, StaffSubmission } from "@/types/staff";
import {
  ArrowUpDown,
  ClipboardCheck,
  FileText,
  GraduationCap,
  ListChecks,
  Printer,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type ClassFilter = "all" | "specific";
type TypeFilter = "Semua" | "IZIN" | "SAKIT" | "DISPENSASI";
type StatusFilter = "Semua" | "menunggu" | "diterima" | "ditolak";
type SortBy = "name" | "nis" | "type" | "status" | "date_desc";

type Columns = {
  kelas: boolean;
  tipe: boolean;
  alasan: boolean;
  status: boolean;
  catatanReview: boolean;
  waktu: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  IZIN: "Izin",
  SAKIT: "Sakit",
  DISPENSASI: "Dispensasi",
};

const STATUS_LABEL: Record<string, string> = {
  menunggu: "Menunggu",
  diterima: "Diterima",
  ditolak: "Ditolak",
};

function normalizeStatus(val?: string) {
  return (val || "").toLowerCase().trim();
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

// ─── PDF generator ────────────────────────────────────────────────────────────

async function generateBKPengajuanPdf(
  records: StaffSubmission[],
  meta: { kelas: string; tipe: string; status: string; urutan: string },
  columns: Columns,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan Pengajuan BK");
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
  doc.text("LAPORAN PENGAJUAN SISWA — BK", W - mx - 5, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(167, 243, 208);
  doc.text(`Dicetak: ${now}`, W - mx - 5, 24, { align: "right" });

  // Meta pills
  const metaY = 37;
  const pills = [
    `Kelas: ${meta.kelas}`,
    `Tipe: ${meta.tipe}`,
    `Status: ${meta.status}`,
    `Total: ${records.length} pengajuan`,
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
  if (columns.tipe) head[0].push("Tipe");
  if (columns.alasan) head[0].push("Alasan");
  if (columns.status) head[0].push("Status");
  if (columns.catatanReview) head[0].push("Catatan Review");
  if (columns.waktu) head[0].push("Waktu");

  const body = records.map((r, i) => {
    const row: string[] = [String(i + 1), r.student_name, r.nis];
    if (columns.kelas) row.push(r.class_name || "—");
    if (columns.tipe) row.push(TYPE_LABEL[r.type] ?? r.type);
    if (columns.alasan) row.push(truncate(r.reason, 80));
    if (columns.status) row.push(STATUS_LABEL[normalizeStatus(r.status)] ?? r.status);
    if (columns.catatanReview) row.push(r.review_note ? truncate(r.review_note, 80) : "—");
    if (columns.waktu) row.push(formatDateTime(r.created_at));
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
    doc.text("Laporan Pengajuan Siswa — BK ABSENSI CN", mx, H - 4);
    doc.text(`Halaman ${i} / ${totalPages}`, W - mx, H - 4, { align: "right" });
  }

  doc.save(`Laporan-Pengajuan-BK-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: StaffBKClassSummary[];
};

export function BKPengajuanReportModal({ open, onOpenChange, classes }: Props) {
  const [classFilter, setClassFilter] = useState<ClassFilter | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter | null>(null);
  const [columns, setColumns] = useState<Columns>({
    kelas: true,
    tipe: true,
    alasan: true,
    status: true,
    catatanReview: false,
    waktu: true,
  });
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [generating, setGenerating] = useState(false);

  const q1FullyAnswered =
    classFilter === "all" || (classFilter === "specific" && selectedClassId !== null);
  const showQ2 = q1FullyAnswered;
  const showQ3 = q1FullyAnswered && typeFilter !== null;
  const showQ4 = showQ3 && statusFilter !== null;
  const canDownload = showQ4 && sortBy !== null;

  const selectedClass = useMemo(
    () => classes.find((c) => c.class_id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );

  function reset() {
    setClassFilter(null);
    setSelectedClassId(null);
    setTypeFilter(null);
    setStatusFilter(null);
    setColumns({ kelas: true, tipe: true, alasan: true, status: true, catatanReview: false, waktu: true });
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
      const overview = await getBKSubmissionsOverview({
        class_id: classFilter === "specific" && selectedClassId ? selectedClassId : "",
        type: typeFilter === "Semua" ? "" : (typeFilter ?? ""),
        status: statusFilter === "Semua" ? "" : (statusFilter ?? ""),
      });

      const records = overview.records ?? [];
      if (records.length === 0) {
        toast.warning("Tidak ada pengajuan yang sesuai filter.");
        return;
      }

      const TYPE_SORT_ORDER: Record<string, number> = { IZIN: 0, SAKIT: 1, DISPENSASI: 2 };
      const STATUS_SORT_ORDER: Record<string, number> = { menunggu: 0, diterima: 1, ditolak: 2 };

      const sorted = [...records].sort((a, b) => {
        if (sortBy === "name") return a.student_name.localeCompare(b.student_name, "id");
        if (sortBy === "nis") return a.nis.localeCompare(b.nis, "id");
        if (sortBy === "type") {
          return (TYPE_SORT_ORDER[a.type] ?? 9) - (TYPE_SORT_ORDER[b.type] ?? 9);
        }
        if (sortBy === "status") {
          return (STATUS_SORT_ORDER[normalizeStatus(a.status)] ?? 9) - (STATUS_SORT_ORDER[normalizeStatus(b.status)] ?? 9);
        }
        if (sortBy === "date_desc") return (b.created_at ?? "").localeCompare(a.created_at ?? "");
        return 0;
      });

      const meta = {
        kelas: classFilter === "specific" && selectedClass
          ? selectedClass.class_name
          : "Semua Kelas",
        tipe: typeFilter === "Semua" || !typeFilter
          ? "Semua"
          : (TYPE_LABEL[typeFilter] ?? typeFilter),
        status: statusFilter === "Semua" || !statusFilter
          ? "Semua"
          : (STATUS_LABEL[statusFilter] ?? statusFilter),
        urutan:
          sortBy === "name" ? "Nama (A–Z)" :
          sortBy === "nis" ? "NIS" :
          sortBy === "type" ? "Tipe" :
          sortBy === "status" ? "Status" : "Waktu (Terbaru)",
      };

      await generateBKPengajuanPdf(sorted, meta, columns);
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
      title="Cetak Laporan Pengajuan BK"
      description="Filter kelas, tipe, dan status pengajuan — unduh PDF rekap izin & dispensasi siap cetak."
      icon={Printer}
      className="sm:!max-w-[640px]"
    >
      <div className="space-y-4">
        {/* Q1 — Kelas */}
        <QuestionBlock icon={GraduationCap} label="Filter per kelas" answered={q1FullyAnswered}>
          <div className="grid gap-2 sm:grid-cols-2">
            <ReportRadio
              selected={classFilter === "all"}
              label="Semua Kelas"
              badge={`${classes.length} kelas`}
              onClick={() => { setClassFilter("all"); setSelectedClassId(null); setTypeFilter(null); setStatusFilter(null); setSortBy(null); }}
            />
            <ReportRadio
              selected={classFilter === "specific"}
              label="Per Kelas Tertentu"
              onClick={() => { setClassFilter("specific"); setSelectedClassId(null); setTypeFilter(null); setStatusFilter(null); setSortBy(null); }}
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
                      onClick={() => { setSelectedClassId(cls.class_id); setTypeFilter(null); setStatusFilter(null); setSortBy(null); }}
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

        {/* Q2 — Tipe pengajuan */}
        <AnimatePresence>
          {showQ2 && (
            <motion.div
              key="q2"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
            >
              <QuestionBlock icon={FileText} label="Tipe pengajuan" answered={typeFilter !== null}>
                <div className="grid gap-2 sm:grid-cols-2">
                  <ReportRadio selected={typeFilter === "Semua"} label="Semua Tipe" onClick={() => { setTypeFilter("Semua"); setStatusFilter(null); setSortBy(null); }} />
                  <ReportRadio selected={typeFilter === "IZIN"} label="Izin" onClick={() => { setTypeFilter("IZIN"); setStatusFilter(null); setSortBy(null); }} />
                  <ReportRadio selected={typeFilter === "SAKIT"} label="Sakit" onClick={() => { setTypeFilter("SAKIT"); setStatusFilter(null); setSortBy(null); }} />
                  <ReportRadio selected={typeFilter === "DISPENSASI"} label="Dispensasi" onClick={() => { setTypeFilter("DISPENSASI"); setStatusFilter(null); setSortBy(null); }} />
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Q3 — Status pengajuan */}
        <AnimatePresence>
          {showQ3 && (
            <motion.div
              key="q3"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
            >
              <QuestionBlock icon={ClipboardCheck} label="Status pengajuan" answered={statusFilter !== null}>
                <div className="grid gap-2 sm:grid-cols-2">
                  <ReportRadio selected={statusFilter === "Semua"} label="Semua Status" onClick={() => { setStatusFilter("Semua"); setSortBy(null); }} />
                  <ReportRadio selected={statusFilter === "menunggu"} label="Menunggu" onClick={() => { setStatusFilter("menunggu"); setSortBy(null); }} />
                  <ReportRadio selected={statusFilter === "diterima"} label="Diterima" onClick={() => { setStatusFilter("diterima"); setSortBy(null); }} />
                  <ReportRadio selected={statusFilter === "ditolak"} label="Ditolak" onClick={() => { setStatusFilter("ditolak"); setSortBy(null); }} />
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
                  <ReportCheckbox checked={columns.tipe} onChange={(v) => setColumns((c) => ({ ...c, tipe: v }))} label="Tipe" />
                  <ReportCheckbox checked={columns.alasan} onChange={(v) => setColumns((c) => ({ ...c, alasan: v }))} label="Alasan" />
                  <ReportCheckbox checked={columns.status} onChange={(v) => setColumns((c) => ({ ...c, status: v }))} label="Status" />
                  <ReportCheckbox checked={columns.catatanReview} onChange={(v) => setColumns((c) => ({ ...c, catatanReview: v }))} label="Catatan Review" />
                  <ReportCheckbox checked={columns.waktu} onChange={(v) => setColumns((c) => ({ ...c, waktu: v }))} label="Waktu" />
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
                  <ReportRadio selected={sortBy === "type"} label="Tipe Pengajuan" onClick={() => setSortBy("type")} />
                  <ReportRadio selected={sortBy === "status"} label="Status" onClick={() => setSortBy("status")} />
                  <ReportRadio selected={sortBy === "date_desc"} label="Waktu (Terbaru)" onClick={() => setSortBy("date_desc")} />
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
