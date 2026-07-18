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
import { QuestionBlock, ReportCheckbox, ReportFormatQuestion, ReportRadio, type ReportFormat } from "@/features/reports/shared/report-question-ui";
import { exportStyledExcelReport } from "@/lib/reports/excel-report-kit";
import { getTeacherHomeroomStudents } from "@/services/staff.service";
import type { StaffHomeroomContext, StaffStudentSummary } from "@/types/staff";
import { ArrowUpDown, ListChecks, Printer, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ConditionFilter = "Semua" | "aktif" | "perlu_perhatian" | "stabil";
type SortBy = "name" | "nis" | "alpha";
type Columns = {
  nis: boolean;
  gender: boolean;
  identitas: boolean;
  hadir: boolean;
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
  conditionLabel: string,
  sortLabel: string,
  columns: Columns,
) {
  await exportStyledExcelReport({
    filename: `Laporan-Walas-Siswa-${homeroom.class_name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}`,
    title: "LAPORAN SISWA KELAS",
    subtitle: "Sekolah Citra Negara - Laporan Wali Kelas",
    metadata: [
      { label: "Kelas", value: homeroom.class_name },
      { label: "Tahun ajaran", value: homeroom.school_year_name },
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeroom: StaffHomeroomContext;
};

export function WalasSiswaReportModal({ open, onOpenChange, homeroom }: Props) {
  const [format, setFormat] = useState<ReportFormat | null>(null);
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter | null>(null);
  const [columns, setColumns] = useState<Columns>({ nis: true, gender: false, identitas: false, hadir: true, alfa: true, izin: false, sakit: false, status: false });
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [generating, setGenerating] = useState(false);

  const showQ2 = conditionFilter !== null;
  const canDownload = format !== null && conditionFilter !== null && sortBy !== null;

  function resetState() {
    setFormat(null);
    setConditionFilter(null);
    setColumns({ nis: true, gender: false, identitas: false, hadir: true, alfa: true, izin: false, sakit: false, status: false });
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
                  <ReportCheckbox checked={columns.hadir} onChange={(v) => setColumns((c) => ({ ...c, hadir: v }))} label="Hadir" />
                  <ReportCheckbox checked={columns.izin} onChange={(v) => setColumns((c) => ({ ...c, izin: v }))} label="Izin" />
                  <ReportCheckbox checked={columns.sakit} onChange={(v) => setColumns((c) => ({ ...c, sakit: v }))} label="Sakit" />
                  <ReportCheckbox checked={columns.alfa} onChange={(v) => setColumns((c) => ({ ...c, alfa: v }))} label="Alfa" />
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
