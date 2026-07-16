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
import type { StaffSubjectAssignment, StaffSubjectSessionListItem } from "@/types/staff";
import { ArrowUpDown, Columns3, Database, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ReportTableCell = string | { content: string; colSpan?: number; styles?: Record<string, unknown> };
type SortBy = "date_desc" | "date_asc" | "status";
type Columns = { status: boolean; topic: boolean; hisa: boolean };

const STATUS_LABELS: Record<string, string> = {
  belum_divalidasi: "Belum Divalidasi",
  sudah_divalidasi: "Sudah Divalidasi",
  diedit: "Diedit",
};

const HARI_LABELS: Record<string, string> = {
  senin: "Senin",
  selasa: "Selasa",
  rabu: "Rabu",
  kamis: "Kamis",
  jumat: "Jumat",
  sabtu: "Sabtu",
  minggu: "Minggu",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment?: StaffSubjectAssignment;
  sessions: StaffSubjectSessionListItem[];
  periodeLabel: string;
  statusLabel: string;
};

export function SubjectSessionHistoryReportModal({
  open,
  onOpenChange,
  assignment,
  sessions,
  periodeLabel,
  statusLabel,
}: Props) {
  const [columns, setColumns] = useState<Columns>({ status: true, topic: true, hisa: true });
  const [sortBy, setSortBy] = useState<SortBy | null>("date_desc");
  const [generating, setGenerating] = useState(false);

  const sortOptions = useMemo(
    () => [
      { value: "date_desc" as const, label: "Tanggal terbaru" },
      { value: "date_asc" as const, label: "Tanggal terlama" },
      ...(columns.status ? [{ value: "status" as const, label: "Status sesi" }] : []),
    ],
    [columns.status],
  );

  useEffect(() => {
    if (sortBy && !sortOptions.some((option) => option.value === sortBy)) {
      setSortBy(null);
    }
  }, [sortBy, sortOptions]);

  async function handleDownload() {
    if (!assignment || sessions.length === 0 || !sortBy) return;
    setGenerating(true);
    try {
      const sorted = [...sessions].sort((first, second) => {
        if (sortBy === "date_asc") return first.tanggal.localeCompare(second.tanggal, "id");
        if (sortBy === "status") return first.status.localeCompare(second.status, "id");
        return second.tanggal.localeCompare(first.tanggal, "id");
      });

      await generateSubjectSessionHistoryPdf(sorted, assignment, periodeLabel, statusLabel, getSortLabel(sortBy), columns);
    } catch {
      toast.error("Gagal membuat PDF riwayat sesi. Silakan coba lagi.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <PremiumModal
      open={open}
      onOpenChange={onOpenChange}
      title="Cetak Laporan Riwayat Sesi"
      description="Pilih kolom dan urutan data sebelum mengunduh PDF riwayat sesi mapel."
      icon={Printer}
      className="sm:!max-w-[640px]"
    >
      <div className="space-y-4">
        <QuestionBlock icon={Database} label="Data laporan" answered={Boolean(assignment && sessions.length > 0)}>
          <div className="rounded-[0.9rem] border border-white bg-white/80 px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{assignment ? `${assignment.subject_name} - ${assignment.class_name}` : "Belum ada mapel dipilih"}</p>
            <p className="mt-1">Periode: {periodeLabel}</p>
            <p>Status: {statusLabel} - {sessions.length} sesi</p>
          </div>
        </QuestionBlock>

        <QuestionBlock icon={Columns3} label="Kolom yang ingin ditampilkan" answered>
          <div className="grid grid-cols-1 gap-2 min-[520px]:grid-cols-2">
            <ReportCheckbox checked disabled label="Tanggal & Jam" badge="wajib" />
            <ReportCheckbox checked={columns.status} onChange={(value) => setColumns((current) => ({ ...current, status: value }))} label="Status Sesi" />
            <ReportCheckbox checked={columns.topic} onChange={(value) => setColumns((current) => ({ ...current, topic: value }))} label="Topik" />
            <ReportCheckbox checked={columns.hisa} onChange={(value) => setColumns((current) => ({ ...current, hisa: value }))} label="Rekap H I S A D" />
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
          canDownload={Boolean(assignment && sessions.length > 0 && sortBy)}
          generating={generating}
          onCancel={() => onOpenChange(false)}
          onDownload={handleDownload}
        />
      </div>
    </PremiumModal>
  );
}

async function generateSubjectSessionHistoryPdf(
  sessions: StaffSubjectSessionListItem[],
  assignment: StaffSubjectAssignment,
  periodeLabel: string,
  statusLabel: string,
  sortLabel: string,
  columns: Columns,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan Riwayat Sesi Mapel");
  const mx = REPORT_PDF_MARGIN_X;
  const { metaY } = drawReportPdfHeader(doc, {
    title: "LAPORAN RIWAYAT SESI MAPEL",
    subtitle: "Riwayat Sesi Guru Mapel",
  });
  drawReportPdfPills(doc, [
    `Mapel: ${assignment.subject_name}`,
    `Kelas: ${assignment.class_name}`,
    `Periode: ${periodeLabel}`,
    `Status: ${statusLabel}`,
    `Total: ${sessions.length} sesi`,
    `Urutan: ${sortLabel}`,
  ], metaY);

  const head: string[][] = [["No", "Tanggal", "Hari / Jam"]];
  if (columns.status) head[0].push("Status");
  if (columns.topic) head[0].push("Topik");
  if (columns.hisa) head[0].push("H", "I", "S", "A", "D");

  const totals = sessions.reduce((acc, session) => ({
    h: acc.h + session.hadir,
    i: acc.i + session.izin,
    s: acc.s + session.sakit,
    a: acc.a + session.alfa,
    d: acc.d + session.dispensasi,
  }), { h: 0, i: 0, s: 0, a: 0, d: 0 });

  const body: ReportTableCell[][] = sessions.map((session, index) => {
    const row: ReportTableCell[] = [
      String(index + 1),
      formatDate(session.tanggal),
      `${HARI_LABELS[session.hari] ?? session.hari} / ${session.jam_mulai}-${session.jam_selesai}`,
    ];
    if (columns.status) row.push(STATUS_LABELS[session.status] ?? session.status);
    if (columns.topic) row.push(session.topic || "-");
    if (columns.hisa) {
      row.push(...[session.hadir, session.izin, session.sakit, session.alfa, session.dispensasi].map((value) => ({
        content: String(value),
        styles: { halign: "center" },
      })));
    }
    return row;
  });

  if (columns.hisa) {
    body.push([
      {
        content: "Total Akumulatif",
        colSpan: head[0].length - 5,
        styles: { fillColor: [236, 253, 245], fontStyle: "bold", halign: "center", textColor: [6, 78, 59] },
      },
      ...[totals.h, totals.i, totals.s, totals.a, totals.d].map((value) => ({
        content: String(value),
        styles: { fillColor: [236, 253, 245], fontStyle: "bold", halign: "center", textColor: [6, 78, 59] },
      })),
    ]);
  }

  autoTable(doc, {
    head,
    body,
    startY: metaY + 8,
    margin: { left: mx, right: mx },
    ...REPORT_TABLE_STYLE,
  });

  drawReportPdfFooter(doc, `Riwayat Sesi Mapel - ${assignment.subject_name} - ABSENSI CN`);
  doc.save(`Laporan-Riwayat-Sesi-${assignment.subject_name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function getSortLabel(sortBy: SortBy) {
  if (sortBy === "date_asc") return "Tanggal terlama";
  if (sortBy === "status") return "Status sesi";
  return "Tanggal terbaru";
}
