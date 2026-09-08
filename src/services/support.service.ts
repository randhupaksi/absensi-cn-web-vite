import axios from "axios";
import { apiClient } from "@/services/api/client";
import type {
  CreatedSupportTicket,
  ResetSession,
  SupportNotificationList,
  SupportTicket,
  SupportTicketCategory,
  SupportTicketList,
  SupportTicketStatus,
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

type SupportApiError = Error & { code?: string; status?: number };

export async function createPublicSupportTicket(
  payload: PublicSupportTicketForm,
) {
  return unwrap<CreatedSupportTicket>(
    apiClient.post("/public/support/tickets", payload, mutationConfig(20_000)),
  );
}

export async function accessPublicSupportTicket(
  reference: string,
  accessCode: string,
  messageOffset = 0,
  messageLimit = 50,
) {
  return unwrap<SupportTicket>(
    apiClient.post(
      `/public/support/tickets/${encodeURIComponent(reference)}/access`,
      {
        access_code: accessCode,
        message_offset: messageOffset,
        message_limit: messageLimit,
      },
    ),
  );
}

export async function accessPublicSupportTicketByCode(
  accessCode: string,
  messageOffset = 0,
  messageLimit = 50,
) {
  return unwrap<SupportTicket>(
    apiClient.post("/public/support/tickets/access", {
      access_code: accessCode,
      message_offset: messageOffset,
      message_limit: messageLimit,
    }),
  );
}

export async function replyPublicSupportTicket(
  reference: string,
  accessCode: string,
  message: string,
) {
  return unwrap<SupportTicket>(
    apiClient.post(
      `/public/support/tickets/${encodeURIComponent(reference)}/messages`,
      {
        access_code: accessCode,
        message,
      },
      mutationConfig(),
    ),
  );
}

export async function startPasswordReset(
  reference: string,
  accessCode: string,
) {
  return unwrap<ResetSession>(
    apiClient.post(
      `/public/support/tickets/${encodeURIComponent(reference)}/reset-session`,
      {
        access_code: accessCode,
      },
      mutationConfig(),
    ),
  );
}

export async function completePasswordReset(
  token: string,
  newPassword: string,
) {
  return unwrap<{ completed: true }>(
    apiClient.post(
      "/public/support/password/reset",
      {
        token,
        new_password: newPassword,
      },
      mutationConfig(),
    ),
  );
}

export async function getMySupportTickets(
  params: {
    status?: "ALL" | SupportTicketStatus;
    category?: "ALL" | SupportTicketCategory;
    q?: string;
    limit?: number;
    offset?: number;
  } = {},
) {
  return unwrap<SupportTicketList>(
    apiClient.get("/support/tickets", { params }),
  );
}

export async function createMySupportTicket(payload: SupportTicketForm) {
  return unwrap<CreatedSupportTicket>(
    apiClient.post("/support/tickets", payload, mutationConfig()),
  );
}

export async function getMySupportTicket(
  reference: string,
  messageOffset = 0,
  messageLimit = 50,
) {
  return unwrap<SupportTicket>(
    apiClient.get(`/support/tickets/${encodeURIComponent(reference)}`, {
      params: { message_offset: messageOffset, message_limit: messageLimit },
    }),
  );
}

export async function deleteMySupportTicket(reference: string) {
  return unwrap<{ deleted: true }>(
    apiClient.delete(
      `/support/tickets/${encodeURIComponent(reference)}`,
      mutationConfig(),
    ),
  );
}

export async function deleteAdminSupportTicket(reference: string) {
  return unwrap<{ deleted: true }>(
    apiClient.delete(
      `/admin/support/tickets/${encodeURIComponent(reference)}`,
      mutationConfig(),
    ),
  );
}

export async function replyMySupportTicket(reference: string, message: string) {
  return unwrap<SupportTicket>(
    apiClient.post(
      `/support/tickets/${encodeURIComponent(reference)}/messages`,
      { message },
      mutationConfig(),
    ),
  );
}

export async function getMySupportNotifications() {
  return unwrap<SupportNotificationList>(
    apiClient.get("/support/notifications"),
  );
}

export async function markMySupportNotificationRead(notificationID: string) {
  return unwrap<{ read: true }>(
    apiClient.patch(
      `/support/notifications/${encodeURIComponent(notificationID)}/read`,
    ),
  );
}

export type SupportTicketListParams = {
  status?: "ALL" | SupportTicketStatus;
  q?: string;
  limit?: number;
  offset?: number;
};

export async function getAdminSupportTickets(params: SupportTicketListParams) {
  return unwrap<SupportTicketList>(
    apiClient.get("/admin/support/tickets", { params }),
  );
}

export async function getAdminSupportTicket(
  reference: string,
  messageOffset = 0,
  messageLimit = 50,
) {
  return unwrap<SupportTicket>(
    apiClient.get(`/admin/support/tickets/${encodeURIComponent(reference)}`, {
      params: { message_offset: messageOffset, message_limit: messageLimit },
    }),
  );
}

export async function replyAdminSupportTicket(
  reference: string,
  message: string,
) {
  return unwrap<SupportTicket>(
    apiClient.post(
      `/admin/support/tickets/${encodeURIComponent(reference)}/messages`,
      { message },
      mutationConfig(),
    ),
  );
}

export async function updateAdminSupportTicket(
  reference: string,
  payload: { status?: SupportTicketStatus; priority?: "NORMAL" | "HIGH" },
) {
  return unwrap<SupportTicket>(
    apiClient.patch(
      `/admin/support/tickets/${encodeURIComponent(reference)}`,
      payload,
      mutationConfig(),
    ),
  );
}

export async function approveAdminPasswordReset(reference: string) {
  return unwrap<SupportTicket>(
    apiClient.post(
      `/admin/support/tickets/${encodeURIComponent(reference)}/approve-password-reset`,
      undefined,
      mutationConfig(),
    ),
  );
}

export async function rejectAdminPasswordReset(
  reference: string,
  reason: string,
) {
  return unwrap<SupportTicket>(
    apiClient.post(
      `/admin/support/tickets/${encodeURIComponent(reference)}/reject-password-reset`,
      { reason },
      mutationConfig(),
    ),
  );
}

function mutationConfig(timeout?: number) {
  return {
    ...(timeout ? { timeout } : {}),
    headers: { "Idempotency-Key": crypto.randomUUID() },
  };
}

async function unwrap<T>(
  request: Promise<{ data: ApiEnvelope<T> }>,
): Promise<T> {
  try {
    const response = await request;
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
      const body = error.response?.data;
      const fieldMessage = Object.values(body?.errors ?? {})[0];
      const apiError = new Error(
        fieldMessage ||
          body?.message ||
          "Layanan bantuan belum dapat memproses permintaan.",
      ) as SupportApiError;
      apiError.code = body?.code;
      apiError.status = error.response?.status;
      throw apiError;
    }
    throw error instanceof Error
      ? error
      : new Error("Layanan bantuan belum dapat dihubungi.");
  }
}
