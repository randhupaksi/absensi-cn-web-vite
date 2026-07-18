"use client";

import { AppLink as Link } from "@/components/router/app-link";
import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import { KpiCard } from "@/features/admin/dashboard/widgets/kpi-card";
import { StaffShell } from "@/features/staff/components/shell";
import { walasSidebarItems } from "@/features/staff/components/sidebar";
import {
  getBKDashboard,
  getTeacherHomeroomDashboard,
  getTeacherMe,
  getTeacherSubjectAssignments,
  getTeacherSubjectCurrentSession,
} from "@/services/staff.service";
import type {
  StaffBKDashboard,
  StaffHomeroomDashboard,
  StaffRiskStudentRecord,
} from "@/types/staff";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BellRing,
  BookHeart,
  BookOpenCheck,
  CalendarClock,
  ChartColumnBig,
  ChevronRight,
  ClipboardPenLine,
  Clock3,
  GraduationCap,
  History,
  LayoutPanelTop,
  ShieldAlert,
  SquareLibrary,
  Users,
  UsersRound,
} from "lucide-react";
import type { AuthSession } from "@/types/auth";
import { ChartSkeleton, ListRowsSkeleton, PageSkeleton } from "@/components/loading/loading-system";
import dynamic from "@/lib/dynamic";

const AttendanceDonutChart = dynamic(
  () =>
    import("@/features/admin/dashboard/charts/attendance-donut-chart").then(
      (module) => ({ default: module.AttendanceDonutChart }),
    ),
  { ssr: false, fallback: <ChartSkeleton type="donut" /> },
);

const HARI_LABEL: Record<string, string> = {
  senin: "Senin",
  selasa: "Selasa",
  rabu: "Rabu",
  kamis: "Kamis",
  jumat: "Jumat",
  sabtu: "Sabtu",
  minggu: "Minggu",
};

const fallbackHomeroom: StaffHomeroomDashboard = {
  homeroom: {
    assignment_id: "",
    teacher_id: "",
    class_id: "",
    class_name: "Kelas walas",
    school_year_id: "",
    school_year_name: "Tahun ajaran aktif",
    is_active: false,
  },
  total_students: 0,
  today: { present: 0, permission: 0, sick: 0, alpha: 0, repeated_alpha: [] },
  students_needing_attention: [],
  recent_submissions: [],
};

const fallbackBK: StaffBKDashboard = {
  total_students: 0,
  students_need_attention: 0,
  total_counseling_notes: 0,
  pending_submissions: 0,
  today: { present: 0, permission: 0, sick: 0, alpha: 0, repeated_alpha: [] },
  top_risk_students: [],
  recent_submissions: [],
  recent_counseling_notes: [],
  classes: [],
};

export function TeacherDashboardPage() {
  return (
    <StaffShell
      expectedRole="walas"
      sidebarItems={walasSidebarItems}
      userLabel="Guru"
      eyebrow="Ruang Kerja Guru"
      resolveTitle={(pathname) =>
        pathname === "/dashboard/teacher" ? "Dashboard Guru" : "Dashboard Guru"
      }
    >
      {(session) => <TeacherDashboardContent session={session} />}
    </StaffShell>
  );
}

function TeacherDashboardContent({ session }: { session: AuthSession }) {
  const now = new Date();
  const hari = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"][now.getDay()];
  const jam = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const teacherMeQuery = useQuery({
    queryKey: ["teacher-me"],
    queryFn: getTeacherMe,
    staleTime: 60_000,
  });
  const teacherMe = teacherMeQuery.data;
  const isHomeroomTeacher = teacherMe?.is_homeroom_teacher ?? false;
  const hasSubjectAssignments = teacherMe?.has_subject_assignments ?? false;
  const hasBKScope = session.user.has_bk_scope;

  const homeroomQuery = useQuery({
    queryKey: ["teacher-homeroom-dashboard"],
    queryFn: getTeacherHomeroomDashboard,
    enabled: isHomeroomTeacher,
    refetchInterval: 30_000,
    staleTime: 0,
  });
  const bkQuery = useQuery({
    queryKey: ["bk-dashboard"],
    queryFn: getBKDashboard,
    enabled: hasBKScope,
    refetchInterval: 30_000,
    staleTime: 0,
  });
  const assignmentsQuery = useQuery({
    queryKey: ["teacher-subject-assignments"],
    queryFn: getTeacherSubjectAssignments,
    enabled: hasSubjectAssignments,
    staleTime: 60_000,
  });
  const activeSessionQuery = useQuery({
    queryKey: ["subject-current-session", hari, jam],
    queryFn: () => getTeacherSubjectCurrentSession(hari, jam),
    enabled: hasSubjectAssignments,
    refetchInterval: 30_000,
    staleTime: 0,
  });

  if (teacherMeQuery.isLoading && !teacherMe) {
    return <PageSkeleton variant="dashboard" />;
  }

  const homeroom = normalizeHomeroom(homeroomQuery.data ?? fallbackHomeroom);
  const bk = normalizeBK(bkQuery.data ?? fallbackBK);
  const assignments = assignmentsQuery.data ?? [];
  const activeSession = activeSessionQuery.data ?? null;
  const attendance = hasBKScope ? bk.today : homeroom.today;
  const attendanceTotal = attendance.present + attendance.permission + attendance.sick + attendance.alpha;
  const attendancePercentage = attendanceTotal > 0 ? Math.round((attendance.present / attendanceTotal) * 100) : 0;
  const roleCount = Number(isHomeroomTeacher) + Number(hasSubjectAssignments) + Number(hasBKScope);
  const attentionCount = hasBKScope
    ? bk.students_need_attention
    : homeroom.today.repeated_alpha.length;
  const pendingCount = hasBKScope
    ? bk.pending_submissions
    : homeroom.recent_submissions.filter((item) => item.status.toLowerCase() === "pending").length;

  return (
    <>
      <section className="grid items-start gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <TeacherHero
          name={session.user.name}
          isHomeroomTeacher={isHomeroomTeacher}
          hasSubjectAssignments={hasSubjectAssignments}
          hasBKScope={hasBKScope}
          schoolYearName={homeroom.homeroom.school_year_name}
        />
        <AttendanceDonutChart
          present={attendance.present}
          permission={attendance.permission}
          sick={attendance.sick}
          alpha={attendance.alpha}
          percentage={attendancePercentage}
          title="Kehadiran Hari Ini"
          subtitle={hasBKScope ? "Snapshot lintas kelas yang dipantau BK" : "Snapshot kelas dan kehadiran hari ini"}
          badgeText="Hari ini"
        />
      </section>

      <section className="grid grid-cols-2 items-start gap-4 xl:grid-cols-4">
        <KpiCard label="Peran Aktif" value={String(roleCount)} subtitle="Walas, mapel, atau BK" icon={LayoutPanelTop} accentClass="bg-violet-100 text-violet-700" />
        <KpiCard label="Siswa Terpantau" value={String(hasBKScope ? bk.total_students : homeroom.total_students)} subtitle={hasBKScope ? "Lintas kelas dalam scope BK" : "Siswa kelas walas aktif"} icon={UsersRound} accentClass="bg-amber-100 text-amber-700" />
        <KpiCard label="Perlu Tindak Lanjut" value={String(attentionCount)} subtitle="Alfa atau prioritas pembinaan" icon={ShieldAlert} accentClass="bg-rose-100 text-rose-700" />
        <KpiCard label="Menunggu Review" value={String(pendingCount)} subtitle="Pengajuan izin dan sakit" icon={ClipboardPenLine} accentClass="bg-sky-100 text-sky-700" />
      </section>

      {hasSubjectAssignments && (
        <section className="grid items-start gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <ActiveSessionCard
            session={activeSession}
            isLoading={activeSessionQuery.isLoading}
            day={hari}
            time={jam}
          />
          <SubjectAssignmentsCard assignments={assignments} isLoading={assignmentsQuery.isLoading} errorMessage={assignmentsQuery.error?.message} />
        </section>
      )}

      {(isHomeroomTeacher || hasBKScope) && (
        <section className="grid items-start gap-5 xl:grid-cols-2">
          {isHomeroomTeacher && (
            <AttentionCard
              title="Prioritas Kelas Walas"
              subtitle="Alfa yang perlu dicek lebih dulu"
              students={homeroom.today.repeated_alpha}
              isLoading={homeroomQuery.isLoading}
              errorMessage={homeroomQuery.error?.message}
              href="/dashboard/teacher/homeroom/attendance"
              badge="Wali kelas"
            />
          )}
          {hasBKScope && (
            <AttentionCard
              title="Monitoring Prioritas BK"
              subtitle="Siswa dengan pola absensi yang membutuhkan tindak lanjut"
              students={bk.top_risk_students}
              isLoading={bkQuery.isLoading}
              errorMessage={bkQuery.error?.message}
              href="/dashboard/teacher/bk/students"
              badge="Lintas kelas"
            />
          )}
          {isHomeroomTeacher && (
            <SubmissionCard
              submissions={homeroom.recent_submissions}
              isLoading={homeroomQuery.isLoading}
              errorMessage={homeroomQuery.error?.message}
              href="/dashboard/teacher/homeroom/submissions"
              title="Pengajuan Kelas Terbaru"
              subtitle="Izin dan sakit dari siswa kelas walas"
            />
          )}
          {hasBKScope && (
            <CounselingCard
              dashboard={bk}
              isLoading={bkQuery.isLoading}
              errorMessage={bkQuery.error?.message}
            />
          )}
        </section>
      )}

      {!isHomeroomTeacher && !hasSubjectAssignments && !hasBKScope && !teacherMeQuery.isLoading && (
        <section className="rounded-[32px] border border-white/70 bg-white/88 p-6 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
          <EmptyState icon={GraduationCap} title="Ruang kerja belum memiliki assignment" description="Admin perlu menetapkan kelas walas, mata pelajaran, atau scope BK agar data operasional guru dapat ditampilkan." />
        </section>
      )}
    </>
  );
}

function TeacherHero({
  name,
  isHomeroomTeacher,
  hasSubjectAssignments,
  hasBKScope,
  schoolYearName,
}: {
  name: string;
  isHomeroomTeacher: boolean;
  hasSubjectAssignments: boolean;
  hasBKScope: boolean;
  schoolYearName: string;
}) {
  const roles = [
    isHomeroomTeacher && { icon: GraduationCap, label: "Wali kelas" },
    hasSubjectAssignments && { icon: BookOpenCheck, label: "Guru mapel" },
    hasBKScope && { icon: ShieldAlert, label: "Guru BK" },
  ].filter(Boolean) as Array<{ icon: typeof GraduationCap; label: string }>;
  const quickActions = [
    isHomeroomTeacher && { icon: Users, label: "Siswa Kelas", href: "/dashboard/teacher/homeroom/students" },
    isHomeroomTeacher && { icon: ClipboardPenLine, label: "Absensi Kelas", href: "/dashboard/teacher/homeroom/attendance" },
    hasSubjectAssignments && { icon: History, label: "Sesi Mapel", href: "/dashboard/teacher/subject/history" },
    hasSubjectAssignments && { icon: ChartColumnBig, label: "Rekap Mapel", href: "/dashboard/teacher/subject/recap" },
    hasBKScope && { icon: ShieldAlert, label: "Monitoring BK", href: "/dashboard/teacher/bk/students" },
    hasBKScope && { icon: BookHeart, label: "Konseling", href: "/dashboard/teacher/bk/counseling" },
  ].filter(Boolean) as Array<{ icon: typeof CalendarClock; label: string; href: string }>;

  return (
    <article className="h-fit self-start overflow-hidden rounded-[34px] border border-white/75 bg-[radial-gradient(circle_at_top_right,rgba(255,212,132,0.3),transparent_24%),linear-gradient(135deg,#fffdf9_0%,#f7f5ee_38%,#ebf8f0_100%)] p-5 shadow-[0_24px_60px_rgba(150,163,184,0.14)] md:p-6">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
          <LayoutPanelTop className="size-3.5" />
          Ruang Kerja Guru
        </div>
        <div>
          <p className="text-3xl font-semibold tracking-tight text-slate-950 md:text-[2.1rem]">Halo, {name}!</p>
          <p className="mt-2.5 max-w-2xl text-sm leading-7 text-slate-600 md:text-[15px]">Satu pusat kendali untuk memantau kelas, menjalankan sesi mapel, dan menindaklanjuti kebutuhan siswa sesuai peran akunmu.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {roles.length > 0 ? roles.map(({ icon: Icon, label }) => <HeroChip key={label} icon={Icon} label={label} />) : <HeroChip icon={CalendarClock} label="Menunggu assignment" />}
          <HeroChip icon={SquareLibrary} label={schoolYearName || "Tahun ajaran aktif"} />
        </div>
        {quickActions.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 pt-1 xl:grid-cols-3">
            {quickActions.map(({ icon: Icon, label, href }) => (
              <Link
                key={href}
                href={href}
                className="group flex min-h-14 items-center justify-between gap-2 rounded-[20px] border border-white/80 bg-white/74 px-3 py-3 text-xs font-semibold text-slate-700 shadow-[0_12px_26px_rgba(15,23,42,0.05)] transition hover:border-emerald-200 hover:bg-emerald-50/80 hover:text-emerald-800 sm:gap-3 sm:px-3.5 sm:text-sm"
              >
                <span className="inline-flex min-w-0 items-center gap-2 sm:gap-2.5">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-100 sm:size-9">
                    <Icon className="size-4 sm:size-4.5" />
                  </span>
                  <span className="truncate">{label}</span>
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-700" />
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function HeroChip({ icon: Icon, label }: { icon: typeof CalendarClock; label: string }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/78 px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm"><Icon className="size-3.5 text-emerald-600" />{label}</span>;
}

function ActiveSessionCard({ session, isLoading, day, time }: { session: Awaited<ReturnType<typeof getTeacherSubjectCurrentSession>>; isLoading: boolean; day: string; time: string }) {
  return (
    <article className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xl font-semibold text-slate-950">Sesi Mapel Saat Ini</p><p className="mt-1 text-sm text-slate-500">Akses daftar hadir saat jam pelajaran sedang berjalan</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Live</span></div>
      <div className="mt-5">
        {isLoading ? <ListRowsSkeleton rows={1} /> : session ? (
          <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/60 p-4"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="font-semibold text-slate-900">{session.assignment.subject_name}</p><p className="mt-1 text-sm text-slate-500">{session.assignment.class_name} · {HARI_LABEL[session.hari] ?? session.hari}, {session.jam_mulai}–{session.jam_selesai}</p>{session.topic && <p className="mt-3 text-sm text-slate-600">{session.topic}</p>}</div><CalendarClock className="size-5 shrink-0 text-emerald-700" /></div><Link href={`/dashboard/teacher/subject/session?session_id=${session.session_id}`} className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">Buka daftar hadir<ArrowUpRight className="size-4" /></Link></div>
        ) : <EmptyState icon={Clock3} title="Tidak ada sesi aktif" description={`${HARI_LABEL[day] ?? day}, ${time}. Sesi mapel yang berjalan akan tampil di sini.`} compact />}
      </div>
    </article>
  );
}

function SubjectAssignmentsCard({
  assignments,
  isLoading,
  errorMessage,
}: {
  assignments: Awaited<ReturnType<typeof getTeacherSubjectAssignments>>;
  isLoading: boolean;
  errorMessage?: string;
}) {
  return (
    <article className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xl font-semibold text-slate-950">Mata Pelajaran Saya</p>
          <p className="mt-1 text-sm text-slate-500">Kelas dan jadwal mengajar yang aktif</p>
        </div>
        <Link
          href="/dashboard/teacher/subject/recap"
          className="rounded-full bg-violet-50 p-2.5 text-violet-700 transition hover:bg-violet-100"
          aria-label="Buka rekap mata pelajaran"
        >
          <ChartColumnBig className="size-4" />
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        {errorMessage ? (
          <EmptyState icon={BookOpenCheck} title="Mapel belum bisa dimuat" description={errorMessage} compact />
        ) : isLoading ? (
          <ListRowsSkeleton rows={4} />
        ) : assignments.length === 0 ? (
          <EmptyState icon={BookOpenCheck} title="Belum ada mapel aktif" description="Assignment mata pelajaran akan muncul setelah ditetapkan admin." compact />
        ) : (
          assignments.slice(0, 4).map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/teacher/subject/history?assignment_id=${item.id}`}
              className="group flex items-center justify-between gap-3 rounded-[22px] border border-slate-100 bg-slate-50/95 p-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/70 hover:shadow-[0_16px_34px_rgba(15,23,42,0.08)]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 transition group-hover:text-emerald-900">
                  {item.subject_name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.class_name} · {item.schedules.length} jadwal
                </p>
              </div>
              <span
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-white text-emerald-700 transition group-hover:border-emerald-200 group-hover:bg-emerald-100 group-hover:text-emerald-900"
                aria-hidden="true"
              >
                <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))
        )}
      </div>
    </article>
  );
}

function AttentionCard({ title, subtitle, students, isLoading, errorMessage, href, badge }: { title: string; subtitle: string; students: StaffRiskStudentRecord[]; isLoading: boolean; errorMessage?: string; href: string; badge: string }) {
  return <article className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]"><div className="flex items-start justify-between gap-4"><div><p className="text-xl font-semibold text-slate-950">{title}</p><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div><span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">{badge}</span></div><div className="mt-5 space-y-3">{errorMessage ? <EmptyState icon={ShieldAlert} title="Data prioritas belum bisa dimuat" description={errorMessage} compact /> : isLoading ? <ListRowsSkeleton rows={4} /> : students.length === 0 ? <EmptyState icon={ShieldAlert} title="Belum ada prioritas" description="Siswa dengan pola alfa berulang akan muncul di panel ini." compact /> : students.slice(0, 4).map((item) => <div key={item.student_id} className="flex items-center justify-between gap-3 rounded-[22px] border border-slate-100 bg-slate-50/95 p-3.5"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{item.student_name}</p><p className="mt-1 text-xs text-slate-500">{item.nis} · {item.class_name}</p></div><span className="shrink-0 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">{item.occurrences}x</span></div>)}</div><MoreLink href={href} label="Buka monitoring" /></article>;
}

function SubmissionCard({ submissions, isLoading, errorMessage, href, title, subtitle }: { submissions: StaffHomeroomDashboard["recent_submissions"]; isLoading: boolean; errorMessage?: string; href: string; title: string; subtitle: string }) {
  return <article className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]"><div className="flex items-start justify-between gap-4"><div><p className="text-xl font-semibold text-slate-950">{title}</p><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div><BellRing className="size-5 text-sky-600" /></div><div className="mt-5 space-y-3">{errorMessage ? <EmptyState icon={BellRing} title="Pengajuan belum bisa dimuat" description={errorMessage} compact /> : isLoading ? <ListRowsSkeleton rows={4} /> : submissions.length === 0 ? <EmptyState icon={BellRing} title="Belum ada pengajuan" description="Pengajuan izin dan sakit baru akan muncul di sini." compact /> : submissions.slice(0, 4).map((item) => <div key={item.id} className="rounded-[22px] border border-slate-100 bg-slate-50/95 p-3.5"><div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-semibold text-slate-900">{item.student_name}</p><span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold uppercase text-sky-700">{item.type}</span></div><p className="mt-1 text-xs text-slate-500">{item.class_name ?? "Kelas"} · {item.status}</p></div>)}</div><MoreLink href={href} label="Buka pengajuan" /></article>;
}

function CounselingCard({ dashboard, isLoading, errorMessage }: { dashboard: StaffBKDashboard; isLoading: boolean; errorMessage?: string }) {
  return <article className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]"><div className="flex items-start justify-between gap-4"><div><p className="text-xl font-semibold text-slate-950">Catatan Pembinaan</p><p className="mt-1 text-sm text-slate-500">Riwayat konseling terbaru dalam scope BK</p></div><BookHeart className="size-5 text-emerald-600" /></div><div className="mt-5 space-y-3">{errorMessage ? <EmptyState icon={BookHeart} title="Catatan belum bisa dimuat" description={errorMessage} compact /> : isLoading ? <ListRowsSkeleton rows={4} /> : dashboard.recent_counseling_notes.length === 0 ? <EmptyState icon={BookHeart} title="Belum ada catatan pembinaan" description="Catatan konseling yang dibuat akan tampil di panel ini." compact /> : dashboard.recent_counseling_notes.slice(0, 4).map((item) => <div key={item.id} className="rounded-[22px] border border-slate-100 bg-slate-50/95 p-3.5"><p className="truncate text-sm font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.student_name} · {item.class_name ?? "Kelas"}</p><p className="mt-2 line-clamp-1 text-xs leading-5 text-slate-500">{item.note}</p></div>)}</div><MoreLink href="/dashboard/teacher/bk/counseling" label="Buka catatan konseling" /></article>;
}

function MoreLink({ href, label }: { href: string; label: string }) { return <Link href={href} className="group mx-auto mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/60 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-100/80 hover:text-emerald-900"><span>{label}</span><ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>; }

function normalizeHomeroom(dashboard: StaffHomeroomDashboard): StaffHomeroomDashboard { return { ...dashboard, today: { ...dashboard.today, repeated_alpha: dashboard.today?.repeated_alpha ?? [] }, recent_submissions: dashboard.recent_submissions ?? [] }; }
function normalizeBK(dashboard: StaffBKDashboard): StaffBKDashboard { return { ...dashboard, today: { ...dashboard.today, repeated_alpha: dashboard.today?.repeated_alpha ?? [] }, top_risk_students: dashboard.top_risk_students ?? [], recent_counseling_notes: dashboard.recent_counseling_notes ?? [] }; }
