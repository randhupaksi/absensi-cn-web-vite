"use client";

import { PremiumModal } from "@/components/modals/premium-modal";
import { ReportModalFooter } from "@/features/reports/shared/report-modal-footer";
import { QuestionBlock, ReportCheckbox, ReportRadio } from "@/features/reports/shared/report-question-ui";
import { applyPdfCreditMetadata } from "@/lib/reports/pdf-metadata";
import {
  drawReportPdfFooter,
  drawReportPdfHeader,
  drawReportPdfPills,
  REPORT_PDF_MARGIN_X,
  REPORT_TABLE_STYLE,
} from "@/lib/reports/pdf-report-kit";
import type { StaffSubjectRecap, StaffSubjectRecapStudentRow } from "@/types/staff";
import { ArrowUpDown, Columns3, Database, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ReportTableCell = string | { content: string; colSpan?: number; styles?: Record<string, unknown> };
type SortBy = "name" | "nis" | "h" | "a";
type Columns = { nis: boolean; detail: boolean; dispensasi: boolean };
type HisaRow = StaffSubjectRecapStudentRow & { h: number; i: number; s: number; a: number };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recap?: StaffSubjectRecap;
  periodeLabel: string;
};

export function SubjectRecapReportModal({ open, onOpenChange, recap, periodeLabel }: Props) {
  const [columns, setColumns] = useState<Columns>({ nis: true, detail: true, dispensasi: true });
  const [sortBy, setSortBy] = useState<SortBy | null>("name");
  const [generating, setGenerating] = useState(false);

  const sortOptions = useMemo(
    () => [
      { value: "name" as const, label: "Nama (A-Z)" },
      ...(columns.nis ? [{ value: "nis" as const, label: "NIS" }] : []),
      { value: "h" as const, label: "Hadir terbanyak" },
      { value: "a" as const, label: "Alfa terbanyak" },
    ],
    [columns.nis],
  );

  useEffect(() => {
    if (sortBy && !sortOptions.some((option) => option.value === sortBy)) {
      setSortBy(null);
    }
  }, [sortBy, sortOptions]);

  async function handleDownload() {
    if (!recap || recap.students.length === 0 || !sortBy) return;
    setGenerating(true);
    try {
      const rows = recap.students.map(toHisaRow);
      const sorted = [...rows].sort((first, second) => {
        if (sortBy === "nis") return first.nis.localeCompare(second.nis, "id");
        if (sortBy === "h") return second.h - first.h;
        if (sortBy === "a") return second.a - first.a;
        return first.student_name.localeCompare(second.student_name, "id");
      });

      await generateSubjectRecapPdf(sorted, recap, periodeLabel, getSortLabel(sortBy), columns);
    } catch {
      toast.error("Gagal membuat PDF rekap mapel. Silakan coba lagi.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <PremiumModal
      open={open}
      onOpenChange={onOpenChange}
      title="Cetak Laporan Rekap Mapel"
      description="Pilih kolom dan urutan data sebelum mengunduh PDF rekap kehadiran mapel."
      icon={Printer}
      className="sm:!max-w-[640px]"
    >
      <div className="space-y-4">
        <QuestionBlock icon={Database} label="Data laporan" answered={Boolean(recap && recap.students.length > 0)}>
          <div className="rounded-[0.9rem] border border-white bg-white/80 px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{recap ? `${recap.assignment.subject_name} - ${recap.assignment.class_name}` : "Belum ada mapel dipilih"}</p>
            <p className="mt-1">Periode: {periodeLabel}</p>
            <p>{recap?.total_pertemuan ?? 0} pertemuan - {recap?.students.length ?? 0} siswa</p>
          </div>
        </QuestionBlock>

        <QuestionBlock icon={Columns3} label="Kolom yang ingin ditampilkan" answered>
          <div className="grid grid-cols-1 gap-2 min-[520px]:grid-cols-2">
            <ReportCheckbox checked disabled label="Nama Siswa" badge="wajib" />
            <ReportCheckbox checked={columns.nis} onChange={(value) => setColumns((current) => ({ ...current, nis: value }))} label="NIS" />
            <ReportCheckbox checked disabled label="Rekap H I S A" badge="wajib" />
            <ReportCheckbox checked={columns.detail} onChange={(value) => setColumns((current) => ({ ...current, detail: value }))} label="Telat & Alfa Kelas" />
            <ReportCheckbox checked={columns.dispensasi} onChange={(value) => setColumns((current) => ({ ...current, dispensasi: value }))} label="Dispensasi" />
          </div>
        </QuestionBlock>

        <QuestionBlock icon={ArrowUpDown} label="Urutkan data berdasarkan" answered={sortBy !== null}>
          <div className="grid gap-2 sm:grid-cols-2">
            {sortOptions.map((option) => (
              <ReportRadio key={option.value} selected={sortBy === option.value} label={option.label} onClick={() => setSortBy(option.value)} />
            ))}
          </div>
        </QuestionBlock>

        <ReportModalFooter
          canDownload={Boolean(recap && recap.students.length > 0 && sortBy)}
          generating={generating}
          onCancel={() => onOpenChange(false)}
          onDownload={handleDownload}
        />
      </div>
    </PremiumModal>
  );
}

async function generateSubjectRecapPdf(
  rows: HisaRow[],
  recap: StaffSubjectRecap,
  periodeLabel: string,
  sortLabel: string,
  columns: Columns,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan Rekap Mapel");
  const mx = REPORT_PDF_MARGIN_X;
  const { metaY } = drawReportPdfHeader(doc, {
    title: "LAPORAN REKAP MAPEL",
    subtitle: "Rekap Kehadiran Guru Mapel",
  });
  drawReportPdfPills(doc, [
    `Mapel: ${recap.assignment.subject_name}`,
    `Kelas: ${recap.assignment.class_name}`,
    `Periode: ${periodeLabel}`,
    `Pertemuan: ${recap.total_pertemuan}`,
    `Total: ${rows.length} siswa`,
    `Urutan: ${sortLabel}`,
  ], metaY);

  const head: string[][] = [["No", "Nama Siswa"]];
  if (columns.nis) head[0].push("NIS");
  head[0].push("H", "I", "S", "A");
  if (columns.detail) head[0].push("T", "AK");
  if (columns.dispensasi) head[0].push("D");

  const totals = rows.reduce((acc, row) => ({
    h: acc.h + row.h,
    i: acc.i + row.i,
    s: acc.s + row.s,
    a: acc.a + row.a,
    t: acc.t + row.telat,
    ak: acc.ak + row.alfa_kelas,
    d: acc.d + row.dispensasi,
  }), { h: 0, i: 0, s: 0, a: 0, t: 0, ak: 0, d: 0 });

  const body: ReportTableCell[][] = rows.map((row, index) => {
    const cells: ReportTableCell[] = [String(index + 1), row.student_name];
    if (columns.nis) cells.push(row.nis);
    cells.push(...[row.h, row.i, row.s, row.a].map(centerCell));
    if (columns.detail) cells.push(centerCell(row.telat), centerCell(row.alfa_kelas));
    if (columns.dispensasi) cells.push(centerCell(row.dispensasi));
    return cells;
  });

  const totalValues = [totals.h, totals.i, totals.s, totals.a];
  if (columns.detail) totalValues.push(totals.t, totals.ak);
  if (columns.dispensasi) totalValues.push(totals.d);
  body.push([
    {
      content: "Total Akumulatif",
      colSpan: head[0].length - totalValues.length,
      styles: { fillColor: [236, 253, 245], fontStyle: "bold", halign: "center", textColor: [6, 78, 59] },
    },
    ...totalValues.map((value) => ({
      content: String(value),
      styles: { fillColor: [236, 253, 245], fontStyle: "bold", halign: "center", textColor: [6, 78, 59] },
    })),
  ]);

  autoTable(doc, {
    head,
    body,
    startY: metaY + 8,
    margin: { left: mx, right: mx },
    ...REPORT_TABLE_STYLE,
  });

  drawReportPdfFooter(doc, `Rekap Mapel - ${recap.assignment.subject_name} - ABSENSI CN`);
  doc.save(`Laporan-Rekap-Mapel-${recap.assignment.subject_name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function toHisaRow(row: StaffSubjectRecapStudentRow): HisaRow {
  return {
    ...row,
    h: row.hadir + row.telat,
    i: row.izin,
    s: row.sakit,
    a: row.alfa + row.alfa_kelas,
  };
}

function centerCell(value: number): ReportTableCell {
  return { content: String(value), styles: { halign: "center" } };
}

function getSortLabel(sortBy: SortBy) {
  if (sortBy === "nis") return "NIS";
  if (sortBy === "h") return "Hadir terbanyak";
  if (sortBy === "a") return "Alfa terbanyak";
  return "Nama (A-Z)";
}
