"use client";

import type { AuthSession } from "@/types/auth";
import type { ReactNode } from "react";
import {
  adminSidebarItems,
} from "@/features/staff/components/sidebar";
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
