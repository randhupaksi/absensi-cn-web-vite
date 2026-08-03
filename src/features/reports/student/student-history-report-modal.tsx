"use client";

import { PremiumModal } from "@/components/modals/premium-modal";
import { ReportModalFooter } from "@/features/reports/shared/report-modal-footer";
import {
  QuestionBlock,
  ReportCheckbox,
  ReportFormatQuestion,
  type ReportFormat,
} from "@/features/reports/shared/report-question-ui";
import { exportStyledExcelReport } from "@/lib/reports/excel-report-kit";
import { applyPdfCreditMetadata } from "@/lib/reports/pdf-metadata";
import {
  drawReportPdfFooter,
  drawReportPdfHeader,
  drawReportPdfPills,
  REPORT_PDF_MARGIN_X,
  REPORT_TABLE_STYLE,
} from "@/lib/reports/pdf-report-kit";
import type { StaffAttendanceRecord } from "@/types/staff";
import type { StudentProfile, StudentStats } from "@/types/student";
import { CalendarDays, Columns3, Database, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Columns = {
  checkIn: boolean;
  validation: boolean;
  notes: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: StudentProfile;
  stats?: StudentStats;
  attendance: StaffAttendanceRecord[];
};

export function StudentHistoryReportModal({
  open,
  onOpenChange,
  profile,
  stats,
  attendance,
}: Props) {
  const [format, setFormat] = useState<ReportFormat | null>(null);
  const [columns, setColumns] = useState<Columns>({
    checkIn: true,
    validation: true,
    notes: true,
  });
  const [generating, setGenerating] = useState(false);

  const sortedAttendance = useMemo(
    () => [...attendance].sort((first, second) => first.attendance_date.localeCompare(second.attendance_date)),
    [attendance],
  );

  useEffect(() => {
    if (!open) setFormat(null);
  }, [open]);

  async function handleDownload() {
    if (!profile || !format || sortedAttendance.length === 0) return;

    setGenerating(true);
    try {
      if (format === "excel") {
        await generateStudentHistoryExcel(sortedAttendance, profile, stats, columns);
      } else {
        await generateStudentHistoryPdf(sortedAttendance, profile, stats, columns);
      }
      onOpenChange(false);
    } catch {
      toast.error(`Gagal membuat ${format === "excel" ? "Excel" : "PDF"} histori absensi. Silakan coba lagi.`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <PremiumModal
      open={open}
      onOpenChange={onOpenChange}
      title="Export Histori Absensi"
      description="Pilih format laporan. Excel tersusun dalam dua tab: ringkasan siswa dan histori absensi per bulan."
      icon={Printer}
      className="sm:!max-w-[640px]"
    >
      <div className="space-y-4">
        <ReportFormatQuestion value={format} onChange={setFormat} />

        <QuestionBlock icon={Database} label="Data laporan" answered={Boolean(profile && sortedAttendance.length)}>
          <div className="rounded-[0.9rem] border border-white bg-white/80 px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{profile?.name ?? "Profil siswa belum tersedia"}</p>
            <p className="mt-1">{profile?.class_name ?? "Kelas"} · {profile?.school_year_name ?? "Tahun ajaran"}</p>
            <p>{sortedAttendance.length} riwayat absensi akan disusun kronologis per bulan.</p>
          </div>
        </QuestionBlock>

        <QuestionBlock icon={Columns3} label="Kolom histori" answered>
          <div className="grid gap-2 min-[520px]:grid-cols-2">
            <ReportCheckbox checked disabled label="Bulan, tanggal & status" badge="wajib" />
            <ReportCheckbox checked={columns.checkIn} onChange={(value) => setColumns((current) => ({ ...current, checkIn: value }))} label="Waktu masuk" />
            <ReportCheckbox checked={columns.validation} onChange={(value) => setColumns((current) => ({ ...current, validation: value }))} label="Status validasi" />
            <ReportCheckbox checked={columns.notes} onChange={(value) => setColumns((current) => ({ ...current, notes: value }))} label="Catatan absensi" />
          </div>
        </QuestionBlock>

        <QuestionBlock icon={CalendarDays} label="Susunan laporan" answered>
          <p className="rounded-[0.9rem] border border-emerald-100 bg-white/80 px-4 py-3 text-sm leading-6 text-slate-600">
            Ringkasan identitas dan persentase kehadiran ditampilkan lebih dahulu, lalu histori diurutkan dari bulan terlama ke terbaru.
          </p>
        </QuestionBlock>

        <ReportModalFooter
          canDownload={Boolean(format && profile && sortedAttendance.length > 0)}
          generating={generating}
          onCancel={() => onOpenChange(false)}
          onDownload={handleDownload}
          format={format}
          generatingLabel={`Membuat ${format === "excel" ? "Excel" : "PDF"}...`}
          downloadLabel={format ? `Unduh ${format === "excel" ? "Excel" : "PDF"}` : "Pilih format laporan"}
        />
      </div>
    </PremiumModal>
  );
}

async function generateStudentHistoryExcel(
  attendance: StaffAttendanceRecord[],
  profile: StudentProfile,
  stats: StudentStats | undefined,
  columns: Columns,
) {
  const rate = getAttendanceRate(stats);
  await exportStyledExcelReport({
    filename: `Histori-Absensi-${slugify(profile.name)}-${new Date().toISOString().slice(0, 10)}`,
    title: "LAPORAN HISTORI ABSENSI SISWA",
    subtitle: "Sekolah Citra Negara - Rekap Kehadiran Pribadi",
    metadata: [
      { label: "Nama siswa", value: profile.name },
      { label: "NIS", value: profile.nis },
      { label: "NISN", value: profile.nisn || "-" },
      { label: "Kelas", value: profile.class_name || "-" },
      { label: "Jurusan", value: profile.major_code || "-" },
      { label: "Tahun ajaran", value: profile.school_year_name || "-" },
      { label: "Periode", value: getPeriodLabel(attendance) },
    ],
    metrics: [
      { label: "Total absensi", value: stats?.total_attendance ?? attendance.length, tone: "emerald" },
      { label: "Hadir", value: stats?.present ?? countStatus(attendance, "hadir"), tone: "emerald" },
      { label: "Izin", value: stats?.permission ?? countStatus(attendance, "izin"), tone: "sky" },
      { label: "Sakit", value: stats?.sick ?? countStatus(attendance, "sakit"), tone: "violet" },
      { label: "Alfa", value: stats?.alpha ?? countStatus(attendance, "alfa"), tone: "rose" },
      { label: "Kehadiran", value: `${Math.round(rate * 100)}%`, tone: "amber" },
    ],
    rows: attendance,
    dataSheetName: "Histori per Bulan",
    includeStatisticsSheet: false,
    columns: [
      { header: "No", value: (_record, index) => index + 1, width: 7, kind: "number" },
      { header: "Bulan", value: (record) => formatMonth(record.attendance_date), width: 22 },
      { header: "Tanggal", value: (record) => toDate(record.attendance_date), width: 16, kind: "date" },
      { header: "Status", value: (record) => formatStatus(record.status), width: 14, kind: "status" },
      ...(columns.checkIn ? [{ header: "Absen Masuk", value: (record: StaffAttendanceRecord) => toDateTime(record.check_in_at), width: 18, kind: "date" as const, numberFormat: "hh:mm" }] : []),
      ...(columns.validation ? [{ header: "Validasi", value: (record: StaffAttendanceRecord) => getValidationLabel(record), width: 22, kind: "status" as const }] : []),
      ...(columns.notes ? [{ header: "Catatan", value: (record: StaffAttendanceRecord) => record.notes || record.verification_note || "-", width: 42 }] : []),
    ],
  });
}

async function generateStudentHistoryPdf(
  attendance: StaffAttendanceRecord[],
  profile: StudentProfile,
  stats: StudentStats | undefined,
  columns: Columns,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan Histori Absensi Siswa");

  const { metaY } = drawReportPdfHeader(doc, {
    title: "LAPORAN HISTORI ABSENSI",
    subtitle: "Rekap Kehadiran Siswa",
  });
  drawReportPdfPills(doc, [
    `Siswa: ${profile.name}`,
    `Kelas: ${profile.class_name ?? "-"}`,
    `Periode: ${getPeriodLabel(attendance)}`,
    `Kehadiran: ${Math.round(getAttendanceRate(stats) * 100)}%`,
    `Total: ${attendance.length} data`,
  ], metaY);

  const head = [["No", "Bulan", "Tanggal", "Status"]];
  if (columns.checkIn) head[0].push("Absen Masuk");
  if (columns.validation) head[0].push("Validasi");
  if (columns.notes) head[0].push("Catatan");

  const body = attendance.map((record, index) => {
    const row = [String(index + 1), formatMonth(record.attendance_date), formatDate(record.attendance_date), formatStatus(record.status)];
    if (columns.checkIn) row.push(formatTime(record.check_in_at));
    if (columns.validation) row.push(getValidationLabel(record));
    if (columns.notes) row.push(record.notes || record.verification_note || "-");
    return row;
  });

  autoTable(doc, {
    head,
    body,
    startY: metaY + 8,
    margin: { left: REPORT_PDF_MARGIN_X, right: REPORT_PDF_MARGIN_X },
    ...REPORT_TABLE_STYLE,
  });

  drawReportPdfFooter(doc, `Histori Absensi ${profile.name} - ABSENSI CN`);
  doc.save(`Histori-Absensi-${slugify(profile.name)}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function getAttendanceRate(stats?: StudentStats) {
  if (!stats?.total_attendance) return 0;
  return stats.present / stats.total_attendance;
}

function countStatus(attendance: StaffAttendanceRecord[], status: string) {
  return attendance.filter((record) => record.status.toLowerCase() === status).length;
}

function getPeriodLabel(attendance: StaffAttendanceRecord[]) {
  if (attendance.length === 0) return "Belum ada data";
  return `${formatMonth(attendance[0].attendance_date)} - ${formatMonth(attendance[attendance.length - 1].attendance_date)}`;
}

function getValidationLabel(record: StaffAttendanceRecord) {
  if (record.verified_at) return "Sudah direview";
  return record.status.toLowerCase() === "hadir" ? "Terkirim" : "Menunggu review";
}

function formatStatus(value: string) {
  return value ? `${value.slice(0, 1).toUpperCase()}${value.slice(1).toLowerCase()}` : "-";
}

function formatMonth(value: string) {
  const date = toDate(value);
  return date ? date.toLocaleDateString("id-ID", { month: "long", year: "numeric" }) : "-";
}

function formatDate(value: string) {
  const date = toDate(value);
  return date ? date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-";
}

function formatTime(value?: string) {
  const date = toDateTime(value);
  return date ? date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-";
}

function toDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toDateTime(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function slugify(value: string) {
  return value.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "") || "Siswa";
}
