/* oxlint-disable react/only-export-components -- Shared ticket labels and formatters belong with the support presentation components. */

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { SupportLiveStatus, SupportMessage, SupportTicket, SupportTicketStatus } from "@/types/support";
import {
  CheckCircle2,
  Clock3,
  KeyRound,
  LoaderCircle,
  MessageSquareText,
  SendHorizontal,
  ShieldCheck,
} from "lucide-react";

export const supportStatusLabels: Record<SupportTicketStatus, string> = {
  OPEN: "Baru",
  WAITING_ADMIN: "Menunggu Admin",
  WAITING_USER: "Menunggu Balasanmu",
  RESOLVED: "Selesai",
  CLOSED: "Ditutup",
};

export const supportCategoryLabels = {
  PASSWORD_RECOVERY: "Lupa password",
  ACCOUNT_ACCESS: "Akses akun",
  TECHNICAL: "Kendala teknis",
  OTHER: "Lainnya",
} as const;

// Detail requests can overlap while polling, replying, or loading an older
// page. A single merge point prevents duplicates and keeps the transcript in
// chronological order without losing already loaded history.
export function mergeSupportMessages(...groups: Array<SupportMessage[] | undefined>) {
  const messagesByID = new Map<string, SupportMessage>();
  groups.flat().forEach((message) => {
    if (message) messagesByID.set(message.id, message);
  });
  return Array.from(messagesByID.values()).sort((left, right) => (
    new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
  ));
}

export function SupportStatusBadge({ status }: { status: SupportTicketStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        status === "WAITING_ADMIN" && "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200",
        (status === "OPEN" || status === "WAITING_USER") && "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950/50 dark:text-sky-200",
        status === "RESOLVED" && "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200",
        status === "CLOSED" && "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",
      )}
    >
      {supportStatusLabels[status]}
    </span>
  );
}

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
}) {
  const canReply = ticket.status !== "CLOSED";
  const resetApproved = ticket.password_reset.status === "APPROVED";
  const latestSystemMessage = [...(ticket.messages ?? [])].reverse().find((message) => message.sender_role === "SYSTEM");

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_22px_60px_rgba(15,23,42,0.09)] dark:border-slate-700 dark:bg-slate-950/85 dark:shadow-none">
      <header className="border-b-2 border-slate-200/90 bg-white/95 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/20 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <MessageSquareText className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300">
                {ticket.reference_code}
              </p>
              <h2 className="mt-1 font-heading text-xl font-semibold text-slate-950 dark:text-white">
                {ticket.subject}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {supportCategoryLabels[ticket.category]} · Dibuat {formatSupportDate(ticket.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {liveStatus ? <LiveStatus status={liveStatus} /> : null}
            <SupportStatusBadge status={ticket.status} />
          </div>
        </div>

        {adminView ? (
          <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-white/75 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/70 sm:grid-cols-3">
            <Info label="Pemohon" value={ticket.requester_name} />
            <Info label="Akun terdeteksi" value={ticket.account_name || "Belum cocok"} />
            <Info label={ticket.portal === "student" ? "NIS" : "Username"} value={ticket.account_identifier || "-"} />
          </div>
        ) : null}

        {latestSystemMessage ? (
          <div className="mt-5 rounded-2xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-amber-950 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-100">
            <div className="flex items-center gap-2 text-xs font-bold">
              <ShieldCheck className="size-4 shrink-0" />
              <span>Pemberitahuan sistem</span>
            </div>
            <p className="mt-2 text-sm leading-6">{latestSystemMessage.body}</p>
            <p className="mt-2 text-[10px] text-amber-800/70 dark:text-amber-200/70">{formatSupportDate(latestSystemMessage.created_at)}</p>
          </div>
        ) : null}
      </header>

      <div className="max-h-[440px] space-y-4 overflow-y-auto bg-slate-100/80 p-4 dark:bg-slate-950/60 sm:p-6">
        {ticket.messages_page?.has_more && onLoadOlder ? (
          <div className="flex justify-center">
            <Button type="button" variant="secondary" className="h-9 rounded-xl px-4 text-xs" disabled={isLoadingOlder} onClick={onLoadOlder}>
              {isLoadingOlder ? <LoaderCircle className="animate-spin" /> : <Clock3 />}
              Muat pesan sebelumnya
            </Button>
          </div>
        ) : null}
        {(ticket.messages ?? []).map((message) => {
          const requester = message.sender_role === "REQUESTER";
          const system = message.sender_role === "SYSTEM";
          return (
            <article
              key={message.id}
              className={cn("flex", requester ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[88%] rounded-[22px] border px-4 py-3 text-sm leading-6 sm:max-w-[76%]",
                  requester
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
                <p className={cn("mt-2 text-[10px]", requester ? "text-emerald-50/80" : "text-slate-400")}>
                  {formatSupportDate(message.created_at)}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      {resetApproved && onStartReset ? (
        <div className="border-t border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/25 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <KeyRound className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-emerald-950 dark:text-emerald-100">Reset password telah disetujui</p>
                <p className="mt-1 text-xs leading-5 text-emerald-800/75 dark:text-emerald-200/70">
                  Token aman dibuat saat tombol ditekan dan berlaku selama 20 menit.
                </p>
              </div>
            </div>
            <Button type="button" variant="success" className="h-11 rounded-2xl px-5" disabled={isStartingReset} onClick={onStartReset}>
              {isStartingReset ? <LoaderCircle className="animate-spin" /> : <KeyRound />}
              Buat password baru
            </Button>
          </div>
        </div>
      ) : null}

      <footer className="border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/80 sm:p-6">
        {canReply ? (
          <div className="space-y-3">
            <Textarea
              value={reply}
              onChange={(event) => onReplyChange(event.target.value)}
              maxLength={1500}
              rows={3}
              placeholder={adminView ? "Tulis balasan yang jelas dan tidak memuat password..." : "Tulis balasan untuk admin..."}
              className="min-h-24 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950/60"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400">{reply.length}/1500</p>
              <Button type="button" variant="success" className="h-10 rounded-2xl px-5" disabled={isReplying || reply.trim().length < 2} onClick={onReply}>
                {isReplying ? <LoaderCircle className="animate-spin" /> : <SendHorizontal />}
                Kirim balasan
              </Button>
            </div>
          </div>
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

function LiveStatus({ status }: { status: SupportLiveStatus }) {
  const live = status === "live";
  const label = live ? "Live" : status === "connecting" ? "Menyambungkan" : status === "reconnecting" ? "Menyambungkan ulang" : "Pembaruan berkala";
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold", live ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400")}>
      <span className={cn("size-1.5 rounded-full", live ? "animate-pulse bg-emerald-500" : "bg-slate-400")} />
      {label}
    </span>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 truncate font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}

export function formatSupportDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatSupportName(value?: string) {
  return (value ?? "")
    .trim()
    .toLocaleLowerCase("id-ID")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.split("-").map((part) => part ? `${part.charAt(0).toLocaleUpperCase("id-ID")}${part.slice(1)}` : part).join("-"))
    .join(" ");
}
