"use client";

import { AdminShell } from "@/features/admin/shell/shell";
import { UserSection } from "@/features/admin/management/users/section";
import { getAdminUsers } from "@/services/admin.service";
import type { AdminUser } from "@/types/admin";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAdminUsers,
  });

  const users: AdminUser[] = usersQuery.data ?? [];
  return (
    <AdminShell searchTerm={searchTerm} onSearchChange={setSearchTerm}>
      {() => (
        <UserSection
          users={users}
          isLoading={usersQuery.isLoading}
          errorMessage={usersQuery.error?.message}
        />
      )}
    </AdminShell>
  );
}
