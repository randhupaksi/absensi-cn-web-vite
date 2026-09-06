import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { mergeSupportMessages, TicketConversation, SupportStatusBadge, formatSupportDate, supportCategoryLabels } from "@/features/support/components/ticket-ui";
import { useSupportTicketLive } from "@/features/support/hooks/use-support-ticket-live";
import { supportTicketSchema, type SupportTicketForm } from "@/lib/validations/support-schema";
import {
  createMySupportTicket,
  getMySupportNotifications,
  getMySupportTicket,
  getMySupportTickets,
  markMySupportNotificationRead,
  replyMySupportTicket,
} from "@/services/support.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, ChevronLeft, ChevronRight, Headphones, LifeBuoy, LoaderCircle, MessageSquarePlus, Plus, Search, ShieldCheck, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import type { SupportTicket } from "@/types/support";

const ticketPageSize = 25;

export function UserSupportCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedReference = searchParams.get("ticket") ?? "";
  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState("");
  const [ticketOffset, setTicketOffset] = useState(0);
  const queryClient = useQueryClient();

  const ticketsQuery = useQuery({
    queryKey: ["my-support-tickets", ticketOffset],
    queryFn: () => getMySupportTickets({ limit: ticketPageSize, offset: ticketOffset }),
    refetchInterval: 60_000,
  });
  const detailQuery = useQuery({
    queryKey: ["my-support-ticket", selectedReference],
    queryFn: () => getMySupportTicket(selectedReference),
    enabled: Boolean(selectedReference),
    refetchInterval: 60_000,
    structuralSharing: (current, next) => {
      const currentTicket = current as SupportTicket | undefined;
      const nextTicket = next as SupportTicket;
      return (currentTicket?.messages?.length ?? 0) > (nextTicket.messages?.length ?? 0)
        ? { ...nextTicket, messages: mergeSupportMessages(currentTicket?.messages, nextTicket.messages), messages_page: currentTicket?.messages_page }
        : nextTicket;
    },
  });
  const notificationsQuery = useQuery({
    queryKey: ["my-support-notifications"],
    queryFn: getMySupportNotifications,
    refetchInterval: 60_000,
  });
  const liveStatus = useSupportTicketLive({
    liveToken: detailQuery.data?.live_token,
    enabled: Boolean(selectedReference),
    onTicketUpdated: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-support-ticket", selectedReference] });
      void queryClient.invalidateQueries({ queryKey: ["my-support-tickets"] });
      void queryClient.invalidateQueries({ queryKey: ["my-support-notifications"] });
    },
    onRenew: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-support-ticket", selectedReference] });
    },
  });

  useEffect(() => {
    if (!selectedReference && ticketsQuery.data?.tickets[0]) {
      setSearchParams({ ticket: ticketsQuery.data.tickets[0].reference_code }, { replace: true });
    }
  }, [selectedReference, setSearchParams, ticketsQuery.data]);

  const form = useForm<SupportTicketForm>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: { category: "TECHNICAL", subject: "", message: "" },
  });

  const createMutation = useMutation({
    mutationFn: createMySupportTicket,
    onSuccess: (result) => {
    queryClient.invalidateQueries({ queryKey: ["my-support-tickets"] });
      queryClient.setQueryData(["my-support-ticket", result.ticket.reference_code], result.ticket);
      setSearchParams({ ticket: result.ticket.reference_code });
      setShowCreate(false);
      form.reset();
      toast.success("Tiket bantuan dibuat");
    },
    onError: (error) => toast.error("Tiket belum dibuat", { description: error.message }),
  });

  const replyMutation = useMutation({
    mutationFn: () => replyMySupportTicket(selectedReference, reply),
    onSuccess: (ticket) => {
      queryClient.setQueryData(["my-support-ticket", selectedReference], (current: typeof ticket | undefined) => (
        current
          ? { ...ticket, messages: mergeSupportMessages(current.messages, ticket.messages), messages_page: current.messages_page ?? ticket.messages_page }
          : ticket
      ));
      queryClient.invalidateQueries({ queryKey: ["my-support-tickets"] });
      setReply("");
    },
    onError: (error) => toast.error("Balasan belum terkirim", { description: error.message }),
  });

  const markNotificationMutation = useMutation({
    mutationFn: markMySupportNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-support-notifications"] }),
  });

  const filteredTickets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const tickets = ticketsQuery.data?.tickets ?? [];
    if (!normalized) return tickets;
    return tickets.filter((ticket) =>
      [ticket.reference_code, ticket.subject, supportCategoryLabels[ticket.category]]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, ticketsQuery.data]);

  const loadOlderMutation = useMutation({
    mutationFn: () => getMySupportTicket(selectedReference, detailQuery.data?.messages?.length ?? 0),
    onSuccess: (olderTicket) => {
      queryClient.setQueryData(["my-support-ticket", selectedReference], (current: typeof olderTicket | undefined) => (
        current
          ? { ...olderTicket, messages: mergeSupportMessages(olderTicket.messages, current.messages) }
          : olderTicket
      ));
    },
    onError: (error) => toast.error("Pesan sebelumnya belum dimuat", { description: error.message }),
  });

  const openNotification = (notificationID: string, actionURL: string) => {
    const reference = new URL(actionURL, window.location.origin).searchParams.get("ticket");
    markNotificationMutation.mutate(notificationID);
    if (reference) setSearchParams({ ticket: reference });
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[30px] border border-white/70 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.25),transparent_26%),linear-gradient(135deg,#ffffff_0%,#f0faf5_100%)] p-5 shadow-[0_22px_55px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-none dark:bg-slate-900 dark:shadow-none sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-[18px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><LifeBuoy className="size-6" /></span>
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">Pusat bantuan</p><h1 className="mt-1 font-heading text-2xl font-semibold text-slate-950 dark:text-white sm:text-3xl">Percakapan langsung dengan admin</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Sampaikan kendala, pantau status, dan simpan seluruh jawaban dalam satu tiket.</p></div>
          </div>
          <Button type="button" variant="success" className="h-11 rounded-2xl px-5" onClick={() => setShowCreate(true)}><Plus /> Buat tiket</Button>
        </div>
      </section>

      {(notificationsQuery.data?.notifications.length ?? 0) > 0 ? (
        <section className="rounded-[24px] border border-sky-200/80 bg-sky-50/75 p-4 dark:border-sky-900/70 dark:bg-sky-950/20">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sky-950 dark:text-sky-100"><span className="flex size-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-900/70 dark:text-sky-300"><BellRing className="size-4" /></span><div><h2 className="text-sm font-semibold">Pembaruan tiket</h2><p className="text-xs text-sky-700/80 dark:text-sky-300/80">Balasan admin tersimpan di sini agar tidak terlewat.</p></div></div>{notificationsQuery.data?.unread_count ? <span className="rounded-full bg-sky-600 px-2.5 py-1 text-[10px] font-bold text-white">{notificationsQuery.data.unread_count} baru</span> : null}</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">{notificationsQuery.data?.notifications.slice(0, 4).map((notification) => <button key={notification.id} type="button" onClick={() => openNotification(notification.id, notification.action_url)} className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:border-sky-300 active:scale-[0.985] ${notification.read ? "border-sky-100 bg-white/65 dark:border-sky-900/50 dark:bg-slate-950/30" : "border-sky-300 bg-white shadow-[0_8px_20px_rgba(14,116,144,0.08)] dark:border-sky-800 dark:bg-slate-900"}`}><p className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white">{notification.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{notification.description}</p><p className="mt-2 text-[10px] text-slate-400">{formatSupportDate(notification.created_at)}</p></button>)}</div>
        </section>
      ) : null}

      {showCreate ? (
        <form onSubmit={form.handleSubmit((values) => createMutation.mutate(values))} className="rounded-[28px] border border-emerald-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] dark:border-emerald-900 dark:bg-slate-900 sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><h2 className="font-heading text-xl font-semibold">Tiket bantuan baru</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Jangan tulis password atau data rahasia di dalam pesan.</p></div><button type="button" aria-label="Tutup formulir" onClick={() => setShowCreate(false)} className="flex size-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="size-4" /></button></div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2"><Label>Kategori</Label><select {...form.register("category")} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-200 dark:border-slate-600 dark:bg-slate-950 dark:focus:ring-emerald-900"><option value="TECHNICAL">Kendala teknis</option><option value="ACCOUNT_ACCESS">Akses akun</option><option value="OTHER">Lainnya</option></select></div>
            <div className="space-y-2"><Label>Judul kendala</Label><Input {...form.register("subject")} placeholder="Contoh: Kamera tidak dapat dibuka" className="h-11 rounded-xl px-3" />{form.formState.errors.subject ? <p className="text-xs text-rose-600">{form.formState.errors.subject.message}</p> : null}</div>
          </div>
          <div className="mt-5 space-y-2"><Label>Detail kendala</Label><Textarea {...form.register("message")} maxLength={1500} rows={4} className="min-h-28 rounded-xl px-4 py-3" placeholder="Jelaskan halaman, waktu kejadian, dan pesan yang tampil..." />{form.formState.errors.message ? <p className="text-xs text-rose-600">{form.formState.errors.message.message}</p> : null}</div>
          <div className="mt-5 flex justify-end gap-3"><Button type="button" variant="secondary" className="h-10 rounded-xl px-5" onClick={() => setShowCreate(false)}>Batal</Button><Button type="submit" variant="success" className="h-10 rounded-xl px-5" disabled={createMutation.isPending}>{createMutation.isPending ? <LoaderCircle className="animate-spin" /> : <MessageSquarePlus />} Kirim tiket</Button></div>
        </form>
      ) : null}

      <section className="grid min-h-[560px] gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-[28px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-none">
          <div className="relative"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari tiket di halaman ini..." className="h-11 rounded-2xl pl-10" /></div>
          <div className="mt-4 max-h-[570px] space-y-2 overflow-y-auto pr-1">
            {ticketsQuery.isLoading ? <div className="flex min-h-40 items-center justify-center"><LoaderCircle className="animate-spin text-emerald-500" /></div> : null}
            {!ticketsQuery.isLoading && filteredTickets.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700"><Headphones className="mx-auto size-7 text-slate-400" /><p className="mt-3 font-semibold">Belum ada tiket</p><p className="mt-1 text-xs leading-5 text-slate-500">Buat tiket ketika kamu membutuhkan bantuan admin.</p></div> : null}
            {filteredTickets.map((ticket) => <button key={ticket.reference_code} type="button" onClick={() => setSearchParams({ ticket: ticket.reference_code })} className={`w-full rounded-[20px] border p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-300 active:scale-[0.985] ${selectedReference === ticket.reference_code ? "border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/35" : "border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-950/45"}`}><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.13em] text-emerald-600 dark:text-emerald-300">{ticket.reference_code}</span>{ticket.unread ? <span className="size-2 rounded-full bg-rose-500" aria-label="Ada balasan baru" /> : null}</div><p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-white">{ticket.subject}</p><div className="mt-3 flex items-center justify-between gap-2"><SupportStatusBadge status={ticket.status} /><span className="text-[10px] text-slate-400">{formatSupportDate(ticket.last_message_at)}</span></div></button>)}
          </div>
          <TicketPager total={ticketsQuery.data?.total ?? 0} offset={ticketOffset} pageSize={ticketPageSize} loaded={ticketsQuery.data?.tickets.length ?? 0} onPrevious={() => setTicketOffset((current) => Math.max(0, current - ticketPageSize))} onNext={() => setTicketOffset((current) => current + ticketPageSize)} />
        </aside>

        <div>
          {detailQuery.isLoading ? <div className="flex min-h-[500px] items-center justify-center rounded-[28px] border border-slate-200 bg-white/90 dark:border-slate-700 dark:bg-slate-900"><LoaderCircle className="size-7 animate-spin text-emerald-500" /></div> : null}
          {detailQuery.data ? <TicketConversation ticket={detailQuery.data} reply={reply} onReplyChange={setReply} onReply={() => replyMutation.mutate()} isReplying={replyMutation.isPending} onLoadOlder={() => loadOlderMutation.mutate()} isLoadingOlder={loadOlderMutation.isPending} liveStatus={liveStatus} /> : null}
          {!selectedReference && !detailQuery.isLoading ? <div className="flex min-h-[500px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white/70 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60"><ShieldCheck className="size-10 text-emerald-500" /><h2 className="mt-4 font-heading text-xl font-semibold">Pilih tiket untuk membuka percakapan</h2></div> : null}
        </div>
      </section>
    </div>
  );
}

function TicketPager({ total, offset, pageSize, loaded, onPrevious, onNext }: { total: number; offset: number; pageSize: number; loaded: number; onPrevious: () => void; onNext: () => void }) {
  if (total <= pageSize) return null;
  const start = loaded === 0 ? 0 : offset + 1;
  const end = Math.min(offset + loaded, total);
  return <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400"><span>{start}–{end} dari {total}</span><div className="flex gap-1"><Button type="button" variant="secondary" size="icon-sm" aria-label="Halaman sebelumnya" disabled={offset === 0} onClick={onPrevious}><ChevronLeft /></Button><Button type="button" variant="secondary" size="icon-sm" aria-label="Halaman berikutnya" disabled={offset + pageSize >= total} onClick={onNext}><ChevronRight /></Button></div></div>;
}
