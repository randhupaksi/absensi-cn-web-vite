"use client";

import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import { actionIconButtonClass, DataTablePagination, usePagination } from "@/features/admin/management/shared/section-ui";
import { WalasShell } from "@/features/staff/components/homeroom-shell";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadixSelectField } from "@/components/ui/radix-select";
import {
  getTeacherSubjectAssignments,
  getTeacherSubjectCurrentSession,
  getTeacherSubjectSessions,
} from "@/services/staff.service";
import dynamic from "@/lib/dynamic";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { motion } from "motion/react";
import { ArrowUpRight, BookOpenCheck, CalendarClock, CalendarDays, Eye, History, Printer } from "lucide-react";
import { AppLink as Link } from "@/components/router/app-link";
import { useSearchParams } from "@/lib/router";
import { useEffect, useState } from "react";
import { HistoryPageSkeleton } from "@/components/loading/loading-system";

const SubjectSessionHistoryReportModal = dynamic(
  () =>
    import("@/features/reports/subject/session-history-report-modal").then(
      (module) => module.SubjectSessionHistoryReportModal,
    ),
  { ssr: false },
);

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  belum_divalidasi: { label: "Belum Divalidasi", cls: "bg-amber-100 text-amber-700" },
  sudah_divalidasi: { label: "Sudah Divalidasi", cls: "bg-emerald-100 text-emerald-700" },
  diedit: { label: "Diedit", cls: "bg-violet-100 text-violet-700" },
};

const HARI_LABEL: Record<string, string> = {
  senin: "Senin", selasa: "Selasa", rabu: "Rabu", kamis: "Kamis",
  jumat: "Jumat", sabtu: "Sabtu", minggu: "Minggu",
};

const STATUS_OPTIONS = [
  { value: "all", label: "Semua status" },
  { value: "belum_divalidasi", label: "Belum Divalidasi" },
  { value: "sudah_divalidasi", label: "Sudah Divalidasi" },
  { value: "diedit", label: "Diedit" },
];

type DateFilterMode = "single" | "range";

export function MapelHistoryPage() {
  const searchParams = useSearchParams();
  const defaultAssignment = searchParams.get("assignment_id") ?? "";

  const [selectedAssignmentId, setSelectedAssignmentId] = useState(defaultAssignment);
  const [currentClock, setCurrentClock] = useState(getCurrentClock);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>("range");
  const [singleDate, setSingleDate] = useState<Date | undefined>(undefined);
  const [rangeDateFrom, setRangeDateFrom] = useState<Date | undefined>(undefined);
  const [rangeDateTo, setRangeDateTo] = useState<Date | undefined>(undefined);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const dateFromStr = dateFilterMode === "single"
    ? singleDate ? format(singleDate, "yyyy-MM-dd") : ""
    : rangeDateFrom ? format(rangeDateFrom, "yyyy-MM-dd") : "";
  const dateToStr = dateFilterMode === "single"
    ? singleDate ? format(singleDate, "yyyy-MM-dd") : ""
    : rangeDateTo ? format(rangeDateTo, "yyyy-MM-dd") : "";

  const assignmentsQuery = useQuery({
    queryKey: ["teacher-subject-assignments"],
    queryFn: getTeacherSubjectAssignments,
    staleTime: 60_000,
  });

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentClock(getCurrentClock()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const currentSessionQuery = useQuery({
    queryKey: ["teacher-subject-current-session-selection", currentClock.day, currentClock.time],
    queryFn: () => getTeacherSubjectCurrentSession(currentClock.day, currentClock.time),
    enabled: assignmentsQuery.isSuccess,
    refetchInterval: 30_000,
    staleTime: 30_000,
  });

  const assignments = assignmentsQuery.data ?? [];

  useEffect(() => {
    if (selectedAssignmentId || assignments.length === 0) return;

    const activeSessionAssignmentId = currentSessionQuery.data?.assignment.id;
    const scheduledAssignment = assignments.find((assignment) =>
      assignment.schedules.some((schedule) =>
        schedule.hari.toLowerCase() === currentClock.day &&
        isTimeWithinSchedule(currentClock.time, schedule.jam_mulai, schedule.jam_selesai),
      ),
    );
    const preferredAssignment =
      assignments.find((assignment) => assignment.id === activeSessionAssignmentId) ??
      scheduledAssignment ??
      (assignments.length === 1 ? assignments[0] : assignments.find((assignment) => assignment.is_primary && assignment.is_active));

    if (preferredAssignment) setSelectedAssignmentId(preferredAssignment.id);
  }, [assignments, currentClock.day, currentClock.time, currentSessionQuery.data?.assignment.id, selectedAssignmentId]);

  const sessionsQuery = useQuery({
    queryKey: ["subject-sessions", selectedAssignmentId, statusFilter, dateFromStr, dateToStr],
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
  const sessions = sessionsQuery.data?.sessions ?? [];
  const { pageItems: pagedSessions, pagination: sessionsPagination } = usePagination(sessions, 10);
  const selectedAssignment = sessionList?.assignment ?? assignments.find((a) => a.id === selectedAssignmentId);
  const periodeLabel = buildPeriodLabel(dateFromStr, dateToStr, sessions.map((session) => session.tanggal));
  const statusLabel = STATUS_OPTIONS.find((option) => option.value === statusFilter)?.label ?? "Semua status";
  const todayFocus = buildTodaySessionFocus({
    assignments,
    sessions,
    activeSession: currentSessionQuery.data ?? null,
    selectedAssignmentId,
    currentClock,
  });
  const nextSchedule = buildNextScheduleFocus(assignments, currentClock, todayFocus);

  const assignmentOptions = assignments.map((a) => ({
    value: a.id,
    label: `${a.subject_name} — ${a.class_name}`,
  }));

  return (
    <WalasShell>
      {() => (
        (assignmentsQuery.isLoading && !assignmentsQuery.data) ||
        (currentSessionQuery.isLoading && !selectedAssignmentId) ||
        (Boolean(selectedAssignmentId) && sessionsQuery.isLoading && !sessionsQuery.data)
      ) ? (
        <HistoryPageSkeleton />
      ) : (
        <>
          <TodaySessionCard focus={todayFocus} nextSchedule={nextSchedule} />

          {/* Filter */}
          <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-lg font-semibold text-slate-950">Filter Sesi Mapel</p>
              <Button
                type="button"
                disabled={!selectedAssignmentId || sessions.length === 0 || sessionsQuery.isLoading}
                onClick={() => setReportModalOpen(true)}
                className="h-11 rounded-[1rem] bg-emerald-700 px-4 text-white shadow-[0_14px_28px_rgba(5,150,105,0.18)] hover:bg-emerald-800"
              >
                <Printer className="size-4" />
                Export Laporan
              </Button>
            </div>
            <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_2fr]">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Mata Pelajaran</label>
                <RadixSelectField
                  value={selectedAssignmentId}
                  onValueChange={setSelectedAssignmentId}
                  placeholder="Pilih mata pelajaran"
                  options={assignmentOptions}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Status</label>
                <RadixSelectField
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  placeholder="Semua status"
                  options={STATUS_OPTIONS}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Mode Tanggal</label>
                <DateFilterModeSwitch value={dateFilterMode} onChange={setDateFilterMode} />
              </div>

              {dateFilterMode === "single" ? (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Tanggal Tertentu</label>
                  <DatePickerButton
                    value={singleDate}
                    onChange={setSingleDate}
                    placeholder="Pilih tanggal"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Dari</label>
                    <DatePickerButton
                      value={rangeDateFrom}
                      onChange={setRangeDateFrom}
                      placeholder="Dari"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Sampai</label>
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
                Tanpa tanggal terpilih, sistem menampilkan semua data pada periode{" "}
                <span className="font-medium text-emerald-700">{periodeLabel}</span>.
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
            <section id="riwayat-sesi" className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
              <EmptyState icon={History} title="Riwayat belum bisa dimuat" description={sessionsQuery.error.message} />
            </section>
          ) : sessions.length === 0 ? (
            <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
              <EmptyState
                icon={BookOpenCheck}
                title="Belum ada sesi tercatat"
                description="Belum ada sesi yang tersimpan untuk mata pelajaran ini."
              />
            </section>
          ) : (
            <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
              <p className="mb-4 text-lg font-semibold text-slate-950">
                Sesi Mapel
                <span className="ml-2 text-sm font-normal text-slate-500">
                  ({sessions.length} sesi)
                </span>
              </p>
              <p className="-mt-2 mb-4 text-sm text-slate-500">
                Periode: <span className="font-medium text-emerald-700">{periodeLabel}</span>
                <span className="mx-2 text-slate-300">/</span>
                Status: <span className="font-medium text-slate-700">{statusLabel}</span>
              </p>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <th className="pb-3 pr-4">Tanggal</th>
                      <th className="pb-3 pr-4">Hari / Jam</th>
                      <th className="pb-3 pr-4">Konteks Mapel</th>
                      <th className="pb-3 pr-4">Topik</th>
                      <th className="pb-3 pr-4 text-center text-emerald-600">H</th>
                      <th className="pb-3 pr-4 text-center text-slate-600">I</th>
                      <th className="pb-3 pr-4 text-center text-sky-600">S</th>
                      <th className="pb-3 pr-4 text-center text-rose-600">A</th>
                      <th className="pb-3 pr-4 text-center">Status</th>
                      <th className="pb-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pagedSessions.map((sess, i) => {
                      const statusInfo = STATUS_MAP[sess.status] ?? {
                        label: sess.status,
                        cls: "bg-slate-100 text-slate-600",
                      };
                      return (
                        <motion.tr
                          key={sess.session_id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15, delay: i * 0.02 }}
                        >
                          <td className="py-3 pr-4 font-semibold text-slate-950">{formatDisplayDate(sess.tanggal)}</td>
                          <td className="py-3 pr-4 text-slate-600">
                            <span className="font-medium text-slate-800">{HARI_LABEL[sess.hari] ?? sess.hari}</span>
                            <span className="mt-0.5 block text-xs text-slate-500">{sess.jam_mulai}-{sess.jam_selesai}</span>
                          </td>
                          <td className="py-3 pr-4">
                            <p className="font-medium text-slate-900">{selectedAssignment?.subject_name ?? "Mapel"}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{selectedAssignment?.class_name ?? "Kelas belum dipilih"}</p>
                          </td>
                          <td className="max-w-[240px] py-3 pr-4 text-slate-600">
                            <span className="line-clamp-2">{sess.topic || "Belum ada topik"}</span>
                          </td>
                          <HistoryMetric value={sess.hadir} cls="text-emerald-700 bg-emerald-50" />
                          <HistoryMetric value={sess.izin} cls="text-slate-600 bg-slate-50" />
                          <HistoryMetric value={sess.sakit} cls="text-sky-700 bg-sky-50" />
                          <HistoryMetric value={sess.alfa} cls="text-rose-700 bg-rose-50" />
                          <td className="py-3 pr-4 text-center">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusInfo.cls}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <Link
                              href={`/dashboard/teacher/subject/session?session_id=${sess.session_id}`}
                              aria-label={`Lihat sesi ${formatDisplayDate(sess.tanggal)}`}
                              title="Lihat sesi"
                              className={`inline-flex items-center justify-center ${actionIconButtonClass("emerald")}`}
                            >
                              <Eye className="size-4" />
                            </Link>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {pagedSessions.map((sess, i) => {
                  const statusInfo = STATUS_MAP[sess.status] ?? {
                    label: sess.status,
                    cls: "bg-slate-100 text-slate-600",
                  };
                  return (
                    <motion.div
                      key={sess.session_id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: i * 0.03 }}
                      className="rounded-[1.35rem] border border-emerald-100/70 bg-white/80 p-4 shadow-[0_16px_34px_rgba(15,23,42,0.06)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                        <p className="font-semibold leading-6 text-slate-900">
                          {formatDisplayDate(sess.tanggal)}
                        </p>
                        <div className="mt-3">
                          <p className="text-sm font-medium leading-6 text-slate-900">{selectedAssignment?.subject_name ?? "Mapel"}</p>
                          <p className="text-xs leading-5 text-slate-500">{selectedAssignment?.class_name ?? "Kelas belum dipilih"}</p>
                        </div>
                        <p className="mt-0.5 text-xs leading-5 text-slate-500">
                          {HARI_LABEL[sess.hari] ?? sess.hari} · {sess.jam_mulai}–{sess.jam_selesai}
                        </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                            <HistoryMiniMetric label="H" value={sess.hadir} cls="text-emerald-700 bg-emerald-50" />
                            <HistoryMiniMetric label="I" value={sess.izin} cls="text-slate-600 bg-slate-50" />
                            <HistoryMiniMetric label="S" value={sess.sakit} cls="text-sky-700 bg-sky-50" />
                            <HistoryMiniMetric label="A" value={sess.alfa} cls="text-rose-700 bg-rose-50" />
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusInfo.cls}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="min-w-0 text-sm leading-6 text-slate-600">{sess.topic || "Belum ada topik"}</p>
                        <Link
                          href={`/dashboard/teacher/subject/session?session_id=${sess.session_id}`}
                          aria-label={`Lihat sesi ${formatDisplayDate(sess.tanggal)}`}
                          title="Lihat sesi"
                          className={`inline-flex shrink-0 items-center justify-center ${actionIconButtonClass("emerald")}`}
                        >
                          <Eye className="size-4" />
                        </Link>
                      </div>
                    </motion.div>
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
              assignment={selectedAssignment}
              sessions={sessions}
              periodeLabel={periodeLabel}
              statusLabel={statusLabel}
            />
          ) : null}
        </>
      )}
    </WalasShell>
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
  class_name: string;
  schedules: Array<{ hari: string; jam_mulai: string; jam_selesai: string; is_active: boolean }>;
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
    tanggal: string;
    hari: string;
    jam_mulai: string;
    jam_selesai: string;
    status: string;
  }>;
  activeSession: {
    session_id: string;
    assignment: { id: string; subject_name: string; class_name: string };
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
      className: activeSession.assignment.class_name,
      hari: activeSession.hari,
      jamMulai: activeSession.jam_mulai,
      jamSelesai: activeSession.jam_selesai,
      scheduledFor: today,
      scheduledAt: buildScheduleTimestamp(currentClock.date, activeSession.jam_mulai),
      sessionId: activeSession.session_id,
      state: "active",
      status: activeSession.status,
    };
  }

  const recordedToday = sessions.find((session) => session.tanggal === today);
  const selectedAssignment = assignments.find((assignment) => assignment.id === selectedAssignmentId);

  if (recordedToday && selectedAssignment) {
    return {
      assignmentId: selectedAssignment.id,
      subjectName: selectedAssignment.subject_name,
      className: selectedAssignment.class_name,
      hari: recordedToday.hari,
      jamMulai: recordedToday.jam_mulai,
      jamSelesai: recordedToday.jam_selesai,
      scheduledFor: today,
      scheduledAt: buildScheduleTimestamp(currentClock.date, recordedToday.jam_mulai),
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
  const threshold = focus?.state === "scheduled"
    ? focus.scheduledAt
    : currentClock.date.getTime();

  return buildUpcomingScheduleFocuses(assignments, currentClock).find((schedule) => schedule.scheduledAt > threshold) ?? null;
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
        if (daysAhead === 0 && normalizeTime(schedule.jam_selesai) < normalizeTime(currentClock.time)) {
          daysAhead = 7;
        }

        const scheduledDate = new Date(currentClock.date);
        scheduledDate.setDate(scheduledDate.getDate() + daysAhead);

        return [{
          assignmentId: assignment.id,
          subjectName: assignment.subject_name,
          className: assignment.class_name,
          hari: schedule.hari,
          jamMulai: schedule.jam_mulai,
          jamSelesai: schedule.jam_selesai,
          scheduledFor: format(scheduledDate, "yyyy-MM-dd"),
          scheduledAt: buildScheduleTimestamp(scheduledDate, schedule.jam_mulai),
          state: "scheduled" as const,
        }];
      }),
    )
    .sort((a, b) => a.scheduledAt - b.scheduledAt);
}

function TodaySessionCard({
  focus,
  nextSchedule,
}: {
  focus: TodaySessionFocus | null;
  nextSchedule: TodaySessionFocus | null;
}) {
  const focusHref = focus?.sessionId
    ? `/dashboard/teacher/subject/session?session_id=${focus.sessionId}`
    : focus
      ? `/dashboard/teacher/subject/history?assignment_id=${focus.assignmentId}`
      : "#riwayat-sesi";
  const stateCopy = focus?.state === "active"
    ? { eyebrow: "SEDANG BERLANGSUNG", title: "Sesi mapel aktif", badge: "Buka sekarang" }
    : focus?.state === "recorded"
      ? { eyebrow: "SUDAH TERCATAT HARI INI", title: "Tinjau hasil sesi", badge: "Lihat sesi" }
      : focus?.state === "scheduled"
        ? {
            eyebrow: focus.scheduledFor === format(new Date(), "yyyy-MM-dd") ? "JADWAL BERIKUTNYA HARI INI" : "JADWAL TERDEKAT",
            title: focus.scheduledFor === format(new Date(), "yyyy-MM-dd") ? "Sesi mapel hari ini" : "Siapkan sesi berikutnya",
            badge: "Lihat jadwal",
          }
        : { eyebrow: "AGENDA HARI INI", title: "Tidak ada sesi mapel hari ini", badge: "Lihat riwayat" };
  const focusDate = focus?.scheduledFor
    ? format(new Date(`${focus.scheduledFor}T00:00:00`), "EEEE, d MMMM yyyy", { locale: localeID })
    : format(new Date(), "EEEE, d MMMM yyyy", { locale: localeID });

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-emerald-200/80 bg-[linear-gradient(135deg,#effcf6_0%,#ffffff_58%,#f2fbf8_100%)] p-5 shadow-[0_24px_52px_rgba(15,118,110,0.11)] sm:p-6">
      <div className="pointer-events-none absolute -right-14 -top-20 size-52 rounded-full bg-emerald-200/25 blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[18px] bg-emerald-600 text-white shadow-[0_10px_22px_rgba(5,150,105,0.24)]">
            <BookOpenCheck className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">{stateCopy.eyebrow}</p>
              <span className="rounded-full border border-emerald-200 bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                {focusDate}
              </span>
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-slate-950">{stateCopy.title}</h2>
            {focus ? (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{focus.subjectName}</span>
                <span className="text-slate-300">•</span>
                <span>{focus.className}</span>
                <span className="text-slate-300">•</span>
                <span>{HARI_LABEL[focus.hari] ?? focus.hari}, {focus.jamMulai}–{focus.jamSelesai}</span>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Tidak ada jadwal yang perlu dibuka pada hari ini.</p>
            )}
          </div>
        </div>

        <div className="relative flex shrink-0 flex-wrap items-center gap-3 lg:justify-end">
          {focus?.status ? (
            <span className={`rounded-full px-3 py-2 text-xs font-semibold ${STATUS_MAP[focus.status]?.cls ?? "bg-slate-100 text-slate-600"}`}>
              {STATUS_MAP[focus.status]?.label ?? focus.status}
            </span>
          ) : null}
          <Link
            href={focusHref}
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-[16px] bg-emerald-700 px-4 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(5,150,105,0.2)] transition hover:bg-emerald-800"
          >
            {stateCopy.badge}
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>

      <div className="relative mt-5 border-t border-emerald-100/90 pt-4">
        <div className="flex flex-wrap items-center gap-3 rounded-[18px] border border-emerald-100 bg-white/70 px-3.5 py-3 sm:px-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[13px] bg-emerald-100 text-emerald-700">
            <CalendarClock className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Jadwal selanjutnya</p>
            {nextSchedule ? (
              <p className="mt-0.5 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{nextSchedule.subjectName}</span>
                <span className="mx-2 text-slate-300">•</span>
                <span>{nextSchedule.className}</span>
                <span className="mx-2 text-slate-300">•</span>
                <span className="font-medium text-slate-700">
                  {format(new Date(`${nextSchedule.scheduledFor}T00:00:00`), "EEEE, d MMM", { locale: localeID })}, {nextSchedule.jamMulai}–{nextSchedule.jamSelesai}
                </span>
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-slate-500">Belum ada jadwal lanjutan yang aktif.</p>
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

  const sortedDates = [...new Set(availableDates)].filter(Boolean).sort((a, b) => a.localeCompare(b));
  if (sortedDates.length === 1) return `Tanggal ${formatReportDate(sortedDates[0])}`;
  if (sortedDates.length > 1) {
    return `${formatReportDate(sortedDates[0])} - ${formatReportDate(sortedDates[sortedDates.length - 1])}`;
  }
  return "Belum ada tanggal tercatat";
}

function formatReportDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDisplayDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function getCurrentClock() {
  const now = new Date();
  return {
    day: ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"][now.getDay()],
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`,
    date: now,
  };
}

function isTimeWithinSchedule(currentTime: string, startTime: string, endTime: string) {
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
  return ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"].indexOf(day.toLowerCase());
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
    <td className="py-3 pr-4 text-center">
      <span className={`inline-flex min-w-8 justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${value > 0 ? cls : "bg-slate-50 text-slate-300"}`}>
        {value || "-"}
      </span>
    </td>
  );
}

function HistoryMiniMetric({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/70 px-2 py-2">
      <p className="text-[10px] font-bold text-slate-400">{label}</p>
      <p className={`mt-1 rounded-full px-1.5 py-0.5 font-semibold ${value > 0 ? cls : "bg-slate-50 text-slate-300"}`}>
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
        className="h-14 w-full justify-start rounded-[1.25rem] border-slate-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-3 text-left shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] transition-[border-color,box-shadow,background-color] hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_14px_30px_rgba(15,23,42,0.05)]"
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays className="size-4 shrink-0 text-emerald-600" />
          <span className={`truncate text-sm font-medium ${value ? "text-slate-700" : "text-slate-400"}`}>
            {value ? format(value, "d MMM yy", { locale: localeID }) : placeholder}
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
          onSelect={(date) => { onChange(date); setOpen(false); }}
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
        className={`h-full rounded-[1rem] px-2 text-xs font-semibold ${
          value === "single" ? "bg-emerald-600 !text-white hover:bg-emerald-700 hover:!text-white" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
        }`}
      >
        Tanggal
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => onChange("range")}
        className={`h-full rounded-[1rem] px-2 text-xs font-semibold ${
          value === "range" ? "bg-emerald-600 !text-white hover:bg-emerald-700 hover:!text-white" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
        }`}
      >
        Rentang
      </Button>
    </div>
  );
}
