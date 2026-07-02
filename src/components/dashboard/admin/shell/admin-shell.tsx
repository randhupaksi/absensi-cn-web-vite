"use client";

import type { AuthSession } from "@/types/auth";
import type { ReactNode } from "react";
import {
  adminSidebarItems,
} from "@/components/dashboard/staff/staff-sidebar";
import { StaffShell } from "@/components/dashboard/staff/staff-shell";

type AdminShellProps = {
  children: (session: AuthSession) => ReactNode;
  searchTerm: string;
  onSearchChange: (value: string) => void;
};

export function AdminShell({
  children,
  searchTerm,
  onSearchChange,
}: AdminShellProps) {
  void searchTerm;
  void onSearchChange;

  return (
    <StaffShell
      expectedRole="admin"
      sidebarItems={adminSidebarItems}
      userLabel="Administrator"
      resolveTitle={getAdminSectionTitle}
    >
      {children}
    </StaffShell>
  );
}

function getAdminSectionTitle(pathname: string) {
  if (pathname === "/dashboard/admin") return "Admin Dashboard";
  if (pathname.startsWith("/dashboard/admin/teachers")) {
    return "Teacher Management Dashboard";
  }
  if (pathname.startsWith("/dashboard/admin/subjects")) {
    return "Manajemen Mapel";
  }
  if (pathname.startsWith("/dashboard/admin/students")) {
    return "Student Management Dashboard";
  }
  if (pathname.startsWith("/dashboard/admin/classes")) {
    return "Class Management Dashboard";
  }
  if (pathname.startsWith("/dashboard/admin/users")) {
    return "Role Management Dashboard";
  }
  if (pathname.startsWith("/dashboard/admin/admins")) {
    return "Admin Management Dashboard";
  }
  if (pathname.startsWith("/dashboard/admin/reports")) {
    return "Reports Dashboard";
  }
  return "Admin Dashboard";
}
