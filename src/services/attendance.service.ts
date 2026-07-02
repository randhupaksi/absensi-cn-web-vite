import { apiClient } from "@/services/api/client";

export async function getAttendanceHistory() {
  const response = await apiClient.get("/attendance");
  return response.data;
}

export async function submitAttendanceCheckIn() {
  const response = await apiClient.post("/attendance/check-in");
  return response.data;
}

export async function submitAttendanceCheckOut() {
  const response = await apiClient.post("/attendance/check-out");
  return response.data;
}
