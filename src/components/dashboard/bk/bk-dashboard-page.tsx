"use client";

import { AttendanceDonutChart } from "@/components/dashboard/admin/charts/attendance-donut-chart";
import { EmptyState } from "@/components/dashboard/admin/widgets/empty-state";
import { KpiCard } from "@/components/dashboard/admin/widgets/kpi-card";
import { StaffShell } from "@/components/dashboard/staff/staff-shell";
import { bkSidebarItems } from "@/components/dashboard/staff/staff-sidebar";
import { getBKDashboard } from "@/services/staff.service";
import type { StaffBKDashboard, StaffRiskStudentRecord } from "@/types/staff";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { AppLink as Link } from "@/components/router/app-link";
import {
  ArrowUpRight,
  BellRing,
  BookHeart,
  ClipboardPenLine,
  LayoutPanelTop,
  ShieldAlert,
  SquareLibrary,
  UsersRound,
} from "lucide-react";

const fallbackDashboard: StaffBKDashboard = {
  total_students: 0,
  students_need_attention: 0,
  total_counseling_notes: 0,
  pending_submissions: 0,
  today: {
    present: 0,
    late: 0,
    permission: 0,
    sick: 0,
    alpha: 0,
    repeated_late: [],
    repeated_alpha: [],
  },
  top_risk_students: [],
  recent_submissions: [],
  recent_counseling_notes: [],
  classes: [],
};

export function BKDashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ["bk-dashboard"],
    queryFn: getBKDashboard,
    refetchInterval: 30_000,
    staleTime: 0,
  });

  const dashboard = normalizeDashboard(dashboardQuery.data ?? fallbackDashboard);
  const todaySummary = dashboard.today;
  const totalAttendanceToday =
    todaySummary.present +
    todaySummary.late +
    todaySummary.permission +
    todaySummary.sick +
    todaySummary.alpha;
  const attendancePercentage =
    totalAttendanceToday > 0
      ? Math.round((todaySummary.present / totalAttendanceToday) * 100)
      : 0;

  const kpiCards = [
    {
      label: "Total Siswa",
      value: String(dashboard.total_students),
      subtitle: "Siswa aktif terhubung",
      icon: UsersRound,
      accentClass: "bg-amber-100 text-amber-700",
    },
    {
      label: "Perlu Perhatian",
      value: String(dashboard.students_need_attention),
      subtitle: "Risiko lintas kelas",
      icon: ShieldAlert,
      accentClass: "bg-rose-100 text-rose-700",
    },
    {
      label: "Catatan BK",
      value: String(dashboard.total_counseling_notes),
      subtitle: "Riwayat pembinaan aktif",
      icon: BookHeart,
      accentClass: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Pengajuan Pending",
      value: String(dashboard.pending_submissions),
      subtitle: "Menunggu tindak lanjut",
      icon: ClipboardPenLine,
      accentClass: "bg-sky-100 text-sky-700",
    },
  ];

  return (
    <StaffShell
      expectedRole="bk"
      sidebarItems={bkSidebarItems}
      userLabel="Guru BK"
      resolveTitle={getBKSectionTitle}
    >
      {(session) => (
        <>
          <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <motion.article
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden rounded-[34px] border border-white/75 bg-[radial-gradient(circle_at_top_right,rgba(255,212,132,0.3),transparent_24%),linear-gradient(135deg,#fffdf9_0%,#f7f5ee_38%,#ebf8f0_100%)] p-6 shadow-[0_24px_60px_rgba(150,163,184,0.14)]"
            >
              <div className="grid items-center gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-5">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
                      <LayoutPanelTop className="size-3.5" />
                      BK Operations Workspace
                    </div>
                    <p className="text-3xl font-semibold tracking-tight text-slate-950 md:text-[2.1rem]">
                      Halo, {session.user.name}!
                    </p>
                    <p className="max-w-xl text-sm leading-7 text-slate-600 md:text-[15px]">
                      Pantau siswa lintas kelas, tangani absensi berulang, dan
                      simpan catatan pembinaan dari satu dashboard BK yang lebih
                      fokus untuk tindak lanjut.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <HeroChip
                      icon={SquareLibrary}
                      label={`${dashboard.classes.length} kelas aktif`}
                    />
                    <HeroChip
                      icon={ShieldAlert}
                      label={`${dashboard.students_need_attention} siswa prioritas`}
                    />
                    <HeroChip
                      icon={BellRing}
                      label={`${dashboard.pending_submissions} pengajuan pending`}
                    />
                  </div>
                </div>

                <div className="relative min-h-[290px] overflow-hidden rounded-[30px] border border-emerald-300/70 bg-[linear-gradient(180deg,#e8fbf0_0%,#d9f5e4_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_18px_40px_rgba(74,151,112,0.16)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(110,224,165,0.14),transparent_58%)]" />
                  <div className="absolute left-8 top-10 h-18 w-18 rounded-[28px] bg-emerald-300/95 shadow-[0_10px_24px_rgba(52,173,116,0.22)]" />
                  <div className="absolute right-10 top-9 h-12 w-12 rounded-full bg-[#ffd2b6]" />
                  <div className="absolute right-10 top-19 h-20 w-10 rounded-full bg-[#21335d]" />
                  <div className="absolute bottom-10 right-10 h-20 w-14 rounded-[26px] bg-[#ff9c3b]" />
                  <div className="absolute bottom-12 left-14 h-18 w-18 rounded-[30px] border-[12px] border-slate-300/90 border-b-transparent border-l-transparent rotate-12" />
                  <div className="absolute inset-x-10 bottom-5 h-3 rounded-full bg-emerald-400/35 blur-lg" />
                </div>
              </div>
            </motion.article>

            <AttendanceDonutChart
              present={todaySummary.present}
              late={todaySummary.late}
              permission={todaySummary.permission}
              sick={todaySummary.sick}
              alpha={todaySummary.alpha}
              percentage={attendancePercentage}
              title="Kehadiran Hari Ini"
              subtitle="Snapshot absensi seluruh kelas hari ini"
              badgeText="Hari ini"
            />
          </section>

          <section className="grid gap-4 grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.24,
                  delay: index * 0.04,
                  ease: "easeOut",
                }}
              >
                <KpiCard {...item} />
              </motion.div>
            ))}
          </section>

          <section className="grid items-start gap-5 xl:grid-cols-[1fr_1fr]">
            <BKFocusCard
              students={dashboard.top_risk_students}
              isLoading={dashboardQuery.isLoading}
              errorMessage={dashboardQuery.error?.message}
            />
            <BKCounselingCard
              notes={dashboard.recent_counseling_notes}
              isLoading={dashboardQuery.isLoading}
              errorMessage={dashboardQuery.error?.message}
            />
          </section>

          <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-semibold text-slate-950">Pengajuan Terbaru</p>
                <p className="mt-1 text-sm text-slate-500">
                  Izin, sakit, dan dispensasi terbaru yang perlu diketahui BK
                </p>
              </div>
              <Link
                href="/dashboard/bk/submissions"
                className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(236,253,245,0.96)_100%)] px-4 py-2 text-xs font-semibold text-emerald-800 shadow-[0_12px_24px_rgba(16,185,129,0.1),inset_0_1px_0_rgba(255,255,255,0.95)] transition-[border-color,box-shadow,background-color,color] hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-950 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.14),0_14px_28px_rgba(15,23,42,0.06)]"
              >
                Lihat Selengkapnya
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {dashboardQuery.error ? (
                <EmptyState
                  icon={BellRing}
                  title="Pengajuan belum bisa dimuat"
                  description={dashboardQuery.error.message}
                  compact
                />
              ) : dashboardQuery.isLoading ? (
                <EmptyState
                  icon={BellRing}
                  title="Memuat pengajuan BK"
                  description="Daftar pengajuan lintas kelas sedang disiapkan."
                  compact
                />
              ) : dashboard.recent_submissions.length === 0 ? (
                <EmptyState
                  icon={BellRing}
                  title="Belum ada pengajuan"
                  description="Pengajuan siswa yang relevan untuk BK akan tampil di sini."
                  compact
                />
              ) : (
                dashboard.recent_submissions.slice(0, 6).map((item, index) => (
                  <motion.article
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="rounded-[24px] border border-slate-100 bg-slate-50/95 p-4"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {item.student_name}
                        </p>
                        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {item.nis} • {item.class_name || "Kelas belum tersedia"}
                      </p>
                      <p className="line-clamp-2 text-sm leading-6 text-slate-500">
                        {item.reason}
                      </p>
                    </div>
                  </motion.article>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </StaffShell>
  );
}

function HeroChip({
  icon: Icon,
  label,
}: {
  icon: typeof SquareLibrary;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/78 px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm">
      <Icon className="size-3.5 text-emerald-600" />
      {label}
    </span>
  );
}

function BKFocusCard({
  students,
  isLoading,
  errorMessage,
}: {
  students: StaffRiskStudentRecord[];
  isLoading: boolean;
  errorMessage?: string;
}) {
  const visibleStudents = students.slice(0, 5);

  return (
    <article className="self-start rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xl font-semibold text-slate-950">Fokus BK</p>
          <p className="mt-1 text-sm text-slate-500">
            Siswa lintas kelas dengan pola telat atau alfa berulang
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          Prioritas
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {errorMessage ? (
          <EmptyState
            icon={ShieldAlert}
            title="Data risiko BK belum bisa dimuat"
            description={errorMessage}
            compact
          />
        ) : isLoading ? (
          <EmptyState
            icon={ShieldAlert}
            title="Menyiapkan daftar prioritas"
            description="Siswa yang perlu perhatian BK sedang dimuat."
            compact
          />
        ) : visibleStudents.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="Belum ada siswa prioritas"
            description="Siswa dengan pola absensi berulang akan tampil di panel ini."
            compact
          />
        ) : (
          visibleStudents.map((item, index) => (
            <motion.article
              key={`${item.student_id}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="rounded-[24px] border border-slate-100 bg-slate-50/95 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.student_name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {item.nis} • {item.class_name}
                  </p>
                </div>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                  {item.occurrences} kali
                </span>
              </div>
            </motion.article>
          ))
        )}
      </div>

      <DashboardMoreLink href="/dashboard/bk/students" label="Lihat detail fokus siswa" />
    </article>
  );
}

function BKCounselingCard({
  notes,
  isLoading,
  errorMessage,
}: {
  notes: StaffBKDashboard["recent_counseling_notes"];
  isLoading: boolean;
  errorMessage?: string;
}) {
  const visibleNotes = notes.slice(0, 3);

  return (
    <article className="self-start rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xl font-semibold text-slate-950">Catatan Pembinaan</p>
          <p className="mt-1 text-sm text-slate-500">
            Riwayat konseling terbaru yang dicatat oleh tim BK
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          Aktif
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {errorMessage ? (
          <EmptyState
            icon={BookHeart}
            title="Catatan BK belum bisa dimuat"
            description={errorMessage}
            compact
          />
        ) : isLoading ? (
          <EmptyState
            icon={BookHeart}
            title="Memuat catatan konseling"
            description="Riwayat pembinaan terbaru sedang disiapkan."
            compact
          />
        ) : visibleNotes.length === 0 ? (
          <EmptyState
            icon={BookHeart}
            title="Belum ada catatan pembinaan"
            description="Catatan konseling baru akan tampil setelah dicatat tim BK."
            compact
          />
        ) : (
          visibleNotes.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="rounded-[24px] border border-slate-100 bg-slate-50/95 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.student_name} • {item.class_name || "Kelas belum tersedia"}
                  </p>
                  <p className="line-clamp-2 text-sm leading-6 text-slate-500">
                    {item.note}
                  </p>
                </div>
                <BookHeart className="size-4.5 shrink-0 text-emerald-600" />
              </div>
            </motion.article>
          ))
        )}
      </div>

      <DashboardMoreLink href="/dashboard/bk/counseling" label="Buka semua catatan pembinaan" />
    </article>
  );
}

function DashboardMoreLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group mx-auto mt-4 inline-flex w-fit items-center justify-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/60 px-4 py-2 text-sm font-semibold text-emerald-700 transition-[border-color,background-color,color,box-shadow] hover:border-emerald-400 hover:bg-emerald-100/80 hover:text-emerald-900 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
    >
      {label}
      <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}

function normalizeDashboard(dashboard: StaffBKDashboard): StaffBKDashboard {
  return {
    ...dashboard,
    today: {
      ...dashboard.today,
      repeated_late: dashboard.today?.repeated_late ?? [],
      repeated_alpha: dashboard.today?.repeated_alpha ?? [],
    },
    top_risk_students: dashboard.top_risk_students ?? [],
    recent_submissions: dashboard.recent_submissions ?? [],
    recent_counseling_notes: dashboard.recent_counseling_notes ?? [],
    classes: dashboard.classes ?? [],
  };
}

function getBKSectionTitle(pathname: string) {
  if (pathname === "/dashboard/bk") return "BK Dashboard";
  if (pathname.startsWith("/dashboard/bk/students")) return "Student Monitoring Dashboard";
  if (pathname.startsWith("/dashboard/bk/attendance")) return "Attendance Review Dashboard";
  if (pathname.startsWith("/dashboard/bk/counseling")) return "Counseling Notes Dashboard";
  if (pathname.startsWith("/dashboard/bk/submissions")) return "Submission Monitoring Dashboard";
  return "BK Dashboard";
}
