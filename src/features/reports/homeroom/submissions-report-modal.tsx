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
import { getTeacherHomeroomSubmissionsOverview } from "@/services/staff.service";
import type { StaffHomeroomContext, StaffSubmission } from "@/types/staff";
import { ArrowUpDown, ClipboardCheck, FileText, ListChecks, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type TypeFilter = "Semua" | "IZIN" | "SAKIT";
type StatusFilter = "Semua" | "menunggu" | "diterima" | "ditolak";
type SortBy = "name" | "nis" | "type" | "status" | "newest";
type Columns = { nis: boolean; type: boolean; reason: boolean; status: boolean; catatan: boolean; waktu: boolean };

const TYPE_LABELS: Record<TypeFilter, string> = {
  Semua: "Semua Tipe",
  IZIN: "Izin",
  SAKIT: "Sakit",
};

const STATUS_LABELS: Record<StatusFilter, string> = {
  Semua: "Semua Status",
  menunggu: "Menunggu",
  diterima: "Diterima",
  ditolak: "Ditolak",
};

async function generateWalasPengajuanPdf(
  records: StaffSubmission[],
  homeroom: StaffHomeroomContext,
  typeLabel: string,
  statusLabel: string,
  sortLabel: string,
  columns: Columns,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan Walas Pengajuan");
  const mx = REPORT_PDF_MARGIN_X;
  const { metaY } = drawReportPdfHeader(doc, {
    title: "LAPORAN PENGAJUAN KELAS",
    subtitle: "Laporan Wali Kelas",
  });
  const pills = [
    `Kelas: ${homeroom.class_name}`,
    `Tipe: ${typeLabel}`,
    `Status: ${statusLabel}`,
    `Total: ${records.length} pengajuan`,
    `Urutan: ${sortLabel}`,
  ];
  drawReportPdfPills(doc, pills, metaY);

  const head: string[][] = [["No", "Nama Siswa"]];
  if (columns.nis) head[0].push("NIS");
  if (columns.type) head[0].push("Tipe");
  if (columns.reason) head[0].push("Alasan");
  if (columns.status) head[0].push("Status");
  if (columns.catatan) head[0].push("Catatan Review");
  if (columns.waktu) head[0].push("Waktu");

  const body = records.map((r, i) => {
    const row: string[] = [String(i + 1), r.student_name];
    if (columns.nis) row.push(r.nis);
    if (columns.type) row.push(r.type ?? "—");
    if (columns.reason) row.push(r.reason ?? "—");
    if (columns.status) {
      const s = r.status ?? "";
      row.push(s.charAt(0).toUpperCase() + s.slice(1).toLowerCase());
    }
    if (columns.catatan) row.push((r as unknown as Record<string, string>).review_note ?? "—");
    if (columns.waktu) {
      const ts = (r as unknown as Record<string, string>).created_at ?? (r as unknown as Record<string, string>).submitted_at;
      row.push(ts ? new Date(ts).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—");
    }
    return row;
  });

  autoTable(doc, {
    head,
    body,
    startY: metaY + 8,
    margin: { left: mx, right: mx },
    ...REPORT_TABLE_STYLE,
  });

  drawReportPdfFooter(doc, `Laporan Pengajuan Kelas — ${homeroom.class_name} — ABSENSI CN`);

  doc.save(`Laporan-Walas-Pengajuan-${homeroom.class_name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

async function generateWalasPengajuanExcel(
  records: StaffSubmission[],
  homeroom: StaffHomeroomContext,
  typeLabel: string,
  statusLabel: string,
  sortLabel: string,
  columns: Columns,
) {
  const dateValue = (record: StaffSubmission) => {
    const raw = record as unknown as Record<string, string>;
    const value = raw.created_at ?? raw.submitted_at;
    return value ? new Date(value) : null;
  };
  await exportStyledExcelReport({
    filename: `Laporan-Walas-Pengajuan-${homeroom.class_name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}`,
    title: "LAPORAN PENGAJUAN KELAS",
    subtitle: "Sekolah Citra Negara - Laporan Wali Kelas",
    metadata: [
      { label: "Kelas", value: homeroom.class_name },
      { label: "Tipe", value: typeLabel },
      { label: "Status", value: statusLabel },
      { label: "Urutan", value: sortLabel },
    ],
    rows: records,
    dataSheetName: "Data Pengajuan",
    columns: [
      { header: "No", value: (_record, index) => index + 1, width: 7, kind: "number" },
      { header: "Nama Siswa", value: (record) => record.student_name, width: 28 },
      ...(columns.nis ? [{ header: "NIS", value: (record: StaffSubmission) => record.nis, width: 17 }] : []),
      ...(columns.type ? [{ header: "Tipe", value: (record: StaffSubmission) => TYPE_LABELS[record.type as TypeFilter] ?? record.type, width: 16, kind: "status" as const }] : []),
      ...(columns.reason ? [{ header: "Alasan", value: (record: StaffSubmission) => record.reason, width: 42 }] : []),
      ...(columns.status ? [{ header: "Status", value: (record: StaffSubmission) => STATUS_LABELS[(record.status ?? "") as StatusFilter] ?? record.status, width: 16, kind: "status" as const }] : []),
      ...(columns.catatan ? [{ header: "Catatan Review", value: (record: StaffSubmission) => (record as unknown as Record<string, string>).review_note, width: 38 }] : []),
      ...(columns.waktu ? [{ header: "Waktu Pengajuan", value: dateValue, width: 22, kind: "date" as const, numberFormat: "dd mmm yyyy hh:mm" }] : []),
    ],
  });
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeroom: StaffHomeroomContext;
};

export function WalasPengajuanReportModal({ open, onOpenChange, homeroom }: Props) {
  const [format, setFormat] = useState<ReportFormat | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter | null>(null);
  const [columns, setColumns] = useState<Columns>({ nis: true, type: true, reason: true, status: true, catatan: false, waktu: false });
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [generating, setGenerating] = useState(false);

  const showQ2 = typeFilter !== null;
  const showQ3 = typeFilter !== null && statusFilter !== null;
  const canDownload = format !== null && showQ3 && sortBy !== null;

  function resetState() {
    setFormat(null);
    setTypeFilter(null);
    setStatusFilter(null);
    setColumns({ nis: true, type: true, reason: true, status: true, catatan: false, waktu: false });
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
      const overview = await getTeacherHomeroomSubmissionsOverview({
        type: typeFilter === "Semua" ? "" : (typeFilter ?? ""),
        status: statusFilter === "Semua" ? "" : (statusFilter ?? ""),
      });

      const records = overview.records ?? [];
      if (records.length === 0) {
        toast.warning("Tidak ada pengajuan yang sesuai filter.");
        return;
      }

      const sorted = [...records].sort((a, b) => {
        if (sortBy === "name") return a.student_name.localeCompare(b.student_name, "id");
        if (sortBy === "nis") return a.nis.localeCompare(b.nis, "id");
        if (sortBy === "type") return (a.type ?? "").localeCompare(b.type ?? "", "id");
        if (sortBy === "status") return (a.status ?? "").localeCompare(b.status ?? "", "id");
        // newest: sort by created_at desc
        const aTs = (a as unknown as Record<string, string>).created_at ?? "";
        const bTs = (b as unknown as Record<string, string>).created_at ?? "";
        return bTs.localeCompare(aTs);
      });

      const typeLabel = typeFilter ? TYPE_LABELS[typeFilter] : "Semua Tipe";
      const statusLabel = statusFilter ? STATUS_LABELS[statusFilter] : "Semua Status";
      const sortLabel =
        sortBy === "name" ? "Nama (A–Z)" :
        sortBy === "nis" ? "NIS" :
        sortBy === "type" ? "Tipe" :
        sortBy === "status" ? "Status" : "Waktu terbaru";

      if (format === "excel") {
        await generateWalasPengajuanExcel(sorted, homeroom, typeLabel, statusLabel, sortLabel, columns);
      } else {
        await generateWalasPengajuanPdf(sorted, homeroom, typeLabel, statusLabel, sortLabel, columns);
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
      title="Export Laporan Pengajuan Kelas"
      description="Pilih PDF siap cetak atau Excel bergaya untuk mengolah rekap pengajuan."
      icon={Printer}
      className="sm:!max-w-[640px]"
    >
      <div className="space-y-4">
        <ReportFormatQuestion value={format} onChange={setFormat} />
        {/* Q1 — Tipe */}
        <QuestionBlock icon={FileText} label="Filter berdasarkan tipe pengajuan" answered={typeFilter !== null}>
          <div className="grid gap-2 sm:grid-cols-2">
            {(["Semua", "IZIN", "SAKIT"] as TypeFilter[]).map((t) => (
              <ReportRadio key={t} selected={typeFilter === t} label={TYPE_LABELS[t]} onClick={() => { setTypeFilter(t); setStatusFilter(null); setSortBy(null); }} />
            ))}
          </div>
        </QuestionBlock>

        {/* Q2 — Status */}
        <AnimatePresence>
          {showQ2 && (
            <motion.div key="q2" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.26, ease: "easeOut" }}>
              <QuestionBlock icon={ClipboardCheck} label="Filter berdasarkan status pengajuan" answered={statusFilter !== null}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["Semua", "menunggu", "diterima", "ditolak"] as StatusFilter[]).map((s) => (
                    <ReportRadio key={s} selected={statusFilter === s} label={STATUS_LABELS[s]} onClick={() => { setStatusFilter(s); setSortBy(null); }} />
                  ))}
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Q3 — Kolom */}
        <AnimatePresence>
          {showQ3 && (
            <motion.div key="q3" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.26, ease: "easeOut" }}>
              <QuestionBlock icon={ListChecks} label="Kolom yang ingin ditampilkan" answered>
                <div className="grid gap-2 sm:grid-cols-3">
                  <ReportCheckbox checked disabled label="Nama" badge="wajib" />
                  <ReportCheckbox checked={columns.nis} onChange={(v) => setColumns((c) => ({ ...c, nis: v }))} label="NIS" />
                  <ReportCheckbox checked={columns.type} onChange={(v) => setColumns((c) => ({ ...c, type: v }))} label="Tipe" />
                  <ReportCheckbox checked={columns.reason} onChange={(v) => setColumns((c) => ({ ...c, reason: v }))} label="Alasan" />
                  <ReportCheckbox checked={columns.status} onChange={(v) => setColumns((c) => ({ ...c, status: v }))} label="Status" />
                  <ReportCheckbox checked={columns.catatan} onChange={(v) => setColumns((c) => ({ ...c, catatan: v }))} label="Catatan Review" />
                  <ReportCheckbox checked={columns.waktu} onChange={(v) => setColumns((c) => ({ ...c, waktu: v }))} label="Waktu Pengajuan" />
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Q4 — Urutan */}
        <AnimatePresence>
          {showQ3 && (
            <motion.div key="q4" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.26, ease: "easeOut", delay: 0.08 }}>
              <QuestionBlock icon={ArrowUpDown} label="Urutkan data berdasarkan" answered={sortBy !== null}>
                <div className="grid gap-2 sm:grid-cols-2">
                  <ReportRadio selected={sortBy === "name"} label="Nama (A–Z)" onClick={() => setSortBy("name")} />
                  <ReportRadio selected={sortBy === "nis"} label="NIS" onClick={() => setSortBy("nis")} />
                  <ReportRadio selected={sortBy === "type"} label="Tipe" onClick={() => setSortBy("type")} />
                  <ReportRadio selected={sortBy === "status"} label="Status" onClick={() => setSortBy("status")} />
                  <ReportRadio selected={sortBy === "newest"} label="Waktu terbaru" onClick={() => setSortBy("newest")} />
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
