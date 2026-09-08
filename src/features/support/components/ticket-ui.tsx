import { Button } from "@/components/ui/button";
import { SupportReplyComposer } from "@/features/support/components/support-reply-composer";
import { TicketConversationHeader } from "@/features/support/components/ticket-conversation-header";
import { TicketMessageList } from "@/features/support/components/ticket-message-list";
import type { SupportLiveStatus, SupportTicket } from "@/types/support";
import { CheckCircle2, KeyRound, LoaderCircle } from "lucide-react";
import { type ReactNode } from "react";

export function TicketConversation({
  ticket,
  reply,
  onReplyChange,
  onReply,
  isReplying,
  onStartReset,
  isStartingReset,
  onLoadOlder,
  isLoadingOlder = false,
  adminView = false,
  liveStatus,
  adminToolbar,
}: {
  ticket: SupportTicket;
  reply: string;
  onReplyChange: (value: string) => void;
  onReply: () => void;
  isReplying: boolean;
  onStartReset?: () => void;
  isStartingReset?: boolean;
  onLoadOlder?: () => void;
  isLoadingOlder?: boolean;
  adminView?: boolean;
  liveStatus?: SupportLiveStatus;
  adminToolbar?: ReactNode;
}) {
  const canReply = ticket.status !== "CLOSED";
  const resetApproved = ticket.password_reset.status === "APPROVED";

  return (
    <section className="min-w-0 w-full overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_22px_60px_rgba(15,23,42,0.09)] dark:border-slate-700 dark:bg-slate-950/85 dark:shadow-none">
      {adminToolbar ? (
        <div className="border-b border-slate-200/80 bg-white/90 p-3 dark:border-slate-700 dark:bg-slate-900/90 sm:px-6">
          {adminToolbar}
        </div>
      ) : null}
      <TicketConversationHeader
        ticket={ticket}
        adminView={adminView}
        liveStatus={liveStatus}
      />
      <TicketMessageList
        ticket={ticket}
        adminView={adminView}
        onLoadOlder={onLoadOlder}
        isLoadingOlder={isLoadingOlder}
      />

      {resetApproved && onStartReset ? (
        <div className="border-t border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/25 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <KeyRound className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-emerald-950 dark:text-emerald-100">
                  Reset password telah disetujui
                </p>
                <p className="mt-1 text-xs leading-5 text-emerald-800/75 dark:text-emerald-200/70">
                  Token aman dibuat saat tombol ditekan dan berlaku selama 20
                  menit.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="success"
              className="h-11 rounded-2xl px-5"
              disabled={isStartingReset}
              onClick={onStartReset}
            >
              {isStartingReset ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <KeyRound />
              )}
              Buat password baru
            </Button>
          </div>
        </div>
      ) : null}

      <footer className="border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        {canReply ? (
          <SupportReplyComposer
            value={reply}
            onChange={onReplyChange}
            onSubmit={onReply}
            isSubmitting={isReplying}
            placeholder={
              adminView
                ? "Tulis pesan untuk user..."
                : "Tulis pesan untuk admin..."
            }
          />
        ) : (
          <div className="flex items-center gap-3 rounded-2xl bg-slate-100 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <CheckCircle2 className="size-5 text-emerald-500" />
            Tiket telah ditutup. Buat tiket baru bila masih membutuhkan bantuan.
          </div>
        )}
      </footer>
    </section>
  );
}
