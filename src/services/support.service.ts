import axios from "axios";
import { apiClient } from "@/services/api/client";
import type {
  CreatedSupportTicket,
  ResetSession,
  SupportNotificationList,
  SupportTicket,
  SupportTicketList,
} from "@/types/support";
import type {
  PublicSupportTicketForm,
  SupportTicketForm,
} from "@/lib/validations/support-schema";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  code?: string;
  errors?: Record<string, string>;
};

export async function createPublicSupportTicket(payload: PublicSupportTicketForm) {
  return unwrap<CreatedSupportTicket>(
    apiClient.post("/public/support/tickets", payload, { timeout: 20_000 }),
  );
}

export async function accessPublicSupportTicket(reference: string, accessCode: string, messageOffset = 0, messageLimit = 50) {
  return unwrap<SupportTicket>(
    apiClient.post(`/public/support/tickets/${encodeURIComponent(reference)}/access`, {
      access_code: accessCode,
      message_offset: messageOffset,
      message_limit: messageLimit,
    }),
  );
}

export async function accessPublicSupportTicketByCode(accessCode: string, messageOffset = 0, messageLimit = 50) {
  return unwrap<SupportTicket>(
    apiClient.post("/public/support/tickets/access", {
      access_code: accessCode,
      message_offset: messageOffset,
      message_limit: messageLimit,
    }),
  );
}

export async function replyPublicSupportTicket(reference: string, accessCode: string, message: string) {
  return unwrap<SupportTicket>(
    apiClient.post(`/public/support/tickets/${encodeURIComponent(reference)}/messages`, {
      access_code: accessCode,
      message,
    }),
  );
}

export async function startPasswordReset(reference: string, accessCode: string) {
  return unwrap<ResetSession>(
    apiClient.post(`/public/support/tickets/${encodeURIComponent(reference)}/reset-session`, {
      access_code: accessCode,
    }),
  );
}

export async function completePasswordReset(token: string, newPassword: string) {
  return unwrap<{ completed: true }>(
    apiClient.post("/public/support/password/reset", {
      token,
      new_password: newPassword,
    }),
  );
}

export async function getMySupportTickets(params: { limit?: number; offset?: number } = {}) {
  return unwrap<SupportTicketList>(apiClient.get("/support/tickets", { params }));
}

export async function createMySupportTicket(payload: SupportTicketForm) {
  return unwrap<CreatedSupportTicket>(apiClient.post("/support/tickets", payload));
}

export async function getMySupportTicket(reference: string, messageOffset = 0, messageLimit = 50) {
  return unwrap<SupportTicket>(apiClient.get(`/support/tickets/${encodeURIComponent(reference)}`, {
    params: { message_offset: messageOffset, message_limit: messageLimit },
  }));
}

export async function replyMySupportTicket(reference: string, message: string) {
  return unwrap<SupportTicket>(
    apiClient.post(`/support/tickets/${encodeURIComponent(reference)}/messages`, { message }),
  );
}

export async function getMySupportNotifications() {
  return unwrap<SupportNotificationList>(apiClient.get("/support/notifications"));
}

export async function markMySupportNotificationRead(notificationID: string) {
  return unwrap<{ read: true }>(apiClient.patch(`/support/notifications/${encodeURIComponent(notificationID)}/read`));
}

export async function getAdminSupportTickets(params: { status?: string; q?: string; limit?: number; offset?: number }) {
  return unwrap<SupportTicketList>(apiClient.get("/admin/support/tickets", { params }));
}

export async function getAdminSupportTicket(reference: string, messageOffset = 0, messageLimit = 50) {
  return unwrap<SupportTicket>(apiClient.get(`/admin/support/tickets/${encodeURIComponent(reference)}`, {
    params: { message_offset: messageOffset, message_limit: messageLimit },
  }));
}

export async function replyAdminSupportTicket(reference: string, message: string) {
  return unwrap<SupportTicket>(
    apiClient.post(`/admin/support/tickets/${encodeURIComponent(reference)}/messages`, { message }),
  );
}

export async function updateAdminSupportTicket(
  reference: string,
  payload: { status?: string; priority?: string },
) {
  return unwrap<SupportTicket>(
    apiClient.patch(`/admin/support/tickets/${encodeURIComponent(reference)}`, payload),
  );
}

export async function approveAdminPasswordReset(reference: string) {
  return unwrap<SupportTicket>(
    apiClient.post(`/admin/support/tickets/${encodeURIComponent(reference)}/approve-password-reset`),
  );
}

async function unwrap<T>(request: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  try {
    const response = await request;
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
      const body = error.response?.data;
      const fieldMessage = Object.values(body?.errors ?? {})[0];
      throw new Error(fieldMessage || body?.message || "Layanan bantuan belum dapat memproses permintaan.");
    }
    throw error instanceof Error ? error : new Error("Layanan bantuan belum dapat dihubungi.");
  }
}
