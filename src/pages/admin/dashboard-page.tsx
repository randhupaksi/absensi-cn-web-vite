"use client";

import { getAdminDashboard } from "@/services/admin.service";
import type { AdminDashboardData } from "@/types/admin";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  BookOpenCheck,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";
import dynamic from "@/lib/dynamic";
import { useState } from "react";
import { AdminShell } from "@/features/admin/shell/shell";
import { GreetingCard } from "@/features/admin/dashboard/widgets/greeting-card";
import { KpiCard } from "@/features/admin/dashboard/widgets/kpi-card";
import { AnnouncementCard } from "@/features/admin/dashboard/widgets/announcement-card";
import { RoleDistributionTable } from "@/features/admin/dashboard/widgets/role-distribution-table";

const AttendanceDonutChart = dynamic(
  () =>
    import("@/features/admin/dashboard/charts/attendance-donut-chart").then(
      (m) => ({ default: m.AttendanceDonutChart }),
    ),
  { ssr: false },
);

const SemesterAttendanceChart = dynamic(
  () =>
    import("@/features/admin/dashboard/charts/semester-attendance-chart").then(
      (m) => ({ default: m.SemesterAttendanceChart }),
    ),
  { ssr: false },
);

const ClassPerformanceChart = dynamic(
  () =>
    import("@/features/admin/dashboard/charts/class-performance-chart").then(
      (m) => ({ default: m.ClassPerformanceChart }),
    ),
  { ssr: false },
);

const fallbackDashboard: AdminDashboardData = {
  attendance_percentage: 0,
  counts: {
    total_users: 0,
    total_students: 0,
    total_teachers: 0,
    total_bk: 0,
    total_admins: 0,
  },
  today_status: {
    present: 0,
    late: 0,
    permission: 0,
    sick: 0,
    alpha: 0,
  },
  semester_trend: [
    { label: "Jul", present: 0, late: 0, alpha: 0 },
    { label: "Agu", present: 0, late: 0, alpha: 0 },
    { label: "Sep", present: 0, late: 0, alpha: 0 },
    { label: "Okt", present: 0, late: 0, alpha: 0 },
    { label: "Nov", present: 0, late: 0, alpha: 0 },
    { label: "Des", present: 0, late: 0, alpha: 0 },
  ],
  class_performance: [
    { class_name: "X PPLG 1", percentage: 0, present_text: "0/0 hadir" },
    { class_name: "X PPLG 2", percentage: 0, present_text: "0/0 hadir" },
    { class_name: "XI PPLG 1", percentage: 0, present_text: "0/0 hadir" },
    { class_name: "XI PPLG 2", percentage: 0, present_text: "0/0 hadir" },
  ],
  announcements: [],
};

export function AdminDashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboard,
  });

  const dashboard = dashboardQuery.data ?? fallbackDashboard;
  const todayStatus = dashboard.today_status;
  const todayTotal =
    (todayStatus.present ?? 0) +
    (todayStatus.late ?? 0) +
    (todayStatus.permission ?? 0) +
    (todayStatus.sick ?? 0) +
    (todayStatus.alpha ?? 0);
  const todayPositive =
    (todayStatus.present ?? 0) +
    (todayStatus.late ?? 0) +
    (todayStatus.permission ?? 0) +
    (todayStatus.sick ?? 0);
  const todayAttendancePercentage =
    todayTotal > 0 ? Math.round((todayPositive / todayTotal) * 100) : 0;

  const kpiCards = [
    {
      label: "Total Siswa",
      value: String(dashboard.counts.total_students ?? 0),
      subtitle: "Akun siswa aktif di sistem",
      icon: Users,
      accentClass: "bg-amber-100 text-amber-700",
    },
    {
      label: "Total Guru",
      value: String(dashboard.counts.total_teachers ?? 0),
      subtitle: "Guru dan wali kelas terdaftar",
      icon: GraduationCap,
      accentClass: "bg-sky-100 text-sky-700",
    },
    {
      label: "Total Admin",
      value: String(dashboard.counts.total_admins ?? 0),
      subtitle: "Pengelola sistem aktif",
      icon: ShieldCheck,
      accentClass: "bg-rose-100 text-rose-700",
    },
    {
      label: "Kehadiran Hari Ini",
      value: `${todayAttendancePercentage}%`,
      subtitle: "Persentase hadir dari data hari ini",
      icon: BookOpenCheck,
      accentClass: "bg-emerald-100 text-emerald-700",
    },
  ];

  return (
    <AdminShell searchTerm={searchTerm} onSearchChange={setSearchTerm}>
      {(session) => (
        <>
          <section className="grid items-start gap-5 xl:grid-cols-[1.45fr_0.78fr]">
            <div className="space-y-5">
              <GreetingCard adminName={session.user.name} />

              <div className="grid items-start gap-4 sm:grid-cols-2">
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
              </div>

              <RoleDistributionTable
                totalUsers={dashboard.counts.total_users ?? 0}
                rows={[
                  {
                    label: "Siswa",
                    count: dashboard.counts.total_students ?? 0,
                    caption: "Akun portal siswa",
                    colorClass: "bg-amber-400",
                    barClass: "bg-amber-400",
                  },
                  {
                    label: "Guru",
                    count: dashboard.counts.total_teachers ?? 0,
                    caption: "Pengajar dan walas",
                    colorClass: "bg-sky-400",
                    barClass: "bg-sky-400",
                  },
                  {
                    label: "Penempatan BK",
                    count: dashboard.counts.total_bk ?? 0,
                    caption: "Guru dengan capability BK",
                    colorClass: "bg-emerald-400",
                    barClass: "bg-emerald-400",
                  },
                  {
                    label: "Admin",
                    count: dashboard.counts.total_admins ?? 0,
                    caption: "Pengelola sistem",
                    colorClass: "bg-rose-400",
                    barClass: "bg-rose-400",
                  },
                ]}
              />
            </div>

            <div className="space-y-5 self-start">
              <AttendanceDonutChart
                present={dashboard.today_status.present ?? 0}
                late={dashboard.today_status.late ?? 0}
                permission={dashboard.today_status.permission ?? 0}
                sick={dashboard.today_status.sick ?? 0}
                alpha={dashboard.today_status.alpha ?? 0}
                percentage={todayAttendancePercentage}
              />
              <AnnouncementCard announcements={dashboard.announcements} />
            </div>
          </section>

          <section className="grid items-start gap-5 xl:grid-cols-[1.15fr_0.95fr]">
            <SemesterAttendanceChart data={dashboard.semester_trend ?? []} />
            <ClassPerformanceChart data={dashboard.class_performance ?? []} />
          </section>
        </>
      )}
    </AdminShell>
  );
}
