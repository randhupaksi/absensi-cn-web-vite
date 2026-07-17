"use client";

import { AdminShell } from "@/features/admin/shell/shell";
import { TeacherSection } from "@/features/admin/management/teachers/section";
import {
  getAdminBKUnitScopes,
  getAdminHomeroomAssignments,
  getAdminSchoolUnits,
  getAdminTeacherProfiles,
  getAdminTeacherSubjectAssignments,
} from "@/services/admin.service";
import type {
  AdminBKUnitScope,
  AdminHomeroomAssignment,
  AdminSchoolUnit,
  AdminTeacherProfile,
  AdminTeacherSubjectAssignment,
} from "@/types/admin";
import { useQuery } from "@tanstack/react-query";

export function AdminTeachersPage() {
  const teacherProfilesQuery = useQuery({
    queryKey: ["admin-teacher-profiles"],
    queryFn: getAdminTeacherProfiles,
  });
  const teacherSubjectAssignmentsQuery = useQuery({
    queryKey: ["admin-teacher-subject-assignments"],
    queryFn: () => getAdminTeacherSubjectAssignments(),
  });
  const homeroomAssignmentsQuery = useQuery({
    queryKey: ["admin-homeroom-assignments"],
    queryFn: getAdminHomeroomAssignments,
  });
  const schoolUnitsQuery = useQuery({
    queryKey: ["admin-school-units"],
    queryFn: getAdminSchoolUnits,
  });
  const bkScopesQuery = useQuery({
    queryKey: ["admin-bk-unit-scopes"],
    queryFn: () => getAdminBKUnitScopes(),
  });

  const teacherProfiles: AdminTeacherProfile[] =
    teacherProfilesQuery.data ?? [];
  const teacherSubjectAssignments: AdminTeacherSubjectAssignment[] =
    teacherSubjectAssignmentsQuery.data ?? [];
  const homeroomAssignments: AdminHomeroomAssignment[] =
    homeroomAssignmentsQuery.data ?? [];
  const schoolUnits: AdminSchoolUnit[] = schoolUnitsQuery.data ?? [];
  const bkUnitScopes: AdminBKUnitScope[] = bkScopesQuery.data ?? [];

  return (
    <AdminShell>
      {() => (
        <TeacherSection
          teacherProfiles={teacherProfiles}
          teacherSubjectAssignments={teacherSubjectAssignments}
          homeroomAssignments={homeroomAssignments}
          schoolUnits={schoolUnits}
          bkUnitScopes={bkUnitScopes}
          isLoading={
            teacherProfilesQuery.isLoading ||
            teacherSubjectAssignmentsQuery.isLoading ||
            homeroomAssignmentsQuery.isLoading ||
            schoolUnitsQuery.isLoading ||
            bkScopesQuery.isLoading
          }
          errorMessage={
            teacherProfilesQuery.error?.message ??
            teacherSubjectAssignmentsQuery.error?.message ??
            homeroomAssignmentsQuery.error?.message ??
            schoolUnitsQuery.error?.message ??
            bkScopesQuery.error?.message
          }
        />
      )}
    </AdminShell>
  );
}
