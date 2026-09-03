"use client";

import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import {
  actionIconButtonClass,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHeadRow,
  DataTableRow,
  DataTablePagination,
  usePagination,
} from "@/features/admin/management/shared/section-ui";
import { WalasShell } from "@/features/staff/components/homeroom-shell";
import { Button } from "@/components/ui/button";
import { ExportImportActions } from "@/components/ui/export-import-actions";
import { AsyncButton } from "@/components/ui/async-button";
import { Calendar } from "@/components/ui/calendar";
import {
  PremiumModal,
  premiumModalActionsClassName,
  premiumModalSubmitButtonClassName,
} from "@/components/modals/premium-modal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadixSelectField } from "@/components/ui/radix-select";
import {
  getTeacherSubjectAssignments,
  getTeacherSubjectAttendance,
  getTeacherSubjectCurrentSession,
  getTeacherSubjectScheduleDayStatus,
  getTeacherSubjectSessions,
  openTeacherSubjectSessionLate,
} from "@/services/staff.service";
import type { StaffSubjectSessionListItem } from "@/types/staff";
import dynamic from "@/lib/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import {
  ArrowUpRight,
  BookOpen,
  BookOpenCheck,
  CalendarClock,
  CalendarDays,
  Clock3,
  Eye,
  FilePenLine,
  History,
  Users,
} from "lucide-react";
import { AppLink as Link } from "@/components/router/app-link";
import { useRouter, useSearchParams } from "@/lib/router";
import { useEffect, useState } from "react";
import { HistoryPageSkeleton } from "@/components/loading/loading-system";
import { toast } from "sonner";

const SubjectSessionHistoryReportModal = dynamic(
  () =>
    import("@/features/reports/subject/session-history-report-modal").then(
      (module) => module.SubjectSessionHistoryReportModal,
    ),
  { ssr: false },
);

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  tidak_dibuka: { label: "Tidak Dibuka", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  belum_divalidasi: {
    label: "Belum Divalidasi",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300",
  },
  sudah_divalidasi: {
    label: "Sudah Divalidasi",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300",
  },
  diedit: { label: "Diedit", cls: "bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300" },
};

function isFinalizedSubjectSession(status: string) {
  return status === "sudah_divalidasi" || status === "diedit";
}

const HARI_LABEL: Record<string, string> = {
  senin: "Senin",
  selasa: "Selasa",
  rabu: "Rabu",
  kamis: "Kamis",
  jumat: "Jumat",
  sabtu: "Sabtu",
  minggu: "Minggu",
};

const STATUS_OPTIONS = [
  { value: "all", label: "Semua status" },
  { value: "tidak_dibuka", label: "Tidak Dibuka" },
  { value: "belum_divalidasi", label: "Belum Divalidasi" },
  { value: "sudah_divalidasi", label: "Sudah Divalidasi" },
  { value: "diedit", label: "Diedit" },
];

const EMPTY_ASSIGNMENTS: Awaited<
  ReturnType<typeof getTeacherSubjectAssignments>
> = [];
const EMPTY_SESSIONS: Awaited<
  ReturnType<typeof getTeacherSubjectSessions>
>["sessions"] = [];

type DateFilterMode = "single" | "range";

type LateReviewTarget = {
  assignmentId: string;
  session: StaffSubjectSessionListItem;
};

export function MapelHistoryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const defaultAssignment = searchParams.get("assignment_id") ?? "";

  const prefetchSessionDetail = (sessionId: string) => {
    void queryClient.prefetchQuery({
      queryKey: ["subject-attendance-overview", sessionId],
      queryFn: () => getTeacherSubjectAttendance(sessionId),
      staleTime: 30_000,
    });
  };

  const [selectedAssignmentId, setSelectedAssignmentId] =
    useState(defaultAssignment);
  const [currentClock, setCurrentClock] = useState(getCurrentClock);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>("range");
  const [singleDate, setSingleDate] = useState<Date | undefined>(undefined);
  const [rangeDateFrom, setRangeDateFrom] = useState<Date | undefined>(
    undefined,
  );
  const [rangeDateTo, setRangeDateTo] = useState<Date | undefined>(undefined);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [lateReviewTarget, setLateReviewTarget] =
    useState<LateReviewTarget | null>(null);

  const dateFromStr =
    dateFilterMode === "single"
      ? singleDate
        ? format(singleDate, "yyyy-MM-dd")
        : ""
      : rangeDateFrom
        ? format(rangeDateFrom, "yyyy-MM-dd")
        : "";
  const dateToStr =
    dateFilterMode === "single"
      ? singleDate
        ? format(singleDate, "yyyy-MM-dd")
        : ""
      : rangeDateTo
        ? format(rangeDateTo, "yyyy-MM-dd")
        : "";

  const assignmentsQuery = useQuery({
    queryKey: ["teacher-subject-assignments"],
    queryFn: getTeacherSubjectAssignments,
    staleTime: 60_000,
  });

  const scheduleDayStatusQuery = useQuery({
    queryKey: ["teacher-subject-schedule-day-status"],
    queryFn: getTeacherSubjectScheduleDayStatus,
    staleTime: 60_000,
  });
  const isHoliday = scheduleDayStatusQuery.data?.is_school_day === false;
  const holidayName = scheduleDayStatusQuery.data?.holiday_name;

  useEffect(() => {
    const interval = window.setInterval(
      () => setCurrentClock(getCurrentClock()),
      30_000,
    );
    return () => window.clearInterval(interval);
  }, []);

  const currentSessionQuery = useQuery({
    queryKey: [
      "teacher-subject-current-session-selection",
      currentClock.day,
      currentClock.time,
    ],
    queryFn: () =>
      getTeacherSubjectCurrentSession(currentClock.day, currentClock.time),
    enabled: assignmentsQuery.isSuccess && !isHoliday,
    refetchInterval: 30_000,
    staleTime: 30_000,
  });

  const assignments = assignmentsQuery.data ?? EMPTY_ASSIGNMENTS;

  useEffect(() => {
    if (selectedAssignmentId || assignments.length === 0) return;

    const activeSessionAssignmentId = currentSessionQuery.data?.assignment.id;
    const scheduledAssignment = assignments.find((assignment) =>
      assignment.schedules.some(
        (schedule) =>
          schedule.hari.toLowerCase() === currentClock.day &&
          isTimeWithinSchedule(
            currentClock.time,
            schedule.jam_mulai,
            schedule.jam_selesai,
          ),
      ),
    );
    const preferredAssignment =
      assignments.find(
        (assignment) => assignment.id === activeSessionAssignmentId,
      ) ??
      scheduledAssignment ??
      (assignments.length === 1
        ? assignments[0]
        : assignments.find(
            (assignment) => assignment.is_primary && assignment.is_active,
          ));

    if (preferredAssignment) setSelectedAssignmentId(preferredAssignment.id);
  }, [
    assignments,
    currentClock.day,
    currentClock.time,
    currentSessionQuery.data?.assignment.id,
    selectedAssignmentId,
  ]);

  const sessionsQuery = useQuery({
    queryKey: [
      "subject-sessions",
      selectedAssignmentId,
      statusFilter,
      dateFromStr,
      dateToStr,
    ],
    queryFn: () =>
      getTeacherSubjectSessions({
        assignment_id: selectedAssignmentId,
        status: statusFilter !== "all" ? statusFilter : undefined,
        date_from: dateFromStr || undefined,
        date_to: dateToStr || undefined,
      }),
    enabled: !!selectedAssignmentId,
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });

  const sessionList = sessionsQuery.data;
  const sessions = sessionsQuery.data?.sessions ?? EMPTY_SESSIONS;
  const { pageItems: pagedSessions, pagination: sessionsPagination } =
    usePagination(sessions, 10);
  const selectedAssignment =
    sessionList?.assignment ??
    assignments.find((a) => a.id === selectedAssignmentId);
  const periodeLabel = buildPeriodLabel(
    dateFromStr,
    dateToStr,
    sessions.map((session) => session.tanggal),
  );
  const statusLabel =
    STATUS_OPTIONS.find((option) => option.value === statusFilter)?.label ??
    "Semua status";
  const todayFocus = isHoliday
    ? null
    : buildTodaySessionFocus({
        assignments,
        sessions,
        activeSession: currentSessionQuery.data ?? null,
        selectedAssignmentId,
        currentClock,
      });
  const nextSchedule = isHoliday
    ? (buildUpcomingScheduleFocuses(assignments, {
        ...currentClock,
        time: "23:59",
      })[0] ?? null)
    : buildNextScheduleFocus(assignments, currentClock, todayFocus);

  const assignmentOptions = assignments.map((a) => ({
    value: a.id,
    label: a.subject_name,
  }));

  const openLateMutation = useMutation({
    mutationFn: (target: LateReviewTarget) =>
      openTeacherSubjectSessionLate({
        assignment_id: target.assignmentId,
        schedule_id: target.session.schedule_id,
        tanggal: target.session.tanggal,
      }),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["subject-sessions"] });
      queryClient.invalidateQueries({
        queryKey: ["teacher-subject-current-session-selection"],
      });
      setLateReviewTarget(null);
      toast.success(
        "Sesi dibuka untuk review. Simpan draft sebelum melakukan validasi final.",
      );
      router.push(
        `/dashboard/teacher/subject/session?session_id=${session.session_id}`,
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <WalasShell>
      {() =>
        (assignmentsQuery.isLoading && !assignmentsQuery.data) ||
        (currentSessionQuery.isLoading && !selectedAssignmentId) ||
        (Boolean(selectedAssignmentId) &&
          sessionsQuery.isLoading &&
          !sessionsQuery.data) ? (
          <HistoryPageSkeleton />
        ) : (
          <>
            <TodaySessionCard
              focus={todayFocus}
              nextSchedule={nextSchedule}
              isHoliday={isHoliday}
              holidayName={holidayName}
            />

            {/* Filter */}
            <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-lg font-semibold text-slate-950">
                  Filter Sesi Mapel
                </p>
                <ExportImportActions
                  exportAction={{
                    onClick: () => setReportModalOpen(true),
                    label: "Export Laporan",
                    hideOutline: true,
                    disabled:
                      !selectedAssignmentId ||
                      sessions.length === 0 ||
                      sessionsQuery.isLoading,
                  }}
                />
              </div>
              <div className="grid min-w-0 items-start gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(16rem,1.25fr)_minmax(9rem,11rem)_minmax(10rem,12rem)_minmax(16rem,1fr)]">
                <div className="min-w-0">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Mata Pelajaran
                  </label>
                  <RadixSelectField
                    value={selectedAssignmentId}
                    onValueChange={setSelectedAssignmentId}
                    placeholder="Pilih mata pelajaran"
                    options={assignmentOptions}
                    triggerClassName="min-w-0"
                  />
                </div>

                <div className="min-w-0">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Status
                  </label>
                  <RadixSelectField
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    placeholder="Semua status"
                    options={STATUS_OPTIONS}
                    triggerClassName="min-w-0"
                  />
                </div>

                <div className="min-w-0">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Mode Tanggal
                  </label>
                  <DateFilterModeSwitch
                    value={dateFilterMode}
                    onChange={setDateFilterMode}
                  />
                </div>

                {dateFilterMode === "single" ? (
                  <div className="min-w-0">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Tanggal Tertentu
                    </label>
                    <DatePickerButton
                      value={singleDate}
                      onChange={setSingleDate}
                      placeholder="Pilih tanggal"
                    />
                  </div>
                ) : (
                  <div className="grid min-w-0 grid-cols-2 gap-2">
                    <div className="min-w-0">
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                        Dari
                      </label>
                      <DatePickerButton
                        value={rangeDateFrom}
                        onChange={setRangeDateFrom}
                        placeholder="Dari"
                      />
                    </div>
                    <div className="min-w-0">
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
                )}
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

            {/* Sessions list */}
            {!selectedAssignmentId ? (
              <section>
                <EmptyState
                  icon={History}
                  title="Pilih mata pelajaran"
                  description="Pilih mata pelajaran di atas untuk membuka riwayat sesi mapel."
                />
              </section>
            ) : sessionsQuery.error ? (
              <section
                id="riwayat-sesi"
                className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]"
              >
                <EmptyState
                  icon={History}
                  title="Riwayat belum bisa dimuat"
                  description={sessionsQuery.error.message}
                />
              </section>
            ) : sessions.length === 0 ? (
              <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
                <EmptyState
                  icon={BookOpenCheck}
                  title="Belum ada sesi tercatat"
                  description="Belum ada slot jadwal yang selesai pada periode ini."
                />
              </section>
            ) : (
              <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/88 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
                <div className="px-5 pt-5 sm:px-6 sm:pt-6">
                <p className="mb-4 text-lg font-semibold text-slate-950">
                  Sesi Mapel
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    ({sessions.length} sesi)
                  </span>
                </p>
                <p className="-mt-2 mb-4 text-sm text-slate-500">
                  Periode:{" "}
                  <span className="font-medium text-emerald-700">
                    {periodeLabel}
                  </span>
                  <span className="mx-2 text-slate-300">/</span>
                  Status:{" "}
                  <span className="font-medium text-slate-700">
                    {statusLabel}
                  </span>
                </p>
                </div>

                <div className="hidden overflow-x-auto border-t border-emerald-100/80 md:block dark:border-slate-700">
                  <DataTable>
                    <DataTableHeadRow
                      labels={[
                        "Tanggal",
                        "Hari / Jam",
                        "Konteks Mapel",
                        "Topik",
                        "H",
                        "I",
                        "S",
                        "A",
                        "Status",
                        "Aksi",
                      ]}
                      centerLabels={["H", "I", "S", "A", "Status"]}
                    />
                    <DataTableBody>
                      {pagedSessions.map((sess) => {
                        const statusInfo = STATUS_MAP[sess.status] ?? {
                          label: sess.status,
                          cls: "bg-slate-100 text-slate-600",
                        };
                        return (
                          <DataTableRow
                            key={sess.session_id}
                            className="content-enter-up-4"
                          >
                            <DataTableCell className="font-semibold text-slate-950">
                              {formatDisplayDate(sess.tanggal)}
                            </DataTableCell>
                            <DataTableCell>
                              <span className="font-medium text-slate-800">
                                {HARI_LABEL[sess.hari] ?? sess.hari}
                              </span>
                              <span className="mt-0.5 block text-xs text-slate-500">
                                {sess.jam_mulai}-{sess.jam_selesai}
                              </span>
                            </DataTableCell>
                            <DataTableCell>
                              <p className="font-medium text-slate-900">
                                {selectedAssignment?.subject_name ?? "Mapel"}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {sess.class_name ?? "Kelas belum tersedia"}
                              </p>
                            </DataTableCell>
                            <DataTableCell className="max-w-[240px]">
                              <span className="line-clamp-2">
                                {sess.topic || "Belum ada topik"}
                              </span>
                            </DataTableCell>
                            <HistoryMetric
                              value={sess.hadir}
                              cls="text-emerald-700 bg-emerald-50"
                            />
                            <HistoryMetric
                              value={sess.izin}
                              cls="text-slate-600 bg-slate-50"
                            />
                            <HistoryMetric
                              value={sess.sakit}
                              cls="text-sky-700 bg-sky-50"
                            />
                            <HistoryMetric
                              value={sess.alfa}
                              cls="text-rose-700 bg-rose-50"
                            />
                            <DataTableCell className="text-center">
                              <div className="flex flex-wrap justify-center gap-1.5">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusInfo.cls}`}
                                >
                                  {statusInfo.label}
                                </span>
                                {sess.opened_late && !isFinalizedSubjectSession(sess.status) ? (
                                  <span className="inline-flex rounded-full border border-rose-200 bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-300">
                                    Dibuka terlambat
                                  </span>
                                ) : null}
                              </div>
                            </DataTableCell>
                            <DataTableCell className="text-center">
                              {sess.is_recorded ? (
                                <div className="flex items-center justify-center gap-2">
                                  <Link
                                    href={`/dashboard/teacher/subject/session?session_id=${sess.session_id}`}
                                    onFocus={() => prefetchSessionDetail(sess.session_id)}
                                    onPointerEnter={() =>
                                      prefetchSessionDetail(sess.session_id)
                                    }
                                    onTouchStart={() =>
                                      prefetchSessionDetail(sess.session_id)
                                    }
                                    aria-label={`Lihat sesi ${formatDisplayDate(sess.tanggal)}`}
                                    title="Lihat sesi"
                                    className={`inline-flex items-center justify-center ${actionIconButtonClass("emerald")}`}
                                  >
                                    <Eye className="size-4" />
                                  </Link>
                                </div>
                              ) : sess.can_open_late ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setLateReviewTarget({
                                      assignmentId: selectedAssignmentId,
                                      session: sess,
                                    })
                                  }
                                  aria-label={`Buka sesi ${formatDisplayDate(sess.tanggal)} untuk review`}
                                  title="Buka untuk review terlambat"
                                  className={`inline-flex items-center justify-center ${actionIconButtonClass("sky")}`}
                                >
                                  <FilePenLine className="size-4" />
                                </button>
                              ) : (
                                <span
                                  title="Sesi tidak dibuka, sehingga tidak ada detail presensi."
                                  className="inline-flex size-9 cursor-not-allowed items-center justify-center rounded-full bg-slate-100 text-slate-300"
                                >
                                  <Eye className="size-4" />
                                </span>
                              )}
                            </DataTableCell>
                          </DataTableRow>
                        );
                      })}
                    </DataTableBody>
                  </DataTable>
                </div>

                <div className="space-y-3 p-5 md:hidden">
                  {pagedSessions.map((sess, i) => {
                    const statusInfo = STATUS_MAP[sess.status] ?? {
                      label: sess.status,
                      cls: "bg-slate-100 text-slate-600",
                    };
                    return (
                      <div
                        key={sess.session_id}
                        className="content-enter-up-6 rounded-[1.35rem] border border-emerald-100/70 bg-white/80 p-4 shadow-[0_16px_34px_rgba(15,23,42,0.06)]"
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold leading-6 text-slate-900">
                              {formatDisplayDate(sess.tanggal)}
                            </p>
                            <div className="mt-3">
                              <p className="text-sm font-medium leading-6 text-slate-900">
                                {selectedAssignment?.subject_name ?? "Mapel"}
                              </p>
                              <p className="text-xs leading-5 text-slate-500">
                                {sess.class_name ?? "Kelas belum tersedia"}
                              </p>
                            </div>
                            <p className="mt-0.5 text-xs leading-5 text-slate-500">
                              {HARI_LABEL[sess.hari] ?? sess.hari} ·{" "}
                              {sess.jam_mulai}–{sess.jam_selesai}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                              <HistoryMiniMetric
                                label="H"
                                value={sess.hadir}
                                cls="text-emerald-700 bg-emerald-50"
                              />
                              <HistoryMiniMetric
                                label="I"
                                value={sess.izin}
                                cls="text-slate-600 bg-slate-50"
                              />
                              <HistoryMiniMetric
                                label="S"
                                value={sess.sakit}
                                cls="text-sky-700 bg-sky-50"
                              />
                              <HistoryMiniMetric
                                label="A"
                                value={sess.alfa}
                                cls="text-rose-700 bg-rose-50"
                              />
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusInfo.cls}`}
                            >
                              {statusInfo.label}
                            </span>
                            {sess.opened_late && !isFinalizedSubjectSession(sess.status) ? (
                              <span className="rounded-full border border-rose-200 bg-rose-100 px-2.5 py-1 text-[10px] font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-300">
                                Dibuka terlambat
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <p className="min-w-0 text-sm leading-6 text-slate-600">
                            {sess.topic || "Belum ada topik"}
                          </p>
                          {sess.is_recorded ? (
                            <div className="flex shrink-0 items-center gap-2">
                              <Link
                                href={`/dashboard/teacher/subject/session?session_id=${sess.session_id}`}
                                onFocus={() => prefetchSessionDetail(sess.session_id)}
                                onPointerEnter={() =>
                                  prefetchSessionDetail(sess.session_id)
                                }
                                onTouchStart={() =>
                                  prefetchSessionDetail(sess.session_id)
                                }
                                aria-label={`Lihat sesi ${formatDisplayDate(sess.tanggal)}`}
                                title="Lihat sesi"
                                className={`inline-flex items-center justify-center ${actionIconButtonClass("emerald")}`}
                              >
                                <Eye className="size-4" />
                              </Link>
                            </div>
                          ) : sess.can_open_late ? (
                            <button
                              type="button"
                              onClick={() =>
                                setLateReviewTarget({
                                  assignmentId: selectedAssignmentId,
                                  session: sess,
                                })
                              }
                              aria-label={`Buka sesi ${formatDisplayDate(sess.tanggal)} untuk review`}
                              title="Buka untuk review terlambat"
                              className={`inline-flex shrink-0 items-center justify-center ${actionIconButtonClass("sky")}`}
                            >
                              <FilePenLine className="size-4" />
                            </button>
                          ) : (
                            <span
                              title="Sesi tidak dibuka, sehingga tidak ada detail presensi."
                              className="inline-flex size-9 shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-slate-100 text-slate-300"
                            >
                              <Eye className="size-4" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <DataTablePagination {...sessionsPagination} />
              </section>
            )}

            {reportModalOpen ? (
              <SubjectSessionHistoryReportModal
                open={reportModalOpen}
                onOpenChange={setReportModalOpen}
                assignments={assignments}
                selectedAssignmentId={selectedAssignmentId}
                dateFrom={dateFromStr}
                dateTo={dateToStr}
                periodeLabel={periodeLabel}
              />
            ) : null}

            {lateReviewTarget ? (
              <PremiumModal
                open={Boolean(lateReviewTarget)}
                onOpenChange={(open) =>
                  !open &&
                  !openLateMutation.isPending &&
                  setLateReviewTarget(null)
                }
                title="Buka sesi untuk review"
                description="Sesi yang terlewat tetap bisa dilengkapi dan ditinjau sebelum disahkan."
                icon={FilePenLine}
                className="sm:!max-w-[640px] [&_[data-modal-scroll-area]]:!flex-none [&_[data-modal-scroll-area]]:!overflow-visible [&_[data-modal-scroll-area]]:!pb-0 [&_[data-modal-scroll-area]+div]:!pt-2 [&_[data-modal-scroll-area]+div]:!pb-3"
                footer={
                  <div
                    className={`${premiumModalActionsClassName} !mt-2 !pt-3`}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      disabled={openLateMutation.isPending}
                      onClick={() => setLateReviewTarget(null)}
                      className="h-12 rounded-[1.1rem]"
                    >
                      Batal
                    </Button>
                    <AsyncButton
                      type="button"
                      isPending={openLateMutation.isPending}
                      pendingLabel="Membuka..."
                      icon={FilePenLine}
                      onClick={() => openLateMutation.mutate(lateReviewTarget)}
                      className={premiumModalSubmitButtonClassName}
                    >
                      Buka untuk Review
                    </AsyncButton>
                  </div>
                }
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <ReviewSessionDetail
                      icon={BookOpen}
                      label="Mata pelajaran"
                      value={
                        selectedAssignment?.subject_name ??
                        "Mapel belum tersedia"
                      }
                    />
                    <ReviewSessionDetail
                      icon={Users}
                      label="Kelas"
                      value={
                        lateReviewTarget.session.class_name ||
                        "Kelas belum tersedia"
                      }
                    />
                    <ReviewSessionDetail
                      icon={CalendarDays}
                      label="Tanggal"
                      value={formatDisplayDate(
                        lateReviewTarget.session.tanggal,
                      )}
                    />
                    <ReviewSessionDetail
                      icon={Clock3}
                      label="Jadwal"
                      value={`${HARI_LABEL[lateReviewTarget.session.hari] ?? lateReviewTarget.session.hari} · ${lateReviewTarget.session.jam_mulai}–${lateReviewTarget.session.jam_selesai}`}
                    />
                  </div>

                  <div className="rounded-[1.2rem] bg-amber-50/80 p-4 text-sm leading-6 text-amber-950">
                    <p className="font-semibold text-rose-700 dark:text-rose-300">
                      Review sesi yang terlewat
                    </p>
                    <p className="mt-1 text-amber-800 dark:text-amber-200">
                      Sesi akan dibuka dengan status{" "}
                      <span className="font-semibold">Belum Divalidasi</span>{" "}
                      dan penanda{" "}
                      <span className="font-semibold">Dibuka terlambat</span>.
                      Data belum masuk rekap resmi sampai guru memilih “Validasi
                      & Tutup”.
                    </p>
                  </div>
                </div>
              </PremiumModal>
            ) : null}
          </>
        )
      }
    </WalasShell>
  );
}

function ReviewSessionDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.15rem] bg-white/80 px-3.5 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
        <Icon className="size-3.5 text-emerald-600" />
        {label}
      </div>
      <p className="mt-1.5 text-sm font-semibold leading-5 text-slate-800">
        {value}
      </p>
    </div>
  );
}

type TodaySessionFocus = {
  assignmentId: string;
  subjectName: string;
  className: string;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  scheduledFor: string;
  scheduledAt: number;
  sessionId?: string;
  state: "active" | "recorded" | "scheduled";
  status?: string;
};

type SubjectAssignmentScheduleSource = Array<{
  id: string;
  subject_name: string;
  schedules: Array<{
    class_name: string;
    hari: string;
    jam_mulai: string;
    jam_selesai: string;
    is_active: boolean;
  }>;
}>;

type SubjectSessionClock = { day: string; time: string; date: Date };

function buildTodaySessionFocus({
  assignments,
  sessions,
  activeSession,
  selectedAssignmentId,
  currentClock,
}: {
  assignments: SubjectAssignmentScheduleSource;
  sessions: Array<{
    session_id: string;
    class_name?: string;
    tanggal: string;
    hari: string;
    jam_mulai: string;
    jam_selesai: string;
    status: string;
  }>;
  activeSession: {
    session_id: string;
    assignment: { id: string; subject_name: string; class_name?: string };
    hari: string;
    jam_mulai: string;
    jam_selesai: string;
    status: string;
  } | null;
  selectedAssignmentId: string;
  currentClock: SubjectSessionClock;
}): TodaySessionFocus | null {
  const today = format(currentClock.date, "yyyy-MM-dd");

  if (activeSession) {
    return {
      assignmentId: activeSession.assignment.id,
      subjectName: activeSession.assignment.subject_name,
      className: activeSession.assignment.class_name ?? "Kelas belum tersedia",
      hari: activeSession.hari,
      jamMulai: activeSession.jam_mulai,
      jamSelesai: activeSession.jam_selesai,
      scheduledFor: today,
      scheduledAt: buildScheduleTimestamp(
        currentClock.date,
        activeSession.jam_mulai,
      ),
      sessionId: activeSession.session_id,
      state: "active",
      status: activeSession.status,
    };
  }

  const recordedToday = sessions.find((session) => session.tanggal === today);
  const selectedAssignment = assignments.find(
    (assignment) => assignment.id === selectedAssignmentId,
  );

  if (recordedToday && selectedAssignment) {
    return {
      assignmentId: selectedAssignment.id,
      subjectName: selectedAssignment.subject_name,
      className: recordedToday.class_name ?? "Kelas belum tersedia",
      hari: recordedToday.hari,
      jamMulai: recordedToday.jam_mulai,
      jamSelesai: recordedToday.jam_selesai,
      scheduledFor: today,
      scheduledAt: buildScheduleTimestamp(
        currentClock.date,
        recordedToday.jam_mulai,
      ),
      sessionId: recordedToday.session_id,
      state: "recorded",
      status: recordedToday.status,
    };
  }

  return buildUpcomingScheduleFocuses(assignments, currentClock)[0] ?? null;
}

function buildNextScheduleFocus(
  assignments: SubjectAssignmentScheduleSource,
  currentClock: SubjectSessionClock,
  focus: TodaySessionFocus | null,
): TodaySessionFocus | null {
  const threshold =
    focus?.state === "scheduled"
      ? focus.scheduledAt
      : currentClock.date.getTime();

  return (
    buildUpcomingScheduleFocuses(assignments, currentClock).find(
      (schedule) => schedule.scheduledAt > threshold,
    ) ?? null
  );
}

function buildUpcomingScheduleFocuses(
  assignments: SubjectAssignmentScheduleSource,
  currentClock: SubjectSessionClock,
): TodaySessionFocus[] {
  const currentDayIndex = getDayIndex(currentClock.day);

  return assignments
    .flatMap((assignment) =>
      assignment.schedules.flatMap((schedule) => {
        if (!schedule.is_active) return [];

        const scheduleDayIndex = getDayIndex(schedule.hari);
        if (scheduleDayIndex < 0 || currentDayIndex < 0) return [];

        let daysAhead = (scheduleDayIndex - currentDayIndex + 7) % 7;
        if (
          daysAhead === 0 &&
          normalizeTime(schedule.jam_selesai) < normalizeTime(currentClock.time)
        ) {
          daysAhead = 7;
        }

        const scheduledDate = new Date(currentClock.date);
        scheduledDate.setDate(scheduledDate.getDate() + daysAhead);

        return [
          {
            assignmentId: assignment.id,
            subjectName: assignment.subject_name,
            className: schedule.class_name,
            hari: schedule.hari,
            jamMulai: schedule.jam_mulai,
            jamSelesai: schedule.jam_selesai,
            scheduledFor: format(scheduledDate, "yyyy-MM-dd"),
            scheduledAt: buildScheduleTimestamp(
              scheduledDate,
              schedule.jam_mulai,
            ),
            state: "scheduled" as const,
          },
        ];
      }),
    )
    .sort((a, b) => a.scheduledAt - b.scheduledAt);
}

function TodaySessionCard({
  focus,
  nextSchedule,
  isHoliday = false,
  holidayName,
}: {
  focus: TodaySessionFocus | null;
  nextSchedule: TodaySessionFocus | null;
  isHoliday?: boolean;
  holidayName?: string;
}) {
  const sessionHref = focus?.sessionId
    ? `/dashboard/teacher/subject/session?session_id=${focus.sessionId}`
    : null;
  const stateCopy = isHoliday
    ? {
        eyebrow: "HARI LIBUR",
        title: "Tidak ada sesi mapel hari ini",
        badge: "Jadwal berikutnya",
      }
    : focus?.state === "active"
      ? {
          eyebrow: "SEDANG BERLANGSUNG",
          title: "Sesi mapel aktif",
          badge: "Buka sekarang",
        }
      : focus?.state === "recorded"
        ? {
            eyebrow: "SUDAH TERCATAT HARI INI",
            title: "Tinjau hasil sesi",
            badge: "Lihat sesi",
          }
        : focus?.state === "scheduled"
          ? {
              eyebrow:
                focus.scheduledFor === format(new Date(), "yyyy-MM-dd")
                  ? "JADWAL BERIKUTNYA HARI INI"
                  : "JADWAL TERDEKAT",
              title:
                focus.scheduledFor === format(new Date(), "yyyy-MM-dd")
                  ? "Sesi mapel hari ini"
                  : "Siapkan sesi berikutnya",
              badge: "Lihat jadwal",
            }
          : {
              eyebrow: "AGENDA HARI INI",
              title: "Tidak ada sesi mapel hari ini",
              badge: "Lihat riwayat",
            };
  const focusDate = focus?.scheduledFor
    ? format(new Date(`${focus.scheduledFor}T00:00:00`), "EEEE, d MMMM yyyy", {
        locale: localeID,
      })
    : format(new Date(), "EEEE, d MMMM yyyy", { locale: localeID });

  return (
    <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[18px] bg-emerald-600 text-white shadow-[0_10px_22px_rgba(5,150,105,0.24)]">
            <BookOpenCheck className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                {stateCopy.eyebrow}
              </p>
              <span className="rounded-full border border-emerald-200 bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                {focusDate}
              </span>
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-slate-950">
              {stateCopy.title}
            </h2>
            {focus ? (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  {focus.subjectName}
                </span>
                <span className="text-slate-300">•</span>
                <span>{focus.className}</span>
                <span className="text-slate-300">•</span>
                <span>
                  {HARI_LABEL[focus.hari] ?? focus.hari}, {focus.jamMulai}–
                  {focus.jamSelesai}
                </span>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                {isHoliday
                  ? `Hari ini libur${holidayName ? `: ${holidayName}` : ""}. Ticket presensi tidak tersedia.`
                  : "Tidak ada jadwal yang perlu dibuka pada hari ini."}
              </p>
            )}
          </div>
        </div>

        <div className="relative flex shrink-0 flex-wrap items-center gap-3 lg:justify-end">
          {focus?.status ? (
            <span
              className={`rounded-full px-3 py-2 text-xs font-semibold ${STATUS_MAP[focus.status]?.cls ?? "bg-slate-100 text-slate-600"}`}
            >
              {STATUS_MAP[focus.status]?.label ?? focus.status}
            </span>
          ) : null}
          <Link
            href="/dashboard/teacher/subject/schedule"
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-[16px] border border-emerald-200 bg-white/90 px-4 text-sm font-semibold text-emerald-800 shadow-[0_12px_24px_rgba(15,118,110,0.08)] transition hover:border-emerald-300 hover:bg-emerald-50 active:translate-y-px active:scale-[0.97] active:!border-emerald-500 active:!bg-emerald-100 active:!text-emerald-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200/80"
          >
            Lihat jadwal
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          {sessionHref ? (
            <Link
              href={sessionHref}
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-[16px] bg-emerald-700 px-4 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(5,150,105,0.2)] transition hover:bg-emerald-800 active:translate-y-px active:scale-[0.97] active:!bg-emerald-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200/80"
            >
              Masuk
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          ) : (
            <span
              title="Ticket sesi akan tersedia saat jadwal sudah dimulai."
              className="inline-flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-[16px] bg-slate-200 px-4 text-sm font-semibold text-slate-500"
            >
              Masuk
              <ArrowUpRight className="size-4" />
            </span>
          )}
        </div>
      </div>

      <div className="relative mt-5 border-t border-emerald-100/90 pt-4">
        <div className="flex flex-wrap items-center gap-3 rounded-[18px] border border-emerald-100 bg-white/70 px-3.5 py-3 sm:px-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[13px] bg-emerald-100 text-emerald-700">
            <CalendarClock className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
              Jadwal selanjutnya
            </p>
            {nextSchedule ? (
              <p className="mt-0.5 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  {nextSchedule.subjectName}
                </span>
                <span className="mx-2 text-slate-300">•</span>
                <span>{nextSchedule.className}</span>
                <span className="mx-2 text-slate-300">•</span>
                <span className="font-medium text-slate-700">
                  {format(
                    new Date(`${nextSchedule.scheduledFor}T00:00:00`),
                    "EEEE, d MMM",
                    { locale: localeID },
                  )}
                  , {nextSchedule.jamMulai}–{nextSchedule.jamSelesai}
                </span>
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-slate-500">
                Belum ada jadwal lanjutan yang aktif.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function buildPeriodLabel(from: string, to: string, availableDates: string[]) {
  if (from && to && from === to) return `Tanggal ${formatReportDate(from)}`;
  if (from && to) return `${formatReportDate(from)} - ${formatReportDate(to)}`;
  if (from) return `Mulai ${formatReportDate(from)}`;
  if (to) return `Sampai ${formatReportDate(to)}`;

  const sortedDates = [...new Set(availableDates)]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  if (sortedDates.length === 1)
    return `Tanggal ${formatReportDate(sortedDates[0])}`;
  if (sortedDates.length > 1) {
    return `${formatReportDate(sortedDates[0])} - ${formatReportDate(sortedDates[sortedDates.length - 1])}`;
  }
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

function formatDisplayDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getCurrentClock() {
  const now = new Date();
  return {
    day: ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"][
      now.getDay()
    ],
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`,
    date: now,
  };
}

function isTimeWithinSchedule(
  currentTime: string,
  startTime: string,
  endTime: string,
) {
  const current = normalizeTime(currentTime);
  const start = normalizeTime(startTime);
  const end = normalizeTime(endTime);
  return Boolean(current && start && end && current >= start && current <= end);
}

function normalizeTime(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : "";
}

function getDayIndex(day: string) {
  return [
    "minggu",
    "senin",
    "selasa",
    "rabu",
    "kamis",
    "jumat",
    "sabtu",
  ].indexOf(day.toLowerCase());
}

function buildScheduleTimestamp(date: Date, time: string) {
  const normalizedTime = normalizeTime(time);
  const [hours, minutes] = normalizedTime.split(":").map(Number);
  const scheduledAt = new Date(date);
  scheduledAt.setHours(hours || 0, minutes || 0, 0, 0);
  return scheduledAt.getTime();
}

function HistoryMetric({ value, cls }: { value: number; cls: string }) {
  return (
    <DataTableCell className="text-center">
      <span
        className={`inline-flex min-w-8 justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${value > 0 ? cls : "bg-slate-50 text-slate-300"}`}
      >
        {value || "-"}
      </span>
    </DataTableCell>
  );
}

function HistoryMiniMetric({
  label,
  value,
  cls,
}: {
  label: string;
  value: number;
  cls: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/70 px-2 py-2">
      <p className="text-[10px] font-bold text-slate-400">{label}</p>
      <p
        className={`mt-1 rounded-full px-1.5 py-0.5 font-semibold ${value > 0 ? cls : "bg-slate-50 text-slate-300"}`}
      >
        {value || "-"}
      </p>
    </div>
  );
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
        className="h-14 w-full min-w-0 justify-start overflow-hidden rounded-[1.25rem] border-slate-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-2 text-left shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] transition-[border-color,box-shadow,background-color] hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_14px_30px_rgba(15,23,42,0.05)] dark:border-slate-600 dark:bg-none dark:bg-slate-800 dark:text-slate-100 dark:shadow-none sm:px-3"
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays className="size-4 shrink-0 text-emerald-600" />
          <span
            className={`truncate text-sm font-medium ${value ? "text-slate-700" : "text-slate-400"}`}
          >
            {value
              ? format(value, "d MMM yy", { locale: localeID })
              : placeholder}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent
        sideOffset={8}
        className="w-auto rounded-[24px] border border-emerald-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] p-4 shadow-[0_24px_54px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-none dark:bg-slate-900 dark:shadow-none"
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

function DateFilterModeSwitch({
  value,
  onChange,
}: {
  value: DateFilterMode;
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
