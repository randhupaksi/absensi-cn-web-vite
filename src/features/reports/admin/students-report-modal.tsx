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
} from "@/lib/reports/pdf-report-kit";
import type { AdminStudent } from "@/types/admin";
import {
  QuestionBlock,
  ReportCheckbox,
  ReportFormatQuestion,
  ReportRadio,
  type ReportFormat,
} from "@/features/reports/shared/report-question-ui";
import { exportStyledExcelReport } from "@/lib/reports/excel-report-kit";
import { ArrowUpDown, ListChecks, ListFilter, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterStatus = "all" | "active" | "inactive";
type SortBy = "name" | "nis" | "nisn";
type Columns = {
  nisn: boolean;
  gender: boolean;
};

// ─── PDF generator ────────────────────────────────────────────────────────────

async function generateSiswaPdf(
  data: AdminStudent[],
  filterLabel: string,
  sortLabel: string,
  columns: Columns,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan Siswa");
  const mx = REPORT_PDF_MARGIN_X;
  const { metaY } = drawReportPdfHeader(doc, {
    title: "LAPORAN DATA SISWA",
    subtitle: "Sistem Informasi Absensi Sekolah",
    bandHeight: 20,
  });
  const pills = [
    `Filter: ${filterLabel}`,
    `Total: ${data.length} siswa`,
    `Urutan: ${sortLabel}`,
  ];
  drawReportPdfPills(doc, pills, metaY);

  // Table columns
  const head: string[][] = [["No", "Nama Siswa", "NIS"]];
  if (columns.nisn) head[0].push("NISN");
  if (columns.gender) head[0].push("Jenis Kelamin");

  const body = data.map((s, i) => {
    const row: string[] = [String(i + 1), s.name, s.nis];
    if (columns.nisn) row.push(s.nisn || "—");
    if (columns.gender)
      row.push(
        s.gender === "MALE" ? "Laki-laki" : s.gender === "FEMALE" ? "Perempuan" : "—",
      );
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

  drawReportPdfFooter(doc, "Laporan Data Siswa — ABSENSI CN");

  doc.save(`Laporan-Siswa-${new Date().toISOString().slice(0, 10)}.pdf`);
}

async function generateSiswaExcel(
  data: AdminStudent[],
  filterLabel: string,
  sortLabel: string,
  columns: Columns,
) {
  await exportStyledExcelReport({
    filename: `Laporan-Siswa-${new Date().toISOString().slice(0, 10)}`,
    title: "LAPORAN DATA SISWA",
    subtitle: "Sekolah Citra Negara - Sistem Informasi Absensi Sekolah",
    metadata: [
      { label: "Filter", value: filterLabel },
      { label: "Urutan", value: sortLabel },
    ],
    rows: data,
    dataSheetName: "Data Siswa",
    metrics: [
      { label: "Total Siswa", value: data.length, tone: "emerald" },
      { label: "Siswa Aktif", value: data.filter((student) => student.is_active).length, tone: "sky" },
      { label: "Siswa Nonaktif", value: data.filter((student) => !student.is_active).length, tone: "rose" },
    ],
    columns: [
      { header: "No", value: (_student, index) => index + 1, width: 7, kind: "number" },
      { header: "Nama Siswa", value: (student) => student.name, width: 30 },
      { header: "NIS", value: (student) => student.nis, width: 18 },
      ...(columns.nisn ? [{ header: "NISN", value: (student: AdminStudent) => student.nisn, width: 18 }] : []),
      ...(columns.gender ? [{
        header: "Jenis Kelamin",
        value: (student: AdminStudent) => student.gender === "MALE" ? "Laki-laki" : student.gender === "FEMALE" ? "Perempuan" : "—",
        width: 18,
      }] : []),
      { header: "Status", value: (student) => student.is_active ? "Aktif" : "Non-aktif", width: 15, kind: "status" },
    ],
  });
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: AdminStudent[];
};

export function SiswaReportModal({ open, onOpenChange, students }: Props) {
  const [format, setFormat] = useState<ReportFormat | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus | null>(null);
  const [columns, setColumns] = useState<Columns>({
    nisn: false,
    gender: false,
  });
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [generating, setGenerating] = useState(false);

  const counts = useMemo(
    () => ({
      all: students.length,
      active: students.filter((s) => s.is_active).length,
      inactive: students.filter((s) => !s.is_active).length,
    }),
    [students],
  );

  const q1FullyAnswered = filterStatus !== null;
  const showQ2 = q1FullyAnswered;
  const canDownload = format !== null && q1FullyAnswered && sortBy !== null;

  const filteredCount = useMemo(() => {
    if (!q1FullyAnswered) return 0;
    if (filterStatus === "active") return counts.active;
    if (filterStatus === "inactive") return counts.inactive;
    return counts.all;
  }, [q1FullyAnswered, filterStatus, counts]);

  function resetState() {
    setFormat(null);
    setFilterStatus(null);
    setColumns({
      nisn: false,
      gender: false,
    });
    setSortBy(null);
  }

  function handleClose(isOpen: boolean) {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  }

  async function handleDownload() {
    if (!canDownload) return;
    const filtered = students.filter((s) => {
      if (filterStatus === "active") return s.is_active;
      if (filterStatus === "inactive") return !s.is_active;
      return true;
    });
    if (filtered.length === 0) {
      toast.warning("Tidak ada data siswa yang sesuai filter.");
      return;
    }
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name, "id");
      if (sortBy === "nis") return a.nis.localeCompare(b.nis, "id");
      return (a.nisn ?? "").localeCompare(b.nisn ?? "", "id");
    });
    const filterLabel =
      filterStatus === "active" ? "Aktif Saja" :
      filterStatus === "inactive" ? "Non-aktif Saja" : "Semua Siswa";
    const sortLabel =
      sortBy === "name" ? "Nama (A–Z)" :
      sortBy === "nis" ? "NIS" : "NISN";

    setGenerating(true);
    try {
      if (format === "excel") {
        await generateSiswaExcel(sorted, filterLabel, sortLabel, columns);
      } else {
        await generateSiswaPdf(sorted, filterLabel, sortLabel, columns);
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
      title="Export Laporan Siswa"
      description="Pilih PDF siap cetak atau Excel bergaya yang siap diolah dan direkap."
      icon={Printer}
      className="sm:!max-w-[620px]"
    >
      <div className="space-y-4">
        <ReportFormatQuestion value={format} onChange={setFormat} />
        {/* Q1 — Filter */}
        <QuestionBlock
          icon={ListFilter}
          label="Saring berdasarkan"
          answered={q1FullyAnswered}
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <ReportRadio
              selected={filterStatus === "all"}
              label="Semua Siswa"
              badge={`${counts.all}`}
              onClick={() => { setFilterStatus("all"); setSortBy(null); }}
            />
            <ReportRadio
              selected={filterStatus === "active"}
              label="Aktif Saja"
              badge={`${counts.active}`}
              onClick={() => { setFilterStatus("active"); setSortBy(null); }}
            />
            <ReportRadio
              selected={filterStatus === "inactive"}
              label="Non-aktif"
              badge={`${counts.inactive}`}
              onClick={() => { setFilterStatus("inactive"); setSortBy(null); }}
            />
          </div>
        </QuestionBlock>

        {/* Q2 — Columns */}
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
                icon={ListChecks}
                label="Kolom yang ingin ditampilkan"
                answered
              >
                <div className="grid gap-2 sm:grid-cols-3">
                  <ReportCheckbox checked disabled label="Nama & NIS" badge="wajib" />
                  <ReportCheckbox
                    checked={columns.nisn}
                    onChange={(v) => setColumns((c) => ({ ...c, nisn: v }))}
                    label="NISN"
                  />
                  <ReportCheckbox
                    checked={columns.gender}
                    onChange={(v) => setColumns((c) => ({ ...c, gender: v }))}
                    label="Jenis Kelamin"
                  />
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Q3 — Sort */}
        <AnimatePresence>
          {showQ2 && (
            <motion.div
              key="q3"
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
                <div className="grid gap-2 sm:grid-cols-3">
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
                    selected={sortBy === "nisn"}
                    label="NISN"
                    onClick={() => setSortBy("nisn")}
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
          format={format}
          generatingLabel={`Membuat ${format === "excel" ? "Excel" : "PDF"}...`}
          downloadLabel={canDownload ? `Download ${format === "excel" ? "Excel" : "PDF"} (${filteredCount} siswa)` : "Pilih format laporan"}
        />
      </div>
    </PremiumModal>
  );
}
