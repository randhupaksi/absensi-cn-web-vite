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
  AdminMajorPayload,
  AdminSchoolUnit,
  AdminSchoolUnitPayload,
  AdminSubjectOffering,
  AdminSubjectOfferingPayload,
  AdminRoom,
  AdminRoomPayload,
  AdminScheduleOverride,
  AdminScheduleOverridePayload,
  AdminBKUnitScope,
  AdminSchoolYear,
  AdminStudent,
  AdminStudentClassMembership,
  AdminStudentClassMembershipPayload,
  AdminStudentPayload,
  AdminSubject,
  AdminSubjectPayload,
  AdminSubjectScheduleFilters,
  AdminSubjectScheduleOverview,
  AdminTeacherAccountPayload,
  AdminTeacherProfile,
  AdminTeacherSubjectAssignment,
  AdminTeacherSubjectAssignmentPayload,
  AdminUser,
  AdminUserPayload,
  ImportResult,
} from "@/types/admin";
import axios from "axios";
import { downloadBlob } from "@/lib/download-file";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string>;
};

// MySQL/GORM sometimes bubble raw driver errors (e.g. "Error 1062 (23000):
// Duplicate entry '...' for key '...'") straight into the API envelope
// message. Surface a readable message instead of the raw SQL error text.
function humanizeBackendMessage(message: string) {
  if (/duplicate entry/i.test(message)) {
    return "Data yang sama sudah tersimpan. Periksa kembali pilihan Anda (kemungkinan ada duplikat, misalnya program/jurusan yang sama dipilih dua kali).";
  }
  return message;
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiEnvelope<never>>(error)) {
    const message = error.response?.data?.message;
    return message
      ? humanizeBackendMessage(message)
      : "Terjadi kesalahan saat menghubungkan dashboard admin.";
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

export async function getAdminTeacherSubjectAssignments(params: Record<string, string> = {}) {
  try {
    const response =
      await apiClient.get<ApiEnvelope<AdminTeacherSubjectAssignment[]>>(
        "/admin/teacher-subject-assignments", { params },
      );
    return response.data.data.map(withNormalizedSchedules);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// Backend returns `schedules: null` (not `[]`) for assignments with no schedule
// slots yet, since it serializes a nil Go slice. Normalize here so callers can
// safely rely on the declared `AdminTeacherSubjectAssignment.schedules` array type.
function withNormalizedSchedules(assignment: AdminTeacherSubjectAssignment): AdminTeacherSubjectAssignment {
  return { ...assignment, schedules: assignment.schedules ?? [] };
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

export async function getAdminSubjects(params: { scope?: string; major_id?: string } = {}) {
  try {
    const response = await apiClient.get<ApiEnvelope<AdminSubject[]>>(
      "/admin/subjects", { params },
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

export async function getAdminMajors(params: { school_unit_id?: string; program_type?: string } = {}) {
  try {
    const response = await apiClient.get<ApiEnvelope<AdminMajor[]>>(
      "/admin/majors", { params },
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getAdminClasses(params: { school_unit_id?: string; major_id?: string; school_year_id?: string } = {}) {
  try {
    const response = await apiClient.get<ApiEnvelope<AdminClass[]>>(
      "/admin/classes", { params },
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
    return withNormalizedSchedules(response.data.data);
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

export async function updateAdminTeacherSubjectAssignment(
  id: string,
  payload: AdminTeacherSubjectAssignmentPayload,
) {
  try {
    const response = await apiClient.patch<
      ApiEnvelope<AdminTeacherSubjectAssignment>
    >(`/admin/teacher-subject-assignments/${id}`, payload);
    return withNormalizedSchedules(response.data.data);
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

export async function getAdminSchoolUnits() {
  try {
    const response = await apiClient.get<ApiEnvelope<AdminSchoolUnit[]>>("/admin/school-units");
    return response.data.data;
  } catch (error) { throw new Error(getErrorMessage(error)); }
}

export async function createAdminSchoolUnit(payload: AdminSchoolUnitPayload) {
  try {
    const response = await apiClient.post<ApiEnvelope<AdminSchoolUnit>>("/admin/school-units", payload);
    return response.data.data;
  } catch (error) { throw new Error(getErrorMessage(error)); }
}

export async function updateAdminSchoolUnit(id: string, payload: AdminSchoolUnitPayload) {
  try {
    const response = await apiClient.patch<ApiEnvelope<AdminSchoolUnit>>(`/admin/school-units/${id}`, payload);
    return response.data.data;
  } catch (error) { throw new Error(getErrorMessage(error)); }
}

export async function deleteAdminSchoolUnit(id: string) {
  try { await apiClient.delete(`/admin/school-units/${id}`); }
  catch (error) { throw new Error(getErrorMessage(error)); }
}

export async function createAdminMajor(payload: AdminMajorPayload) {
  try {
    const response = await apiClient.post<ApiEnvelope<AdminMajor>>("/admin/majors", payload);
    return response.data.data;
  } catch (error) { throw new Error(getErrorMessage(error)); }
}

export async function updateAdminMajor(id: string, payload: AdminMajorPayload) {
  try {
    const response = await apiClient.patch<ApiEnvelope<AdminMajor>>(`/admin/majors/${id}`, payload);
    return response.data.data;
  } catch (error) { throw new Error(getErrorMessage(error)); }
}

export async function deleteAdminMajor(id: string) {
  try { await apiClient.delete(`/admin/majors/${id}`); }
  catch (error) { throw new Error(getErrorMessage(error)); }
}

export async function getAdminSubjectOfferings(params: Record<string, string> = {}) {
  try {
    const response = await apiClient.get<ApiEnvelope<AdminSubjectOffering[]>>("/admin/subject-offerings", { params });
    return response.data.data;
  } catch (error) { throw new Error(getErrorMessage(error)); }
}

export async function createAdminSubjectOffering(payload: AdminSubjectOfferingPayload) {
  try {
    const response = await apiClient.post<ApiEnvelope<AdminSubjectOffering>>("/admin/subject-offerings", payload);
    return response.data.data;
  } catch (error) { throw new Error(getErrorMessage(error)); }
}

export async function updateAdminSubjectOffering(id: string, payload: AdminSubjectOfferingPayload) {
  try {
    const response = await apiClient.patch<ApiEnvelope<AdminSubjectOffering>>(`/admin/subject-offerings/${id}`, payload);
    return response.data.data;
  } catch (error) { throw new Error(getErrorMessage(error)); }
}

export async function deleteAdminSubjectOffering(id: string) {
  try { await apiClient.delete(`/admin/subject-offerings/${id}`); }
  catch (error) { throw new Error(getErrorMessage(error)); }
}

export async function getAdminRooms(params: { school_unit_id?: string } = {}) {
  try {
    const response = await apiClient.get<ApiEnvelope<AdminRoom[]>>("/admin/rooms", { params });
    return response.data.data;
  } catch (error) { throw new Error(getErrorMessage(error)); }
}

export async function createAdminRoom(payload: AdminRoomPayload) {
  try {
    const response = await apiClient.post<ApiEnvelope<AdminRoom>>("/admin/rooms", payload);
    return response.data.data;
  } catch (error) { throw new Error(getErrorMessage(error)); }
}

export async function updateAdminRoom(id: string, payload: AdminRoomPayload) {
  try {
    const response = await apiClient.patch<ApiEnvelope<AdminRoom>>(`/admin/rooms/${id}`, payload);
    return response.data.data;
  } catch (error) { throw new Error(getErrorMessage(error)); }
}

export async function deleteAdminRoom(id: string) {
  try { await apiClient.delete(`/admin/rooms/${id}`); }
  catch (error) { throw new Error(getErrorMessage(error)); }
}

export async function getAdminScheduleOverrides(params: { schedule_id?: string } = {}) {
  try {
    const response = await apiClient.get<ApiEnvelope<AdminScheduleOverride[]>>("/admin/schedule-overrides", { params });
    return response.data.data;
  } catch (error) { throw new Error(getErrorMessage(error)); }
}

export async function createAdminScheduleOverride(payload: AdminScheduleOverridePayload) {
  try {
    const response = await apiClient.post<ApiEnvelope<AdminScheduleOverride>>("/admin/schedule-overrides", payload);
    return response.data.data;
  } catch (error) { throw new Error(getErrorMessage(error)); }
}

export async function updateAdminScheduleOverride(id: string, payload: AdminScheduleOverridePayload) {
  try {
    const response = await apiClient.patch<ApiEnvelope<AdminScheduleOverride>>(`/admin/schedule-overrides/${id}`, payload);
    return response.data.data;
  } catch (error) { throw new Error(getErrorMessage(error)); }
}

export async function deleteAdminScheduleOverride(id: string) {
  try { await apiClient.delete(`/admin/schedule-overrides/${id}`); }
  catch (error) { throw new Error(getErrorMessage(error)); }
}

export async function getAdminBKUnitScopes(userId?: string) {
  try {
    const response = await apiClient.get<ApiEnvelope<AdminBKUnitScope[]>>("/admin/bk-unit-scopes", { params: userId ? { user_id: userId } : {} });
    return response.data.data;
  } catch (error) { throw new Error(getErrorMessage(error)); }
}

export async function replaceAdminBKUnitScopes(userId: string, schoolUnitIds: string[]) {
  try {
    const response = await apiClient.put<ApiEnvelope<AdminBKUnitScope[]>>(`/admin/bk-unit-scopes/${userId}`, { school_unit_ids: schoolUnitIds });
    return response.data.data;
  } catch (error) { throw new Error(getErrorMessage(error)); }
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
      downloadBlob(new Blob([response.data]), filename);
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
