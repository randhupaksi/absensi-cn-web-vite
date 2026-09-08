import { Button } from "@/components/ui/button";
import {
  formatSupportDate,
  formatSupportName,
} from "@/features/support/components/ticket-display";
import { cn } from "@/lib/utils";
import type { SupportTicket } from "@/types/support";
import { Clock3, LoaderCircle, ShieldCheck } from "lucide-react";

type TicketMessageListProps = {
  ticket: SupportTicket;
  adminView: boolean;
  onLoadOlder?: () => void;
  isLoadingOlder: boolean;
};

export function TicketMessageList({
  ticket,
  adminView,
  onLoadOlder,
  isLoadingOlder,
}: TicketMessageListProps) {
  return (
    <div className="min-w-0 max-w-full max-h-[440px] space-y-4 overflow-y-auto bg-slate-100/80 p-4 dark:bg-slate-950/60 sm:p-6">
      {ticket.messages_page?.has_more && onLoadOlder ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            className="h-9 rounded-xl px-4 text-xs"
            disabled={isLoadingOlder}
            onClick={onLoadOlder}
          >
            {isLoadingOlder ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Clock3 />
            )}
            Muat pesan sebelumnya
          </Button>
        </div>
      ) : null}
      {(ticket.messages ?? []).map((message) => {
        const requester = message.sender_role === "REQUESTER";
        const admin = message.sender_role === "ADMIN";
        const system = message.sender_role === "SYSTEM";
        const primary = adminView ? admin : requester;
        return (
          <article
            key={message.id}
            className={cn(
              "flex min-w-0 max-w-full",
              primary ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "min-w-0 max-w-[88%] break-words rounded-[22px] border px-4 py-3 text-sm leading-6 sm:max-w-[76%]",
                primary
                  ? "rounded-br-md border-emerald-300 bg-emerald-600 text-white shadow-[0_12px_26px_rgba(5,150,105,0.18)]"
                  : system
                    ? "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/45 dark:text-amber-100"
                    : "rounded-bl-md border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
              )}
            >
              <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold">
                {system ? <ShieldCheck className="size-3.5" /> : null}
                <span>{formatSupportName(message.sender_name)}</span>
              </div>
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
              <p
                className={cn(
                  "mt-2 text-[10px]",
                  primary ? "text-emerald-50/80" : "text-slate-400",
                )}
              >
                {formatSupportDate(message.created_at)}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
