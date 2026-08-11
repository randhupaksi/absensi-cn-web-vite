import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import { WalasShell } from "@/features/staff/components/homeroom-shell";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { AppLink as Link } from "@/components/router/app-link";
import dynamic from "@/lib/dynamic";
import {
  getTeacherSubjectAssignments,
  getTeacherSubjectCurrentSession,
  getTeacherSubjectScheduleDayStatus,
} from "@/services/staff.service";
import type { StaffSubjectAssignment } from "@/types/staff";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { ArrowUpRight, BookOpenCheck, CalendarDays, CalendarOff, Clock3, GraduationCap, Layers3, Printer, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { RadixSelectField } from "@/components/ui/radix-select";

const HARI_LABEL: Record<string, string> = {
  senin: "Senin", selasa: "Selasa", rabu: "Rabu", kamis: "Kamis",
  jumat: "Jumat", sabtu: "Sabtu", minggu: "Minggu",
};

const SubjectScheduleReportModal = dynamic(
  () => import("@/features/reports/subject/schedule-report-modal").then((module) => module.SubjectScheduleReportModal),
  { ssr: false },
);

type ScheduleTicket = {
  id: string;
  assignment: StaffSubjectAssignment;
  scheduleIds: string[];
  classId: string;
  className: string;
  date: Date;
  day: string;
  start: string;
  end: string;
  state: "active" | "upcoming" | "completed";
};

export function MapelSchedulePage() {
  const [dayFilter, setDayFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const currentDay = getDayKey(now);
  const currentTime = format(now, "HH:mm");

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

  const activeSessionQuery = useQuery({
    queryKey: ["teacher-subject-current-session", currentDay, currentTime],
    queryFn: () => getTeacherSubjectCurrentSession(currentDay, currentTime),
    enabled: assignmentsQuery.isSuccess && !isHoliday,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const assignments = assignmentsQuery.data ?? [];
  const allTickets = buildScheduleTickets(assignments, now).filter(
    (ticket) => !isHoliday || format(ticket.date, "yyyy-MM-dd") !== today,
  );
  const activeSession = activeSessionQuery.data ?? null;
  const activeAssignments = assignments.filter((assignment) => assignment.is_active);
  const tickets = allTickets.filter((ticket) =>
    (dayFilter === "all" || ticket.day === dayFilter)
    && (classFilter === "all" || ticket.classId === classFilter),
  );
  const classFilterOptions = useMemo(() => {
    const classes = new Map<string, string>();
    activeAssignments.forEach((assignment) => {
      assignment.schedules
        .filter((schedule) => schedule.is_active)
        .forEach((schedule) => classes.set(schedule.class_id, schedule.class_name));
    });
    return [...classes.entries()]
      .sort((first, second) => first[1].localeCompare(second[1], "id"))
      .map(([value, label]) => ({ value, label }));
  }, [activeAssignments]);
  const dayFilterOptions = Object.entries(HARI_LABEL).map(([value, label]) => ({ value, label }));
  const activeSubjectCount = new Set(activeAssignments.map((assignment) => assignment.subject_id)).size;
  const activeClassCount = new Set(
    activeAssignments.flatMap((assignment) => assignment.schedules
      .filter((schedule) => schedule.is_active)
      .map((schedule) => `${schedule.class_id}:${assignment.school_year_id}`)),
  ).size;
  const teachingDayCount = new Set(tickets.map((ticket) => ticket.day)).size;

  return (
    <WalasShell>
      {(session) => assignmentsQuery.isLoading && !assignmentsQuery.data ? (
        <SchedulePageSkeleton />
      ) : assignmentsQuery.error ? (
        <section className="rounded-[32px] border border-white/70 bg-white/88 p-6 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
          <EmptyState icon={CalendarDays} title="Jadwal belum bisa dimuat" description={assignmentsQuery.error.message} />
        </section>
      ) : (
        <div className="space-y-5">
          <BackButton href="/dashboard/teacher/subject/history" label="Kembali ke Sesi Mapel" />
          <section className="relative overflow-hidden rounded-[32px] border border-emerald-200/80 bg-[linear-gradient(135deg,#effcf6_0%,#ffffff_58%,#f2fbf8_100%)] p-5 shadow-[0_24px_52px_rgba(15,118,110,0.11)] sm:p-6">
            <div className="pointer-events-none absolute -right-10 -top-24 size-60 rounded-full bg-emerald-200/30 blur-3xl" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
                  <CalendarDays className="size-3.5" />
                  Jadwal Mengajar
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-[2.1rem]">Ritme mengajarmu minggu ini.</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                  Lihat semua jadwal aktif, pantau sesi terdekat, lalu masuk ke ticket absensi ketika kelas sudah dimulai.
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <ScheduleKpi icon={BookOpenCheck} label="Mapel Aktif" value={activeSubjectCount} tone="emerald" />
            <ScheduleKpi icon={Users} label="Kelas Terjadwal" value={activeClassCount} tone="sky" />
            <ScheduleKpi icon={Layers3} label="Sesi Mingguan" value={tickets.length} tone="violet" />
            <ScheduleKpi
              icon={CalendarDays}
              label="Hari Mengajar"
              value={teachingDayCount}
              detail="dalam 7 hari"
              tone="amber"
            />
          </section>

          {allTickets.length === 0 ? (
            <section className="rounded-[32px] border border-white/70 bg-white/88 p-6 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
              <EmptyState icon={CalendarDays} title="Belum ada jadwal aktif" description="Jadwal mengajar akan muncul setelah admin menautkan mata pelajaran dan slot waktu yang aktif." />
            </section>
          ) : (
            <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)] sm:p-6">
              <div className="mb-6 space-y-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">Agenda 7 Hari</p>
                  <h3 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-slate-950">Ticket jadwal mapel</h3>
                </div>
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="grid w-full min-w-0 flex-1 grid-cols-2 gap-3 sm:min-w-[440px]">
                    <RadixSelectField
                      value={dayFilter}
                      onValueChange={setDayFilter}
                      options={[{ value: "all", label: "Semua hari" }, ...dayFilterOptions]}
                      placeholder="Filter hari"
                      triggerClassName="h-14 rounded-[22px] pl-4"
                    />
                    <RadixSelectField
                      value={classFilter}
                      onValueChange={setClassFilter}
                      options={[{ value: "all", label: "Semua kelas" }, ...classFilterOptions]}
                      placeholder="Filter kelas"
                      triggerClassName="h-14 rounded-[22px] pl-4"
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={tickets.length === 0}
                    onClick={() => setReportModalOpen(true)}
                    className="h-14 w-full shrink-0 rounded-[1rem] bg-emerald-700 px-4 text-white shadow-[0_14px_28px_rgba(5,150,105,0.18)] hover:bg-emerald-800 hover:!shadow-none focus:!border-emerald-700 focus:!bg-emerald-700 focus:!text-white focus:!ring-emerald-300/70 active:!bg-emerald-800 sm:w-auto"
                  >
                    <Printer className="size-4" />
                    Export Jadwal
                  </Button>
                </div>
              </div>

              {isHoliday ? (
                <div className="mb-6 flex items-center gap-3 rounded-[20px] border border-amber-200/80 bg-amber-50/70 px-4 py-3.5 text-sm text-amber-900">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[14px] bg-white text-amber-700 shadow-[0_8px_18px_rgba(180,83,9,0.08)]">
                    <CalendarOff className="size-4" />
                  </span>
                  <p className="leading-6">
                    <span className="font-semibold">Hari ini libur{holidayName ? `: ${holidayName}` : ""}.</span>{" "}
                    Ticket presensi hari ini tidak tersedia.
                  </p>
                </div>
              ) : null}

              <div className="mb-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {groupSchedulesBySubject(activeAssignments).map((group) => (
                  <div key={group.subjectId} className="min-w-0 rounded-[18px] border border-emerald-100/80 bg-emerald-50/45 px-3.5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-slate-900">{group.subjectName}</p>
                      <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">{group.classes.length} kelas</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">{group.classes.map((item) => item.name).join(" · ")}</p>
                  </div>
                ))}
              </div>

              {tickets.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title="Tidak ada jadwal yang cocok"
                  description="Coba ubah filter hari atau kelas untuk melihat ticket lainnya."
                />
              ) : (
                <div className="space-y-6">
                  {groupTicketsByDate(tickets).map(([dateKey, dayTickets]) => (
                  <div key={dateKey} className={`rounded-[28px] border border-l-4 p-3.5 sm:p-4 ${getDayGroupTone(dayTickets[0].date).wrapper}`}>
                    <div className="mb-3 flex items-center gap-3">
                      <span className={`flex size-10 shrink-0 flex-col items-center justify-center rounded-[14px] ${getDayGroupTone(dayTickets[0].date).dateBadge}`}>
                        <span className="text-[10px] font-bold uppercase leading-none">{format(dayTickets[0].date, "MMM", { locale: localeID })}</span>
                        <span className="mt-0.5 text-sm font-bold leading-none">{format(dayTickets[0].date, "d")}</span>
                      </span>
                      <div>
                        <p className={`text-sm font-semibold ${getDayGroupTone(dayTickets[0].date).heading}`}>{format(dayTickets[0].date, "EEEE, d MMMM", { locale: localeID })}</p>
                        <p className="text-xs text-slate-500">{dayTickets.length} ticket jadwal</p>
                      </div>
                      {dateKey === today ? <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Hari ini</span> : null}
                    </div>
                    <div className="grid gap-3 xl:grid-cols-2">
                      {dayTickets.map((ticket) => (
                        <ScheduleTicketCard
                          key={ticket.id}
                          ticket={ticket}
                          sessionId={
                            ticket.state === "active" && activeSession?.assignment.id === ticket.assignment.id
                              && ticket.scheduleIds.includes(activeSession.schedule_id)
                              ? activeSession.session_id
                              : null
                          }
                        />
                      ))}
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {reportModalOpen ? (
            <SubjectScheduleReportModal
              open={reportModalOpen}
              onOpenChange={setReportModalOpen}
              teacherName={session.user.name}
              assignments={activeAssignments}
              dayFilter={dayFilter}
              classFilter={classFilter}
            />
          ) : null}
        </div>
      )}
    </WalasShell>
  );
}

function getDayGroupTone(date: Date) {
  const tones = [
    { wrapper: "border-slate-300 bg-slate-100/75 border-l-slate-500", dateBadge: "bg-slate-200 text-slate-700", heading: "text-slate-900", icon: "text-slate-600" },
    { wrapper: "border-emerald-300 bg-emerald-100/70 border-l-emerald-500", dateBadge: "bg-emerald-200 text-emerald-800", heading: "text-emerald-950", icon: "text-emerald-700" },
    { wrapper: "border-sky-300 bg-sky-100/70 border-l-sky-500", dateBadge: "bg-sky-200 text-sky-800", heading: "text-sky-950", icon: "text-sky-700" },
    { wrapper: "border-violet-300 bg-violet-100/65 border-l-violet-500", dateBadge: "bg-violet-200 text-violet-800", heading: "text-violet-950", icon: "text-violet-700" },
    { wrapper: "border-amber-300 bg-amber-100/70 border-l-amber-500", dateBadge: "bg-amber-200 text-amber-800", heading: "text-amber-950", icon: "text-amber-700" },
    { wrapper: "border-cyan-300 bg-cyan-100/70 border-l-cyan-500", dateBadge: "bg-cyan-200 text-cyan-800", heading: "text-cyan-950", icon: "text-cyan-700" },
    { wrapper: "border-indigo-300 bg-indigo-100/65 border-l-indigo-500", dateBadge: "bg-indigo-200 text-indigo-800", heading: "text-indigo-950", icon: "text-indigo-700" },
  ];
  return tones[date.getDay()] ?? tones[0];
}

function ScheduleKpi({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof BookOpenCheck;
  label: string;
  value: number | string;
  detail?: string;
  tone: "emerald" | "sky" | "violet" | "amber";
}) {
  const tones = {
    emerald: "bg-emerald-100 text-emerald-700",
    sky: "bg-sky-100 text-sky-700",
    violet: "bg-violet-100 text-violet-700",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <article className="min-w-0 rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-[0_16px_34px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-slate-400">{label}</p>
          <div className="mt-2 flex min-w-0 items-baseline gap-2">
            <p className="shrink-0 truncate text-2xl font-bold tracking-[-0.03em] text-slate-950">{value}</p>
            {detail ? <p className="min-w-0 truncate text-xs text-slate-500">{detail}</p> : null}
          </div>
        </div>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-[14px] ${tones[tone]}`}><Icon className="size-4.5" /></span>
      </div>
    </article>
  );
}

function ScheduleTicketCard({ ticket, sessionId }: { ticket: ScheduleTicket; sessionId: string | null }) {
  const state = {
    active: { label: "Sedang berlangsung", cls: "bg-emerald-100 text-emerald-700", description: "Ticket absensi sudah siap dibuka." },
    upcoming: { label: "Akan datang", cls: "bg-sky-100 text-sky-700", description: "Ticket dapat dibuka saat jam pelajaran dimulai." },
    completed: { label: "Selesai", cls: "bg-slate-100 text-slate-600", description: "Slot jadwal hari ini telah berakhir." },
  }[ticket.state];

  return (
    <article className={`rounded-[24px] border p-4 transition sm:p-5 ${ticket.state === "active" ? "border-emerald-200 bg-emerald-50/70 shadow-[0_16px_34px_rgba(5,150,105,0.10)]" : "border-slate-100 bg-slate-50/45"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-slate-950">{ticket.assignment.subject_name}</span>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${state.cls}`}>{state.label}</span>
          </div>
          <p className="mt-1.5 text-sm text-slate-600">{ticket.className} · {ticket.assignment.school_year_name}</p>
        </div>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-white shadow-[0_8px_20px_rgba(15,23,42,0.06)] ${getDayGroupTone(ticket.date).icon}`}><GraduationCap className="size-4.5" /></span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200/70 pt-3.5">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800"><Clock3 className="size-4 text-emerald-600" />{ticket.start}–{ticket.end}</p>
          <p className="mt-1 text-xs text-slate-500">{state.description}</p>
        </div>
        {ticket.state === "active" && sessionId ? (
          <Link
            href={`/dashboard/teacher/subject/session?session_id=${sessionId}`}
            className="group inline-flex h-10 shrink-0 items-center gap-2 rounded-[14px] bg-emerald-700 px-3.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(5,150,105,0.18)] transition hover:bg-emerald-800"
          >
            Masuk
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        ) : (
          <span title={state.description} className="inline-flex h-10 shrink-0 cursor-not-allowed items-center gap-2 rounded-[14px] bg-white px-3.5 text-sm font-semibold text-slate-400 ring-1 ring-slate-200">Masuk<ArrowUpRight className="size-4" /></span>
        )}
      </div>
    </article>
  );
}

function buildScheduleTickets(assignments: StaffSubjectAssignment[], now: Date): ScheduleTicket[] {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Array.from({ length: 7 }, (_, dayOffset) => {
    const date = new Date(startOfToday);
    date.setDate(startOfToday.getDate() + dayOffset);
    const day = getDayKey(date);
    return assignments.flatMap((assignment) => {
      if (!assignment.is_active) return [];

      const schedules = assignment.schedules
        .filter((schedule) => schedule.is_active && schedule.hari.toLowerCase() === day)
        .sort((first, second) => normalizeTime(first.jam_mulai).localeCompare(normalizeTime(second.jam_mulai)));
      const sessions: Array<{ start: string; end: string; sourceIds: string[]; classId: string; className: string }> = [];

      schedules.forEach((schedule) => {
        const start = normalizeTime(schedule.jam_mulai);
        const end = normalizeTime(schedule.jam_selesai);
        const current = sessions[sessions.length - 1];

        // Back-to-back slots are one teaching session from the user's point of view.
        if (current && current.end === start && current.classId === schedule.class_id) {
          current.end = end;
          current.sourceIds.push(schedule.id);
        } else {
          sessions.push({
            start,
            end,
            sourceIds: [schedule.id],
            classId: schedule.class_id,
            className: schedule.class_name,
          });
        }
      });

      return sessions.map((session) => ({
        id: `${assignment.id}-${session.sourceIds.join("-")}-${format(date, "yyyy-MM-dd")}`,
        assignment,
        scheduleIds: session.sourceIds,
        classId: session.classId,
        className: session.className,
        date,
        day,
        start: session.start,
        end: session.end,
        state: getTicketState(date, session.start, session.end, now),
      }));
    });
  }).flat().sort((first, second) => first.date.getTime() - second.date.getTime() || first.start.localeCompare(second.start));
}

function getTicketState(date: Date, start: string, end: string, now: Date): ScheduleTicket["state"] {
  const startAt = buildDateTime(date, start);
  const endAt = buildDateTime(date, end);
  if (now >= startAt && now <= endAt) return "active";
  return now > endAt ? "completed" : "upcoming";
}

function buildDateTime(date: Date, time: string) {
  const [hours, minutes] = normalizeTime(time).split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function normalizeTime(value: string) {
  return value.slice(0, 5);
}

function getDayKey(date: Date) {
  return ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"][date.getDay()];
}

function groupTicketsByDate(tickets: ScheduleTicket[]) {
  const groups = new Map<string, ScheduleTicket[]>();
  tickets.forEach((ticket) => {
    const key = format(ticket.date, "yyyy-MM-dd");
    groups.set(key, [...(groups.get(key) ?? []), ticket]);
  });
  return [...groups.entries()];
}

function groupSchedulesBySubject(assignments: StaffSubjectAssignment[]) {
  const groups = new Map<string, { subjectId: string; subjectName: string; classes: Array<{ id: string; name: string }> }>();
  assignments.forEach((assignment) => {
    const current = groups.get(assignment.subject_id) ?? {
      subjectId: assignment.subject_id,
      subjectName: assignment.subject_name,
      classes: [],
    };
    assignment.schedules.filter((schedule) => schedule.is_active).forEach((schedule) => {
      if (!current.classes.some((item) => item.id === schedule.class_id)) {
        current.classes.push({ id: schedule.class_id, name: schedule.class_name });
      }
    });
    groups.set(assignment.subject_id, current);
  });
  return [...groups.values()].filter((group) => group.classes.length > 0);
}

function SchedulePageSkeleton() {
  return <div className="space-y-5"><div className="h-52 animate-pulse rounded-[32px] bg-slate-100" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-[24px] bg-slate-100" />)}</div><div className="h-96 animate-pulse rounded-[32px] bg-slate-100" /></div>;
}
