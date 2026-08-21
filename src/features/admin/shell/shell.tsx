"use client";

import type { AuthSession } from "@/types/auth";
import type { ReactNode } from "react";
import { adminSidebarItems } from "@/features/staff/components/sidebar";
import { StaffShell } from "@/features/staff/components/shell";

type AdminShellProps = {
  children: (session: AuthSession) => ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  return (
    <StaffShell
      expectedRole="admin"
      sidebarItems={adminSidebarItems}
      userLabel="Administrator"
      resolveTitle={getAdminSectionTitle}
      surfaceClassName="admin-workspace"
    >
      {children}
    </StaffShell>
  );
}

function getAdminSectionTitle(pathname: string) {
  if (pathname === "/dashboard/admin") return "Dashboard Admin";
  if (pathname.startsWith("/dashboard/admin/analytics")) {
    return "Analitik Kehadiran";
  }
  if (pathname.startsWith("/dashboard/admin/teachers")) {
    return "Manajemen Guru";
  }
  if (pathname.startsWith("/dashboard/admin/subjects")) {
    return "Manajemen Mapel";
  }
  if (pathname.startsWith("/dashboard/admin/students")) {
    return "Manajemen Siswa";
  }
  if (pathname.startsWith("/dashboard/admin/classes")) {
    return "Manajemen Kelas";
  }
  if (pathname.startsWith("/dashboard/admin/holidays")) {
    return "Kalender Hari Libur";
  }
  if (pathname.startsWith("/dashboard/admin/users")) {
    return "Manajemen Peran";
  }
  if (pathname.startsWith("/dashboard/admin/admins")) {
    return "Manajemen Administrator";
  }
  if (pathname.startsWith("/dashboard/admin/reports")) {
    return "Laporan";
  }
  return "Dashboard Admin";
}
