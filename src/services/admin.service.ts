import { apiClient } from "@/services/api/client";
import type {
  AdminClass,
  AdminClassPayload,
  AdminAttendanceRule,
  AdminAttendanceRulePayload,
  AdminDashboardData,
  AdminHomeroomAssignment,
  AdminHomeroomAssignmentPayload,
  AdminMajor,
  AdminSchoolYear,
  AdminStudent,
  AdminStudentClassMembership,
  AdminStudentClassMembershipPayload,
  AdminStudentPayload,
  AdminSubject,
  AdminSubjectPayload,
  AdminSubjectScheduleFilters,
  AdminSubjectScheduleOverview,
  AdminTeacherDirectory,
  AdminTeacherAccountPayload,
  AdminTeacherProfile,
  AdminTeacherProfilePayload,
  AdminTeacherSubjectAssignment,
  AdminTeacherSubjectAssignmentPayload,
  AdminUser,
  AdminUserPayload,
  ImportResult,
} from "@/types/admin";
import axios from "axios";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string>;
};

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiEnvelope<never>>(error)) {
    return (
      error.response?.data?.message ??
      "Terjadi kesalahan saat menghubungkan dashboard admin."
    );
  }

  return error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.";
}

export async function getAdminDashboard() {
  try {
    const response =
      await apiClient.get<ApiEnvelope<AdminDashboardData>>("/admin/dashboard");
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getAdminUsers() {
  try {
    const response = await apiClient.get<ApiEnvelope<AdminUser[]>>("/admin/users");
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getAdminTeachers() {
  try {
    const response = await apiClient.get<ApiEnvelope<AdminTeacherDirectory[]>>("/admin/teachers");
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getAdminTeacherProfiles() {
  try {
    const response = await apiClient.get<ApiEnvelope<AdminTeacherProfile[]>>(
      "/admin/teacher-profiles",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getAdminTeacherSubjectAssignments() {
  try {
    const response =
      await apiClient.get<ApiEnvelope<AdminTeacherSubjectAssignment[]>>(
        "/admin/teacher-subject-assignments",
      );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getAdminHomeroomAssignments() {
  try {
    const response = await apiClient.get<ApiEnvelope<AdminHomeroomAssignment[]>>(
      "/admin/homeroom-assignments",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getAdminSubjects() {
  try {
    const response = await apiClient.get<ApiEnvelope<AdminSubject[]>>(
      "/admin/subjects",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getAdminSubjectSchedules(filters: AdminSubjectScheduleFilters = {}) {
  try {
    const response = await apiClient.get<ApiEnvelope<AdminSubjectScheduleOverview[]>>(
      "/admin/subject-schedules",
      { params: filters },
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function createAdminSubject(payload: AdminSubjectPayload) {
  try {
    const response = await apiClient.post<ApiEnvelope<AdminSubject>>(
      "/admin/subjects",
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateAdminSubject(id: string, payload: AdminSubjectPayload) {
  try {
    const response = await apiClient.patch<ApiEnvelope<AdminSubject>>(
      `/admin/subjects/${id}`,
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function deleteAdminSubject(id: string) {
  try {
    await apiClient.delete(`/admin/subjects/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getAdminMajors() {
  try {
    const response = await apiClient.get<ApiEnvelope<AdminMajor[]>>(
      "/admin/majors",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getAdminClasses() {
  try {
    const response = await apiClient.get<ApiEnvelope<AdminClass[]>>(
      "/admin/classes",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function createAdminClass(payload: AdminClassPayload) {
  try {
    const response = await apiClient.post<ApiEnvelope<AdminClass>>(
      "/admin/classes",
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateAdminClass(id: string, payload: AdminClassPayload) {
  try {
    const response = await apiClient.patch<ApiEnvelope<AdminClass>>(
      `/admin/classes/${id}`,
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function deleteAdminClass(id: string) {
  try {
    const response = await apiClient.delete<ApiEnvelope<null>>(
      `/admin/classes/${id}`,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getAdminSchoolYears() {
  try {
    const response = await apiClient.get<ApiEnvelope<AdminSchoolYear[]>>(
      "/admin/school-years",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getAdminStudents() {
  try {
    const response = await apiClient.get<ApiEnvelope<AdminStudent[]>>(
      "/admin/students",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getAdminStudentClassMemberships() {
  try {
    const response = await apiClient.get<
      ApiEnvelope<AdminStudentClassMembership[]>
    >("/admin/student-class-memberships");
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getAdminAttendanceRules() {
  try {
    const response = await apiClient.get<ApiEnvelope<AdminAttendanceRule[]>>(
      "/admin/attendance-rules",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function createAdminUser(payload: AdminUserPayload) {
  try {
    const response = await apiClient.post<ApiEnvelope<AdminUser>>(
      "/admin/users",
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function createAdminTeacherProfile(
  payload: AdminTeacherProfilePayload,
) {
  try {
    const response = await apiClient.post<ApiEnvelope<AdminTeacherProfile>>(
      "/admin/teacher-profiles",
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function createAdminTeacherAccount(payload: AdminTeacherAccountPayload) {
  try {
    const response = await apiClient.post<ApiEnvelope<AdminTeacherProfile>>(
      "/admin/teacher-accounts",
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function createAdminTeacherSubjectAssignment(
  payload: AdminTeacherSubjectAssignmentPayload,
) {
  try {
    const response = await apiClient.post<
      ApiEnvelope<AdminTeacherSubjectAssignment>
    >("/admin/teacher-subject-assignments", payload);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function createAdminHomeroomAssignment(
  payload: AdminHomeroomAssignmentPayload,
) {
  try {
    const response = await apiClient.post<ApiEnvelope<AdminHomeroomAssignment>>(
      "/admin/homeroom-assignments",
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function createAdminStudent(payload: AdminStudentPayload) {
  try {
    const response = await apiClient.post<ApiEnvelope<AdminStudent>>(
      "/admin/students",
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function createAdminStudentClassMembership(
  payload: AdminStudentClassMembershipPayload,
) {
  try {
    const response = await apiClient.post<
      ApiEnvelope<AdminStudentClassMembership>
    >("/admin/student-class-memberships", payload);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function createAdminAttendanceRule(
  payload: AdminAttendanceRulePayload,
) {
  try {
    const response = await apiClient.post<ApiEnvelope<AdminAttendanceRule>>(
      "/admin/attendance-rules",
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateAdminUser(id: string, payload: AdminUserPayload) {
  try {
    const response = await apiClient.patch<ApiEnvelope<AdminUser>>(
      `/admin/users/${id}`,
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function deleteAdminUser(id: string) {
  try {
    await apiClient.delete(`/admin/users/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateAdminTeacherProfile(
  id: string,
  payload: AdminTeacherProfilePayload,
) {
  try {
    const response = await apiClient.patch<ApiEnvelope<AdminTeacherProfile>>(
      `/admin/teacher-profiles/${id}`,
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateAdminTeacherAccount(
  id: string,
  payload: AdminTeacherAccountPayload,
) {
  try {
    const response = await apiClient.patch<ApiEnvelope<AdminTeacherProfile>>(
      `/admin/teacher-accounts/${id}`,
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function deleteAdminTeacherProfile(id: string) {
  try {
    await apiClient.delete(`/admin/teacher-profiles/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateAdminTeacherSubjectAssignment(
  id: string,
  payload: AdminTeacherSubjectAssignmentPayload,
) {
  try {
    const response = await apiClient.patch<
      ApiEnvelope<AdminTeacherSubjectAssignment>
    >(`/admin/teacher-subject-assignments/${id}`, payload);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function deleteAdminTeacherSubjectAssignment(id: string) {
  try {
    await apiClient.delete(`/admin/teacher-subject-assignments/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateAdminHomeroomAssignment(
  id: string,
  payload: AdminHomeroomAssignmentPayload,
) {
  try {
    const response = await apiClient.patch<ApiEnvelope<AdminHomeroomAssignment>>(
      `/admin/homeroom-assignments/${id}`,
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function deleteAdminHomeroomAssignment(id: string) {
  try {
    await apiClient.delete(`/admin/homeroom-assignments/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateAdminStudent(id: string, payload: AdminStudentPayload) {
  try {
    const response = await apiClient.patch<ApiEnvelope<AdminStudent>>(
      `/admin/students/${id}`,
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function deleteAdminStudent(id: string) {
  try {
    await apiClient.delete(`/admin/students/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateAdminStudentClassMembership(
  id: string,
  payload: AdminStudentClassMembershipPayload,
) {
  try {
    const response = await apiClient.patch<
      ApiEnvelope<AdminStudentClassMembership>
    >(`/admin/student-class-memberships/${id}`, payload);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function deleteAdminStudentClassMembership(id: string) {
  try {
    await apiClient.delete(`/admin/student-class-memberships/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateAdminAttendanceRule(
  id: string,
  payload: AdminAttendanceRulePayload,
) {
  try {
    const response = await apiClient.patch<ApiEnvelope<AdminAttendanceRule>>(
      `/admin/attendance-rules/${id}`,
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function deleteAdminAttendanceRule(id: string) {
  try {
    await apiClient.delete(`/admin/attendance-rules/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export function downloadAdminImportTemplate(type: "guru" | "siswa") {
  apiClient
    .get(`/admin/import/template/${type}`, { responseType: "blob" })
    .then((response) => {
      const filename =
        type === "guru" ? "template_import_guru.xlsx" : "template_import_siswa.xlsx";
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    })
    .catch((error) => {
      throw new Error(getErrorMessage(error));
    });
}

export async function importAdminTeachers(file: File): Promise<ImportResult> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<ApiEnvelope<ImportResult>>(
      "/admin/import/guru",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function importAdminStudents(file: File): Promise<ImportResult> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<ApiEnvelope<ImportResult>>(
      "/admin/import/siswa",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
