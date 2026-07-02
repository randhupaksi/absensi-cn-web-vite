import { apiClient } from "@/services/api/client";
import type {
  StaffBKAttendanceOverview,
  StaffBKCounselingOverview,
  StaffBKDashboard,
  StaffBKStudentDetail,
  StaffBKStudentsOverview,
  StaffBKSubmissionOverview,
  StaffCounselingNote,
  StaffAttendanceReviewPayload,
  StaffHomeroomAttendanceOverview,
  StaffHomeroomContext,
  StaffHomeroomDashboard,
  StaffHomeroomSubmissionOverview,
  StaffHomeroomStudentDetail,
  StaffSubmission,
  StaffStudentSummary,
  StaffTeacherMe,
  StaffSubjectAssignment,
  StaffSubjectCurrentSession,
  StaffSubjectAttendanceOverview,
  StaffSubjectAttendanceRecord,
  StaffSubjectValidationPayload,
  StaffSubjectOverridePayload,
  StaffSubjectRecap,
  StaffSubjectSessionList,
} from "@/types/staff";
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
      "Terjadi kesalahan saat menghubungkan dashboard staff."
    );
  }

  return error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.";
}

export async function getTeacherHomeroomDashboard() {
  try {
    const response = await apiClient.get<ApiEnvelope<StaffHomeroomDashboard>>(
      "/teacher/homeroom/dashboard",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getTeacherHomeroom() {
  try {
    const response = await apiClient.get<ApiEnvelope<StaffHomeroomContext>>(
      "/teacher/homeroom",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getTeacherHomeroomStudents() {
  try {
    const response = await apiClient.get<ApiEnvelope<StaffStudentSummary[]>>(
      "/teacher/homeroom/students",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getTeacherHomeroomStudentDetail(studentId: string) {
  try {
    const response = await apiClient.get<ApiEnvelope<StaffHomeroomStudentDetail>>(
      `/teacher/homeroom/students/${studentId}`,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getTeacherHomeroomAttendanceOverview(params: {
  date?: string;
  status?: string;
  query?: string;
}) {
  try {
    const response = await apiClient.get<ApiEnvelope<StaffHomeroomAttendanceOverview>>(
      "/teacher/homeroom/attendance-overview",
      {
        params,
      },
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function reviewTeacherHomeroomAttendance(
  attendanceId: string,
  payload: StaffAttendanceReviewPayload,
) {
  try {
    const response = await apiClient.patch<ApiEnvelope<unknown>>(
      `/teacher/homeroom/attendance/${attendanceId}/review`,
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getTeacherHomeroomSubmissionsOverview(params: {
  status?: string;
  type?: string;
  query?: string;
}) {
  try {
    const response = await apiClient.get<ApiEnvelope<StaffHomeroomSubmissionOverview>>(
      "/teacher/homeroom/submissions-overview",
      {
        params,
      },
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function reviewTeacherHomeroomSubmission(
  submissionId: string,
  payload: {
    status: string;
    review_note: string;
  },
) {
  try {
    const response = await apiClient.patch<ApiEnvelope<StaffSubmission>>(
      `/teacher/homeroom/submissions/${submissionId}/review`,
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getBKDashboard() {
  try {
    const response = await apiClient.get<ApiEnvelope<StaffBKDashboard>>("/bk/dashboard");
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getBKStudentsOverview(params: {
  class_id?: string;
  risk?: string;
  query?: string;
}) {
  try {
    const response = await apiClient.get<ApiEnvelope<StaffBKStudentsOverview>>(
      "/bk/students-overview",
      { params },
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getBKStudentDetail(studentId: string) {
  try {
    const response = await apiClient.get<ApiEnvelope<StaffBKStudentDetail>>(
      `/bk/students/${studentId}`,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getBKAttendanceOverview(params: {
  date?: string;
  status?: string;
  class_id?: string;
  query?: string;
}) {
  try {
    const response = await apiClient.get<ApiEnvelope<StaffBKAttendanceOverview>>(
      "/bk/attendance-overview",
      { params },
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function reviewBKAttendance(
  attendanceId: string,
  payload: StaffAttendanceReviewPayload,
) {
  try {
    const response = await apiClient.patch<ApiEnvelope<unknown>>(
      `/bk/attendance/${attendanceId}/review`,
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getBKCounselingOverview(params: {
  class_id?: string;
  student_id?: string;
  query?: string;
}) {
  try {
    const response = await apiClient.get<ApiEnvelope<StaffBKCounselingOverview>>(
      "/bk/counseling-overview",
      { params },
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function createBKCounselingNote(
  studentId: string,
  payload: {
    title: string;
    note: string;
  },
) {
  try {
    const response = await apiClient.post<ApiEnvelope<StaffCounselingNote>>(
      `/bk/students/${studentId}/counseling-notes`,
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateBKCounselingNote(
  noteId: string,
  payload: {
    title: string;
    note: string;
  },
) {
  try {
    const response = await apiClient.patch<ApiEnvelope<StaffCounselingNote>>(
      `/bk/counseling-notes/${noteId}`,
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function deleteBKCounselingNote(noteId: string) {
  try {
    const response = await apiClient.delete<ApiEnvelope<null>>(
      `/bk/counseling-notes/${noteId}`,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getBKSubmissionsOverview(params: {
  status?: string;
  type?: string;
  class_id?: string;
  query?: string;
}) {
  try {
    const response = await apiClient.get<ApiEnvelope<StaffBKSubmissionOverview>>(
      "/bk/submissions-overview",
      { params },
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function reviewBKSubmission(
  submissionId: string,
  payload: {
    status: string;
    review_note: string;
  },
) {
  try {
    const response = await apiClient.patch<ApiEnvelope<StaffSubmission>>(
      `/bk/submissions/${submissionId}/review`,
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ─── Guru Mapel Services ─────────────────────────────────────────────────────

export async function getTeacherMe() {
  try {
    const response = await apiClient.get<ApiEnvelope<StaffTeacherMe>>("/teacher/me");
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getTeacherSubjectAssignments() {
  try {
    const response = await apiClient.get<ApiEnvelope<StaffSubjectAssignment[]>>(
      "/teacher/subject-assignments",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getTeacherSubjectCurrentSession(hari: string, jam: string) {
  try {
    const response = await apiClient.get<ApiEnvelope<StaffSubjectCurrentSession | null>>(
      "/teacher/subject/current-session",
      { params: { hari, jam } },
    );
    return response.data.data ?? null;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getTeacherSubjectAttendance(sessionId: string) {
  try {
    const response = await apiClient.get<ApiEnvelope<StaffSubjectAttendanceOverview>>(
      "/teacher/subject/attendance",
      { params: { session_id: sessionId } },
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function submitTeacherSubjectValidation(payload: StaffSubjectValidationPayload) {
  try {
    const response = await apiClient.post<ApiEnvelope<StaffSubjectCurrentSession>>(
      "/teacher/subject/attendance/validate",
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function overrideTeacherSubjectAttendance(payload: StaffSubjectOverridePayload) {
  try {
    const response = await apiClient.put<ApiEnvelope<StaffSubjectAttendanceRecord>>(
      "/teacher/subject/attendance/override",
      payload,
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getTeacherSubjectSessions(params: {
  assignment_id: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}) {
  try {
    const response = await apiClient.get<ApiEnvelope<StaffSubjectSessionList>>(
      "/teacher/subject/sessions",
      { params },
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getTeacherSubjectRecap(params: {
  assignment_id: string;
  date_from?: string;
  date_to?: string;
}) {
  try {
    const response = await apiClient.get<ApiEnvelope<StaffSubjectRecap>>(
      "/teacher/subject/recap",
      { params },
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
