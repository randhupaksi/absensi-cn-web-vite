"use client";

import { AdminShell } from "@/features/admin/shell/shell";
import { ClassManagementSection } from "@/features/admin/management/classes/section";
import { AcademicStructureSection } from "@/features/admin/management/academic/section";
import {
  getAdminClasses,
  getAdminMajors,
  getAdminSchoolYears,
  getAdminSchoolUnits,
} from "@/services/admin.service";
import type { AdminClass, AdminMajor, AdminSchoolUnit, AdminSchoolYear } from "@/types/admin";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export function AdminClassesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const classesQuery = useQuery({
    queryKey: ["admin-classes"],
    queryFn: () => getAdminClasses(),
  });
  const majorsQuery = useQuery({
    queryKey: ["admin-majors"],
    queryFn: () => getAdminMajors(),
  });
  const schoolYearsQuery = useQuery({
    queryKey: ["admin-school-years"],
    queryFn: getAdminSchoolYears,
  });
	const schoolUnitsQuery = useQuery({ queryKey: ["admin-school-units"], queryFn: getAdminSchoolUnits });

  const classes: AdminClass[] = classesQuery.data ?? [];
  const majors: AdminMajor[] = majorsQuery.data ?? [];
  const schoolYears: AdminSchoolYear[] = schoolYearsQuery.data ?? [];
	const schoolUnits: AdminSchoolUnit[] = schoolUnitsQuery.data ?? [];

  return (
    <AdminShell searchTerm={searchTerm} onSearchChange={setSearchTerm}>
      {() => (<>
        <ClassManagementSection
          classes={classes}
          majors={majors}
          schoolYears={schoolYears}
          schoolUnits={schoolUnits}
          isLoading={classesQuery.isLoading || majorsQuery.isLoading || schoolYearsQuery.isLoading || schoolUnitsQuery.isLoading}
          errorMessage={
            classesQuery.error?.message ??
            majorsQuery.error?.message ??
            schoolYearsQuery.error?.message
			?? schoolUnitsQuery.error?.message
          }
        />
		<AcademicStructureSection units={schoolUnits} programs={majors} isLoading={majorsQuery.isLoading || schoolUnitsQuery.isLoading} />
	  </>)}
    </AdminShell>
  );
}
