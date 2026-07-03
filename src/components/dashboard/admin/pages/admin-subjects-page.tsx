"use client";

import { AdminShell } from "@/components/dashboard/admin/shell/admin-shell";
import { SubjectManagementSection } from "@/components/dashboard/admin/sections/subject-management-section";
import { AcademicOperationsSection } from "@/components/dashboard/admin/sections/academic-operations-section";
import {
  getAdminClasses,
  getAdminMajors,
  getAdminRooms,
  getAdminSchoolUnits,
  getAdminScheduleOverrides,
  getAdminSubjectOfferings,
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
  const subjectsQuery = useQuery({ queryKey: ["admin-subjects"], queryFn: () => getAdminSubjects() });
  const schedulesQuery = useQuery({ queryKey: ["admin-subject-schedules"], queryFn: () => getAdminSubjectSchedules() });
  const assignmentsQuery = useQuery({ queryKey: ["admin-teacher-subject-assignments"], queryFn: () => getAdminTeacherSubjectAssignments() });
  const teachersQuery = useQuery({ queryKey: ["admin-teacher-profiles"], queryFn: getAdminTeacherProfiles });
  const classesQuery = useQuery({ queryKey: ["admin-classes"], queryFn: () => getAdminClasses() });
  const schoolYearsQuery = useQuery({ queryKey: ["admin-school-years"], queryFn: getAdminSchoolYears });
	const programsQuery = useQuery({ queryKey: ["admin-majors"], queryFn: () => getAdminMajors() });
	const roomsQuery = useQuery({ queryKey: ["admin-rooms"], queryFn: () => getAdminRooms() });
	const unitsQuery = useQuery({ queryKey: ["admin-school-units"], queryFn: getAdminSchoolUnits });
	const offeringsQuery = useQuery({ queryKey: ["admin-subject-offerings"], queryFn: () => getAdminSubjectOfferings() });
	const overridesQuery = useQuery({ queryKey: ["admin-schedule-overrides"], queryFn: () => getAdminScheduleOverrides() });

  const queries = [subjectsQuery, schedulesQuery, assignmentsQuery, teachersQuery, classesQuery, schoolYearsQuery, programsQuery, roomsQuery, unitsQuery, offeringsQuery, overridesQuery];

  return (
    <AdminShell searchTerm={searchTerm} onSearchChange={setSearchTerm}>
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
          isLoading={queries.some((query) => query.isLoading)}
          errorMessage={queries.find((query) => query.error)?.error?.message}
        />
		<AcademicOperationsSection offerings={offeringsQuery.data ?? []} rooms={roomsQuery.data ?? []} overrides={overridesQuery.data ?? []} subjects={subjectsQuery.data ?? []} classes={classesQuery.data ?? []} schoolYears={schoolYearsQuery.data ?? []} schoolUnits={unitsQuery.data ?? []} schedules={schedulesQuery.data ?? []} teachers={teachersQuery.data ?? []} isLoading={queries.some((query) => query.isLoading)} />
	  </>)}
    </AdminShell>
  );
}
