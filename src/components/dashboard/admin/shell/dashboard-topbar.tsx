"use client";

import { StaffTopbar } from "@/components/dashboard/staff/staff-topbar";
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
  if (!pathname) return "Admin Dashboard";
  if (pathname === "/dashboard/admin") return "Admin Dashboard";
  if (pathname.startsWith("/dashboard/admin/teachers")) {
    return "Teacher Management Dashboard";
  }
  if (pathname.startsWith("/dashboard/admin/students")) {
    return "Student Management Dashboard";
  }
  if (pathname.startsWith("/dashboard/admin/users")) {
    return "Role Management Dashboard";
  }
  if (pathname.startsWith("/dashboard/admin/admins")) {
    return "Admin Management Dashboard";
  }
  if (pathname.startsWith("/dashboard/admin/reports")) return "Reports Dashboard";
  return "Admin Dashboard";
}
