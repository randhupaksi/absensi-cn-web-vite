"use client";

import { AnimatePresence, motion } from "motion/react";
import { PremiumModal, premiumModalActionsClassName } from "@/components/modals/premium-modal";
import { Button } from "@/components/ui/button";
import { applyPdfCreditMetadata } from "@/lib/reports/pdf-metadata";
import { cn } from "@/lib/utils";
import { QuestionBlock, ReportCheckbox, ReportRadio } from "@/components/reports/admin/guru-report-modal";
import { getTeacherHomeroomSubmissionsOverview } from "@/services/staff.service";
import type { StaffHomeroomContext, StaffSubmission } from "@/types/staff";
import { ArrowUpDown, ClipboardCheck, FileText, ListChecks, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type TypeFilter = "Semua" | "IZIN" | "SAKIT" | "DISPENSASI";
type StatusFilter = "Semua" | "menunggu" | "diterima" | "ditolak";
type SortBy = "name" | "nis" | "type" | "status" | "newest";
type Columns = { nis: boolean; type: boolean; reason: boolean; status: boolean; catatan: boolean; waktu: boolean };

const TYPE_LABELS: Record<TypeFilter, string> = {
  Semua: "Semua Tipe",
  IZIN: "Izin",
  SAKIT: "Sakit",
  DISPENSASI: "Dispensasi",
};

const STATUS_LABELS: Record<StatusFilter, string> = {
  Semua: "Semua Status",
  menunggu: "Menunggu",
  diterima: "Diterima",
  ditolak: "Ditolak",
};

async function generateWalasPengajuanPdf(
  records: StaffSubmission[],
  homeroom: StaffHomeroomContext,
  typeLabel: string,
  statusLabel: string,
  sortLabel: string,
  columns: Columns,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan Walas Pengajuan");
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const mx = 14;
  const now = new Date().toLocaleString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  doc.setFillColor(6, 78, 59);
  doc.roundedRect(mx, 10, W - mx * 2, 22, 2.5, 2.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(236, 253, 245);
  doc.text("ABSENSI CN", mx + 5, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(167, 243, 208);
  doc.text("Laporan Wali Kelas", mx + 5, 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("LAPORAN PENGAJUAN KELAS", W - mx - 5, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(167, 243, 208);
  doc.text(`Dicetak: ${now}`, W - mx - 5, 24, { align: "right" });

  const metaY = 37;
  const pills = [
    `Kelas: ${homeroom.class_name}`,
    `Tipe: ${typeLabel}`,
    `Status: ${statusLabel}`,
    `Total: ${records.length} pengajuan`,
    `Urutan: ${sortLabel}`,
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

  const head: string[][] = [["No", "Nama Siswa"]];
  if (columns.nis) head[0].push("NIS");
  if (columns.type) head[0].push("Tipe");
  if (columns.reason) head[0].push("Alasan");
  if (columns.status) head[0].push("Status");
  if (columns.catatan) head[0].push("Catatan Review");
  if (columns.waktu) head[0].push("Waktu");

  const body = records.map((r, i) => {
    const row: string[] = [String(i + 1), r.student_name];
    if (columns.nis) row.push(r.nis);
    if (columns.type) row.push(r.type ?? "—");
    if (columns.reason) row.push(r.reason ?? "—");
    if (columns.status) {
      const s = r.status ?? "";
      row.push(s.charAt(0).toUpperCase() + s.slice(1).toLowerCase());
    }
    if (columns.catatan) row.push((r as unknown as Record<string, string>).review_note ?? "—");
    if (columns.waktu) {
      const ts = (r as unknown as Record<string, string>).created_at ?? (r as unknown as Record<string, string>).submitted_at;
      row.push(ts ? new Date(ts).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—");
    }
    return row;
  });

  autoTable(doc, {
    head,
    body,
    startY: metaY + 8,
    margin: { left: mx, right: mx },
    styles: { fontSize: 8, cellPadding: { horizontal: 4, vertical: 4 }, lineColor: [226, 232, 240], lineWidth: 0.2, font: "helvetica", textColor: [51, 65, 85], overflow: "linebreak" },
    headStyles: { fillColor: [6, 78, 59], textColor: [236, 253, 245], fontStyle: "bold", fontSize: 7.5, halign: "center" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 14, halign: "center", fontStyle: "bold" } },
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(mx, H - 8, W - mx, H - 8);
    doc.text(`Laporan Pengajuan Kelas — ${homeroom.class_name} — ABSENSI CN`, mx, H - 4);
    doc.text(`Halaman ${i} / ${totalPages}`, W - mx, H - 4, { align: "right" });
  }

  doc.save(`Laporan-Walas-Pengajuan-${homeroom.class_name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeroom: StaffHomeroomContext;
};

export function WalasPengajuanReportModal({ open, onOpenChange, homeroom }: Props) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter | null>(null);
  const [columns, setColumns] = useState<Columns>({ nis: true, type: true, reason: true, status: true, catatan: false, waktu: false });
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [generating, setGenerating] = useState(false);

  const showQ2 = typeFilter !== null;
  const showQ3 = typeFilter !== null && statusFilter !== null;
  const canDownload = showQ3 && sortBy !== null;

  function resetState() {
    setTypeFilter(null);
    setStatusFilter(null);
    setColumns({ nis: true, type: true, reason: true, status: true, catatan: false, waktu: false });
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
      const overview = await getTeacherHomeroomSubmissionsOverview({
        type: typeFilter === "Semua" ? "" : (typeFilter ?? ""),
        status: statusFilter === "Semua" ? "" : (statusFilter ?? ""),
      });

      const records = overview.records ?? [];
      if (records.length === 0) {
        toast.warning("Tidak ada pengajuan yang sesuai filter.");
        return;
      }

      const sorted = [...records].sort((a, b) => {
        if (sortBy === "name") return a.student_name.localeCompare(b.student_name, "id");
        if (sortBy === "nis") return a.nis.localeCompare(b.nis, "id");
        if (sortBy === "type") return (a.type ?? "").localeCompare(b.type ?? "", "id");
        if (sortBy === "status") return (a.status ?? "").localeCompare(b.status ?? "", "id");
        // newest: sort by created_at desc
        const aTs = (a as unknown as Record<string, string>).created_at ?? "";
        const bTs = (b as unknown as Record<string, string>).created_at ?? "";
        return bTs.localeCompare(aTs);
      });

      const typeLabel = typeFilter ? TYPE_LABELS[typeFilter] : "Semua Tipe";
      const statusLabel = statusFilter ? STATUS_LABELS[statusFilter] : "Semua Status";
      const sortLabel =
        sortBy === "name" ? "Nama (A–Z)" :
        sortBy === "nis" ? "NIS" :
        sortBy === "type" ? "Tipe" :
        sortBy === "status" ? "Status" : "Waktu terbaru";

      await generateWalasPengajuanPdf(sorted, homeroom, typeLabel, statusLabel, sortLabel, columns);
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
      title="Cetak Laporan Pengajuan Kelas"
      description="Filter tipe dan status, lalu unduh PDF rekap pengajuan kelas siap cetak."
      icon={Printer}
      className="sm:!max-w-[640px]"
    >
      <div className="space-y-4">
        {/* Q1 — Tipe */}
        <QuestionBlock icon={FileText} label="Filter berdasarkan tipe pengajuan" answered={typeFilter !== null}>
          <div className="grid gap-2 sm:grid-cols-2">
            {(["Semua", "IZIN", "SAKIT", "DISPENSASI"] as TypeFilter[]).map((t) => (
              <ReportRadio key={t} selected={typeFilter === t} label={TYPE_LABELS[t]} onClick={() => { setTypeFilter(t); setStatusFilter(null); setSortBy(null); }} />
            ))}
          </div>
        </QuestionBlock>

        {/* Q2 — Status */}
        <AnimatePresence>
          {showQ2 && (
            <motion.div key="q2" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.26, ease: "easeOut" }}>
              <QuestionBlock icon={ClipboardCheck} label="Filter berdasarkan status pengajuan" answered={statusFilter !== null}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["Semua", "menunggu", "diterima", "ditolak"] as StatusFilter[]).map((s) => (
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
                  <ReportCheckbox checked disabled label="Nama" badge="wajib" />
                  <ReportCheckbox checked={columns.nis} onChange={(v) => setColumns((c) => ({ ...c, nis: v }))} label="NIS" />
                  <ReportCheckbox checked={columns.type} onChange={(v) => setColumns((c) => ({ ...c, type: v }))} label="Tipe" />
                  <ReportCheckbox checked={columns.reason} onChange={(v) => setColumns((c) => ({ ...c, reason: v }))} label="Alasan" />
                  <ReportCheckbox checked={columns.status} onChange={(v) => setColumns((c) => ({ ...c, status: v }))} label="Status" />
                  <ReportCheckbox checked={columns.catatan} onChange={(v) => setColumns((c) => ({ ...c, catatan: v }))} label="Catatan Review" />
                  <ReportCheckbox checked={columns.waktu} onChange={(v) => setColumns((c) => ({ ...c, waktu: v }))} label="Waktu Pengajuan" />
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
                  <ReportRadio selected={sortBy === "type"} label="Tipe" onClick={() => setSortBy("type")} />
                  <ReportRadio selected={sortBy === "status"} label="Status" onClick={() => setSortBy("status")} />
                  <ReportRadio selected={sortBy === "newest"} label="Waktu terbaru" onClick={() => setSortBy("newest")} />
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className={premiumModalActionsClassName}>
          <Button type="button" variant="outline" className="h-10 rounded-[0.8rem] border-slate-200 px-5 text-[0.88rem] text-slate-600" onClick={() => handleClose(false)}>
            Batal
          </Button>
          <button
            type="button"
            disabled={!canDownload || generating}
            onClick={handleDownload}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-[0.8rem] px-6 text-[0.88rem] font-semibold text-white transition-all duration-200",
              canDownload && !generating
                ? "bg-emerald-600 shadow-[0_4px_14px_rgba(5,150,105,0.3)] hover:-translate-y-px hover:bg-emerald-700 hover:shadow-[0_6px_20px_rgba(5,150,105,0.38)]"
                : "cursor-not-allowed bg-slate-300",
            )}
          >
            {generating ? (
              <><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Memuat data & membuat PDF...</>
            ) : (
              <><Printer className="size-4" />Download PDF</>
            )}
          </button>
        </div>
      </div>
    </PremiumModal>
  );
}
