export type SupportTicketStatus =
  | "OPEN"
  | "WAITING_ADMIN"
  | "WAITING_USER"
  | "RESOLVED"
  | "CLOSED";

export type SupportTicketCategory =
  | "PASSWORD_RECOVERY"
  | "ACCOUNT_ACCESS"
  | "TECHNICAL"
  | "OTHER";

export type SupportMessage = {
  id: string;
  sender_role: "REQUESTER" | "ADMIN" | "SYSTEM";
  sender_name: string;
  body: string;
  created_at: string;
};

export type SupportMessagePage = {
  offset: number;
  limit: number;
  has_more: boolean;
};

export type SupportLiveStatus = "connecting" | "live" | "reconnecting" | "offline";

export type SupportTicket = {
  id?: string;
  reference_code: string;
  requester_name: string;
  portal: "student" | "staff";
  account_identifier?: string;
  account_name?: string;
  account_role?: string;
  category: SupportTicketCategory;
  subject: string;
  status: SupportTicketStatus;
  priority: "NORMAL" | "HIGH";
  last_message_at: string;
  last_message_by: "REQUESTER" | "ADMIN" | "SYSTEM";
  unread: boolean;
  created_at: string;
  updated_at: string;
  messages?: SupportMessage[];
  messages_page?: SupportMessagePage;
  live_token?: string;
  password_reset: {
    status: "NOT_APPLICABLE" | "PENDING" | "APPROVED" | "EXPIRED" | "COMPLETED";
    expires_at?: string;
  };
};

export type CreatedSupportTicket = {
  ticket: SupportTicket;
  access_code: string;
};

export type SupportTicketList = {
  tickets: SupportTicket[];
  total: number;
};

export type ResetSession = {
  token: string;
  expires_at: string;
  portal: "student" | "staff";
};

export type SupportNotification = {
  id: string;
  type: string;
  priority: "info" | "warning" | string;
  title: string;
  description: string;
  action_url: string;
  read: boolean;
  created_at: string;
};

export type SupportNotificationList = {
  notifications: SupportNotification[];
  unread_count: number;
};

export type PublicTicketCredentials = {
  referenceCode: string;
  accessCode: string;
};
