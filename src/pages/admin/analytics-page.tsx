"use client";

import { AsyncButton } from "@/components/ui/async-button";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadixSelectField } from "@/components/ui/radix-select";
import {
  ChartSkeleton,
  PageSkeleton,
} from "@/components/loading/loading-system";
import { DataTableCard } from "@/features/admin/management/shared/section-ui";
import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import { AdminShell } from "@/features/admin/shell/shell";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import dynamic from "@/lib/dynamic";
import {
  getAdminAttendanceAnalytics,
  getAdminClasses,
  getAdminMajors,
  getAdminSchoolYears,
} from "@/services/admin.service";
import type {
  AdminAnalyticsPerformance,
  AdminAttendanceAnalytics,
  AdminAttendanceAnalyticsFilters,
} from "@/types/admin";
import { useQuery } from "@tanstack/react-query";
import { id as indonesianLocale } from "date-fns/locale";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  ChartNoAxesCombined,
  CheckCircle2,
  CircleGauge,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

const AnalyticsTrendChart = dynamic(
  () =>
    import("@/features/admin/analytics/analytics-charts").then((module) => ({
      default: module.AnalyticsTrendChart,
    })),
  { ssr: false, fallback: <ChartSkeleton /> },
);

const AnalyticsStatusChart = dynamic(
  () =>
    import("@/features/admin/analytics/analytics-charts").then((module) => ({
      default: module.AnalyticsStatusChart,
    })),
  { ssr: false, fallback: <ChartSkeleton type="donut" /> },
);

const AnalyticsComparisonChart = dynamic(
  () =>
    import("@/features/admin/analytics/analytics-charts").then((module) => ({
      default: module.AnalyticsComparisonChart,
    })),
  { ssr: false, fallback: <ChartSkeleton /> },
);

const today = formatInputDate(new Date());
const defaultFrom = formatInputDate(addDays(new Date(), -6));

export function AdminAnalyticsPage() {
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(today);
  const [schoolYearID, setSchoolYearID] = useState("");
  const [grade, setGrade] = useState("");
  const [majorID, setMajorID] = useState("");
  const [classID, setClassID] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isExporting, setIsExporting] = useState(false);
  const debouncedStudentQuery = useDebouncedValue(studentQuery.trim(), 350);

  const yearsQuery = useQuery({
    queryKey: ["admin-school-years", "analytics"],
    queryFn: getAdminSchoolYears,
    staleTime: 5 * 60_000,
  });
  const majorsQuery = useQuery({
    queryKey: ["admin-majors", "analytics"],
    queryFn: () => getAdminMajors(),
    staleTime: 5 * 60_000,
  });
  const classesQuery = useQuery({
    queryKey: ["admin-classes", "analytics", schoolYearID],
    queryFn: () =>
      getAdminClasses(schoolYearID ? { school_year_id: schoolYearID } : {}),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (schoolYearID || !yearsQuery.data?.length) return;
    const active = yearsQuery.data.find((item) => item.is_active);
    setSchoolYearID(active?.id ?? yearsQuery.data[0].id);
  }, [schoolYearID, yearsQuery.data]);

  useEffect(() => {
    setPage(1);
  }, [
    dateFrom,
    dateTo,
    schoolYearID,
    grade,
    majorID,
    classID,
    debouncedStudentQuery,
  ]);

  const filters = useMemo<AdminAttendanceAnalyticsFilters>(
    () => ({
      date_from: dateFrom,
      date_to: dateTo,
      school_year_id: schoolYearID || undefined,
      grade: grade || undefined,
      major_id: majorID || undefined,
      class_id: classID || undefined,
      student_query: debouncedStudentQuery || undefined,
      page,
      page_size: pageSize,
    }),
    [
      classID,
      dateFrom,
      dateTo,
      debouncedStudentQuery,
      grade,
      majorID,
      page,
      pageSize,
      schoolYearID,
    ],
  );

  const analyticsQuery = useQuery({
    queryKey: ["admin-attendance-analytics", filters],
    queryFn: () => getAdminAttendanceAnalytics(filters),
    enabled: Boolean(dateFrom && dateTo && dateFrom <= dateTo),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });

  const allClasses = useMemo(
    () => classesQuery.data ?? [],
    [classesQuery.data],
  );
  const gradeOptions = useMemo(
    () =>
      [...new Set(allClasses.map((item) => item.grade).filter(Boolean))].sort(
        gradeSort,
      ),
    [allClasses],
  );
  const visibleMajors = useMemo(() => {
    const majorIDs = new Set(
      allClasses
        .filter((item) => !grade || item.grade === grade)
        .map((item) => item.major_id),
    );
    return (majorsQuery.data ?? []).filter((item) => majorIDs.has(item.id));
  }, [allClasses, grade, majorsQuery.data]);
  const visibleClasses = useMemo(
    () =>
      allClasses.filter(
        (item) =>
          (!grade || item.grade === grade) &&
          (!majorID || item.major_id === majorID),
      ),
    [allClasses, grade, majorID],
  );

  const analytics = analyticsQuery.data;
  async function handleExport() {
    if (!analytics) return;
    setIsExporting(true);
    try {
      const exportFilters = { ...filters, page: 1, page_size: 2500 };
      const first = await getAdminAttendanceAnalytics(exportFilters);
      const rows = [...first.students.rows];
      for (
        let nextPage = 2;
        nextPage <= first.students.total_pages;
        nextPage += 1
      ) {
        const next = await getAdminAttendanceAnalytics({
          ...exportFilters,
          page: nextPage,
        });
        rows.push(...next.students.rows);
      }
      const { exportAttendanceAnalytics } =
        await import("@/features/admin/analytics/export-attendance-analytics");
      await exportAttendanceAnalytics(first, rows);
      toast.success("Laporan analitik berhasil dibuat.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Laporan analitik belum berhasil dibuat.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <AdminShell>
      {() => (
        <div className="space-y-5">
          <AnalyticsHero
            onExport={handleExport}
            isExporting={isExporting}
            canExport={Boolean(analytics?.summary.total_students)}
          />

          <AnalyticsFilters
            dateFrom={dateFrom}
            dateTo={dateTo}
            schoolYearID={schoolYearID}
            grade={grade}
            majorID={majorID}
            classID={classID}
            studentQuery={studentQuery}
            years={yearsQuery.data ?? []}
            grades={gradeOptions}
            majors={visibleMajors}
            classes={visibleClasses}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onSchoolYearChange={(value) => {
              setSchoolYearID(value);
              setGrade("");
              setMajorID("");
              setClassID("");
            }}
            onGradeChange={(value) => {
              setGrade(value);
              setMajorID("");
              setClassID("");
            }}
            onMajorChange={(value) => {
              setMajorID(value);
              setClassID("");
            }}
            onClassChange={setClassID}
            onStudentQueryChange={setStudentQuery}
            onReset={() => {
              setDateFrom(defaultFrom);
              setDateTo(today);
              setGrade("");
              setMajorID("");
              setClassID("");
              setStudentQuery("");
            }}
          />

          {analyticsQuery.isLoading && !analytics ? (
            <PageSkeleton variant="dashboard" />
          ) : analyticsQuery.isError ? (
            <section className="rounded-[2rem] border border-white/80 bg-white/88 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.07)] sm:p-8">
              <EmptyState
                icon={AlertTriangle}
                className="min-h-[280px] px-6 py-10"
                title="Analitik belum dapat dimuat"
                description="Data yang diminta tidak ditemukan."
                action={
                  <Button
                    type="button"
                    variant="success"
                    className="mt-3 h-11 rounded-full px-5"
                    onClick={() => analyticsQuery.refetch()}
                  >
                    <RefreshCw className="size-4" /> Coba lagi
                  </Button>
                }
              />
            </section>
          ) : analytics ? (
            <AnalyticsContent
              analytics={analytics}
            />
          ) : null}
        </div>
      )}
    </AdminShell>
  );
}

function AnalyticsHero({
  onExport,
  isExporting,
  canExport,
}: {
  onExport: () => void;
  isExporting: boolean;
  canExport: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-emerald-200/75 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.34),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(236,253,245,0.9)_100%)] p-5 shadow-[0_22px_60px_rgba(16,94,70,0.08)] sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
            <ChartNoAxesCombined className="size-4" /> Analitik sekolah
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Pahami pola kehadiran, bukan sekadar jumlah absen
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Pantau adopsi sistem, performa kelas, serta siswa yang perlu
            ditindaklanjuti dari satu laporan terukur.
          </p>
        </div>
        <AsyncButton
          className="h-13 w-full rounded-[1.15rem] bg-emerald-700 px-5 text-sm font-semibold text-white shadow-none hover:bg-emerald-800 hover:shadow-none lg:w-auto"
          icon={FileSpreadsheet}
          isPending={isExporting}
          pendingLabel="Menyiapkan Excel..."
          disabled={!canExport}
          onClick={onExport}
        >
          Export Analitik
        </AsyncButton>
      </div>
    </section>
  );
}

type FilterProps = {
  dateFrom: string;
  dateTo: string;
  schoolYearID: string;
  grade: string;
  majorID: string;
  classID: string;
  studentQuery: string;
  years: Array<{ id: string; name: string }>;
  grades: string[];
  majors: Array<{ id: string; code: string; name: string }>;
  classes: Array<{ id: string; display_name: string }>;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onSchoolYearChange: (value: string) => void;
  onGradeChange: (value: string) => void;
  onMajorChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onStudentQueryChange: (value: string) => void;
  onReset: () => void;
};

function AnalyticsFilters(props: FilterProps) {
  return (
    <section className="rounded-[2rem] border border-white/80 bg-white/88 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Ruang lingkup laporan
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Filter analitik
          </h2>
        </div>
        <Button
          variant="ghost"
          className="h-10 self-start rounded-full px-4 text-slate-500 hover:bg-emerald-50 hover:text-emerald-800"
          onClick={props.onReset}
        >
          <RefreshCw className="size-4" /> Reset filter
        </Button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FilterField label="Dari tanggal">
          <AnalyticsDatePicker
            value={props.dateFrom}
            max={props.dateTo || today}
            onChange={props.onDateFromChange}
          />
        </FilterField>
        <FilterField label="Sampai tanggal">
          <AnalyticsDatePicker
            value={props.dateTo}
            min={props.dateFrom}
            max={today}
            onChange={props.onDateToChange}
          />
        </FilterField>
        <FilterField label="Tahun ajaran">
          <RadixSelectField
            value={props.schoolYearID}
            onValueChange={props.onSchoolYearChange}
            placeholder="Pilih tahun ajaran"
            options={props.years.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
          />
        </FilterField>
        <FilterField label="Tingkat">
          <RadixSelectField
            value={props.grade || "ALL"}
            onValueChange={(value) =>
              props.onGradeChange(value === "ALL" ? "" : value)
            }
            placeholder="Semua tingkat"
            options={[
              { value: "ALL", label: "Semua tingkat" },
              ...props.grades.map((item) => ({
                value: item,
                label: `Kelas ${item}`,
              })),
            ]}
          />
        </FilterField>
        <FilterField label="Jurusan">
          <RadixSelectField
            value={props.majorID || "ALL"}
            onValueChange={(value) =>
              props.onMajorChange(value === "ALL" ? "" : value)
            }
            placeholder="Semua jurusan"
            options={[
              { value: "ALL", label: "Semua jurusan" },
              ...props.majors.map((item) => ({
                value: item.id,
                label: item.code,
                description: item.name,
              })),
            ]}
          />
        </FilterField>
        <FilterField label="Kelas">
          <RadixSelectField
            searchable
            value={props.classID || "ALL"}
            onValueChange={(value) =>
              props.onClassChange(value === "ALL" ? "" : value)
            }
            placeholder="Semua kelas"
            searchPlaceholder="Cari kelas..."
            options={[
              { value: "ALL", label: "Semua kelas" },
              ...props.classes.map((item) => ({
                value: item.id,
                label: item.display_name,
              })),
            ]}
          />
        </FilterField>
        <FilterField label="Cari pada tabel siswa" className="md:col-span-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={props.studentQuery}
              onChange={(event) =>
                props.onStudentQueryChange(event.target.value)
              }
              placeholder="Nama, NIS, atau kelas..."
              className="h-14 rounded-[1.25rem] border-slate-300/80 bg-white pl-11 pr-4"
            />
          </div>
        </FilterField>
      </div>
    </section>
  );
}

function FilterField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="block text-xs font-semibold text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}

function AnalyticsDatePicker({
  value,
  min,
  max,
  onChange,
}: {
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? parseInputDate(value) : undefined;
  const minDate = min ? parseInputDate(min) : undefined;
  const maxDate = max ? parseInputDate(max) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        className="group flex h-14 w-full items-center justify-between gap-3 rounded-[1.25rem] border border-slate-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-left text-sm font-medium text-slate-700 shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] outline-none transition-[border-color,box-shadow,background-color] duration-150 hover:border-emerald-400 hover:bg-emerald-50/50 focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-200/80 data-open:border-emerald-500 data-open:ring-4 data-open:ring-emerald-200/80"
      >
        <span className="truncate">
          {selectedDate ? formatDisplayDate(selectedDate) : "Pilih tanggal"}
        </span>
        <CalendarDays className="size-4 shrink-0 text-emerald-600 transition-transform group-data-open:scale-110" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto rounded-[1.35rem] border-white/80 bg-white/96 p-2 shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) return;
            onChange(formatInputDate(date));
            setOpen(false);
          }}
          disabled={{ before: minDate, after: maxDate }}
          locale={indonesianLocale}
          captionLayout="dropdown"
          showOutsideDays={false}
        />
      </PopoverContent>
    </Popover>
  );
}

function AnalyticsContent({
  analytics,
}: {
  analytics: AdminAttendanceAnalytics;
}) {
  const lowestClass = analytics.classes[0];
  const bestClass = [...analytics.classes].sort(
    (a, b) => b.system_usage_percentage - a.system_usage_percentage,
  )[0];
  const majorCodes = new Map(
    analytics.classes.map((item) => [item.major_id, item.major_code]),
  );
  const majorChartData = analytics.majors.map((item) => ({
    ...item,
    name: majorCodes.get(item.id) || item.name,
  }));
  const hasScope = analytics.summary.total_students > 0;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <MetricCard
          label="Kehadiran"
          value={`${analytics.summary.attendance_percentage}%`}
          helper={`${analytics.status_breakdown.present.toLocaleString("id-ID")} hadir dari ${analytics.summary.attendance_opportunities.toLocaleString("id-ID")} total siswa`}
          icon={CheckCircle2}
          tone="emerald"
        />
        <MetricCard
          label="Penggunaan Sistem"
          value={`${analytics.summary.system_usage_percentage}%`}
          helper={`${analytics.summary.recorded_attendance.toLocaleString("id-ID")} absensi tercatat`}
          icon={CircleGauge}
          tone="sky"
        />
        <MetricCard
          label="Belum Absen"
          value={analytics.summary.not_attended.toLocaleString("id-ID")}
          helper="Siswa yang belum melakukan absensi"
          icon={Activity}
          tone="amber"
        />
        <MetricCard
          label="Alfa Tercatat"
          value={analytics.summary.alpha.toLocaleString("id-ID")}
          helper="Status Alfa yang sudah tersimpan"
          icon={AlertTriangle}
          tone="rose"
        />
      </div>

      {!hasScope ? (
        <section className="rounded-[2rem] border border-white/80 bg-white/88 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <EmptyState
            icon={Users}
            title="Belum ada siswa pada cakupan ini"
            description="Ubah periode, tahun ajaran, tingkat, jurusan, atau kelas untuk melihat analitik."
          />
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <InsightCard
              eyebrow="Perlu perhatian"
              title={lowestClass?.name ?? "Belum tersedia"}
              description={
                lowestClass
                  ? `Penggunaan sistem ${lowestClass.system_usage_percentage}% dengan ${lowestClass.not_attended} kehadiran belum tercatat.`
                  : "Belum ada kelas untuk dibandingkan."
              }
              tone="amber"
            />
            <InsightCard
              eyebrow="Adopsi terbaik"
              title={bestClass?.name ?? "Belum tersedia"}
              description={
                bestClass
                  ? `Penggunaan sistem mencapai ${bestClass.system_usage_percentage}% pada periode ini.`
                  : "Belum ada kelas untuk dibandingkan."
              }
              tone="emerald"
            />
            <InsightCard
              eyebrow="Validasi sesi mapel"
              title={`${analytics.operational.validation_percentage}% selesai`}
              description={`${analytics.operational.pending_subject_sessions} dari ${analytics.operational.total_subject_sessions} sesi masih perlu divalidasi.`}
              tone="sky"
            />
          </section>
          <section className="grid gap-5 xl:grid-cols-2">
            <AnalyticsComparisonChart
              data={analytics.grades}
              eyebrow="Perbandingan tingkat"
              title="Performa per tingkat"
              description="Bandingkan kehadiran dan adopsi sistem di setiap tingkat kelas."
            />
            <AnalyticsComparisonChart
              data={majorChartData}
              eyebrow="Perbandingan jurusan"
              title="Performa per jurusan"
              description="Temukan jurusan yang paling konsisten dan yang perlu pendampingan."
            />
          </section>
          <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <AnalyticsTrendChart data={analytics.trend} />
            <AnalyticsStatusChart data={analytics.status_breakdown} />
          </section>
          <ClassPerformanceTable rows={analytics.classes} />
        </>
      )}
    </>
  );
}

const tones = {
  emerald: "bg-emerald-100 text-emerald-700",
  sky: "bg-sky-100 text-sky-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
};

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: typeof Users;
  tone: keyof typeof tones;
}) {
  return (
    <article className="rounded-[1.65rem] border border-white/80 bg-white/88 p-4 shadow-[0_16px_38px_rgba(15,23,42,0.06)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:text-xs">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {value}
          </p>
        </div>
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-2xl sm:size-12 ${tones[tone]}`}
        >
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500 sm:text-sm">
        {helper}
      </p>
    </article>
  );
}

function InsightCard({
  eyebrow,
  title,
  description,
  tone,
}: {
  eyebrow: string;
  title: string;
  description: string;
  tone: "amber" | "emerald" | "sky";
}) {
  const styles = {
    amber: "border-amber-200 bg-amber-50/75 text-amber-800",
    emerald: "border-emerald-200 bg-emerald-50/75 text-emerald-800",
    sky: "border-sky-200 bg-sky-50/75 text-sky-800",
  }[tone];
  return (
    <article className={`rounded-[1.5rem] border p-5 ${styles}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-75">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-xl font-semibold text-slate-950 sm:text-2xl">
        {title}
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function ClassPerformanceTable({
  rows,
}: {
  rows: Array<
    AdminAnalyticsPerformance & { grade: string; major_code: string }
  >;
}) {
  return (
    <section className="rounded-[2rem] border border-white/80 bg-white/88 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-6">
      <SectionHeading
        eyebrow="Performa kelas"
        title="Kelas yang perlu dipantau"
        description="Diurutkan dari penggunaan sistem terendah agar tindak lanjut lebih cepat."
      />
      <div className="mt-5">
        <DataTableCard
          icon={ChartNoAxesCombined}
          emptyTitle="Belum ada performa kelas"
          emptyDescription="Belum ada kelas pada filter ini."
          isLoading={false}
          columnCount={7}
          isEmpty={rows.length === 0}
        >
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-emerald-50/80 text-xs uppercase tracking-[0.1em] text-slate-500">
              <tr>
                <Th>Kelas</Th>
                <Th>Siswa</Th>
                <Th>Hadir</Th>
                <Th>Alfa</Th>
                <Th>Belum Absen</Th>
                <Th>Kehadiran</Th>
                <Th>Penggunaan</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="bg-white/70 hover:bg-emerald-50/40">
                  <Td>
                    <p className="font-semibold text-slate-900">{row.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Tingkat {row.grade} - {row.major_code}
                    </p>
                  </Td>
                  <Td>{row.total_students}</Td>
                  <Td>{row.present}</Td>
                  <Td>{row.alpha}</Td>
                  <Td>{row.not_attended}</Td>
                  <Td>
                    <RateBadge value={row.attendance_percentage} />
                  </Td>
                  <Td>
                    <RateBadge value={row.system_usage_percentage} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableCard>
      </div>
    </section>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3.5 font-semibold">{children}</th>
  );
}
function Td({ children }: { children: ReactNode }) {
  return <td className="px-4 py-3.5 text-slate-600">{children}</td>;
}
function RateBadge({ value }: { value: number }) {
  const style =
    value >= 85
      ? "bg-emerald-100 text-emerald-700"
      : value >= 65
        ? "bg-amber-100 text-amber-700"
        : "bg-rose-100 text-rose-700";
  return (
    <span
      className={`inline-flex min-w-14 justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}
    >
      {value}%
    </span>
  );
}

function addDays(value: Date, days: number) {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}
function formatInputDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function gradeSort(left: string, right: string) {
  const ranks: Record<string, number> = {
    VII: 7,
    VIII: 8,
    IX: 9,
    X: 10,
    XI: 11,
    XII: 12,
  };
  return (
    (ranks[left] ?? 99) - (ranks[right] ?? 99) ||
    left.localeCompare(right, "id")
  );
}

function parseInputDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDisplayDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}
