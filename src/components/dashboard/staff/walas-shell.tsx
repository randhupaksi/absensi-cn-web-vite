"use client";

import { getTeacherMe } from "@/services/staff.service";
import { useQuery } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { StaffShell } from "./staff-shell";
import { buildWalasSidebarItems } from "./staff-sidebar";
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
  if (pathname === "/dashboard/walas") return "Homeroom Dashboard";
  if (pathname.startsWith("/dashboard/walas/students")) return "Class Students Dashboard";
  if (pathname.startsWith("/dashboard/walas/attendance")) return "Class Attendance Dashboard";
  if (pathname.startsWith("/dashboard/walas/submissions")) return "Submission Review Dashboard";
  if (pathname.startsWith("/dashboard/walas/mapel/history")) return "Riwayat Sesi Mapel";
  if (pathname.startsWith("/dashboard/walas/mapel/recap")) return "Rekap Kehadiran Mapel";
  if (pathname.startsWith("/dashboard/walas/mapel/session")) return "Sesi Mapel Aktif";
  if (pathname.startsWith("/dashboard/walas/mapel")) return "Daftar Hadir Mapel";
  return "Dashboard";
}
