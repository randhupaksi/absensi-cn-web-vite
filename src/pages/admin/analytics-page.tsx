"use client";

import { Button } from "@/components/ui/button";
import { ExportImportActions } from "@/components/ui/export-import-actions";
import { Calendar } from "@/components/ui/calendar";
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
import { AttendanceAnalyticsReportModal } from "@/features/admin/analytics/attendance-analytics-report-modal";
import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import { AdminShell } from "@/features/admin/shell/shell";
import dynamic from "@/lib/dynamic";
import { getAccentTone } from "@/lib/ui/accent-tone";
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
  Info,
  RefreshCw,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

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

const AnalyticsStatusTrendChart = dynamic(
  () =>
    import("@/features/admin/analytics/analytics-charts").then((module) => ({
      default: module.AnalyticsStatusTrendChart,
    })),
  { ssr: false, fallback: <ChartSkeleton /> },
);

const AnalyticsValidationChart = dynamic(
  () =>
    import("@/features/admin/analytics/analytics-charts").then((module) => ({
      default: module.AnalyticsValidationChart,
    })),
  { ssr: false, fallback: <ChartSkeleton type="donut" /> },
);

const today = formatInputDate(new Date());
const ANALYTICS_LAUNCH_DATE = "2026-08-18";
const defaultFrom = [
  ANALYTICS_LAUNCH_DATE,
  formatInputDate(addDays(new Date(), -6)),
].sort()[1];

const QUICK_DATE_RANGES: Record<string, { label: string; from: string; to: string }> = {
  today: { label: "Hari ini", from: today, to: today },
  "3d": {
    label: "3 hari terakhir",
    from: formatInputDate(addDays(new Date(), -2)),
    to: today,
  },
  "7d": { label: "1 minggu terakhir", from: defaultFrom, to: today },
};

type StudentSortValue = NonNullable<AdminAttendanceAnalyticsFilters["sort"]> | "";

const STUDENT_SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "default", label: "Standar (nama)" },
  { value: "usage_desc", label: "Penggunaan tertinggi" },
  { value: "usage_asc", label: "Penggunaan terendah" },
  { value: "attendance_desc", label: "Kehadiran tertinggi" },
  { value: "attendance_asc", label: "Kehadiran terendah" },
];

function resolveQuickDateRangeValue(dateFrom: string, dateTo: string) {
  return (
    Object.entries(QUICK_DATE_RANGES).find(
      ([, range]) => range.from === dateFrom && range.to === dateTo,
    )?.[0] ?? ""
  );
}

export function AdminAnalyticsPage() {
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(today);
  const [schoolYearID, setSchoolYearID] = useState("");
  const [grade, setGrade] = useState("");
  const [majorID, setMajorID] = useState("");
  const [classID, setClassID] = useState("");
  const [studentSort, setStudentSort] = useState<StudentSortValue>("");
  const [studentGrade, setStudentGrade] = useState("");
  const [studentMajorID, setStudentMajorID] = useState("");
  const [studentClassID, setStudentClassID] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

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
    studentSort,
    studentGrade,
    studentMajorID,
    studentClassID,
  ]);

  const filters = useMemo<AdminAttendanceAnalyticsFilters>(
    () => ({
      date_from: dateFrom,
      date_to: dateTo,
      school_year_id: schoolYearID || undefined,
      grade: grade || undefined,
      major_id: majorID || undefined,
      class_id: classID || undefined,
    }),
    [classID, dateFrom, dateTo, grade, majorID, schoolYearID],
  );

  const analyticsQuery = useQuery({
    queryKey: ["admin-attendance-analytics", filters],
    queryFn: () => getAdminAttendanceAnalytics(filters),
    enabled: Boolean(dateFrom && dateTo && dateFrom <= dateTo),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });

  // Peringkat kelas tidak mengikuti filter tingkat/jurusan/kelas/pencarian,
  // tetapi tetap mengikuti periode yang sedang dilihat. Tanpa periode ini,
  // API akan memakai fallback tujuh hari kalender dan dapat memasukkan hari
  // sebelum sistem web mulai digunakan.
  const overallAnalyticsQuery = useQuery({
    queryKey: [
      "admin-attendance-analytics",
      "overall",
      schoolYearID,
      dateFrom,
      dateTo,
    ],
    queryFn: () =>
      getAdminAttendanceAnalytics({
        school_year_id: schoolYearID,
        date_from: dateFrom,
        date_to: dateTo,
      }),
    enabled: Boolean(schoolYearID && dateFrom && dateTo && dateFrom <= dateTo),
    staleTime: 5 * 60_000,
  });

  // Tabel siswa punya kontrol urutkan/tingkat/jurusan/kelas sendiri, terpisah
  // dari filter analitik di atas, jadi butuh query khusus (masih berbagi
  // periode tanggal & tahun ajaran dengan halaman).
  const studentTableFilters = useMemo<AdminAttendanceAnalyticsFilters>(
    () => ({
      date_from: dateFrom,
      date_to: dateTo,
      school_year_id: schoolYearID || undefined,
      grade: studentGrade || undefined,
      major_id: studentMajorID || undefined,
      class_id: studentClassID || undefined,
      sort: studentSort || undefined,
      page,
      page_size: pageSize,
    }),
    [
      dateFrom,
      dateTo,
      schoolYearID,
      studentGrade,
      studentMajorID,
      studentClassID,
      studentSort,
      page,
      pageSize,
    ],
  );

  const studentTableQuery = useQuery({
    queryKey: ["admin-attendance-analytics", "students", studentTableFilters],
    queryFn: () => getAdminAttendanceAnalytics(studentTableFilters),
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
  const studentVisibleMajors = useMemo(() => {
    const majorIDs = new Set(
      allClasses
        .filter((item) => !studentGrade || item.grade === studentGrade)
        .map((item) => item.major_id),
    );
    return (majorsQuery.data ?? []).filter((item) => majorIDs.has(item.id));
  }, [allClasses, studentGrade, majorsQuery.data]);
  const studentVisibleClasses = useMemo(
    () =>
      allClasses.filter(
        (item) =>
          (!studentGrade || item.grade === studentGrade) &&
          (!studentMajorID || item.major_id === studentMajorID),
      ),
    [allClasses, studentGrade, studentMajorID],
  );

  const analytics = analyticsQuery.data;
  async function loadAnalyticsForExport(exportDateFrom: string, exportDateTo: string) {
    return getAdminAttendanceAnalytics({
      ...filters,
      date_from: exportDateFrom,
      date_to: exportDateTo,
    });
  }

  async function loadAllStudentsForExport(exportDateFrom = dateFrom, exportDateTo = dateTo) {
    const exportFilters = {
      ...filters,
      date_from: exportDateFrom,
      date_to: exportDateTo,
      page: 1,
      page_size: 2500,
    };
    const first = await getAdminAttendanceAnalytics(exportFilters);
    const rows = [...first.students.rows];
    for (let nextPage = 2; nextPage <= first.students.total_pages; nextPage += 1) {
      const next = await getAdminAttendanceAnalytics({ ...exportFilters, page: nextPage });
      rows.push(...next.students.rows);
    }
    return rows;
  }

  return (
    <AdminShell>
      {() => (
        <div className="space-y-5">
          <AnalyticsHero
            onExport={() => setIsExportModalOpen(true)}
            canExport={Boolean(analytics?.summary.total_students)}
            period={analytics?.period}
          />

          <AttendanceAnalyticsReportModal
            open={isExportModalOpen}
            onOpenChange={setIsExportModalOpen}
            analytics={analytics}
            fullPeriod={{ dateFrom: ANALYTICS_LAUNCH_DATE, dateTo: today }}
            onLoadAnalytics={loadAnalyticsForExport}
            onLoadStudents={loadAllStudentsForExport}
          />

          <AnalyticsFilters
            dateFrom={dateFrom}
            dateTo={dateTo}
            grade={grade}
            majorID={majorID}
            classID={classID}
            grades={gradeOptions}
            majors={visibleMajors}
            classes={visibleClasses}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onQuickRangeChange={(from, to) => {
              setDateFrom(from);
              setDateTo(to);
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
            onReset={() => {
              setDateFrom(today);
              setDateTo(today);
              setGrade("");
              setMajorID("");
              setClassID("");
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
              overall={overallAnalyticsQuery.data}
              studentTable={studentTableQuery.data}
              setPage={setPage}
              pageSize={pageSize}
              setPageSize={setPageSize}
              studentSort={studentSort}
              onStudentSortChange={setStudentSort}
              studentGrade={studentGrade}
              onStudentGradeChange={(value) => {
                setStudentGrade(value);
                setStudentMajorID("");
                setStudentClassID("");
              }}
              studentMajorID={studentMajorID}
              onStudentMajorChange={(value) => {
                setStudentMajorID(value);
                setStudentClassID("");
              }}
              studentClassID={studentClassID}
              onStudentClassChange={setStudentClassID}
              studentGrades={gradeOptions}
              studentMajors={studentVisibleMajors}
              studentClasses={studentVisibleClasses}
            />
          ) : null}
        </div>
      )}
    </AdminShell>
  );
}

function AnalyticsHero({
  onExport,
  canExport,
  period,
}: {
  onExport: () => void;
  canExport: boolean;
  period?: AdminAttendanceAnalytics["period"];
}) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-emerald-200/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(236,253,245,0.9)_100%)] p-5 shadow-[0_22px_60px_rgba(16,94,70,0.08)] sm:p-7">
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
          {period ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
              <Info className="size-3.5 shrink-0" />
              <span>Dibuat pada {formatDisplayDateTime(period.generated_at)}</span>
            </div>
          ) : null}
        </div>
        <ExportImportActions
          exportAction={{
            onClick: onExport,
            label: "Export Analitik",
            disabled: !canExport,
          }}
        />
      </div>
    </section>
  );
}

type FilterProps = {
  dateFrom: string;
  dateTo: string;
  grade: string;
  majorID: string;
  classID: string;
  grades: string[];
  majors: Array<{ id: string; code: string; name: string }>;
  classes: Array<{ id: string; display_name: string }>;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onQuickRangeChange: (from: string, to: string) => void;
  onGradeChange: (value: string) => void;
  onMajorChange: (value: string) => void;
  onClassChange: (value: string) => void;
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
        <FilterField label="Periode cepat">
          <RadixSelectField
            value={resolveQuickDateRangeValue(props.dateFrom, props.dateTo)}
            onValueChange={(value) => {
              const range = QUICK_DATE_RANGES[value];
              if (range) props.onQuickRangeChange(range.from, range.to);
            }}
            placeholder="Pilih periode cepat"
            options={Object.entries(QUICK_DATE_RANGES).map(([value, range]) => ({
              value,
              label: range.label,
            }))}
          />
        </FilterField>
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
        className="group flex h-14 w-full items-center justify-between gap-3 rounded-[1.25rem] border border-slate-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-left text-sm font-medium text-slate-700 shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] outline-none transition-[border-color,box-shadow,background-color] duration-150 hover:border-emerald-400 hover:bg-emerald-50/50 focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-200/80 data-open:border-emerald-500 data-open:ring-4 data-open:ring-emerald-200/80 dark:border-slate-600 dark:bg-none dark:bg-slate-800 dark:text-slate-100 dark:shadow-none dark:hover:bg-slate-700 dark:focus-visible:ring-emerald-500/25"
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
  overall,
  studentTable,
  setPage,
  pageSize,
  setPageSize,
  studentSort,
  onStudentSortChange,
  studentGrade,
  onStudentGradeChange,
  studentMajorID,
  onStudentMajorChange,
  studentClassID,
  onStudentClassChange,
  studentGrades,
  studentMajors,
  studentClasses,
}: {
  analytics: AdminAttendanceAnalytics;
  overall?: AdminAttendanceAnalytics;
  studentTable?: AdminAttendanceAnalytics;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  studentSort: StudentSortValue;
  onStudentSortChange: (value: StudentSortValue) => void;
  studentGrade: string;
  onStudentGradeChange: (value: string) => void;
  studentMajorID: string;
  onStudentMajorChange: (value: string) => void;
  studentClassID: string;
  onStudentClassChange: (value: string) => void;
  studentGrades: string[];
  studentMajors: Array<{ id: string; code: string; name: string }>;
  studentClasses: Array<{ id: string; display_name: string }>;
}) {
  const overallClasses = overall?.classes ?? [];
  const lowestClasses = overallClasses.slice(0, 3);
  const highestClasses = [...overallClasses]
    .sort((a, b) => b.system_usage_percentage - a.system_usage_percentage)
    .slice(0, 3);
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
          <SectionHeading
            eyebrow="Peringkat kelas"
            title="Kelas dengan penggunaan sistem tertinggi & terendah"
            description={
              overall
                ? `Dihitung dari seluruh ${overall.summary.total_classes.toLocaleString("id-ID")} kelas pada tahun ajaran ${overall.filters.school_year_name}, terhitung periode ${formatDisplayDate(parseInputDate(overall.period.date_from))} sampai ${formatDisplayDate(parseInputDate(overall.period.date_to))}`
                : "Memuat data keseluruhan tahun ajaran..."
            }
          />
          <section className="grid gap-4 md:grid-cols-2">
            <RankedClassList
              eyebrow="Perlu perhatian"
              title="Penggunaan sistem terendah"
              items={lowestClasses}
              tone="amber"
            />
            <RankedClassList
              eyebrow="Adopsi terbaik"
              title="Penggunaan sistem tertinggi"
              items={highestClasses}
              tone="emerald"
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
          <section className="grid gap-5 xl:grid-cols-2">
            <AnalyticsTrendChart data={analytics.trend} />
            <AnalyticsStatusTrendChart data={analytics.trend} />
          </section>
          <section className="grid gap-5 xl:grid-cols-2">
            <AnalyticsStatusChart data={analytics.status_breakdown} />
            <AnalyticsValidationChart operational={analytics.operational} />
          </section>
          <ClassPerformanceTable rows={analytics.classes} />
          <StudentPerformanceTable
            students={studentTable?.students}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            sort={studentSort}
            onSortChange={onStudentSortChange}
            grade={studentGrade}
            onGradeChange={onStudentGradeChange}
            majorID={studentMajorID}
            onMajorChange={onStudentMajorChange}
            classID={studentClassID}
            onClassChange={onStudentClassChange}
            grades={studentGrades}
            majors={studentMajors}
            classes={studentClasses}
          />
        </>
      )}
    </>
  );
}

const tones = {
  emerald: "emerald",
  sky: "sky",
  amber: "amber",
  rose: "rose",
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
    <article className="rounded-[26px] border border-slate-200/70 bg-white/82 p-4 shadow-[0_16px_34px_rgba(150,163,184,0.12)] backdrop-blur transition-transform duration-200 ease-out hover:-translate-y-[3px] motion-reduce:transition-none dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-none sm:p-5">
      <div className="flex items-center gap-3 xl:gap-4">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 bg-transparent shadow-none xl:size-12 ${getAccentTone(tones[tone])}`}
        >
          <Icon className="size-4 stroke-[1.8] xl:size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400 xl:text-xs">
            {label}
          </p>
          <p className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 xl:text-[1.75rem]">
            {value}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">
        {helper}
      </p>
    </article>
  );
}

function RankedClassList({
  eyebrow,
  title,
  items,
  tone,
}: {
  eyebrow: string;
  title: string;
  items: Array<AdminAnalyticsPerformance & { grade: string; major_code: string }>;
  tone: "amber" | "emerald";
}) {
  const styles = {
    amber: "border-amber-200 bg-amber-50/75 text-amber-800",
    emerald: "border-emerald-200 bg-emerald-50/75 text-emerald-800",
  }[tone];
  return (
    <article className={`rounded-[1.5rem] border p-5 ${styles}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-75">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-slate-950">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Belum ada kelas untuk dibandingkan.
        </p>
      ) : (
        <ol className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-[1rem] bg-white/70 px-3 py-2.5"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-500">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-800">
                    {item.name}
                  </span>
                  <span className="block text-xs text-slate-500">
                    dari {item.total_students.toLocaleString("id-ID")} siswa
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <RateBadge value={item.system_usage_percentage} />
                <span className="text-[10px] font-medium text-slate-400">
                  penggunaan sistem
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
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
          columnCount={9}
          isEmpty={rows.length === 0}
        >
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-emerald-50/80 text-xs uppercase tracking-[0.1em] text-slate-500">
              <tr>
                <Th>Kelas</Th>
                <Th>Siswa</Th>
                <Th>Hadir</Th>
                <Th>Izin</Th>
                <Th>Sakit</Th>
                <Th>Alfa</Th>
                <Th>Belum Absen</Th>
                <Th>Kehadiran</Th>
                <Th>Penggunaan</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
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
                  <Td>{row.permission}</Td>
                  <Td>{row.sick}</Td>
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

function StudentPerformanceTable({
  students,
  setPage,
  pageSize,
  setPageSize,
  sort,
  onSortChange,
  grade,
  onGradeChange,
  majorID,
  onMajorChange,
  classID,
  onClassChange,
  grades,
  majors,
  classes,
}: {
  students?: AdminAttendanceAnalytics["students"];
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  sort: StudentSortValue;
  onSortChange: (value: StudentSortValue) => void;
  grade: string;
  onGradeChange: (value: string) => void;
  majorID: string;
  onMajorChange: (value: string) => void;
  classID: string;
  onClassChange: (value: string) => void;
  grades: string[];
  majors: Array<{ id: string; code: string; name: string }>;
  classes: Array<{ id: string; display_name: string }>;
}) {
  const rangeStart =
    !students || students.total_items === 0
      ? 0
      : (students.page - 1) * students.page_size + 1;
  const rangeEnd = students
    ? Math.min(students.page * students.page_size, students.total_items)
    : 0;
  const compactTriggerClassName = "h-10 rounded-[0.85rem] px-3 text-xs";
  return (
    <section className="rounded-[2rem] border border-white/80 bg-white/88 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-6">
      <SectionHeading
        eyebrow="Performa siswa"
        title="Detail per siswa"
        description="Gunakan kolom pencarian pada filter di atas untuk mempersempit daftar berdasarkan nama, NIS, atau kelas."
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="w-52">
          <RadixSelectField
            value={sort || "default"}
            onValueChange={(value) =>
              onSortChange(value === "default" ? "" : (value as StudentSortValue))
            }
            placeholder="Urutkan"
            triggerClassName={compactTriggerClassName}
            options={STUDENT_SORT_OPTIONS}
          />
        </div>
        <div className="w-40">
          <RadixSelectField
            value={grade || "ALL"}
            onValueChange={(value) =>
              onGradeChange(value === "ALL" ? "" : value)
            }
            placeholder="Semua tingkat"
            triggerClassName={compactTriggerClassName}
            options={[
              { value: "ALL", label: "Semua tingkat" },
              ...grades.map((item) => ({
                value: item,
                label: `Kelas ${item}`,
              })),
            ]}
          />
        </div>
        <div className="w-44">
          <RadixSelectField
            value={majorID || "ALL"}
            onValueChange={(value) =>
              onMajorChange(value === "ALL" ? "" : value)
            }
            placeholder="Semua jurusan"
            triggerClassName={compactTriggerClassName}
            options={[
              { value: "ALL", label: "Semua jurusan" },
              ...majors.map((item) => ({
                value: item.id,
                label: item.code,
                description: item.name,
              })),
            ]}
          />
        </div>
        <div className="w-56">
          <RadixSelectField
            searchable
            value={classID || "ALL"}
            onValueChange={(value) =>
              onClassChange(value === "ALL" ? "" : value)
            }
            placeholder="Semua kelas"
            searchPlaceholder="Cari kelas..."
            triggerClassName={compactTriggerClassName}
            options={[
              { value: "ALL", label: "Semua kelas" },
              ...classes.map((item) => ({
                value: item.id,
                label: item.display_name,
              })),
            ]}
          />
        </div>
      </div>
      <div className="mt-5">
        <DataTableCard
          icon={Users}
          emptyTitle="Belum ada data siswa"
          emptyDescription="Belum ada siswa pada filter atau pencarian ini."
          isLoading={!students}
          columnCount={9}
          isEmpty={!students || students.rows.length === 0}
          pagination={
            students
              ? {
                  page: students.page,
                  setPage,
                  pageSize,
                  setPageSize: (size: number) => {
                    setPageSize(size);
                    setPage(1);
                  },
                  totalItems: students.total_items,
                  totalPages: students.total_pages,
                  rangeStart,
                  rangeEnd,
                }
              : undefined
          }
        >
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-emerald-50/80 text-xs uppercase tracking-[0.1em] text-slate-500">
              <tr>
                <Th>Siswa</Th>
                <Th>Kelas</Th>
                <Th>Hadir</Th>
                <Th>Izin</Th>
                <Th>Sakit</Th>
                <Th>Alfa</Th>
                <Th>Belum Absen</Th>
                <Th>Kehadiran</Th>
                <Th>Penggunaan</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {(students?.rows ?? []).map((row) => (
                <tr
                  key={row.student_id}
                  className="bg-white/70 hover:bg-emerald-50/40"
                >
                  <Td>
                    <p className="font-semibold text-slate-900">
                      {row.student_name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      NIS {row.nis}
                    </p>
                  </Td>
                  <Td>
                    <p className="text-slate-700">{row.class_name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Tingkat {row.grade} - {row.major_code}
                    </p>
                  </Td>
                  <Td>{row.present}</Td>
                  <Td>{row.permission}</Td>
                  <Td>{row.sick}</Td>
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

function formatDisplayDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
