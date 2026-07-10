"use client";

import { EmptyState } from "@/components/dashboard/admin/widgets/empty-state";
import { KpiCard } from "@/components/dashboard/admin/widgets/kpi-card";
import { AttendanceDonutChart } from "@/components/dashboard/admin/charts/attendance-donut-chart";
import { WalasShell } from "@/components/dashboard/staff/walas-shell";
import { getTeacherHomeroomDashboard } from "@/services/staff.service";
import type { StaffHomeroomDashboard, StaffRiskStudentRecord } from "@/types/staff";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  BellRing,
  BookOpenCheck,
  CalendarClock,
  ClipboardPenLine,
  Clock3,
  ShieldAlert,
  Users,
} from "lucide-react";

const fallbackDashboard: StaffHomeroomDashboard = {
  homeroom: {
    assignment_id: "",
    teacher_id: "",
    class_id: "",
    class_name: "Belum ada kelas walas",
    school_year_id: "",
    school_year_name: "Tahun ajaran belum tersedia",
    is_active: false,
  },
  total_students: 0,
  today: {
    present: 0,
    late: 0,
    permission: 0,
    sick: 0,
    alpha: 0,
    repeated_late: [],
    repeated_alpha: [],
  },
  students_needing_attention: [],
  recent_submissions: [],
};

export function WalasDashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ["teacher-homeroom-dashboard"],
    queryFn: getTeacherHomeroomDashboard,
    refetchInterval: 30_000,
    staleTime: 0,
  });

  const dashboard = normalizeHomeroomDashboard(
    dashboardQuery.data ?? fallbackDashboard,
  );
  const totalAttendanceToday =
    dashboard.today.present +
    dashboard.today.late +
    dashboard.today.permission +
    dashboard.today.sick +
    dashboard.today.alpha;
  const attendancePercentage =
    totalAttendanceToday > 0
      ? Math.round((dashboard.today.present / totalAttendanceToday) * 100)
      : 0;
  const pendingSubmissions = dashboard.recent_submissions.filter(
    (item) => item.status?.toLowerCase() === "pending",
  ).length;

  const kpiCards = [
    {
      label: "Total Siswa",
      value: String(dashboard.total_students ?? 0),
      subtitle: "Siswa aktif di kelas walas",
      icon: Users,
      accentClass: "bg-amber-100 text-amber-700",
    },
    {
      label: "Hadir Hari Ini",
      value: String(dashboard.today.present ?? 0),
      subtitle: "Siswa hadir tepat waktu",
      icon: BookOpenCheck,
      accentClass: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Terlambat",
      value: String(dashboard.today.late ?? 0),
      subtitle: "Perlu ditinjau wali kelas",
      icon: Clock3,
      accentClass: "bg-orange-100 text-orange-700",
    },
    {
      label: "Pengajuan Pending",
      value: String(pendingSubmissions),
      subtitle: "Izin atau sakit menunggu review",
      icon: ClipboardPenLine,
      accentClass: "bg-sky-100 text-sky-700",
    },
  ];

  const attentionStudents = [
    ...dashboard.today.repeated_alpha.map((item) => ({ ...item, tone: "ALFA" as const })),
    ...dashboard.today.repeated_late.map((item) => ({ ...item, tone: "TELAT" as const })),
  ].slice(0, 6);

  return (
    <WalasShell>
      {(session) => (
        <>
          <section className="grid items-start gap-5 xl:grid-cols-[1.25fr_0.75fr]">
            <HomeroomHeroCard
              teacherName={session.user.name}
              schoolYearName={dashboard.homeroom.school_year_name}
              totalStudents={dashboard.total_students}
              isActive={dashboard.homeroom.is_active}
            />

            <AttendanceDonutChart
              present={dashboard.today.present}
              late={dashboard.today.late}
              permission={dashboard.today.permission}
              sick={dashboard.today.sick}
              alpha={dashboard.today.alpha}
              percentage={attendancePercentage}
              title="Kehadiran Kelas Hari Ini"
              subtitle={`Snapshot absensi ${dashboard.homeroom.class_name || "kelas walas"} hari ini`}
              badgeText="Hari ini"
            />
          </section>

          <section className="grid grid-cols-2 items-start gap-4 xl:grid-cols-4">
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

          <section className="grid items-start gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <HomeroomAttentionCard
              students={attentionStudents}
              isLoading={dashboardQuery.isLoading}
              errorMessage={dashboardQuery.error?.message}
            />
            <HomeroomSubmissionCard
              submissions={dashboard.recent_submissions}
              isLoading={dashboardQuery.isLoading}
              errorMessage={dashboardQuery.error?.message}
            />
          </section>
        </>
      )}
    </WalasShell>
  );
}
type HomeroomHeroCardProps = {
  teacherName: string;
  schoolYearName: string;
  totalStudents: number;
  isActive: boolean;
};

function HomeroomHeroCard({
  teacherName,
  schoolYearName,
  totalStudents,
  isActive,
}: HomeroomHeroCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: "easeOut" }}
      className="overflow-hidden rounded-[34px] border border-white/75 bg-[radial-gradient(circle_at_top_right,rgba(255,212,132,0.32),transparent_24%),linear-gradient(135deg,#fffdf9_0%,#f6f4ea_42%,#ecf8f0_100%)] p-6 shadow-[0_24px_60px_rgba(150,163,184,0.14)]"
    >
      <div className="grid items-center gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-3xl font-semibold tracking-tight text-slate-950 md:text-[2.1rem]">
              Halo, {teacherName}!
            </p>
            <p className="max-w-xl text-sm leading-7 text-slate-600 md:text-[15px]">
              Pantau kelas walas, cek kehadiran siswa, dan tindak lanjuti
              pengajuan harian dari dashboard yang lebih fokus untuk operasional
              wali kelas.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <HeroChip icon={CalendarClock} label={schoolYearName || "Tahun ajaran aktif"} />
            <HeroChip
              icon={Users}
              label={`${totalStudents} siswa terhubung`}
            />
            <HeroChip
              icon={ShieldAlert}
              label={isActive ? "Walas aktif" : "Walas belum aktif"}
            />
          </div>
        </div>

        <div className="relative min-h-[294px] overflow-hidden rounded-[30px] border border-emerald-300/70 bg-[linear-gradient(180deg,#e8fbf0_0%,#d9f5e4_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_18px_40px_rgba(74,151,112,0.16)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(110,224,165,0.14),transparent_58%)]" />
          <div className="absolute left-8 top-9 h-18 w-18 rounded-[28px] bg-emerald-300/95 shadow-[0_10px_24px_rgba(52,173,116,0.22)]" />
          <div className="absolute bottom-10 left-18 h-18 w-18 rounded-[30px] border-[12px] border-slate-300/90 border-b-transparent border-l-transparent rotate-12" />
          <div className="absolute bottom-8 right-10 h-26 w-12 rounded-full bg-[#ff9c3b]" />
          <div className="absolute right-12 top-15 h-15 w-9 rounded-full bg-[#21335d]" />
          <div className="absolute right-16 top-8 h-10 w-10 rounded-full bg-[#ffd2b6]" />
          <div className="absolute inset-x-10 bottom-5 h-3 rounded-full bg-emerald-400/35 blur-lg" />
        </div>
      </div>
    </motion.article>
  );
}

function HeroChip({
  icon: Icon,
  label,
}: {
  icon: typeof CalendarClock;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/78 px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm">
      <Icon className="size-3.5 text-emerald-600" />
      {label}
    </span>
  );
}

function HomeroomAttentionCard({
  students,
  isLoading,
  errorMessage,
}: {
  students: Array<StaffRiskStudentRecord & { tone: "ALFA" | "TELAT" }>;
  isLoading: boolean;
  errorMessage?: string;
}) {
  return (
    <article className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xl font-semibold text-slate-950">Siswa Perlu Perhatian</p>
          <p className="mt-1 text-sm text-slate-500">
            Sorotan telat dan alfa yang perlu ditindaklanjuti walas hari ini
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          Fokus hari ini
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {errorMessage ? (
          <EmptyState
            icon={ShieldAlert}
            title="Data walas belum bisa dimuat"
            description={errorMessage}
          />
        ) : isLoading ? (
          <EmptyState
            icon={ShieldAlert}
            title="Menyiapkan ringkasan perhatian"
            description="Dashboard sedang memuat daftar telat dan alfa kelas walas."
          />
        ) : students.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="Belum ada siswa yang perlu perhatian"
            description="Jika ada telat atau alfa di kelas walas hari ini, daftar akan muncul di sini."
          />
        ) : (
          students.map((item, index) => (
            <motion.article
              key={`${item.student_id}-${item.tone}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="rounded-[24px] border border-slate-100 bg-slate-50/95 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.student_name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {item.nis} • {item.class_name}
                  </p>
                  <p className="text-sm leading-6 text-slate-500">
                    Perlu pengecekan lanjutan untuk status kehadiran hari ini.
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    item.tone === "ALFA"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {item.tone}
                </span>
              </div>
            </motion.article>
          ))
        )}
      </div>
    </article>
  );
}

function HomeroomSubmissionCard({
  submissions,
  isLoading,
  errorMessage,
}: {
  submissions: StaffHomeroomDashboard["recent_submissions"];
  isLoading: boolean;
  errorMessage?: string;
}) {
  return (
    <article className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xl font-semibold text-slate-950">Pengajuan Terbaru</p>
          <p className="mt-1 text-sm text-slate-500">
            Izin dan sakit terbaru dari siswa kelas walas
          </p>
        </div>
        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
          Review cepat
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {errorMessage ? (
          <EmptyState
            icon={BellRing}
            title="Pengajuan belum bisa dimuat"
            description={errorMessage}
          />
        ) : isLoading ? (
          <EmptyState
            icon={BellRing}
            title="Menyiapkan daftar pengajuan"
            description="Dashboard sedang memuat izin dan sakit terbaru dari siswa."
          />
        ) : submissions.length === 0 ? (
          <EmptyState
            icon={BellRing}
            title="Belum ada pengajuan terbaru"
            description="Pengajuan izin atau sakit dari siswa akan muncul di panel ini."
          />
        ) : (
          submissions.slice(0, 5).map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="rounded-[24px] border border-slate-100 bg-slate-50/95 p-4"
            >
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <BellRing className="size-4" />
                </span>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.student_name}
                    </p>
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-medium uppercase text-slate-600">
                      {item.type}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium uppercase ${getSubmissionStatusTone(
                        item.status,
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {item.nis} • {item.class_name || "Kelas belum tersedia"}
                  </p>
                  <p className="line-clamp-2 text-sm leading-6 text-slate-500">
                    {item.reason}
                  </p>
                </div>
              </div>
            </motion.article>
          ))
        )}
      </div>
    </article>
  );
}

function getSubmissionStatusTone(status: string) {
  switch (status.toLowerCase()) {
    case "approved":
    case "diterima":
      return "bg-emerald-100 text-emerald-700";
    case "rejected":
    case "ditolak":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

function normalizeHomeroomDashboard(
  dashboard: StaffHomeroomDashboard,
): StaffHomeroomDashboard {
  return {
    ...dashboard,
    today: {
      ...dashboard.today,
      repeated_late: dashboard.today?.repeated_late ?? [],
      repeated_alpha: dashboard.today?.repeated_alpha ?? [],
    },
    students_needing_attention: dashboard.students_needing_attention ?? [],
    recent_submissions: dashboard.recent_submissions ?? [],
  };
}
