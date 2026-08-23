"use client";

import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHeadRow,
  DataTableRow,
  DataTablePagination,
  MobileDataCard,
  MobileDataHeader,
  MobileDataList,
  usePagination,
} from "@/features/admin/management/shared/section-ui";
import { WalasShell } from "@/features/staff/components/homeroom-shell";
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
  getTeacherSubjectAssignments,
  getTeacherSubjectRecap,
} from "@/services/staff.service";
import dynamic from "@/lib/dynamic";
import type { StaffSubjectRecapStudentRow } from "@/types/staff";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import {
  BookOpenCheck,
  CalendarDays,
  ChartColumnBig,
  LoaderCircle,
  Printer,
} from "lucide-react";
import { useMemo, useState } from "react";
import { HistoryPageSkeleton } from "@/components/loading/loading-system";

const SubjectRecapReportModal = dynamic(
  () =>
    import("@/features/reports/subject/subject-recap-report-modal").then(
      (module) => module.SubjectRecapReportModal,
    ),
  { ssr: false },
);

type DateFilterMode = "single" | "range";

export function MapelRecapPage() {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode | null>(
    null,
  );
  const [singleDate, setSingleDate] = useState<Date | undefined>(undefined);
  const [rangeDateFrom, setRangeDateFrom] = useState<Date | undefined>(
    undefined,
  );
  const [rangeDateTo, setRangeDateTo] = useState<Date | undefined>(undefined);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("all");

  const dateFromStr =
    dateFilterMode === "single"
      ? singleDate
        ? format(singleDate, "yyyy-MM-dd")
        : ""
      : dateFilterMode === "range" && rangeDateFrom
        ? format(rangeDateFrom, "yyyy-MM-dd")
        : "";
  const dateToStr =
    dateFilterMode === "single"
      ? singleDate
        ? format(singleDate, "yyyy-MM-dd")
        : ""
      : dateFilterMode === "range" && rangeDateTo
        ? format(rangeDateTo, "yyyy-MM-dd")
        : "";

  const assignmentsQuery = useQuery({
    queryKey: ["teacher-subject-assignments"],
    queryFn: getTeacherSubjectAssignments,
    staleTime: 60_000,
  });

  const assignments = assignmentsQuery.data ?? [];

  const recapQuery = useQuery({
    queryKey: ["subject-recap", selectedAssignmentId, dateFromStr, dateToStr],
    queryFn: () =>
      getTeacherSubjectRecap({
        assignment_id: selectedAssignmentId,
        date_from: dateFromStr || undefined,
        date_to: dateToStr || undefined,
      }),
    enabled: !!selectedAssignmentId && dateFilterMode !== null,
    placeholderData: (previousData) => previousData,
    staleTime: 0,
  });

  const recap = recapQuery.data;
  const sortedStudents = useMemo<StaffSubjectRecapStudentRow[]>(
    () =>
      [...(recap?.students ?? [])].sort((first, second) =>
        first.student_name.localeCompare(second.student_name, "id", {
          sensitivity: "base",
        }),
      ),
    [recap?.students],
  );
  const classGroups = useMemo(() => {
    const groups = new Map<string, { id: string; name: string; students: StaffSubjectRecapStudentRow[] }>();
    for (const student of sortedStudents) {
      if (selectedClassId !== "all" && student.class_id !== selectedClassId) {
        continue;
      }
      const id = student.class_id || "unknown";
      const name = student.class_name || "Kelas belum tersedia";
      const group = groups.get(id) ?? { id, name, students: [] };
      group.students.push(student);
      groups.set(id, group);
    }
    return [...groups.values()].sort((first, second) =>
      first.name.localeCompare(second.name, "id", { sensitivity: "base" }),
    );
  }, [selectedClassId, sortedStudents]);
  const periodeLabel = buildPeriodLabel(
    dateFromStr,
    dateToStr,
    recap?.period_start,
    recap?.period_end,
  );

  const assignmentOptions = assignments.map((a) => ({
    value: a.id,
    label: `${a.subject_name} - ${a.class_name} (${a.school_year_name})`,
  }));

  const classOptions = [
    { value: "all", label: "Semua kelas" },
    ...(recap?.assignment.classes ?? []).map((item) => ({
      value: item.id,
      label: item.name,
    })),
  ];

  const filterStep = !selectedAssignmentId
    ? 1
    : dateFilterMode === null
      ? 2
      : 3;
  const filterStepTitle =
    filterStep === 1
      ? "Mulai dari mata pelajaran"
      : filterStep === 2
        ? "Pilih mode tanggal"
        : "Tentukan tanggal rekap";
  const filterStepDescription =
    filterStep === 1
      ? "Pilih mapel tujuan untuk membuka rekap kehadiran siswa."
      : filterStep === 2
        ? "Tentukan apakah rekap berdasarkan satu tanggal atau rentang tanggal."
        : "Atur tanggal untuk mempersempit data yang ingin kamu lihat.";

  return (
    <WalasShell>
      {() =>
        assignmentsQuery.isLoading && !assignmentsQuery.data ? (
          <HistoryPageSkeleton />
        ) : (
          <>
            {/* Filter */}
            <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-lg font-semibold text-slate-950">
                  Filter Rekap
                </p>
                <ExportImportActions
                  exportAction={{
                    onClick: () => setReportModalOpen(true),
                    label: "Export Laporan",
                    hideOutline: true,
                    disabled:
                      !recap ||
                      recap.students.length === 0 ||
                      recapQuery.isLoading,
                  }}
                />
              </div>
              <div className="mb-5 flex items-center gap-3 rounded-[20px] border border-emerald-100 bg-emerald-50/55 px-4 py-3.5 dark:border-emerald-800/70 dark:bg-emerald-950/45">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[13px] bg-emerald-600 text-sm font-bold text-white shadow-[0_8px_18px_rgba(5,150,105,0.18)]">
                  {filterStep}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">
                    {filterStepTitle}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-emerald-800/75 dark:text-emerald-200/80">
                    {filterStepDescription}
                  </p>
                </div>
              </div>
              <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_2fr]">
                <div className="sm:col-span-2 lg:col-span-1">
                  <div className="mb-1.5">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                      1. Mata Pelajaran
                    </label>
                  </div>
                  <RadixSelectField
                    value={selectedAssignmentId}
                    onValueChange={(value) => {
                      setSelectedAssignmentId(value);
                      setSelectedClassId("all");
                      setDateFilterMode(null);
                      setSingleDate(undefined);
                      setRangeDateFrom(undefined);
                      setRangeDateTo(undefined);
                    }}
                    placeholder="Pilih mata pelajaran"
                    options={assignmentOptions}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    2. Mode Tanggal
                  </label>
                  <DateFilterModeSwitch
                    value={dateFilterMode}
                    onChange={setDateFilterMode}
                  />
                </div>
                {dateFilterMode === "single" ? (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      3. Tanggal Tertentu
                    </label>
                    <DatePickerButton
                      value={singleDate}
                      onChange={setSingleDate}
                      placeholder="Pilih tanggal"
                    />
                  </div>
                ) : dateFilterMode === "range" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                        3. Dari
                      </label>
                      <DatePickerButton
                        value={rangeDateFrom}
                        onChange={setRangeDateFrom}
                        placeholder="Dari"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                        Sampai
                      </label>
                      <DatePickerButton
                        value={rangeDateTo}
                        onChange={setRangeDateTo}
                        placeholder="Sampai"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
              {dateFilterMode === "range" && !dateFromStr && !dateToStr ? (
                <p className="mt-3 text-sm text-slate-500">
                  Tanpa tanggal terpilih, sistem menampilkan semua data pada
                  periode{" "}
                  <span className="font-medium text-emerald-700">
                    {periodeLabel}
                  </span>
                  .
                </p>
              ) : null}
            </section>

            {/* Recap table */}
            {!selectedAssignmentId ? (
              <section className="rounded-[32px] border border-dashed border-slate-200 bg-white/45 p-6">
                <EmptyState
                  icon={ChartColumnBig}
                  title="Rekap siap ditampilkan"
                  description="Pilih mata pelajaran pada langkah pertama untuk melihat data kehadiran siswa."
                />
              </section>
            ) : dateFilterMode === null ? (
              <section className="rounded-[32px] border border-dashed border-emerald-200 bg-emerald-50/25 p-6">
                <EmptyState
                  icon={CalendarDays}
                  title="Pilih mode tanggal"
                  description="Gunakan switch langkah 2 untuk melanjutkan ke pengaturan tanggal rekap."
                />
              </section>
            ) : recapQuery.isLoading && !recapQuery.data ? (
              <section className="flex min-h-56 items-center justify-center rounded-[32px] border border-white/70 bg-white/88 p-6 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                  <LoaderCircle className="size-5 animate-spin text-emerald-600" />
                  Memuat rekap mata pelajaran...
                </div>
              </section>
            ) : recapQuery.error ? (
              <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
                <EmptyState
                  icon={ChartColumnBig}
                  title="Rekap belum bisa dimuat"
                  description={recapQuery.error.message}
                />
              </section>
            ) : recap ? (
              <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold text-slate-950">
                      {recap.assignment.subject_name} -{" "}
                      {recap.assignment.classes.length} kelas
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {recap.assignment.school_year_name} ·{" "}
                      <span className="font-medium text-emerald-700">
                        {recap.total_pertemuan} pertemuan
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Periode:{" "}
                      <span className="font-medium text-emerald-700">
                        {periodeLabel}
                      </span>
                    </p>
                  </div>
                  <div className="w-full sm:w-56">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Filter kelas
                    </label>
                    <RadixSelectField
                      value={selectedClassId}
                      onValueChange={setSelectedClassId}
                      options={classOptions}
                      placeholder="Pilih kelas"
                    />
                  </div>
                </div>

                {recap.students.length === 0 ? (
                  <EmptyState
                    icon={BookOpenCheck}
                    title="Belum ada data pertemuan"
                    description="Belum ada sesi yang divalidasi dalam rentang tanggal ini."
                  />
                ) : (
                  <>
                    <div className="space-y-6">
                      {classGroups.map((group) => (
                        <RecapClassTable
                          key={group.id}
                          className={group.name}
                          students={group.students}
                          totalPertemuan={recap.total_pertemuan}
                        />
                      ))}
                    </div>
                  </>
                )}
              </section>
            ) : (
              <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
                <EmptyState
                  icon={BookOpenCheck}
                  title="Belum ada data rekap"
                  description="Pilih filter lain atau pastikan seed sesi mapel sudah berjalan."
                />
              </section>
            )}

            {reportModalOpen ? (
              <SubjectRecapReportModal
                open={reportModalOpen}
                onOpenChange={setReportModalOpen}
                recap={recap}
                periodeLabel={periodeLabel}
              />
            ) : null}
          </>
        )
      }
    </WalasShell>
  );
}

function buildPeriodLabel(
  from: string,
  to: string,
  periodStart?: string,
  periodEnd?: string,
) {
  if (from && to && from === to) return `Tanggal ${formatReportDate(from)}`;
  if (from && to) return `${formatReportDate(from)} - ${formatReportDate(to)}`;
  if (from) return `Mulai ${formatReportDate(from)}`;
  if (to) return `Sampai ${formatReportDate(to)}`;

  if (periodStart && periodEnd && periodStart === periodEnd)
    return `Tanggal ${formatReportDate(periodStart)}`;
  if (periodStart && periodEnd)
    return `${formatReportDate(periodStart)} - ${formatReportDate(periodEnd)}`;
  return "Belum ada tanggal tercatat";
}

function formatReportDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function DatePickerButton({
  value,
  onChange,
  placeholder,
}: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button type="button" variant="outline" />}
        className="h-14 w-full justify-start rounded-[1.25rem] border-slate-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-left shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] transition-[border-color,box-shadow,background-color] hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_14px_30px_rgba(15,23,42,0.05)]"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CalendarDays className="size-4 shrink-0 text-emerald-600" />
          <span
            className={`truncate text-sm font-medium ${value ? "text-slate-700" : "text-slate-400"}`}
          >
            {value
              ? format(value, "d MMM yyyy", { locale: localeID })
              : placeholder}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent
        sideOffset={8}
        className="w-auto rounded-[24px] border border-emerald-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] p-4 shadow-[0_24px_54px_rgba(15,23,42,0.12)]"
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          locale={localeID}
          buttonVariant="ghost"
        />
      </PopoverContent>
    </Popover>
  );
}

function RecapClassTable({
  className,
  students,
  totalPertemuan,
}: {
  className: string;
  students: StaffSubjectRecapStudentRow[];
  totalPertemuan: number;
}) {
  const { pageItems, pagination } = usePagination(students, 10);

  return (
    <section className="overflow-hidden rounded-[24px] border border-emerald-100/80 bg-white/70 dark:border-slate-700 dark:bg-slate-900/70">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100/80 px-5 py-4 dark:border-slate-700">
        <div>
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {className}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Fokus rekap kehadiran kelas ini
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
          {students.length} siswa
        </span>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <DataTable>
          <DataTableHeadRow
            labels={["Siswa", "NIS", "Kelas", "Hadir", "Izin", "Sakit", "Alfa", "Persentase Hadir"]}
            centerLabels={["Hadir", "Izin", "Sakit", "Alfa", "Persentase Hadir"]}
          />
          <DataTableBody>
            {pageItems.map((student) => (
              <DataTableRow key={student.student_id}>
                <DataTableCell className="font-semibold text-slate-900">
                  {student.student_name}
                </DataTableCell>
                <DataTableCell>{student.nis}</DataTableCell>
                <DataTableCell>{student.class_name || className}</DataTableCell>
                <RecapCell value={student.hadir} cls="text-emerald-700 bg-emerald-50" />
                <RecapCell value={student.izin} cls="text-sky-700 bg-sky-50" />
                <RecapCell value={student.sakit} cls="text-violet-700 bg-violet-50" />
                <RecapCell value={student.alfa} cls="text-rose-700 bg-rose-50" />
                <AttendancePercentageCell hadir={student.hadir} totalPertemuan={totalPertemuan} />
              </DataTableRow>
            ))}
          </DataTableBody>
          <tfoot className="border-t border-emerald-100/80 dark:border-slate-700">
            <tr>
              <DataTableCell colSpan={3} className="text-xs font-semibold text-slate-500">
                Total ({students.length} siswa)
              </DataTableCell>
              <SumCell rows={students} field="hadir" cls="text-emerald-700" />
              <SumCell rows={students} field="izin" cls="text-sky-700" />
              <SumCell rows={students} field="sakit" cls="text-violet-700" />
              <SumCell rows={students} field="alfa" cls="text-rose-700" />
              <TotalAttendancePercentageCell rows={students} totalPertemuan={totalPertemuan} />
            </tr>
          </tfoot>
        </DataTable>
      </div>

      <MobileDataList>
        {pageItems.map((student) => (
          <MobileDataCard key={student.student_id}>
            <MobileDataHeader
              title={student.student_name}
              subtitle={`${student.nis} · ${student.class_name || className}`}
            />
            <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
              <RecapMetric label="Hadir" value={student.hadir} cls="text-emerald-700 bg-emerald-50" />
              <RecapMetric label="Izin" value={student.izin} cls="text-sky-700 bg-sky-50" />
              <RecapMetric label="Sakit" value={student.sakit} cls="text-violet-700 bg-violet-50" />
              <RecapMetric label="Alfa" value={student.alfa} cls="text-rose-700 bg-rose-50" />
              <RecapPercentageMetric hadir={student.hadir} totalPertemuan={totalPertemuan} />
            </div>
          </MobileDataCard>
        ))}
      </MobileDataList>
      <DataTablePagination {...pagination} />
    </section>
  );
}

function DateFilterModeSwitch({
  value,
  onChange,
}: {
  value: DateFilterMode | null;
  onChange: (value: DateFilterMode) => void;
}) {
  return (
    <div className="grid h-14 grid-cols-2 rounded-[1.25rem] border border-slate-300/80 bg-white/70 p-1 shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]">
      <Button
        type="button"
        variant="ghost"
        onClick={() => onChange("single")}
        className={`h-full rounded-[1rem] !border-transparent !ring-0 px-2 text-xs font-semibold focus-visible:!border-transparent focus-visible:!ring-0 ${
          value === "single"
            ? "bg-emerald-600 !text-white hover:!bg-emerald-700 hover:!text-white active:!bg-emerald-800 active:!text-white"
            : "!bg-transparent !text-slate-500 shadow-none hover:!bg-emerald-50 hover:!text-emerald-700 active:!bg-emerald-100 active:!text-emerald-800 dark:!text-slate-300 dark:hover:!bg-emerald-950/40 dark:hover:!text-emerald-200"
        }`}
      >
        Tanggal
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => onChange("range")}
        className={`h-full rounded-[1rem] !border-transparent !ring-0 px-2 text-xs font-semibold focus-visible:!border-transparent focus-visible:!ring-0 ${
          value === "range"
            ? "bg-emerald-600 !text-white hover:!bg-emerald-700 hover:!text-white active:!bg-emerald-800 active:!text-white"
            : "!bg-transparent !text-slate-500 shadow-none hover:!bg-emerald-50 hover:!text-emerald-700 active:!bg-emerald-100 active:!text-emerald-800 dark:!text-slate-300 dark:hover:!bg-emerald-950/40 dark:hover:!text-emerald-200"
        }`}
      >
        Rentang
      </Button>
    </div>
  );
}

function RecapCell({ value, cls }: { value: number; cls: string }) {
  return (
    <DataTableCell className="text-center">
      {value > 0 ? (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}
        >
          {value}
        </span>
      ) : (
        <span className="text-xs text-slate-300">-</span>
      )}
    </DataTableCell>
  );
}

function RecapMetric({
  label,
  value,
  cls,
}: {
  label: string;
  value: number;
  cls: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/70 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <span
        className={`mt-2 inline-flex min-w-8 justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${value > 0 ? cls : "bg-slate-50 text-slate-300"}`}
      >
        {value}
      </span>
    </div>
  );
}

function RecapPercentageMetric({
  hadir,
  totalPertemuan,
}: {
  hadir: number;
  totalPertemuan: number;
}) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
        % Hadir
      </p>
      <p className="mt-2 text-sm font-bold text-emerald-700">
        {formatAttendancePercentage(hadir, totalPertemuan)}
      </p>
    </div>
  );
}

function SumCell({
  rows,
  field,
  cls,
}: {
  rows: StaffSubjectRecapStudentRow[];
  field: keyof StaffSubjectRecapStudentRow;
  cls: string;
}) {
  const total = rows.reduce((sum, r) => sum + (r[field] as number), 0);
  return (
    <DataTableCell className={`text-center text-xs font-bold ${cls}`}>
      {total}
    </DataTableCell>
  );
}

function AttendancePercentageCell({
  hadir,
  totalPertemuan,
}: {
  hadir: number;
  totalPertemuan: number;
}) {
  return (
    <DataTableCell className="text-center text-xs font-bold text-emerald-700">
      {formatAttendancePercentage(hadir, totalPertemuan)}
    </DataTableCell>
  );
}

function TotalAttendancePercentageCell({
  rows,
  totalPertemuan,
}: {
  rows: StaffSubjectRecapStudentRow[];
  totalPertemuan: number;
}) {
  const totalHadir = rows.reduce((sum, row) => sum + row.hadir, 0);
  return (
    <DataTableCell className="text-center text-xs font-bold text-emerald-700">
      {formatAttendancePercentage(totalHadir, totalPertemuan * rows.length)}
    </DataTableCell>
  );
}

function formatAttendancePercentage(hadir: number, total: number) {
  if (total <= 0) return "0%";
  return `${Math.round((hadir / total) * 100)}%`;
}
