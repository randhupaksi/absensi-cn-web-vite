"use client";

import { StaffTopbar } from "@/features/staff/components/topbar";
import { usePathname } from "@/lib/router";

type DashboardTopbarProps = {
  adminName: string;
  onToggleSidebar: () => void;
};

export function DashboardTopbar({
  adminName,
  onToggleSidebar,
}: DashboardTopbarProps) {
  const pathname = usePathname();

  return (
    <StaffTopbar
      userName={adminName}
      userLabel="Administrator"
      title={getSectionTitle(pathname)}
      onToggleSidebar={onToggleSidebar}
    />
  );
}

function getSectionTitle(pathname: string | null) {
  if (!pathname) return "Dashboard Admin";
  if (pathname === "/dashboard/admin") return "Dashboard Admin";
  if (pathname.startsWith("/dashboard/admin/teachers")) {
    return "Manajemen Guru";
  }
  if (pathname.startsWith("/dashboard/admin/students")) {
    return "Manajemen Siswa";
  }
  if (pathname.startsWith("/dashboard/admin/users")) {
    return "Manajemen Peran";
  }
  if (pathname.startsWith("/dashboard/admin/admins")) {
    return "Manajemen Administrator";
  }
  if (pathname.startsWith("/dashboard/admin/reports")) return "Laporan";
  return "Dashboard Admin";
}
