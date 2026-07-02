import { apiClient } from "@/services/api/client";
import type {
  StudentDailyReportPayload,
  StudentDashboard,
  StudentHistory,
  StudentProfile,
  StudentSubmission,
  StudentToday,
} from "@/types/student";
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
      "Terjadi kesalahan saat menghubungkan portal siswa."
    );
  }

  return error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.";
}

export async function getStudentDashboard() {
  try {
    const response = await apiClient.get<ApiEnvelope<StudentDashboard>>(
      "/student/dashboard",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getStudentToday() {
  try {
    const response = await apiClient.get<ApiEnvelope<StudentToday>>("/student/today");
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getStudentHistory() {
  try {
    const response = await apiClient.get<ApiEnvelope<StudentHistory>>(
      "/student/history",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getStudentProfile() {
  try {
    const response = await apiClient.get<ApiEnvelope<StudentProfile>>(
      "/student/profile",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getStudentSubmissions() {
  try {
    const response = await apiClient.get<ApiEnvelope<StudentSubmission[]>>(
      "/student/submissions",
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function submitStudentDailyReport(payload: StudentDailyReportPayload) {
  try {
    const formData = new FormData();
    formData.append("type", payload.type);
    formData.append("reason", payload.reason ?? "");
    formData.append("photo", payload.photo);

    const response = await apiClient.post<ApiEnvelope<StudentToday>>(
      "/student/daily-report",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
