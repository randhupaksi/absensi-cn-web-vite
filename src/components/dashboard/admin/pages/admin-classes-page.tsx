"use client";

import { AdminShell } from "@/components/dashboard/admin/shell/admin-shell";
import { ClassManagementSection } from "@/components/dashboard/admin/sections/class-management-section";
import {
  getAdminClasses,
  getAdminMajors,
  getAdminSchoolYears,
} from "@/services/admin.service";
import type { AdminClass, AdminMajor, AdminSchoolYear } from "@/types/admin";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export function AdminClassesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const classesQuery = useQuery({
    queryKey: ["admin-classes"],
    queryFn: getAdminClasses,
  });
  const majorsQuery = useQuery({
    queryKey: ["admin-majors"],
    queryFn: getAdminMajors,
  });
  const schoolYearsQuery = useQuery({
    queryKey: ["admin-school-years"],
    queryFn: getAdminSchoolYears,
  });

  const classes: AdminClass[] = classesQuery.data ?? [];
  const majors: AdminMajor[] = majorsQuery.data ?? [];
  const schoolYears: AdminSchoolYear[] = schoolYearsQuery.data ?? [];

  return (
    <AdminShell searchTerm={searchTerm} onSearchChange={setSearchTerm}>
      {() => (
        <ClassManagementSection
          classes={classes}
          majors={majors}
          schoolYears={schoolYears}
          isLoading={classesQuery.isLoading || majorsQuery.isLoading || schoolYearsQuery.isLoading}
          errorMessage={
            classesQuery.error?.message ??
            majorsQuery.error?.message ??
            schoolYearsQuery.error?.message
          }
        />
      )}
    </AdminShell>
  );
}
