"use client";

import { StaffShell } from "@/features/staff/components/shell";
import { studentSidebarItems } from "@/features/staff/components/sidebar";
import type { AuthSession } from "@/types/auth";
import type { ReactNode } from "react";

type StudentShellProps = {
  children: (session: AuthSession) => ReactNode;
};

export function StudentShell({ children }: StudentShellProps) {
  return (
    <StaffShell
      expectedRole="siswa"
      sidebarItems={studentSidebarItems}
      userLabel="Siswa"
      eyebrow="Siswa Dashboard"
      resolveTitle={(pathname) => {
        if (pathname.includes("/history")) return "Histori Absen";
        if (pathname.includes("/profile")) return "Profile Siswa";
        return "Siswa Dashboard";
      }}
    >
      {children}
    </StaffShell>
  );
}
