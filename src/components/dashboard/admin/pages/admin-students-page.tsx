"use client";

import { AdminShell } from "@/components/dashboard/admin/shell/admin-shell";
import { StudentSection } from "@/components/dashboard/admin/sections/student-section";
import {
  getAdminAttendanceRules,
  getAdminClasses,
  getAdminSchoolYears,
  getAdminStudentClassMemberships,
  getAdminStudents,
} from "@/services/admin.service";
import type {
  AdminAttendanceRule,
  AdminClass,
  AdminSchoolYear,
  AdminStudent,
  AdminStudentClassMembership,
} from "@/types/admin";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export function AdminStudentsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const studentsQuery = useQuery({
    queryKey: ["admin-students"],
    queryFn: getAdminStudents,
  });
  const membershipsQuery = useQuery({
    queryKey: ["admin-student-class-memberships"],
    queryFn: getAdminStudentClassMemberships,
  });
  const attendanceRulesQuery = useQuery({
    queryKey: ["admin-attendance-rules"],
    queryFn: getAdminAttendanceRules,
  });
  const classesQuery = useQuery({
    queryKey: ["admin-classes"],
    queryFn: getAdminClasses,
  });
  const schoolYearsQuery = useQuery({
    queryKey: ["admin-school-years"],
    queryFn: getAdminSchoolYears,
  });

  const students: AdminStudent[] = studentsQuery.data ?? [];
  const memberships: AdminStudentClassMembership[] = membershipsQuery.data ?? [];
  const attendanceRules: AdminAttendanceRule[] = attendanceRulesQuery.data ?? [];
  const classes: AdminClass[] = classesQuery.data ?? [];
  const schoolYears: AdminSchoolYear[] = schoolYearsQuery.data ?? [];

  return (
    <AdminShell searchTerm={searchTerm} onSearchChange={setSearchTerm}>
      {() => (
        <StudentSection
          students={students}
          memberships={memberships}
          attendanceRules={attendanceRules}
          classes={classes}
          schoolYears={schoolYears}
          isLoading={
            studentsQuery.isLoading ||
            membershipsQuery.isLoading ||
            attendanceRulesQuery.isLoading ||
            classesQuery.isLoading ||
            schoolYearsQuery.isLoading
          }
          errorMessage={
            studentsQuery.error?.message ??
            membershipsQuery.error?.message ??
            attendanceRulesQuery.error?.message ??
            classesQuery.error?.message ??
            schoolYearsQuery.error?.message
          }
        />
      )}
    </AdminShell>
  );
}
