"use client";

import { PremiumModal } from "@/components/modals/premium-modal";
import { RadixSelectField } from "@/components/ui/radix-select";
import { ReportModalFooter } from "@/features/reports/shared/report-modal-footer";
import { QuestionBlock, ReportCheckbox, ReportFormatQuestion, ReportRadio, type ReportFormat } from "@/features/reports/shared/report-question-ui";
import { exportStyledExcelReport } from "@/lib/reports/excel-report-kit";
import { applyPdfCreditMetadata } from "@/lib/reports/pdf-metadata";
import { drawReportPdfFooter, drawReportPdfHeader, drawReportPdfPills, REPORT_PDF_MARGIN_X, REPORT_TABLE_STYLE } from "@/lib/reports/pdf-report-kit";
import { getTeacherSubjectRecap } from "@/services/staff.service";
import type { StaffSubjectAssignment, StaffSubjectRecap, StaffSubjectRecapStudentRow } from "@/types/staff";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, Columns3, Database, Layers3, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ReportTableCell = string | { content: string; colSpan?: number; styles?: Record<string, unknown> };
type SortBy = "name" | "nis" | "h" | "a";
type HisaRow = StaffSubjectRecapStudentRow & { h: number; i: number; s: number; a: number };
type ExportScope = "selected" | "all";
type Columns = { nis: boolean };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignments: StaffSubjectAssignment[];
  selectedAssignmentId: string;
  dateFrom?: string;
  dateTo?: string;
  periodeLabel: string;
};

export function SubjectSessionHistoryReportModal({
  open,
  onOpenChange,
  assignments,
  selectedAssignmentId,
  dateFrom,
  dateTo,
  periodeLabel,
}: Props) {
  const [format, setFormat] = useState<ReportFormat | null>(null);
  const [scope, setScope] = useState<ExportScope | null>(null);
  const [reportAssignmentId, setReportAssignmentId] = useState("");
  const [columns, setColumns] = useState<Columns>({ nis: true });
  const [sortBy, setSortBy] = useState<SortBy | null>("name");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setScope(null);
    setReportAssignmentId("");
    setFormat(null);
  }, [open]);

  const targetAssignments = useMemo(() => {
    if (scope === "all") return assignments;
    if (scope !== "selected" || !reportAssignmentId) return [];
    return assignments.filter((item) => item.id === reportAssignmentId);
  }, [assignments, reportAssignmentId, scope]);

  const recapsQuery = useQuery({
    queryKey: ["subject-session-report-recaps", scope, targetAssignments.map((item) => item.id), dateFrom, dateTo],
    queryFn: async () => Promise.all(targetAssignments.map(async (item) => ({
      assignmentId: item.id,
      recap: await getTeacherSubjectRecap({
        assignment_id: item.id,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
    }))),
    enabled: open && scope !== null && targetAssignments.length > 0,
    staleTime: 30_000,
  });

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
    if (sortBy && !sortOptions.some((option) => option.value === sortBy)) setSortBy(null);
  }, [sortBy, sortOptions]);

  const recaps = recapsQuery.data ?? [];
  const totalStudents = recaps.reduce((total, item) => total + item.recap.students.length, 0);
  const hasData = recaps.some((item) => item.recap.students.length > 0);
  const selectedReportAssignment = assignments.find((item) => item.id === reportAssignmentId);

  function handleClose(isOpen: boolean) {
    if (!isOpen) setFormat(null);
    onOpenChange(isOpen);
  }

  async function handleDownload() {
    if (!scope || !sortBy || !hasData) return;
    setGenerating(true);
    try {
      const prepared = recaps.map(({ recap }) => ({
        recap,
        rows: sortRows(recap.students.map(toHisaRow), sortBy),
      })).filter((item) => item.rows.length > 0);

      if (format === "excel") {
        await generateSubjectRecapWorkbook(prepared, periodeLabel, scope, columns);
      } else {
        await generateSubjectRecapPdf(prepared, periodeLabel, scope, columns, getSortLabel(sortBy));
      }
    } catch {
      toast.error(`Gagal membuat ${format === "excel" ? "Excel" : "PDF"} rekap mapel. Silakan coba lagi.`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <PremiumModal
      open={open}
      onOpenChange={handleClose}
      title="Export Laporan Sesi Mapel"
      description="Pilih mapel yang ingin diekspor. Hasil laporan berisi daftar siswa dan rekap H-I-S-A seperti halaman rekap mapel."
      icon={Printer}
      className="sm:!max-w-[680px]"
    >
      <div className="space-y-4">
        <ReportFormatQuestion value={format} onChange={setFormat} />

        <QuestionBlock icon={Layers3} label="Cakupan mata pelajaran" answered={Boolean(scope)}>
          <div className="grid gap-2 sm:grid-cols-2">
            <ReportRadio
              selected={scope === "selected"}
              label="Mapel yang sedang dipilih"
              onClick={() => {
                setScope("selected");
                setReportAssignmentId(selectedAssignmentId);
              }}
            />
            <ReportRadio selected={scope === "all"} label={`Semua mapel (${assignments.length})`} onClick={() => setScope("all")} />
          </div>
          {scope === "selected" ? (
            <div className="mt-3">
              <RadixSelectField
                value={reportAssignmentId}
                onValueChange={setReportAssignmentId}
                placeholder="Pilih mata pelajaran"
                options={assignments.map((item) => ({
                  value: item.id,
                  label: `${item.subject_name} - ${item.class_name}`,
                }))}
              />
            </div>
          ) : null}
        </QuestionBlock>

        <QuestionBlock icon={Database} label="Data laporan" answered={recapsQuery.isSuccess && hasData}>
          <div className="rounded-[0.9rem] border border-white bg-white/80 px-4 py-3 text-sm text-slate-600">
            {recapsQuery.isLoading ? (
              <p>Menyiapkan rekap siswa...</p>
            ) : recapsQuery.error ? (
              <p className="text-rose-600">{recapsQuery.error.message}</p>
            ) : (
              <>
                <p className="font-semibold text-slate-900">{scope === "all" ? `${recaps.length} mapel siap diekspor` : selectedReportAssignment?.subject_name ?? "Mapel belum dipilih"}</p>
                <p className="mt-1">Periode: {periodeLabel}</p>
                <p>{totalStudents} baris siswa · hanya sesi yang sudah divalidasi</p>
              </>
            )}
          </div>
        </QuestionBlock>

        <QuestionBlock icon={Columns3} label="Kolom yang ingin ditampilkan" answered>
          <div className="grid grid-cols-2 gap-2">
            <ReportCheckbox checked disabled label="Nama Siswa" badge="wajib" />
            <ReportCheckbox checked={columns.nis} onChange={(value) => setColumns((current) => ({ ...current, nis: value }))} label="NIS" />
            <ReportCheckbox checked disabled label="Rekap H I S A" badge="wajib" />
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
          canDownload={Boolean(format && sortBy && hasData && !recapsQuery.isLoading)}
          generating={generating}
          onCancel={() => handleClose(false)}
          onDownload={handleDownload}
          format={format}
          generatingLabel={`Membuat ${format === "excel" ? "Excel" : "PDF"}...`}
          downloadLabel={format ? `Unduh ${format === "excel" ? "Excel" : "PDF"}` : "Pilih format laporan"}
        />
      </div>
    </PremiumModal>
  );
}

function sortRows(rows: HisaRow[], sortBy: SortBy) {
  return [...rows].sort((first, second) => {
    if (sortBy === "nis") return first.nis.localeCompare(second.nis, "id");
    if (sortBy === "h") return second.h - first.h;
    if (sortBy === "a") return second.a - first.a;
    return first.student_name.localeCompare(second.student_name, "id");
  });
}

function toHisaRow(row: StaffSubjectRecapStudentRow): HisaRow {
  return { ...row, h: row.hadir, i: row.izin, s: row.sakit, a: row.alfa };
}

async function generateSubjectRecapWorkbook(
  reports: Array<{ recap: StaffSubjectRecap; rows: HisaRow[] }>,
  periodeLabel: string,
  scope: ExportScope,
  columns: Columns,
) {
  const summaryRows = reports.flatMap((report) => report.rows);
  const totals = sumRows(summaryRows);
  const primary = reports[0].recap;
  const usedNames = new Set<string>();
  const additionalSheets = reports.map((report, index) => ({
    name: uniqueSheetName(`Mapel ${report.recap.assignment.subject_name} - ${report.recap.assignment.class_name}`, usedNames, index),
    rows: report.rows,
    showColumnFilters: false,
    columns: recapColumns(columns),
  }));

  await exportStyledExcelReport({
    filename: `Laporan-Rekap-Sesi-Mapel-${new Date().toISOString().slice(0, 10)}`,
    title: "LAPORAN REKAP SESI MAPEL",
    subtitle: "Sekolah Citra Negara - Rekap Kehadiran Guru Mata Pelajaran",
    metadata: [
      { label: "Cakupan", value: scope === "all" ? "Semua mapel" : primary.assignment.subject_name },
      { label: "Periode", value: periodeLabel },
      { label: "Jumlah mapel", value: reports.length },
      { label: "Jumlah siswa", value: summaryRows.length },
    ],
    rows: summaryRows,
    columns: recapColumns(columns),
    metrics: [
      { label: "Total Mapel", value: reports.length, tone: "emerald" },
      { label: "Total Siswa", value: summaryRows.length, tone: "sky" },
      { label: "Total Hadir", value: totals.h, tone: "emerald" },
      { label: "Total Izin", value: totals.i, tone: "sky" },
      { label: "Total Sakit", value: totals.s, tone: "violet" },
      { label: "Total Alfa", value: totals.a, tone: "rose" },
    ],
    includeDataSheet: false,
    includeStatisticsSheet: false,
    additionalSheets,
  });
}

function recapColumns(columns: Columns) {
  return [
    { header: "No", value: (_row: HisaRow, index: number) => index + 1, width: 7, kind: "number" as const },
    { header: "Nama Siswa", value: (row: HisaRow) => row.student_name, width: 28 },
    ...(columns.nis ? [{ header: "NIS", value: (row: HisaRow) => row.nis, width: 17 }] : []),
    { header: "H", value: (row: HisaRow) => row.h, width: 8, kind: "attendance" as const },
    { header: "I", value: (row: HisaRow) => row.i, width: 8, kind: "attendance" as const },
    { header: "S", value: (row: HisaRow) => row.s, width: 8, kind: "attendance" as const },
    { header: "A", value: (row: HisaRow) => row.a, width: 8, kind: "attendance" as const },
  ];
}

async function generateSubjectRecapPdf(
  reports: Array<{ recap: StaffSubjectRecap; rows: HisaRow[] }>,
  periodeLabel: string,
  scope: ExportScope,
  columns: Columns,
  sortLabel: string,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan Rekap Sesi Mapel");

  reports.forEach((report, index) => {
    if (index > 0) doc.addPage();
    const { metaY } = drawReportPdfHeader(doc, {
      title: "LAPORAN REKAP SESI MAPEL",
      subtitle: "Rekap Kehadiran Guru Mapel",
    });
    drawReportPdfPills(doc, [
      `Mapel: ${report.recap.assignment.subject_name}`,
      `Kelas: ${report.recap.assignment.class_name}`,
      `Periode: ${periodeLabel}`,
      `Pertemuan: ${report.recap.total_pertemuan}`,
      `Total: ${report.rows.length} siswa`,
      `Urutan: ${sortLabel}`,
    ], metaY);

    const head: string[][] = [["No", "Nama Siswa"]];
    if (columns.nis) head[0].push("NIS");
    head[0].push("H", "I", "S", "A");
    const body: ReportTableCell[][] = report.rows.map((row, rowIndex) => {
      const cells: ReportTableCell[] = [String(rowIndex + 1), row.student_name];
      if (columns.nis) cells.push(row.nis);
      cells.push(...[row.h, row.i, row.s, row.a].map(centerCell));
      return cells;
    });
    const totals = sumRows(report.rows);
    body.push(head[0].map((header, headerIndex) => ({
      content: headerIndex === 1 ? "Total" : ({ H: totals.h, I: totals.i, S: totals.s, A: totals.a }[header] !== undefined ? String(({ H: totals.h, I: totals.i, S: totals.s, A: totals.a }[header])) : ""),
      styles: { fillColor: [236, 253, 245], fontStyle: "bold", halign: "center", textColor: [6, 78, 59] },
    })));
    autoTable(doc, { head, body, startY: metaY + 8, margin: { left: REPORT_PDF_MARGIN_X, right: REPORT_PDF_MARGIN_X }, ...REPORT_TABLE_STYLE });
    drawReportPdfFooter(doc, `Rekap Mapel - ${report.recap.assignment.subject_name} - ABSENSI CN`);
  });
  doc.save(`Laporan-Rekap-Sesi-Mapel-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function sumRows(rows: HisaRow[]) {
  return rows.reduce((total, row) => ({ h: total.h + row.h, i: total.i + row.i, s: total.s + row.s, a: total.a + row.a }), { h: 0, i: 0, s: 0, a: 0 });
}

function centerCell(value: number): ReportTableCell {
  return { content: String(value), styles: { halign: "center" } };
}

function uniqueSheetName(value: string, usedNames: Set<string>, index: number) {
  const base = value.replace(/[\\/*?:[\]]/g, " ").trim().slice(0, 27) || `Mapel ${index + 1}`;
  let name = base;
  let suffix = 2;
  while (usedNames.has(name) || name === "Ringkasan") {
    name = `${base.slice(0, 31 - String(suffix).length - 1)} ${suffix}`;
    suffix += 1;
  }
  usedNames.add(name);
  return name;
}

function getSortLabel(sortBy: SortBy) {
  if (sortBy === "nis") return "NIS";
  if (sortBy === "h") return "Hadir terbanyak";
  if (sortBy === "a") return "Alfa terbanyak";
  return "Nama (A-Z)";
}
