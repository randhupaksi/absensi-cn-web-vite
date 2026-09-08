/* oxlint-disable react/only-export-components -- Shared ticket labels and formatters belong with the support presentation components. */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { type ReactNode } from "react";

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

export function SupportStatusBadge({ status, adminView = false }: { status: SupportTicketStatus; adminView?: boolean }) {
  const label = adminView && status === "WAITING_USER" ? "Menunggu Balasan Pengguna" : supportStatusLabels[status];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        status === "WAITING_ADMIN" && "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200",
        (status === "OPEN" || status === "WAITING_USER") && "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950/50 dark:text-sky-200",
        status === "RESOLVED" && "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200",
        status === "CLOSED" && "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",
      )}
    >
      {label}
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
  const latestSystemMessage = [...(ticket.messages ?? [])].reverse().find((message) => message.sender_role === "SYSTEM");

  return (
    <section className="min-w-0 w-full overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_22px_60px_rgba(15,23,42,0.09)] dark:border-slate-700 dark:bg-slate-950/85 dark:shadow-none">
      {adminToolbar ? <div className="border-b border-slate-200/80 bg-white/90 p-3 dark:border-slate-700 dark:bg-slate-900/90 sm:px-6">{adminToolbar}</div> : null}
      <header className="min-w-0 border-b-2 border-slate-200/90 bg-white/95 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20 sm:p-6">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 w-full gap-3">
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
              <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">
                {supportCategoryLabels[ticket.category]} · Dibuat {formatSupportDate(ticket.created_at)}
              </p>
            </div>
          </div>
            <div className="flex min-w-0 w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
            {liveStatus ? <span className="hidden sm:inline-flex"><LiveStatus status={liveStatus} /></span> : null}
            <span className="inline-flex sm:hidden"><SupportStatusBadge status={ticket.status} adminView={adminView} /></span>
            {adminView ? <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:hidden ${ticket.priority === "HIGH" ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200" : "border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"}`}>{ticket.priority === "HIGH" ? "Prioritas tinggi" : "Prioritas normal"}</span> : null}
            <span className="hidden sm:inline-flex"><SupportStatusBadge status={ticket.status} adminView={adminView} /></span>
          </div>
        </div>

        {adminView ? (
          <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-white/75 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/70 sm:grid-cols-3">
            <Info label="Akun terdeteksi" value={ticket.account_name ? formatSupportRequesterName(ticket.account_name, ticket.portal) : "Belum cocok"} />
            <Info label={ticket.portal === "student" ? "NIS" : "Username"} value={ticket.account_identifier || "-"} />
            <Info className="hidden sm:block" label="Waktu pengajuan" value={formatSupportDate(ticket.created_at)} />
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

      <div className="min-w-0 max-w-full max-h-[440px] space-y-4 overflow-y-auto bg-slate-100/80 p-4 dark:bg-slate-950/60 sm:p-6">
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
              className={cn("flex min-w-0 max-w-full", requester ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "min-w-0 max-w-[88%] break-words rounded-[22px] border px-4 py-3 text-sm leading-6 sm:max-w-[76%]",
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

      <footer className="border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        {canReply ? (
          <SupportReplyComposer
            value={reply}
            onChange={onReplyChange}
            onSubmit={onReply}
            isSubmitting={isReplying}
            placeholder={adminView ? "Tulis pesan untuk user..." : "Tulis pesan untuk admin..."}
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

function SupportReplyComposer({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  placeholder: string;
}) {
  return (
    <div className="space-y-2" data-support-reply-composer>
      <div className="relative">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={1500}
          aria-label="Pesan balasan"
          placeholder={placeholder}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              if (!isSubmitting && value.trim().length >= 2) onSubmit();
            }
          }}
          className="h-14 rounded-[1.25rem] border-white/60 bg-white px-4 pr-16 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-12px_30px_rgba(255,255,255,0.2)] transition duration-300 hover:border-emerald-300/85 hover:bg-white active:border-emerald-400 active:bg-white focus-visible:border-emerald-400 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-emerald-200/55 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none dark:hover:!border-emerald-400/55 dark:hover:!bg-slate-900 dark:hover:!ring-1 dark:hover:!ring-emerald-400/18 dark:active:!border-emerald-300 dark:active:!bg-slate-900 dark:active:!ring-1 dark:active:!ring-emerald-400/28 dark:focus-visible:!border-emerald-300 dark:focus-visible:!bg-slate-900 dark:focus-visible:!ring-2 dark:focus-visible:!ring-emerald-400/24"
        />
        <Button
          type="button"
          variant="success"
          size="icon"
          aria-label="Kirim balasan"
          title="Kirim balasan"
          className="absolute inset-y-0 right-3 my-auto size-10 rounded-full p-0 shadow-none hover:shadow-none focus-visible:shadow-none active:shadow-none disabled:shadow-none"
          disabled={isSubmitting || value.trim().length < 2}
          onClick={onSubmit}
        >
          {isSubmitting ? <LoaderCircle className="animate-spin" /> : <SendHorizontal />}
        </Button>
      </div>
    </div>
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

function Info({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 break-words font-semibold text-slate-800 dark:text-slate-100">{value}</p>
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

export function formatSupportRequesterName(value?: string, portal?: string) {
  return portal === "student" ? formatSupportName(value) : (value ?? "").trim();
}
