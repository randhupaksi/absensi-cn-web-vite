"use client";

import { AnimatePresence, motion } from "motion/react";
import { PremiumModal } from "@/components/modals/premium-modal";
import { ReportModalFooter } from "@/components/reports/shared/report-modal-footer";
import { QuestionBlock, ReportCheckbox, ReportRadio } from "@/components/reports/shared/report-question-ui";
import { applyPdfCreditMetadata } from "@/lib/reports/pdf-metadata";
import {
  drawReportPdfFooter,
  drawReportPdfHeader,
  drawReportPdfPills,
  REPORT_PDF_MARGIN_X,
} from "@/lib/reports/pdf-report-kit";
import type { AdminTeacherProfile } from "@/types/admin";
import { ArrowUpDown, ListChecks, ListFilter, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterStatus = "all" | "active" | "inactive";
type SortBy = "name" | "username";
type Columns = {
  gender: boolean;
  status: boolean;
};

// ─── PDF generator ────────────────────────────────────────────────────────────

async function generateGuruPdf(
  data: AdminTeacherProfile[],
  filterLabel: string,
  sortLabel: string,
  columns: Columns,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan Guru");
  const mx = REPORT_PDF_MARGIN_X;
  const { metaY } = drawReportPdfHeader(doc, {
    title: "LAPORAN DATA GURU",
    subtitle: "Sistem Informasi Absensi Sekolah",
    bandHeight: 20,
  });
  const pills = [
    `Filter: ${filterLabel}`,
    `Total: ${data.length} guru`,
    `Urutan: ${sortLabel}`,
  ];
  drawReportPdfPills(doc, pills, metaY);

  // Table columns
  const head: string[][] = [["No", "Nama Guru", "Username"]];
  if (columns.gender) head[0].push("Jenis Kelamin");
  if (columns.status) head[0].push("Status");

  const body = data.map((t, i) => {
    const row: string[] = [String(i + 1), t.name, t.username || "—"];
    if (columns.gender)
      row.push(
        t.gender === "MALE" ? "Laki-laki" : t.gender === "FEMALE" ? "Perempuan" : "—",
      );
    if (columns.status) row.push(t.is_active ? "Aktif" : "Non-aktif");
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

  drawReportPdfFooter(doc, "Laporan Data Guru — ABSENSI CN");

  doc.save(`Laporan-Guru-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teachers: AdminTeacherProfile[];
};

export function GuruReportModal({ open, onOpenChange, teachers }: Props) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus | null>(null);
  const [columns, setColumns] = useState<Columns>({
    gender: false,
    status: true,
  });
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [generating, setGenerating] = useState(false);

  const counts = useMemo(
    () => ({
      all: teachers.length,
      active: teachers.filter((t) => t.is_active).length,
      inactive: teachers.filter((t) => !t.is_active).length,
    }),
    [teachers],
  );

  const filteredCount = filterStatus ? counts[filterStatus] : 0;
  const showQ2 = filterStatus !== null;
  const canDownload = filterStatus !== null && sortBy !== null;

  function resetState() {
    setFilterStatus(null);
    setColumns({ gender: false, status: true });
    setSortBy(null);
  }

  function handleClose(isOpen: boolean) {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  }

  async function handleDownload() {
    if (!canDownload) return;
    const filtered = teachers.filter((t) => {
      if (filterStatus === "active") return t.is_active;
      if (filterStatus === "inactive") return !t.is_active;
      return true;
    });
    if (filtered.length === 0) {
      toast.warning("Tidak ada data guru yang sesuai filter.");
      return;
    }
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name, "id");
      return (a.username ?? "").localeCompare(b.username ?? "", "id");
    });
    const filterLabel =
      filterStatus === "active" ? "Aktif Saja" :
      filterStatus === "inactive" ? "Non-aktif Saja" : "Semua Guru";
    const sortLabel = sortBy === "name" ? "Nama (A–Z)" : "Username";
    setGenerating(true);
    try {
      await generateGuruPdf(sorted, filterLabel, sortLabel, columns);
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
      title="Cetak Laporan Guru"
      description="Sesuaikan preferensi laporan, lalu unduh PDF siap cetak dalam hitungan detik."
      icon={Printer}
      className="sm:!max-w-[600px]"
    >
      <div className="space-y-4">
        {/* Q1 — Filter status */}
        <QuestionBlock
          icon={ListFilter}
          label="Saring berdasarkan status guru"
          answered={filterStatus !== null}
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <ReportRadio
              selected={filterStatus === "all"}
              label="Semua Guru"
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
                  <ReportCheckbox checked disabled label="Nama & Username" badge="wajib" />
                  <ReportCheckbox
                    checked={columns.gender}
                    onChange={(v) => setColumns((c) => ({ ...c, gender: v }))}
                    label="Jenis Kelamin"
                  />
                  <ReportCheckbox
                    checked={columns.status}
                    onChange={(v) => setColumns((c) => ({ ...c, status: v }))}
                    label="Status Aktif"
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
                <div className="grid gap-2 sm:grid-cols-2">
                  <ReportRadio
                    selected={sortBy === "name"}
                    label="Nama (A–Z)"
                    onClick={() => setSortBy("name")}
                  />
                  <ReportRadio
                    selected={sortBy === "username"}
                    label="Username"
                    onClick={() => setSortBy("username")}
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
          generatingLabel="Membuat PDF..."
          downloadLabel={canDownload ? `Download PDF (${filteredCount} guru)` : "Download PDF"}
        />
      </div>
    </PremiumModal>
  );
}
