"use client";

import { AdminShell } from "@/features/admin/shell/shell";
import { AdminManagementSection } from "@/features/admin/management/admins/section";
import { getAdminUsers } from "@/services/admin.service";
import type { AdminUser } from "@/types/admin";
import { useQuery } from "@tanstack/react-query";

export function AdminAdminsPage() {

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAdminUsers,
  });

  const users: AdminUser[] = usersQuery.data ?? [];

  return (
    <AdminShell>
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
