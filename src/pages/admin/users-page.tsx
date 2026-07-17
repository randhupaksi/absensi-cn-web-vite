"use client";

import { AdminShell } from "@/features/admin/shell/shell";
import { UserSection } from "@/features/admin/management/users/section";
import { getAdminUsers } from "@/services/admin.service";
import type { AdminUser } from "@/types/admin";
import { useQuery } from "@tanstack/react-query";

export function AdminUsersPage() {

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAdminUsers,
  });

  const users: AdminUser[] = usersQuery.data ?? [];
  return (
    <AdminShell>
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
