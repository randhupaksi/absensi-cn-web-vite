"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  PremiumModal,
  premiumModalActionsClassName,
} from "@/components/modals/premium-modal";
import { Button } from "@/components/ui/button";
import { applyPdfCreditMetadata } from "@/lib/reports/pdf-metadata";
import { cn } from "@/lib/utils";
import {
  QuestionBlock,
  ReportCheckbox,
  ReportRadio,
} from "@/components/reports/admin/guru-report-modal";
import { getBKStudentsOverview } from "@/services/staff.service";
import type { StaffBKClassSummary, StaffStudentSummary } from "@/types/staff";
import { ArrowUpDown, GraduationCap, ListChecks, Printer, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type ClassFilter = "all" | "specific";
type RiskFilter = "Semua" | "need_attention" | "late" | "alpha" | "counseling" | "stable";
type SortBy = "name" | "nis" | "alpha" | "late";
type Columns = {
  kelas: boolean;
  identitas: boolean;
  telat: boolean;
  alfa: boolean;
  izinSakit: boolean;
  status: boolean;
};

const RISK_LABELS: Record<RiskFilter, string> = {
  Semua: "Semua Siswa",
  need_attention: "Perlu Perhatian",
  late: "Ada Telat",
  alpha: "Ada Alfa",
  counseling: "Punya Catatan BK",
  stable: "Stabil",
};

// ─── PDF generator ────────────────────────────────────────────────────────────

async function generateBKSiswaPdf(
  data: StaffStudentSummary[],
  filterKelasLabel: string,
  filterRisikoLabel: string,
  sortLabel: string,
  columns: Columns,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan BK Siswa");
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
  doc.text("LAPORAN MONITORING SISWA", W - mx - 5, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(167, 243, 208);
  doc.text(`Dicetak: ${now}`, W - mx - 5, 24, { align: "right" });

  // Meta pills
  const metaY = 37;
  const pills = [
    `Kelas: ${filterKelasLabel}`,
    `Risiko: ${filterRisikoLabel}`,
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

  // Build table
  const head: string[][] = [["No", "Nama Siswa", "NIS"]];
  if (columns.kelas) head[0].push("Kelas");
  if (columns.identitas) head[0].push("Identitas");
  if (columns.telat) head[0].push("Telat");
  if (columns.alfa) head[0].push("Alfa");
  if (columns.izinSakit) head[0].push("Izin/Sakit");
  if (columns.status) head[0].push("Status");

  const body = data.map((s, i) => {
    const row: string[] = [String(i + 1), s.name, s.nis];
    if (columns.kelas) {
      row.push([s.class_name, s.school_year_name].filter(Boolean).join("\n") || "—");
    }
    if (columns.identitas) {
      const gender = s.gender === "MALE" ? "Laki-laki" : s.gender === "FEMALE" ? "Perempuan" : "—";
      row.push(`${gender}\nNISN: ${s.nisn || "—"}`);
    }
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
    doc.text("Laporan Monitoring Siswa — BK ABSENSI CN", mx, H - 4);
    doc.text(`Halaman ${i} / ${totalPages}`, W - mx, H - 4, { align: "right" });
  }

  doc.save(`Laporan-BK-Siswa-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: StaffBKClassSummary[];
};

export function BKSiswaReportModal({ open, onOpenChange, classes }: Props) {
  const [classFilter, setClassFilter] = useState<ClassFilter | null>(null);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [riskFilter, setRiskFilter] = useState<RiskFilter | null>(null);
  const [columns, setColumns] = useState<Columns>({
    kelas: true,
    identitas: false,
    telat: true,
    alfa: true,
    izinSakit: false,
    status: false,
  });
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [generating, setGenerating] = useState(false);

  const q1FullyAnswered =
    classFilter === "all" || (classFilter === "specific" && selectedClassIds.length > 0);
  const showQ2 = q1FullyAnswered;
  const showQ3 = q1FullyAnswered && riskFilter !== null;
  const canDownload = showQ3 && sortBy !== null;

  const selectedClasses = useMemo(
    () => classes.filter((c) => selectedClassIds.includes(c.class_id)),
    [classes, selectedClassIds],
  );

  function toggleClassId(id: string) {
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setRiskFilter(null);
    setSortBy(null);
  }

  function resetState() {
    setClassFilter(null);
    setSelectedClassIds([]);
    setRiskFilter(null);
    setColumns({ kelas: true, identitas: false, telat: true, alfa: true, izinSakit: false, status: false });
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
      const overview = await getBKStudentsOverview({
        class_id: "",
        risk: riskFilter === "Semua" ? "" : (riskFilter ?? ""),
      });

      let students = overview.students ?? [];

      if (classFilter === "specific" && selectedClassIds.length > 0) {
        students = students.filter((s) => selectedClassIds.includes(s.class_id ?? ""));
      }

      if (students.length === 0) {
        toast.warning("Tidak ada siswa yang sesuai filter.");
        return;
      }

      const sorted = [...students].sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name, "id");
        if (sortBy === "nis") return a.nis.localeCompare(b.nis, "id");
        if (sortBy === "alpha") return b.alpha_count - a.alpha_count;
        if (sortBy === "late") return b.late_count - a.late_count;
        return 0;
      });

      const filterKelasLabel =
        classFilter === "specific" && selectedClasses.length > 0
          ? selectedClasses.map((c) => c.class_name).join(", ")
          : "Semua Kelas";
      const filterRisikoLabel = riskFilter ? RISK_LABELS[riskFilter] : "Semua Siswa";
      const sortLabel =
        sortBy === "name" ? "Nama (A–Z)" :
        sortBy === "nis" ? "NIS" :
        sortBy === "alpha" ? "Alfa (terbanyak)" : "Telat (terbanyak)";

      await generateBKSiswaPdf(sorted, filterKelasLabel, filterRisikoLabel, sortLabel, columns);
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
      title="Cetak Laporan Siswa BK"
      description="Sesuaikan filter dan kolom, lalu unduh PDF monitoring siswa siap cetak."
      icon={Printer}
      className="sm:!max-w-[640px]"
    >
      <div className="space-y-4">
        {/* Q1 — Filter kelas */}
        <QuestionBlock
          icon={GraduationCap}
          label="Filter per kelas"
          answered={q1FullyAnswered}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <ReportRadio
              selected={classFilter === "all"}
              label="Semua Kelas"
              badge={`${classes.length} kelas`}
              onClick={() => { setClassFilter("all"); setSelectedClassIds([]); setRiskFilter(null); setSortBy(null); }}
            />
            <ReportRadio
              selected={classFilter === "specific"}
              label="Per Kelas Tertentu"
              onClick={() => { setClassFilter("specific"); setSelectedClassIds([]); setRiskFilter(null); setSortBy(null); }}
            />
          </div>

          {/* Class chips */}
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
                  {classes.map((cls) => {
                    const active = selectedClassIds.includes(cls.class_id);
                    return (
                      <button
                        key={cls.class_id}
                        type="button"
                        onClick={() => toggleClassId(cls.class_id)}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500/30",
                          active
                            ? "border-emerald-400 bg-emerald-600 text-white shadow-[0_4px_10px_rgba(5,150,105,0.28)]"
                            : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50",
                        )}
                      >
                        {cls.class_name}
                        {cls.school_year_name && (
                          <span className={cn("ml-1.5 text-xs", active ? "opacity-80" : "opacity-50")}>
                            {cls.school_year_name}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </QuestionBlock>

        {/* Q2 — Filter risiko */}
        <AnimatePresence>
          {showQ2 && (
            <motion.div
              key="q2"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
            >
              <QuestionBlock
                icon={TriangleAlert}
                label="Filter berdasarkan kondisi siswa"
                answered={riskFilter !== null}
              >
                <div className="grid gap-2 sm:grid-cols-3">
                  {(
                    [
                      "Semua",
                      "need_attention",
                      "late",
                      "alpha",
                      "counseling",
                      "stable",
                    ] as RiskFilter[]
                  ).map((risk) => (
                    <ReportRadio
                      key={risk}
                      selected={riskFilter === risk}
                      label={RISK_LABELS[risk]}
                      onClick={() => { setRiskFilter(risk); setSortBy(null); }}
                    />
                  ))}
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Q3 — Kolom */}
        <AnimatePresence>
          {showQ3 && (
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
                <div className="grid gap-2 sm:grid-cols-3">
                  <ReportCheckbox checked disabled label="Nama & NIS" badge="wajib" />
                  <ReportCheckbox
                    checked={columns.kelas}
                    onChange={(v) => setColumns((c) => ({ ...c, kelas: v }))}
                    label="Kelas"
                  />
                  <ReportCheckbox
                    checked={columns.identitas}
                    onChange={(v) => setColumns((c) => ({ ...c, identitas: v }))}
                    label="Identitas"
                  />
                  <ReportCheckbox
                    checked={columns.telat}
                    onChange={(v) => setColumns((c) => ({ ...c, telat: v }))}
                    label="Telat"
                  />
                  <ReportCheckbox
                    checked={columns.alfa}
                    onChange={(v) => setColumns((c) => ({ ...c, alfa: v }))}
                    label="Alfa"
                  />
                  <ReportCheckbox
                    checked={columns.izinSakit}
                    onChange={(v) => setColumns((c) => ({ ...c, izinSakit: v }))}
                    label="Izin/Sakit"
                  />
                  <ReportCheckbox
                    checked={columns.status}
                    onChange={(v) => setColumns((c) => ({ ...c, status: v }))}
                    label="Status"
                  />
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Q4 — Sort */}
        <AnimatePresence>
          {showQ3 && (
            <motion.div
              key="q4"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: "easeOut", delay: 0.09 }}
            >
              <QuestionBlock
                icon={ArrowUpDown}
                label="Urutkan data berdasarkan"
                answered={sortBy !== null}
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <ReportRadio
                    selected={sortBy === "name"}
                    label="Nama (A–Z)"
                    onClick={() => setSortBy("name")}
                  />
                  <ReportRadio
                    selected={sortBy === "nis"}
                    label="NIS"
                    onClick={() => setSortBy("nis")}
                  />
                  <ReportRadio
                    selected={sortBy === "alpha"}
                    label="Alfa (terbanyak)"
                    onClick={() => setSortBy("alpha")}
                  />
                  <ReportRadio
                    selected={sortBy === "late"}
                    label="Telat (terbanyak)"
                    onClick={() => setSortBy("late")}
                  />
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className={premiumModalActionsClassName}>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-[0.8rem] border-slate-200 px-5 text-[0.88rem] text-slate-600"
            onClick={() => handleClose(false)}
          >
            Batal
          </Button>
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
