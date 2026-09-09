import type {
  SupportMessage,
  SupportNotificationList,
  SupportTicket,
  SupportTicketList,
} from "@/types/support";
import { replaceEqualDeep, type QueryClient } from "@tanstack/react-query";

type TicketListScope = "admin" | "user";

// Detail requests can overlap while polling, replying, or loading an older
// page. Keep the cache merge in the data layer so UI components only render.
function mergeSupportMessages(...groups: Array<SupportMessage[] | undefined>) {
  const messagesByID = new Map<string, SupportMessage>();
  groups.flat().forEach((message) => {
    if (message) messagesByID.set(message.id, message);
  });
  return Array.from(messagesByID.values()).sort(
    (left, right) =>
      new Date(left.created_at).getTime() -
      new Date(right.created_at).getTime(),
  );
}

export const supportQueryKeys = {
  publicTickets: () => ["public-support-ticket"] as const,
  publicTicket: (reference?: string) =>
    ["public-support-ticket", reference] as const,
  userTickets: () => ["my-support-tickets"] as const,
  userTicket: (reference?: string) => ["my-support-ticket", reference] as const,
  userNotifications: () => ["my-support-notifications"] as const,
  adminTickets: () => ["admin-support-tickets"] as const,
  adminTicket: (reference?: string) =>
    ["admin-support-ticket", reference] as const,
};

export function mergeTicketDetail(
  current: SupportTicket | undefined,
  next: SupportTicket,
) {
  if (!current) return next;

  return replaceEqualDeep(current, {
    ...next,
    messages: mergeSupportMessages(current.messages, next.messages),
    messages_page: current.messages_page ?? next.messages_page,
  });
}

export function mergeOlderTicketMessages(
  current: SupportTicket | undefined,
  older: SupportTicket,
) {
  if (!current) return older;

  return replaceEqualDeep(current, {
    ...older,
    messages: mergeSupportMessages(older.messages, current.messages),
    messages_page: {
      ...older.messages_page,
      offset: 0,
      limit: (older.messages?.length ?? 0) + (current.messages?.length ?? 0),
      has_more: older.messages_page?.has_more ?? false,
    },
  });
}

export function updateCachedTicketLists(
  queryClient: QueryClient,
  scope: TicketListScope,
  ticket: SupportTicket,
) {
  const queryKey =
    scope === "admin"
      ? supportQueryKeys.adminTickets()
      : supportQueryKeys.userTickets();
  queryClient.setQueriesData<SupportTicketList>({ queryKey }, (current) => {
    if (!current) return current;
    const index = current.tickets.findIndex(
      (item) => item.reference_code === ticket.reference_code,
    );
    if (index < 0) return current;

    const tickets = [...current.tickets];
    tickets[index] = {
      ...tickets[index],
      ...ticket,
      messages: undefined,
      messages_page: undefined,
      live_token: undefined,
    };
    return { ...current, tickets };
  });
}

export function prependCachedUserTicket(
  queryClient: QueryClient,
  ticket: SupportTicket,
) {
  queryClient.setQueriesData<SupportTicketList>(
    { queryKey: supportQueryKeys.userTickets() },
    (current) => {
      if (
        !current ||
        current.tickets.some(
          (item) => item.reference_code === ticket.reference_code,
        )
      )
        return current;
      if (current.tickets.length === 0)
        return { ...current, tickets: [ticket], total: current.total + 1 };
      return current;
    },
  );
}

export function removeCachedUserTicket(
  queryClient: QueryClient,
  reference: string,
) {
  queryClient.setQueriesData<SupportTicketList>(
    { queryKey: supportQueryKeys.userTickets() },
    (current) => {
      if (
        !current ||
        !current.tickets.some((ticket) => ticket.reference_code === reference)
      )
        return current;
      return {
        ...current,
        total: Math.max(0, current.total - 1),
        tickets: current.tickets.filter(
          (ticket) => ticket.reference_code !== reference,
        ),
      };
    },
  );
}

export function markCachedSupportNotificationRead(
  queryClient: QueryClient,
  notificationID: string,
) {
  queryClient.setQueryData<SupportNotificationList>(
    supportQueryKeys.userNotifications(),
    (current) => {
      if (!current) return current;
      const target = current.notifications.find(
        (notification) => notification.id === notificationID,
      );
      if (!target || target.read) return current;

      return {
        ...current,
        unread_count: Math.max(0, current.unread_count - 1),
        notifications: current.notifications.map((notification) =>
          notification.id === notificationID
            ? { ...notification, read: true }
            : notification,
        ),
      };
    },
  );
}
