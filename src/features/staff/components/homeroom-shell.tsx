"use client";

import { getTeacherMe } from "@/services/staff.service";
import { useQuery } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { StaffShell } from "./shell";
import { buildWalasSidebarItems } from "./sidebar";
import type { AuthSession } from "@/types/auth";

type WalasShellProps = {
  children: (session: AuthSession) => ReactNode;
};

export function WalasShell({ children }: WalasShellProps) {
  const teacherMeQuery = useQuery({
    queryKey: ["teacher-me"],
    queryFn: getTeacherMe,
    staleTime: 60_000,
  });

  const sidebarItems = useMemo(
    () =>
      buildWalasSidebarItems({
        isHomeroomTeacher: teacherMeQuery.data?.is_homeroom_teacher ?? false,
        hasSubjectAssignments: teacherMeQuery.data?.has_subject_assignments ?? false,
      }),
    [teacherMeQuery.data],
  );

  return (
    <StaffShell
      expectedRole="walas"
      sidebarItems={sidebarItems}
      userLabel="Guru"
      resolveTitle={resolveWalasSectionTitle}
    >
      {children}
    </StaffShell>
  );
}

export function resolveWalasSectionTitle(pathname: string): string {
  if (pathname === "/dashboard/teacher" || pathname === "/dashboard/teacher/homeroom") return "Dashboard Guru";
  if (pathname.startsWith("/dashboard/teacher/homeroom/students")) return "Class Students Dashboard";
  if (pathname.startsWith("/dashboard/teacher/homeroom/attendance")) return "Class Attendance Dashboard";
  if (pathname.startsWith("/dashboard/teacher/homeroom/submissions")) return "Submission Review Dashboard";
  if (pathname.startsWith("/dashboard/teacher/subject/history")) return "Riwayat Sesi Mapel";
  if (pathname.startsWith("/dashboard/teacher/subject/recap")) return "Rekap Kehadiran Mapel";
  if (pathname.startsWith("/dashboard/teacher/subject/session")) return "Sesi Mapel";
  if (pathname.startsWith("/dashboard/teacher/subject")) return "Daftar Hadir Mapel";
  return "Dashboard";
}
