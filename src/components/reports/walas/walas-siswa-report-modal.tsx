"use client";

import { AnimatePresence, motion } from "motion/react";
import { PremiumModal, premiumModalActionsClassName } from "@/components/modals/premium-modal";
import { Button } from "@/components/ui/button";
import { applyPdfCreditMetadata } from "@/lib/reports/pdf-metadata";
import { cn } from "@/lib/utils";
import { QuestionBlock, ReportCheckbox, ReportRadio } from "@/components/reports/admin/guru-report-modal";
import { getTeacherHomeroomStudents } from "@/services/staff.service";
import type { StaffHomeroomContext, StaffStudentSummary } from "@/types/staff";
import { ArrowUpDown, ListChecks, Printer, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ConditionFilter = "Semua" | "aktif" | "perlu_perhatian" | "stabil";
type SortBy = "name" | "nis" | "alpha" | "late";
type Columns = {
  nis: boolean;
  gender: boolean;
  identitas: boolean;
  telat: boolean;
  alfa: boolean;
  izinSakit: boolean;
  status: boolean;
};

const CONDITION_LABELS: Record<ConditionFilter, string> = {
  Semua: "Semua Siswa",
  aktif: "Aktif Saja",
  perlu_perhatian: "Perlu Perhatian",
  stabil: "Stabil",
};

async function generateWalasSiswaPdf(
  data: StaffStudentSummary[],
  homeroom: StaffHomeroomContext,
  conditionLabel: string,
  sortLabel: string,
  columns: Columns,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan Walas Siswa");
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const mx = 14;
  const now = new Date().toLocaleString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

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
  doc.text("Laporan Wali Kelas", mx + 5, 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("LAPORAN SISWA KELAS", W - mx - 5, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(167, 243, 208);
  doc.text(`Dicetak: ${now}`, W - mx - 5, 24, { align: "right" });

  // Meta pills
  const metaY = 37;
  const pills = [
    `Kelas: ${homeroom.class_name}`,
    `T.A.: ${homeroom.school_year_name}`,
    `Filter: ${conditionLabel}`,
    `Total: ${data.length} siswa`,
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

  // Table
  const head: string[][] = [["No", "Nama Siswa"]];
  if (columns.nis) head[0].push("NIS / NISN");
  if (columns.gender) head[0].push("Gender");
  if (columns.identitas) head[0].push("Telepon");
  if (columns.telat) head[0].push("Telat");
  if (columns.alfa) head[0].push("Alfa");
  if (columns.izinSakit) head[0].push("Izin/Sakit");
  if (columns.status) head[0].push("Status");

  const body = data.map((s, i) => {
    const row: string[] = [String(i + 1), s.name];
    if (columns.nis) row.push(`${s.nis}\n${s.nisn ?? "—"}`);
    if (columns.gender) {
      const g = (s.gender ?? "").toUpperCase();
      row.push(g === "MALE" ? "Laki-laki" : g === "FEMALE" ? "Perempuan" : "—");
    }
    if (columns.identitas) row.push(s.nisn || "—");
    if (columns.telat) row.push(String(s.late_count));
    if (columns.alfa) row.push(String(s.alpha_count));
    if (columns.izinSakit) row.push(String(s.permission_count + s.sick_count));
    if (columns.status) row.push(s.is_active ? "Aktif" : "Nonaktif");
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
    doc.text(`Laporan Siswa Kelas — ${homeroom.class_name} — ABSENSI CN`, mx, H - 4);
    doc.text(`Halaman ${i} / ${totalPages}`, W - mx, H - 4, { align: "right" });
  }

  doc.save(`Laporan-Walas-Siswa-${homeroom.class_name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeroom: StaffHomeroomContext;
};

export function WalasSiswaReportModal({ open, onOpenChange, homeroom }: Props) {
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter | null>(null);
  const [columns, setColumns] = useState<Columns>({ nis: true, gender: false, identitas: false, telat: true, alfa: true, izinSakit: false, status: false });
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [generating, setGenerating] = useState(false);

  const showQ2 = conditionFilter !== null;
  const canDownload = conditionFilter !== null && sortBy !== null;

  function resetState() {
    setConditionFilter(null);
    setColumns({ nis: true, gender: false, identitas: false, telat: true, alfa: true, izinSakit: false, status: false });
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
      const students = await getTeacherHomeroomStudents();
      let filtered = students ?? [];

      if (conditionFilter === "aktif") {
        filtered = filtered.filter((s) => s.is_active);
      } else if (conditionFilter === "perlu_perhatian") {
        filtered = filtered.filter((s) => s.late_count > 0 || s.alpha_count > 0);
      } else if (conditionFilter === "stabil") {
        filtered = filtered.filter((s) => s.late_count === 0 && s.alpha_count === 0);
      }

      if (filtered.length === 0) {
        toast.warning("Tidak ada siswa yang sesuai filter.");
        return;
      }

      const sorted = [...filtered].sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name, "id");
        if (sortBy === "nis") return a.nis.localeCompare(b.nis, "id");
        if (sortBy === "alpha") return b.alpha_count - a.alpha_count;
        if (sortBy === "late") return b.late_count - a.late_count;
        return 0;
      });

      const conditionLabel = conditionFilter ? CONDITION_LABELS[conditionFilter] : "Semua Siswa";
      const sortLabel = sortBy === "name" ? "Nama (A–Z)" : sortBy === "nis" ? "NIS" : sortBy === "alpha" ? "Alfa (terbanyak)" : "Telat (terbanyak)";

      await generateWalasSiswaPdf(sorted, homeroom, conditionLabel, sortLabel, columns);
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
      title="Cetak Laporan Siswa Kelas"
      description="Filter kondisi dan kolom, lalu unduh PDF daftar siswa wali kelas siap cetak."
      icon={Printer}
      className="sm:!max-w-[620px]"
    >
      <div className="space-y-4">
        {/* Q1 — Filter kondisi */}
        <QuestionBlock icon={TriangleAlert} label="Filter berdasarkan kondisi siswa" answered={conditionFilter !== null}>
          <div className="grid gap-2 sm:grid-cols-2">
            {(["Semua", "aktif", "perlu_perhatian", "stabil"] as ConditionFilter[]).map((c) => (
              <ReportRadio
                key={c}
                selected={conditionFilter === c}
                label={CONDITION_LABELS[c]}
                onClick={() => { setConditionFilter(c); setSortBy(null); }}
              />
            ))}
          </div>
        </QuestionBlock>

        {/* Q2 — Kolom */}
        <AnimatePresence>
          {showQ2 && (
            <motion.div key="q2" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.26, ease: "easeOut" }}>
              <QuestionBlock icon={ListChecks} label="Kolom yang ingin ditampilkan" answered>
                <div className="grid gap-2 sm:grid-cols-3">
                  <ReportCheckbox checked disabled label="Nama" badge="wajib" />
                  <ReportCheckbox checked={columns.nis} onChange={(v) => setColumns((c) => ({ ...c, nis: v }))} label="NIS / NISN" />
                  <ReportCheckbox checked={columns.gender} onChange={(v) => setColumns((c) => ({ ...c, gender: v }))} label="Gender" />
                  <ReportCheckbox checked={columns.identitas} onChange={(v) => setColumns((c) => ({ ...c, identitas: v }))} label="Telepon" />
                  <ReportCheckbox checked={columns.telat} onChange={(v) => setColumns((c) => ({ ...c, telat: v }))} label="Telat" />
                  <ReportCheckbox checked={columns.alfa} onChange={(v) => setColumns((c) => ({ ...c, alfa: v }))} label="Alfa" />
                  <ReportCheckbox checked={columns.izinSakit} onChange={(v) => setColumns((c) => ({ ...c, izinSakit: v }))} label="Izin/Sakit" />
                  <ReportCheckbox checked={columns.status} onChange={(v) => setColumns((c) => ({ ...c, status: v }))} label="Status" />
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Q3 — Urutan */}
        <AnimatePresence>
          {showQ2 && (
            <motion.div key="q3" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.26, ease: "easeOut", delay: 0.08 }}>
              <QuestionBlock icon={ArrowUpDown} label="Urutkan data berdasarkan" answered={sortBy !== null}>
                <div className="grid gap-2 sm:grid-cols-2">
                  <ReportRadio selected={sortBy === "name"} label="Nama (A–Z)" onClick={() => setSortBy("name")} />
                  <ReportRadio selected={sortBy === "nis"} label="NIS" onClick={() => setSortBy("nis")} />
                  <ReportRadio selected={sortBy === "alpha"} label="Alfa (terbanyak)" onClick={() => setSortBy("alpha")} />
                  <ReportRadio selected={sortBy === "late"} label="Telat (terbanyak)" onClick={() => setSortBy("late")} />
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
