"use client";

import { PremiumModal } from "@/components/modals/premium-modal";
import { ReportModalFooter } from "@/features/reports/shared/report-modal-footer";
import {
  QuestionBlock,
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
import type { StaffSubjectAssignment } from "@/types/staff";
import { CalendarClock, Database, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const DAY_ORDER = [
  "senin",
  "selasa",
  "rabu",
  "kamis",
  "jumat",
  "sabtu",
  "minggu",
];
const DAY_LABELS: Record<string, string> = {
  senin: "Senin",
  selasa: "Selasa",
  rabu: "Rabu",
  kamis: "Kamis",
  jumat: "Jumat",
  sabtu: "Sabtu",
  minggu: "Minggu",
};

type ScheduleReportRow = {
  day: string;
  start: string;
  end: string;
  durationMinutes: number;
  subjectName: string;
  className: string;
  schoolYearName: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherName: string;
  assignments: StaffSubjectAssignment[];
  dayFilter: string;
  classFilter: string;
};

export function SubjectScheduleReportModal({
  open,
  onOpenChange,
  teacherName,
  assignments,
  dayFilter,
  classFilter,
}: Props) {
  const [format, setFormat] = useState<ReportFormat | null>(null);
  const [generating, setGenerating] = useState(false);
  const rows = useMemo(
    () => buildScheduleReportRows(assignments, dayFilter, classFilter),
    [assignments, classFilter, dayFilter],
  );
  const summary = useMemo(() => getScheduleSummary(rows), [rows]);
  const filterLabel = useMemo(
    () => getFilterLabel(assignments, dayFilter, classFilter),
    [assignments, classFilter, dayFilter],
  );

  function handleClose(isOpen: boolean) {
    if (!isOpen) setFormat(null);
    onOpenChange(isOpen);
  }

  async function handleDownload() {
    if (!format || rows.length === 0) return;
    setGenerating(true);
    try {
      if (format === "excel") {
        await generateScheduleExcel(rows, summary, teacherName, filterLabel);
      } else {
        await generateSchedulePdf(rows, summary, teacherName, filterLabel);
      }
    } catch {
      toast.error(
        `Gagal membuat ${format === "excel" ? "Excel" : "PDF"} jadwal mengajar. Silakan coba lagi.`,
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <PremiumModal
      open={open}
      onOpenChange={handleClose}
      title="Export Jadwal Mengajar"
      description="Pilih PDF siap cetak atau Excel dua tab untuk ringkasan dan rincian jadwal."
      icon={Printer}
      className="sm:!max-w-[640px]"
    >
      <div className="space-y-4">
        <ReportFormatQuestion value={format} onChange={setFormat} />

        <QuestionBlock
          icon={Database}
          label="Cakupan laporan"
          answered={rows.length > 0}
        >
          <div className="rounded-[0.9rem] border border-white bg-white/80 px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{teacherName}</p>
            <p className="mt-1">Jadwal aktif mingguan - {filterLabel}</p>
            <p>
              {summary.subjectCount} mapel - {summary.classCount} kelas -{" "}
              {summary.slotCount} slot
            </p>
          </div>
        </QuestionBlock>

        <QuestionBlock icon={CalendarClock} label="Isi dokumen" answered>
          <div className="rounded-[0.9rem] border border-white bg-white/80 px-4 py-3 text-sm leading-6 text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">Excel:</span> tab
              Ringkasan berisi statistik beban mengajar, lalu tab Rincian
              Jadwal.
            </p>
            <p className="mt-1">
              <span className="font-semibold text-slate-900">PDF:</span>{" "}
              identitas guru, statistik utama, dan tabel jadwal siap cetak.
            </p>
          </div>
        </QuestionBlock>

        <ReportModalFooter
          canDownload={Boolean(format && rows.length > 0)}
          generating={generating}
          onCancel={() => handleClose(false)}
          onDownload={handleDownload}
          format={format}
          generatingLabel={`Membuat ${format === "excel" ? "Excel" : "PDF"}...`}
          downloadLabel={
            format
              ? `Unduh ${format === "excel" ? "Excel" : "PDF"}`
              : "Pilih format laporan"
          }
        />
      </div>
    </PremiumModal>
  );
}

function buildScheduleReportRows(
  assignments: StaffSubjectAssignment[],
  dayFilter: string,
  classFilter: string,
): ScheduleReportRow[] {
  return assignments
    .filter((assignment) => assignment.is_active)
    .flatMap((assignment) =>
      assignment.schedules
        .filter((schedule) => schedule.is_active)
        .filter(
          (schedule) =>
            dayFilter === "all" || schedule.hari.toLowerCase() === dayFilter,
        )
        .filter(
          (schedule) =>
            classFilter === "all" || schedule.class_id === classFilter,
        )
        .map((schedule) => ({
          day: schedule.hari.toLowerCase(),
          start: normalizeTime(schedule.jam_mulai),
          end: normalizeTime(schedule.jam_selesai),
          durationMinutes: getDurationMinutes(
            schedule.jam_mulai,
            schedule.jam_selesai,
          ),
          subjectName: assignment.subject_name,
          className: schedule.class_name,
          schoolYearName: assignment.school_year_name,
        })),
    )
    .sort(
      (first, second) =>
        DAY_ORDER.indexOf(first.day) - DAY_ORDER.indexOf(second.day) ||
        first.start.localeCompare(second.start) ||
        first.className.localeCompare(second.className, "id"),
    );
}

function getScheduleSummary(rows: ScheduleReportRow[]) {
  return {
    slotCount: rows.length,
    subjectCount: new Set(rows.map((row) => row.subjectName)).size,
    classCount: new Set(rows.map((row) => row.className)).size,
    dayCount: new Set(rows.map((row) => row.day)).size,
    totalMinutes: rows.reduce((total, row) => total + row.durationMinutes, 0),
    subjects: [...new Set(rows.map((row) => row.subjectName))].join(", "),
    classes: [...new Set(rows.map((row) => row.className))].join(", "),
    schoolYears: [...new Set(rows.map((row) => row.schoolYearName))].join(", "),
  };
}

function getFilterLabel(
  assignments: StaffSubjectAssignment[],
  dayFilter: string,
  classFilter: string,
) {
  const day =
    dayFilter === "all" ? "Semua hari" : (DAY_LABELS[dayFilter] ?? dayFilter);
  const className =
    classFilter === "all"
      ? "Semua kelas"
      : (assignments
          .flatMap((assignment) => assignment.schedules)
          .find((schedule) => schedule.class_id === classFilter)?.class_name ??
        "Kelas terpilih");
  return `${day} - ${className}`;
}

async function generateScheduleExcel(
  rows: ScheduleReportRow[],
  summary: ReturnType<typeof getScheduleSummary>,
  teacherName: string,
  filterLabel: string,
) {
  const dateLabel = new Date().toISOString().slice(0, 10);
  await exportStyledExcelReport({
    filename: `Jadwal-Mengajar-${toFilenamePart(teacherName)}-${dateLabel}`,
    title: "LAPORAN JADWAL MENGAJAR",
    subtitle: "Sekolah Citra Negara - Jadwal Aktif Guru Mata Pelajaran",
    metadata: [
      { label: "Guru", value: teacherName },
      { label: "Tahun ajaran", value: summary.schoolYears || "-" },
      { label: "Filter", value: filterLabel },
      { label: "Mata pelajaran", value: summary.subjects || "-" },
    ],
    metrics: [
      {
        label: "Total Jam Mengajar",
        value: formatDuration(summary.totalMinutes),
        tone: "emerald",
      },
      { label: "Slot Jadwal", value: summary.slotCount, tone: "sky" },
      { label: "Mapel Aktif", value: summary.subjectCount, tone: "violet" },
      { label: "Kelas Terjadwal", value: summary.classCount, tone: "amber" },
      { label: "Hari Mengajar", value: summary.dayCount, tone: "slate" },
    ],
    rows,
    dataSheetName: "Rincian Jadwal",
    includeStatisticsSheet: false,
    showColumnFilters: false,
    groupBy: (row) => DAY_LABELS[row.day] ?? row.day,
    columns: [
      {
        header: "No",
        value: (_row, index) => index + 1,
        width: 7,
        kind: "number",
      },
      {
        header: "Hari",
        value: (row) => DAY_LABELS[row.day] ?? row.day,
        width: 14,
      },
      { header: "Jam Mulai", value: (row) => row.start, width: 14 },
      { header: "Jam Selesai", value: (row) => row.end, width: 14 },
      {
        header: "Durasi",
        value: (row) => formatDuration(row.durationMinutes),
        width: 16,
      },
      { header: "Mata Pelajaran", value: (row) => row.subjectName, width: 28 },
      { header: "Kelas", value: (row) => row.className, width: 22 },
      { header: "Tahun Ajaran", value: (row) => row.schoolYearName, width: 18 },
    ],
  });
}

async function generateSchedulePdf(
  rows: ScheduleReportRow[],
  summary: ReturnType<typeof getScheduleSummary>,
  teacherName: string,
  filterLabel: string,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan Jadwal Mengajar");

  const mx = REPORT_PDF_MARGIN_X;
  const { metaY } = drawReportPdfHeader(doc, {
    title: "LAPORAN JADWAL MENGAJAR",
    subtitle: "Jadwal Aktif Guru Mata Pelajaran",
  });
  drawReportPdfPills(
    doc,
    [
      `Guru: ${teacherName}`,
      `Tahun ajaran: ${summary.schoolYears || "-"}`,
      `Filter: ${filterLabel}`,
    ],
    metaY,
  );
  drawReportPdfPills(
    doc,
    [
      `Mapel: ${summary.subjectCount}`,
      `Kelas: ${summary.classCount}`,
      `Slot: ${summary.slotCount}`,
      `Total jam: ${formatDuration(summary.totalMinutes)}`,
      `Hari mengajar: ${summary.dayCount}`,
    ],
    metaY + 7,
  );

  autoTable(doc, {
    head: [
      [
        "No",
        "Hari",
        "Jam",
        "Durasi",
        "Mata Pelajaran",
        "Kelas",
        "Tahun Ajaran",
      ],
    ],
    body: rows.map((row, index) => [
      String(index + 1),
      DAY_LABELS[row.day] ?? row.day,
      `${row.start}-${row.end}`,
      formatDuration(row.durationMinutes),
      row.subjectName,
      row.className,
      row.schoolYearName,
    ]),
    startY: metaY + 16,
    margin: { left: mx, right: mx },
    ...REPORT_TABLE_STYLE,
  });

  drawReportPdfFooter(doc, `Jadwal Mengajar - ${teacherName} - ABSENSI CN`);
  doc.save(
    `Jadwal-Mengajar-${toFilenamePart(teacherName)}-${new Date().toISOString().slice(0, 10)}.pdf`,
  );
}

function normalizeTime(value: string) {
  return value.slice(0, 5);
}

function getDurationMinutes(start: string, end: string) {
  const [startHour, startMinute] = normalizeTime(start).split(":").map(Number);
  const [endHour, endMinute] = normalizeTime(end).split(":").map(Number);
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  return Math.max(0, endTotal - startTotal);
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} menit`;
  if (minutes === 0) return `${hours} jam`;
  return `${hours} jam ${minutes} menit`;
}

function toFilenamePart(value: string) {
  return (
    value
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "Guru"
  );
}
