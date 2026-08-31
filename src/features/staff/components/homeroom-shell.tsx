"use client";

/* oxlint-disable react/only-export-components -- The shell and its route-title resolver form one public feature contract. */

import type { ReactNode } from "react";
import { StaffShell } from "./shell";
import { buildWalasSidebarItems } from "./sidebar";
import type { AuthSession } from "@/types/auth";

type WalasShellProps = {
  children: (session: AuthSession) => ReactNode;
};

const walasSidebarItems = buildWalasSidebarItems({
  isHomeroomTeacher: false,
  hasSubjectAssignments: false,
});

export function WalasShell({ children }: WalasShellProps) {
  return (
    <StaffShell
      expectedRole="walas"
      sidebarItems={walasSidebarItems}
      userLabel="Guru"
      surfaceClassName="staff-walas-surface"
      resolveTitle={resolveWalasSectionTitle}
    >
      {children}
    </StaffShell>
  );
}

export function resolveWalasSectionTitle(pathname: string): string {
  if (
    pathname === "/dashboard/teacher" ||
    pathname === "/dashboard/teacher/homeroom"
  )
    return "Dashboard Guru";
  if (pathname.startsWith("/dashboard/teacher/homeroom/students"))
    return "Siswa Kelas";
  if (pathname.startsWith("/dashboard/teacher/homeroom/attendance"))
    return "Kehadiran Kelas";
  if (pathname.startsWith("/dashboard/teacher/homeroom/submissions"))
    return "Tinjauan Pengajuan";
  if (pathname.startsWith("/dashboard/teacher/subject/schedule"))
    return "Jadwal Mengajar";
  if (pathname.startsWith("/dashboard/teacher/subject/history"))
    return "Sesi Mapel";
  if (pathname.startsWith("/dashboard/teacher/subject/recap"))
    return "Rekap Kehadiran Mapel";
  if (pathname.startsWith("/dashboard/teacher/subject/session"))
    return "Sesi Mapel";
  if (pathname.startsWith("/dashboard/teacher/subject"))
    return "Daftar Hadir Mapel";
  return "Dashboard";
}
