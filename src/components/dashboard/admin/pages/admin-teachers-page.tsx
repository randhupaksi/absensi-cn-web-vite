"use client";

import { AdminShell } from "@/components/dashboard/admin/shell/admin-shell";
import { TeacherSection } from "@/components/dashboard/admin/sections/teacher-section";
import {
  getAdminHomeroomAssignments,
  getAdminTeacherProfiles,
  getAdminTeacherSubjectAssignments,
} from "@/services/admin.service";
import type {
  AdminHomeroomAssignment,
  AdminTeacherProfile,
  AdminTeacherSubjectAssignment,
} from "@/types/admin";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export function AdminTeachersPage() {
  const [searchTerm, setSearchTerm] = useState("");
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

  const teacherProfiles: AdminTeacherProfile[] =
    teacherProfilesQuery.data ?? [];
  const teacherSubjectAssignments: AdminTeacherSubjectAssignment[] =
    teacherSubjectAssignmentsQuery.data ?? [];
  const homeroomAssignments: AdminHomeroomAssignment[] =
    homeroomAssignmentsQuery.data ?? [];

  return (
    <AdminShell searchTerm={searchTerm} onSearchChange={setSearchTerm}>
      {() => (
        <TeacherSection
          teacherProfiles={teacherProfiles}
          teacherSubjectAssignments={teacherSubjectAssignments}
          homeroomAssignments={homeroomAssignments}
          isLoading={
            teacherProfilesQuery.isLoading ||
            teacherSubjectAssignmentsQuery.isLoading ||
            homeroomAssignmentsQuery.isLoading
          }
          errorMessage={
            teacherProfilesQuery.error?.message ??
            teacherSubjectAssignmentsQuery.error?.message ??
            homeroomAssignmentsQuery.error?.message
          }
        />
      )}
    </AdminShell>
  );
}
