"use client";

import { HolidayManagementSection } from "@/features/admin/management/holidays/section";
import { AdminShell } from "@/features/admin/shell/shell";
import { getAdminSchoolHolidays } from "@/services/admin.service";
import { useQuery } from "@tanstack/react-query";

export function AdminHolidaysPage() {
  const holidaysQuery = useQuery({
    queryKey: ["admin-school-holidays"],
    queryFn: getAdminSchoolHolidays,
  });

  return (
    <AdminShell>
      {() => (
        <HolidayManagementSection
          holidays={holidaysQuery.data ?? []}
          isLoading={holidaysQuery.isLoading}
          errorMessage={holidaysQuery.error?.message}
        />
      )}
    </AdminShell>
  );
}
