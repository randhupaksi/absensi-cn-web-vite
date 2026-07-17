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
import { QuestionBlock, ReportCheckbox, ReportRadio } from "@/features/reports/shared/report-question-ui";
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
  izin: boolean;
  sakit: boolean;
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
  const mx = REPORT_PDF_MARGIN_X;
  const { metaY } = drawReportPdfHeader(doc, {
    title: "LAPORAN SISWA KELAS",
    subtitle: "Laporan Wali Kelas",
  });
  const pills = [
    `Kelas: ${homeroom.class_name}`,
    `T.A.: ${homeroom.school_year_name}`,
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
  if (columns.telat) head[0].push("Telat");
  if (columns.alfa) head[0].push("Alfa");
  if (columns.izin) head[0].push("Izin");
  if (columns.sakit) head[0].push("Sakit");
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

  drawReportPdfFooter(doc, `Laporan Siswa Kelas — ${homeroom.class_name} — ABSENSI CN`);

  doc.save(`Laporan-Walas-Siswa-${homeroom.class_name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeroom: StaffHomeroomContext;
};

export function WalasSiswaReportModal({ open, onOpenChange, homeroom }: Props) {
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter | null>(null);
  const [columns, setColumns] = useState<Columns>({ nis: true, gender: false, identitas: false, telat: true, alfa: true, izin: false, sakit: false, status: false });
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [generating, setGenerating] = useState(false);

  const showQ2 = conditionFilter !== null;
  const canDownload = conditionFilter !== null && sortBy !== null;

  function resetState() {
    setConditionFilter(null);
    setColumns({ nis: true, gender: false, identitas: false, telat: true, alfa: true, izin: false, sakit: false, status: false });
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
                  <ReportCheckbox checked={columns.izin} onChange={(v) => setColumns((c) => ({ ...c, izin: v }))} label="Izin" />
                  <ReportCheckbox checked={columns.sakit} onChange={(v) => setColumns((c) => ({ ...c, sakit: v }))} label="Sakit" />
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
