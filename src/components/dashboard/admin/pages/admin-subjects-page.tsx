"use client";

import { AdminShell } from "@/components/dashboard/admin/shell/admin-shell";
import { SubjectManagementSection } from "@/components/dashboard/admin/sections/subject-management-section";
import {
  getAdminClasses,
  getAdminSchoolYears,
  getAdminSubjects,
  getAdminSubjectSchedules,
  getAdminTeacherProfiles,
  getAdminTeacherSubjectAssignments,
} from "@/services/admin.service";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export function AdminSubjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const subjectsQuery = useQuery({ queryKey: ["admin-subjects"], queryFn: getAdminSubjects });
  const schedulesQuery = useQuery({ queryKey: ["admin-subject-schedules"], queryFn: () => getAdminSubjectSchedules() });
  const assignmentsQuery = useQuery({ queryKey: ["admin-teacher-subject-assignments"], queryFn: getAdminTeacherSubjectAssignments });
  const teachersQuery = useQuery({ queryKey: ["admin-teacher-profiles"], queryFn: getAdminTeacherProfiles });
  const classesQuery = useQuery({ queryKey: ["admin-classes"], queryFn: getAdminClasses });
  const schoolYearsQuery = useQuery({ queryKey: ["admin-school-years"], queryFn: getAdminSchoolYears });

  const queries = [subjectsQuery, schedulesQuery, assignmentsQuery, teachersQuery, classesQuery, schoolYearsQuery];

  return (
    <AdminShell searchTerm={searchTerm} onSearchChange={setSearchTerm}>
      {() => (
        <SubjectManagementSection
          subjects={subjectsQuery.data ?? []}
          schedules={schedulesQuery.data ?? []}
          assignments={assignmentsQuery.data ?? []}
          teachers={teachersQuery.data ?? []}
          classes={classesQuery.data ?? []}
          schoolYears={schoolYearsQuery.data ?? []}
          isLoading={queries.some((query) => query.isLoading)}
          errorMessage={queries.find((query) => query.error)?.error?.message}
        />
      )}
    </AdminShell>
  );
}
