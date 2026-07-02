"use client";

import { AdminShell } from "@/components/dashboard/admin/shell/admin-shell";
import { AdminManagementSection } from "@/components/dashboard/admin/sections/admin-management-section";
import { getAdminUsers } from "@/services/admin.service";
import type { AdminUser } from "@/types/admin";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export function AdminAdminsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAdminUsers,
  });

  const users: AdminUser[] = usersQuery.data ?? [];

  return (
    <AdminShell searchTerm={searchTerm} onSearchChange={setSearchTerm}>
      {() => (
        <AdminManagementSection
          users={users}
          isLoading={usersQuery.isLoading}
          errorMessage={usersQuery.error?.message}
        />
      )}
    </AdminShell>
  );
}
