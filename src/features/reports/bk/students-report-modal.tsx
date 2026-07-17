"use client";

import { AnimatePresence, motion } from "motion/react";
import { PremiumModal } from "@/components/modals/premium-modal";
import { ReportModalFooter } from "@/features/reports/shared/report-modal-footer";
import { applyPdfCreditMetadata } from "@/lib/reports/pdf-metadata";
import {
  drawReportPdfFooter,
  drawReportPdfHeader,
  drawReportPdfPills,
  REPORT_PDF_MARGIN_X,
  REPORT_TABLE_STYLE,
} from "@/lib/reports/pdf-report-kit";
import { cn } from "@/lib/utils";
import {
  QuestionBlock,
  ReportCheckbox,
  ReportRadio,
} from "@/features/reports/shared/report-question-ui";
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
  izin: boolean;
  sakit: boolean;
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
  const mx = REPORT_PDF_MARGIN_X;
  const { metaY } = drawReportPdfHeader(doc, {
    title: "LAPORAN MONITORING SISWA",
    subtitle: "Laporan Guru Bimbingan Konseling",
  });
  const pills = [
    `Kelas: ${filterKelasLabel}`,
    `Risiko: ${filterRisikoLabel}`,
    `Total: ${data.length} siswa`,
    `Urutan: ${sortLabel}`,
  ];
  drawReportPdfPills(doc, pills, metaY);

  // Build table
  const head: string[][] = [["No", "Nama Siswa", "NIS"]];
  if (columns.kelas) head[0].push("Kelas");
  if (columns.identitas) head[0].push("Identitas");
  if (columns.telat) head[0].push("Telat");
  if (columns.alfa) head[0].push("Alfa");
  if (columns.izin) head[0].push("Izin");
  if (columns.sakit) head[0].push("Sakit");
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
    if (columns.izin) row.push(String(s.permission_count));
    if (columns.sakit) row.push(String(s.sick_count));
    if (columns.status) row.push(s.is_active ? "Aktif" : "Nonaktif");
    return row;
  });

  autoTable(doc, {
    head,
    body,
    startY: metaY + 8,
    margin: { left: mx, right: mx },
    ...REPORT_TABLE_STYLE,
  });

  drawReportPdfFooter(doc, "Laporan Monitoring Siswa — BK ABSENSI CN");

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
    izin: false,
    sakit: false,
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
    setColumns({ kelas: true, identitas: false, telat: true, alfa: true, izin: false, sakit: false, status: false });
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
                    checked={columns.izin}
                    onChange={(v) => setColumns((c) => ({ ...c, izin: v }))}
                    label="Izin"
                  />
                  <ReportCheckbox
                    checked={columns.sakit}
                    onChange={(v) => setColumns((c) => ({ ...c, sakit: v }))}
                    label="Sakit"
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
