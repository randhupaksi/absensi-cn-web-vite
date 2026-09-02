"use client";

import { PremiumModal } from "@/components/modals/premium-modal";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ReportModalFooter } from "@/features/reports/shared/report-modal-footer";
import {
  QuestionBlock,
  ReportFormatQuestion,
  ReportRadio,
  type ReportFormat,
} from "@/features/reports/shared/report-question-ui";
import type {
  AnalyticsExportScope,
  AnalyticsExportSort,
} from "@/features/admin/analytics/export-attendance-analytics";
import type { AdminAttendanceAnalytics } from "@/types/admin";
import {
  CalendarClock,
  CalendarDays,
  ChartNoAxesCombined,
  Database,
  Layers3,
  ListChecks,
  UsersRound,
} from "lucide-react";
import { id as localeID } from "date-fns/locale";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type StudentRow = AdminAttendanceAnalytics["students"]["rows"][number];
type ExportPeriodMode = "today" | "date" | "range";
type ExportReportType = "daily" | "cumulative" | "all";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analytics?: AdminAttendanceAnalytics;
  fullPeriod: { dateFrom: string; dateTo: string };
  onLoadAnalytics: (
    dateFrom: string,
    dateTo: string,
  ) => Promise<AdminAttendanceAnalytics>;
  onLoadStudents: (dateFrom: string, dateTo: string) => Promise<StudentRow[]>;
};

const scopeOptions: Array<{
  value: AnalyticsExportScope;
  label: string;
  description: string;
}> = [
  {
    value: "overall",
    label: "Keseluruhan cakupan",
    description:
      "Ringkasan kelas, jurusan, dan tingkat sesuai filter analitik yang aktif",
  },
  {
    value: "classes",
    label: "Per kelas",
    description: "Bandingkan performa setiap kelas",
  },
  {
    value: "majors",
    label: "Per jurusan",
    description: "Lihat performa tiap jurusan",
  },
  {
    value: "grades",
    label: "Per tingkat",
    description: "Ringkasan kelas X, XI, dan XII",
  },
];

const sortOptions: Array<{
  value: AnalyticsExportSort;
  label: string;
  description: string;
}> = [
  {
    value: "consistency_desc",
    label: "Konsistensi tertinggi ke terendah",
    description:
      "Cocok untuk melihat kelas dengan kebiasaan absensi paling stabil terlebih dahulu",
  },
  {
    value: "consistency_asc",
    label: "Konsistensi terendah ke tertinggi",
    description:
      "Cocok untuk menentukan kelas yang perlu ditindaklanjuti lebih dulu",
  },
  {
    value: "attendance_desc",
    label: "Persentase terbesar ke terkecil",
    description:
      "Urut berdasarkan persentase kehadiran tertinggi terlebih dahulu",
  },
  {
    value: "attendance_asc",
    label: "Persentase terkecil ke terbesar",
    description:
      "Urut berdasarkan persentase kehadiran terendah terlebih dahulu",
  },
  {
    value: "name",
    label: "Berdasarkan nama",
    description: "Urut alfabetis dari nama kelas, jurusan, tingkat, atau siswa",
  },
];

const periodOptions: Array<{
  value: ExportPeriodMode;
  label: string;
  description: string;
}> = [
  {
    value: "today",
    label: "Hari ini",
    description: "Export data untuk tanggal hari ini",
  },
  {
    value: "date",
    label: "Tanggal tertentu",
    description: "Pilih satu tanggal yang ingin diexport",
  },
  {
    value: "range",
    label: "Rentang tanggal",
    description: "Pilih tanggal mulai dan tanggal akhir",
  },
];

const reportTypeOptions: Array<{
  value: ExportReportType;
  label: string;
  badge?: string;
}> = [
  { value: "daily", label: "Periodik per hari", badge: "Per tanggal" },
  { value: "cumulative", label: "Rekap akumulatif", badge: "Total periode" },
  { value: "all", label: "Sepanjang periode" },
];

function getTodayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function parseDateValue(value: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function CalendarField({
  value,
  label,
  title,
  onChange,
}: {
  value: string;
  label: string;
  title: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button type="button" variant="outline" />}
        className="h-11 w-full justify-start rounded-[16px] border-slate-300/80 bg-white px-3 text-left text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      >
        <CalendarClock className="mr-1.5 size-3.5 shrink-0 text-emerald-600" />
        <span className="truncate">
          {value ? formatDateLabel(value) : label}
        </span>
      </PopoverTrigger>
      <PopoverContent
        sideOffset={8}
        className="w-auto rounded-[22px] border border-emerald-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] p-4 shadow-[0_24px_54px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-900 dark:bg-none"
      >
        <PopoverHeader className="px-2 pb-2 pt-1">
          <PopoverTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </PopoverTitle>
        </PopoverHeader>
        <Calendar
          mode="single"
          locale={localeID}
          selected={parseDateValue(value)}
          onSelect={(date) => {
            if (date) {
              onChange(toDateInputValue(date));
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export function AttendanceAnalyticsReportModal({
  open,
  onOpenChange,
  analytics,
  fullPeriod,
  onLoadAnalytics,
  onLoadStudents,
}: Props) {
  const [format, setFormat] = useState<ReportFormat | null>("pdf");
  const [reportType, setReportType] = useState<ExportReportType | null>(
    "cumulative",
  );
  const [periodMode, setPeriodMode] = useState<ExportPeriodMode | null>(
    "range",
  );
  const [selectedDate, setSelectedDate] = useState("");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [scope, setScope] = useState<AnalyticsExportScope | null>("overall");
  const [sort, setSort] = useState<AnalyticsExportSort | null>(
    "consistency_desc",
  );
  const [includeStudentDetails, setIncludeStudentDetails] = useState<
    boolean | null
  >(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFormat("pdf");
    setReportType("cumulative");
    setPeriodMode("range");
    setSelectedDate("");
    setRangeFrom(analytics?.period.date_from ?? "");
    setRangeTo(analytics?.period.date_to ?? "");
    setScope("overall");
    setSort("consistency_desc");
    setIncludeStudentDetails(false);
  }, [analytics?.period.date_from, analytics?.period.date_to, open]);

  const exportPeriod =
    reportType === "all"
      ? fullPeriod
      : periodMode === "today"
        ? { dateFrom: getTodayISO(), dateTo: getTodayISO() }
        : periodMode === "date" && selectedDate
          ? { dateFrom: selectedDate, dateTo: selectedDate }
          : periodMode === "range" &&
              rangeFrom &&
              rangeTo &&
              rangeFrom <= rangeTo
            ? { dateFrom: rangeFrom, dateTo: rangeTo }
            : null;
  const availablePeriodOptions =
    reportType === "daily"
      ? periodOptions.filter(
          (option) => option.value === "today" || option.value === "date",
        )
      : periodOptions.filter(
          (option) => option.value === "date" || option.value === "range",
        );

  const canDownload = Boolean(
    analytics &&
    analytics.summary.total_students > 0 &&
    format &&
    reportType &&
    exportPeriod &&
    scope &&
    sort &&
    includeStudentDetails !== null,
  );

  function resetState() {
    setFormat("pdf");
    setReportType("cumulative");
    setPeriodMode("range");
    setSelectedDate("");
    setRangeFrom(analytics?.period.date_from ?? "");
    setRangeTo(analytics?.period.date_to ?? "");
    setScope("overall");
    setSort("consistency_desc");
    setIncludeStudentDetails(false);
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen && !generating) resetState();
    onOpenChange(isOpen);
  }

  async function handleDownload() {
    if (
      !analytics ||
      !format ||
      !reportType ||
      !scope ||
      !sort ||
      !exportPeriod ||
      includeStudentDetails === null ||
      generating
    )
      return;

    setGenerating(true);
    try {
      const exportAnalytics = await onLoadAnalytics(
        exportPeriod.dateFrom,
        exportPeriod.dateTo,
      );
      const needsStudentRows = includeStudentDetails;
      const students = needsStudentRows
        ? await onLoadStudents(exportPeriod.dateFrom, exportPeriod.dateTo)
        : [];
      const { exportAttendanceAnalytics } =
        await import("@/features/admin/analytics/export-attendance-analytics");
      await exportAttendanceAnalytics({
        analytics: exportAnalytics,
        students,
        scope,
        format,
        includeStudentDetails,
        sort,
        reportType,
      });
      toast.success("Laporan analitik berhasil dibuat.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Gagal membuat ${format === "excel" ? "Excel" : "PDF"} analitik. Silakan coba lagi.`,
      );
    } finally {
      setGenerating(false);
    }
  }

  const periodLabel = analytics
    ? `${exportPeriod?.dateFrom ?? analytics.period.date_from} sampai ${exportPeriod?.dateTo ?? analytics.period.date_to}`
    : "Data analitik belum tersedia";
  const activeFilters = analytics
    ? [
        analytics.filters.grade
          ? `Tingkat ${analytics.filters.grade}`
          : "Semua tingkat",
        analytics.filters.major_id ? "Jurusan terpilih" : "Semua jurusan",
        analytics.filters.class_id ? "Kelas terpilih" : "Semua kelas",
      ].join(" · ")
    : "-";

  return (
    <PremiumModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Export Laporan Analitik"
      description="PDF sudah disiapkan sebagai ringkasan siap baca dan cetak. Semua hasil tetap mengikuti periode serta filter analitik yang sedang aktif."
      icon={ChartNoAxesCombined}
      className="sm:!max-w-[680px]"
      disablePointerDismissal={generating}
    >
      <div className="space-y-4">
        <ReportFormatQuestion value={format} onChange={setFormat} />

        {format === "pdf" ? (
          <p className="rounded-[1rem] border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-xs leading-5 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100">
            PDF berisi ringkasan utama, status, tren, dan peringkat. Detail
            siswa hanya ditambahkan sebagai lampiran bila diperlukan.
          </p>
        ) : null}

        <QuestionBlock
          icon={ChartNoAxesCombined}
          label="Pilih tipe laporan"
          answered={reportType !== null}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {reportTypeOptions.map((option) => (
              <ReportRadio
                key={option.value}
                selected={reportType === option.value}
                label={option.label}
                badge={option.badge}
                onClick={() => {
                  setReportType(option.value);
                  setPeriodMode(null);
                  setSelectedDate("");
                  setRangeFrom("");
                  setRangeTo("");
                }}
              />
            ))}
          </div>
        </QuestionBlock>

        {reportType && reportType !== "all" ? (
          <QuestionBlock
            icon={CalendarDays}
            label="Pilih periode absensi"
            answered={exportPeriod !== null}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {availablePeriodOptions.map((option) => (
                <ReportRadio
                  key={option.value}
                  selected={periodMode === option.value}
                  label={option.label}
                  badge={
                    option.value === "today"
                      ? formatDateLabel(getTodayISO())
                      : undefined
                  }
                  onClick={() => {
                    setPeriodMode(option.value);
                    if (option.value === "date") setSelectedDate("");
                    if (option.value === "range") {
                      setRangeFrom("");
                      setRangeTo("");
                    }
                  }}
                />
              ))}
            </div>
            {periodMode === "date" ? (
              <div className="mt-3">
                <CalendarField
                  value={selectedDate}
                  label="Pilih tanggal"
                  title="Pilih tanggal absensi"
                  onChange={setSelectedDate}
                />
              </div>
            ) : null}
            {periodMode === "range" ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <CalendarField
                  value={rangeFrom}
                  label="Tanggal mulai"
                  title="Tanggal mulai"
                  onChange={(value) => {
                    setRangeFrom(value);
                    if (rangeTo && value > rangeTo) setRangeTo("");
                  }}
                />
                <CalendarField
                  value={rangeTo}
                  label="Tanggal akhir"
                  title="Tanggal akhir"
                  onChange={setRangeTo}
                />
              </div>
            ) : null}
            <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {periodMode
                ? periodOptions.find((option) => option.value === periodMode)
                    ?.description
                : "Pilih periode waktu yang ingin dimasukkan ke dalam laporan."}
            </p>
          </QuestionBlock>
        ) : null}

        <QuestionBlock
          icon={Layers3}
          label="Cakupan laporan"
          answered={scope !== null}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {scopeOptions.map((option) => (
              <ReportRadio
                key={option.value}
                selected={scope === option.value}
                label={option.label}
                onClick={() => setScope(option.value)}
              />
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {scope
              ? scopeOptions.find((option) => option.value === scope)
                  ?.description
              : "Pilih fokus data yang ingin dimasukkan ke dalam laporan."}
          </p>
        </QuestionBlock>

        <QuestionBlock
          icon={ChartNoAxesCombined}
          label="Urutan performa"
          answered={sort !== null}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {sortOptions.map((option) => (
              <ReportRadio
                key={option.value}
                selected={sort === option.value}
                label={option.label}
                onClick={() => setSort(option.value)}
              />
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {sort
              ? sortOptions.find((option) => option.value === sort)?.description
              : "Tentukan urutan data agar laporan lebih mudah dibaca."}
          </p>
        </QuestionBlock>

        <QuestionBlock
          icon={ListChecks}
          label="Sertakan detail siswa?"
          answered={includeStudentDetails !== null}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <ReportRadio
              selected={includeStudentDetails === false}
              label="Tanpa detail siswa"
              onClick={() => setIncludeStudentDetails(false)}
            />
            <ReportRadio
              selected={includeStudentDetails === true}
              label="Sertakan detail siswa"
              badge={`${analytics?.summary.total_students ?? 0} siswa`}
              onClick={() => setIncludeStudentDetails(true)}
            />
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {includeStudentDetails === true
              ? format === "pdf"
                ? "Data kehadiran setiap siswa akan menjadi lampiran setelah halaman ringkasan dan peringkat."
                : "Data kehadiran setiap siswa akan dimasukkan ke sheet detail siswa."
              : includeStudentDetails === false
                ? format === "pdf"
                  ? "PDF tetap memuat ringkasan, status, tren, dan peringkat tanpa lampiran data pribadi siswa."
                  : "Excel hanya berisi ringkasan dan data sesuai cakupan yang dipilih."
                : "Tentukan apakah detail kehadiran setiap siswa perlu disertakan."}
          </p>
        </QuestionBlock>

        <QuestionBlock
          icon={Database}
          label="Data yang akan digunakan"
          answered={Boolean(analytics)}
        >
          <div className="rounded-[0.9rem] border border-white bg-white/80 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Periode: {periodLabel}
            </p>
            <p className="mt-1">{activeFilters}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <UsersRound className="size-3.5" aria-hidden="true" />
              {analytics?.summary.total_students ?? 0} siswa ·{" "}
              {analytics?.summary.total_classes ?? 0} kelas
            </p>
          </div>
        </QuestionBlock>

        <ReportModalFooter
          canDownload={canDownload}
          generating={generating}
          onCancel={() => handleOpenChange(false)}
          onDownload={handleDownload}
          format={format}
          generatingLabel={`Membuat ${format === "excel" ? "Excel" : "PDF"}...`}
          downloadLabel={
            format &&
            reportType &&
            exportPeriod &&
            scope &&
            sort &&
            includeStudentDetails !== null
              ? `Unduh ${format === "excel" ? "Excel" : "PDF"}`
              : "Lengkapi pilihan"
          }
        />
      </div>
    </PremiumModal>
  );
}
