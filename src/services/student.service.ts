import { apiClient } from "@/services/api/client";
import {
  retryTransientRequest,
  type TransientRetryEvent,
} from "@/services/api/transient-retry";
import type {
  StudentDailyReportPayload,
  StudentDashboard,
  StudentHistory,
  StudentProfile,
  StudentSubmission,
  StudentToday,
} from "@/types/student";
import { getUserErrorMessage } from "@/lib/user-error-message";
import axios from "axios";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string>;
};

export class StudentAttendanceSubmissionUncertainError extends Error {
  constructor() {
    super("Status absensi belum dapat dipastikan.");
    this.name = "StudentAttendanceSubmissionUncertainError";
  }
}

export class StudentServerBusyError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Server sedang menerima banyak permintaan.");
    this.name = "StudentServerBusyError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function getErrorMessage(error: unknown) {
  return getUserErrorMessage(error, "student");
}

export async function getStudentDashboard() {
  try {
    const response =
      await apiClient.get<ApiEnvelope<StudentDashboard>>("/student/dashboard");
    return response.data.data;
  } catch (error) {
    const serverBusyError = getStudentServerBusyError(error);
    if (serverBusyError) throw serverBusyError;
    throw new Error(getErrorMessage(error));
  }
}

export async function markStudentNotificationRead(notificationId: string) {
  try {
    await apiClient.patch<ApiEnvelope<null>>(
      `/student/notifications/${notificationId}/read`,
    );
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function markAllStudentNotificationsRead() {
  try {
    await apiClient.patch<ApiEnvelope<null>>("/student/notifications/read-all");
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getStudentToday() {
  return getStudentTodayWithTimeout();
}

export async function getStudentTodayWithTimeout(timeout?: number) {
  try {
    const response = await apiClient.get<ApiEnvelope<StudentToday>>(
      "/student/today",
      { timeout },
    );
    return response.data.data;
  } catch (error) {
    const serverBusyError = getStudentServerBusyError(error);
    if (serverBusyError) throw serverBusyError;
    throw new Error(getErrorMessage(error));
  }
}

function getStudentServerBusyError(error: unknown) {
  if (!axios.isAxiosError<{ code?: string }>(error)) return null;
  if (
    error.response?.status !== 429 ||
    error.response.data?.code !== "SERVER_BUSY"
  ) {
    return null;
  }

  const retryAfter = Number(error.response.headers?.["retry-after"]);
  return new StudentServerBusyError(
    Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 3,
  );
}

export async function getStudentHistory() {
  try {
    const response =
      await apiClient.get<ApiEnvelope<StudentHistory>>("/student/history");
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getStudentProfile() {
  try {
    const response =
      await apiClient.get<ApiEnvelope<StudentProfile>>("/student/profile");
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

export async function submitStudentDailyReport(
  payload: StudentDailyReportPayload,
  onUploadProgress?: (progress: number) => void,
  onRetry?: (event: TransientRetryEvent) => void,
) {
  try {
    const response = await retryTransientRequest(
      () => {
        const formData = new FormData();
        formData.append("type", payload.type);
        formData.append("reason", payload.reason ?? "");
        formData.append("photo", payload.photo);
        if (payload.location.latitude !== undefined) {
          formData.append(
            "location_latitude",
            String(payload.location.latitude),
          );
        }
        if (payload.location.longitude !== undefined) {
          formData.append(
            "location_longitude",
            String(payload.location.longitude),
          );
        }
        if (payload.location.accuracy_meters !== undefined) {
          formData.append(
            "location_accuracy_meters",
            String(payload.location.accuracy_meters),
          );
        }
        if (payload.location.captured_at) {
          formData.append("location_captured_at", payload.location.captured_at);
        }
        formData.append(
          "location_client_status",
          payload.location.client_status,
        );

        return apiClient.post<ApiEnvelope<StudentToday>>(
          "/student/daily-report",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            // Keep the live attendance flow bounded on slower mobile
            // browsers. A timed-out request is reconciled before retrying,
            // so a record that reached the server is never submitted twice.
            timeout: 45_000,
            onUploadProgress: (event) => {
              if (!event.total) return;
              onUploadProgress?.(
                Math.min(95, (event.loaded / event.total) * 100),
              );
            },
          },
        );
      },
      6,
      {
        onRetry: (event) => {
          if (isServerBusyAttendanceRequest(event.error)) onRetry?.(event);
        },
      },
    );
    return response.data.data;
  } catch (error) {
    if (isUncertainAttendanceSubmission(error)) {
      throw new StudentAttendanceSubmissionUncertainError();
    }
    throw new Error(getErrorMessage(error));
  }
}

function isUncertainAttendanceSubmission(error: unknown) {
  if (!axios.isAxiosError<{ code?: string }>(error)) return false;
  if (!error.response) return true;
  if (
    error.response.status === 409 &&
    ["ATTENDANCE_ALREADY_RECORDED", "ATTENDANCE_ALREADY_SUBMITTED"].includes(
      error.response.data?.code ?? "",
    )
  ) {
    // A previous timed-out upload may have reached the API successfully.
    // Reconcile /today instead of showing a false failure or submitting again.
    return true;
  }
  return [429, 502, 503, 504].includes(error.response.status);
}

function isServerBusyAttendanceRequest(error: unknown) {
  if (!axios.isAxiosError<{ code?: string }>(error)) return false;
  return (
    error.response?.status === 429 &&
    error.response.data?.code !== "LOGIN_LOCKED"
  );
}
