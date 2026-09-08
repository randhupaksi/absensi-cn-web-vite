import {
  SupportStatusBadge,
  formatSupportDate,
  formatSupportRequesterName,
  supportCategoryLabels,
} from "@/features/support/components/ticket-display";
import { cn } from "@/lib/utils";
import type { SupportLiveStatus, SupportTicket } from "@/types/support";
import { MessageSquareText, ShieldCheck } from "lucide-react";

type TicketConversationHeaderProps = {
  ticket: SupportTicket;
  adminView: boolean;
  liveStatus?: SupportLiveStatus;
};

export function TicketConversationHeader({
  ticket,
  adminView,
  liveStatus,
}: TicketConversationHeaderProps) {
  const latestSystemMessage = [...(ticket.messages ?? [])]
    .reverse()
    .find((message) => message.sender_role === "SYSTEM");

  return (
    <header className="min-w-0 overflow-hidden border-b-2 border-slate-200/90 bg-white/95 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20 sm:p-6">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 w-full items-start gap-3 sm:items-center">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 sm:size-12">
              <MessageSquareText className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300">
                {ticket.reference_code}
              </p>
              <h2 className="mt-1 break-words font-heading text-xl font-semibold leading-tight text-slate-950 dark:text-white">
                {ticket.subject}
              </h2>
            </div>
          </div>
          <p className="mt-2 break-words text-sm leading-5 text-slate-500 dark:text-slate-400 sm:ml-[60px]">
            {supportCategoryLabels[ticket.category]} · Dibuat{" "}
            {formatSupportDate(ticket.created_at)}
          </p>
        </div>
        <div className="flex min-w-0 w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
          {liveStatus ? (
            <span className="hidden sm:inline-flex">
              <LiveStatus status={liveStatus} />
            </span>
          ) : null}
          <span className="inline-flex sm:hidden">
            <SupportStatusBadge status={ticket.status} adminView={adminView} />
          </span>
          {adminView ? (
            <PriorityBadge priority={ticket.priority} className="sm:hidden" />
          ) : null}
          <span className="hidden sm:inline-flex">
            <SupportStatusBadge status={ticket.status} adminView={adminView} />
          </span>
        </div>
      </div>

      {adminView ? (
        <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-white/75 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/70 sm:grid-cols-3">
          <SupportInfo
            label="Akun terdeteksi"
            value={
              ticket.account_name
                ? formatSupportRequesterName(ticket.account_name, ticket.portal)
                : "Belum cocok"
            }
          />
          <SupportInfo
            label={ticket.portal === "student" ? "NIS" : "Username"}
            value={ticket.account_identifier || "-"}
          />
          <SupportInfo
            className="hidden sm:block"
            label="Waktu pengajuan"
            value={formatSupportDate(ticket.created_at)}
          />
        </div>
      ) : null}

      {latestSystemMessage ? (
        <div className="mt-5 rounded-2xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-amber-950 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-100">
          <div className="flex items-center gap-2 text-xs font-bold">
            <ShieldCheck className="size-4 shrink-0" />
            <span>Pemberitahuan sistem</span>
          </div>
          <p className="mt-2 text-sm leading-6">{latestSystemMessage.body}</p>
          <p className="mt-2 text-[10px] text-amber-800/70 dark:text-amber-200/70">
            {formatSupportDate(latestSystemMessage.created_at)}
          </p>
        </div>
      ) : null}
    </header>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: SupportTicket["priority"];
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        priority === "HIGH"
          ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
          : "border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300",
        className,
      )}
    >
      {priority === "HIGH" ? "Prioritas tinggi" : "Prioritas normal"}
    </span>
  );
}

function LiveStatus({ status }: { status: SupportLiveStatus }) {
  const live = status === "live";
  const label = live
    ? "Live"
    : status === "connecting"
      ? "Menyambungkan"
      : status === "reconnecting"
        ? "Menyambungkan ulang"
        : "Pembaruan berkala";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-semibold",
        live
          ? "text-emerald-700 dark:text-emerald-300"
          : "text-slate-500 dark:text-slate-400",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          live ? "animate-pulse bg-emerald-500" : "bg-slate-400",
        )}
      />
      {label}
    </span>
  );
}

function SupportInfo({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}
