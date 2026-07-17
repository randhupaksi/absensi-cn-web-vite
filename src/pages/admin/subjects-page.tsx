"use client";

import { AdminShell } from "@/features/admin/shell/shell";
import { SubjectManagementSection } from "@/features/admin/management/subjects/section";
import {
  getAdminClasses,
  getAdminMajors,
  getAdminRooms,
  getAdminSchoolUnits,
  getAdminScheduleOverrides,
  getAdminSchoolYears,
  getAdminSubjects,
  getAdminSubjectSchedules,
  getAdminTeacherProfiles,
  getAdminTeacherSubjectAssignments,
} from "@/services/admin.service";
import { useQuery } from "@tanstack/react-query";

export function AdminSubjectsPage() {
  const subjectsQuery = useQuery({ queryKey: ["admin-subjects"], queryFn: () => getAdminSubjects() });
  const schedulesQuery = useQuery({ queryKey: ["admin-subject-schedules"], queryFn: () => getAdminSubjectSchedules() });
  const assignmentsQuery = useQuery({ queryKey: ["admin-teacher-subject-assignments"], queryFn: () => getAdminTeacherSubjectAssignments() });
  const teachersQuery = useQuery({ queryKey: ["admin-teacher-profiles"], queryFn: getAdminTeacherProfiles });
  const classesQuery = useQuery({ queryKey: ["admin-classes"], queryFn: () => getAdminClasses() });
  const schoolYearsQuery = useQuery({ queryKey: ["admin-school-years"], queryFn: getAdminSchoolYears });
	const programsQuery = useQuery({ queryKey: ["admin-majors"], queryFn: () => getAdminMajors() });
	const roomsQuery = useQuery({ queryKey: ["admin-rooms"], queryFn: () => getAdminRooms() });
	const unitsQuery = useQuery({ queryKey: ["admin-school-units"], queryFn: getAdminSchoolUnits });
	const overridesQuery = useQuery({ queryKey: ["admin-schedule-overrides"], queryFn: () => getAdminScheduleOverrides() });

  const queries = [subjectsQuery, schedulesQuery, assignmentsQuery, teachersQuery, classesQuery, schoolYearsQuery, programsQuery, roomsQuery, unitsQuery, overridesQuery];

  return (
    <AdminShell>
      {() => (<>
        <SubjectManagementSection
          subjects={subjectsQuery.data ?? []}
          schedules={schedulesQuery.data ?? []}
          assignments={assignmentsQuery.data ?? []}
          teachers={teachersQuery.data ?? []}
          classes={classesQuery.data ?? []}
          schoolYears={schoolYearsQuery.data ?? []}
		  programs={programsQuery.data ?? []}
		  rooms={roomsQuery.data ?? []}
		  overrides={overridesQuery.data ?? []}
		  schoolUnits={unitsQuery.data ?? []}
          isLoading={queries.some((query) => query.isLoading)}
          errorMessage={queries.find((query) => query.error)?.error?.message}
        />
	  </>)}
    </AdminShell>
  );
}
