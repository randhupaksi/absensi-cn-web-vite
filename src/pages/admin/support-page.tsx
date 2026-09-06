import { AdminShell } from "@/features/admin/shell/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PremiumModal, premiumModalActionsClassName } from "@/components/modals/premium-modal";
import { mergeSupportMessages, TicketConversation, SupportStatusBadge, formatSupportDate } from "@/features/support/components/ticket-ui";
import { useSupportTicketLive } from "@/features/support/hooks/use-support-ticket-live";
import {
  approveAdminPasswordReset,
  getAdminSupportTicket,
  getAdminSupportTickets,
  replyAdminSupportTicket,
  updateAdminSupportTicket,
} from "@/services/support.service";
import type { SupportTicket, SupportTicketStatus } from "@/types/support";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Inbox,
  KeyRound,
  LoaderCircle,
  MessageSquareText,
  Search,
  ShieldCheck,
  TicketCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const statusOptions: Array<{ value: "ALL" | SupportTicketStatus; label: string }> = [
  { value: "ALL", label: "Semua" },
  { value: "WAITING_ADMIN", label: "Perlu dibalas" },
  { value: "WAITING_USER", label: "Menunggu pengguna" },
  { value: "RESOLVED", label: "Selesai" },
  { value: "CLOSED", label: "Ditutup" },
];

const ticketPageSize = 25;

export function AdminSupportPage() {
  return <AdminShell>{() => <AdminSupportContent />}</AdminShell>;
}

function AdminSupportContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedReference = searchParams.get("ticket") ?? "";
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [reply, setReply] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [ticketOffset, setTicketOffset] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = window.setTimeout(() => setCommittedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setTicketOffset(0);
  }, [status, committedSearch]);

  const ticketsQuery = useQuery({
    queryKey: ["admin-support-tickets", status, committedSearch, ticketOffset],
    queryFn: () => getAdminSupportTickets({ status, q: committedSearch, limit: ticketPageSize, offset: ticketOffset }),
    refetchInterval: 60_000,
  });
  const detailQuery = useQuery({
    queryKey: ["admin-support-ticket", selectedReference],
    queryFn: () => getAdminSupportTicket(selectedReference),
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

  const liveStatus = useSupportTicketLive({
    liveToken: detailQuery.data?.live_token,
    enabled: Boolean(selectedReference),
    onTicketUpdated: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-support-ticket", selectedReference] });
      void queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    },
    onRenew: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-support-ticket", selectedReference] });
    },
  });

  useEffect(() => {
    if (!selectedReference && ticketsQuery.data?.tickets[0]) {
      setSearchParams({ ticket: ticketsQuery.data.tickets[0].reference_code }, { replace: true });
    }
  }, [selectedReference, setSearchParams, ticketsQuery.data]);

  const invalidate = (reference?: string) => {
    queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    if (reference) queryClient.invalidateQueries({ queryKey: ["admin-support-ticket", reference] });
  };

  const replyMutation = useMutation({
    mutationFn: () => replyAdminSupportTicket(selectedReference, reply),
    onSuccess: (ticket) => {
      queryClient.setQueryData(["admin-support-ticket", selectedReference], (current: typeof ticket | undefined) => (
        current
          ? { ...ticket, messages: mergeSupportMessages(current.messages, ticket.messages), messages_page: current.messages_page ?? ticket.messages_page }
          : ticket
      ));
      invalidate();
      setReply("");
      toast.success("Balasan admin terkirim");
    },
    onError: (error) => toast.error("Balasan belum terkirim", { description: error.message }),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { status?: string; priority?: string }) => updateAdminSupportTicket(selectedReference, payload),
    onSuccess: (ticket) => {
      queryClient.setQueryData(["admin-support-ticket", selectedReference], ticket);
      invalidate();
      toast.success("Status tiket diperbarui");
    },
    onError: (error) => toast.error("Status belum diperbarui", { description: error.message }),
  });

  const approveMutation = useMutation({
    mutationFn: () => approveAdminPasswordReset(selectedReference),
    onSuccess: (ticket) => {
      queryClient.setQueryData(["admin-support-ticket", selectedReference], ticket);
      invalidate();
      setApproveOpen(false);
      toast.success("Reset password disetujui", { description: "Pengguna dapat membuat password baru dari tiketnya." });
    },
    onError: (error) => toast.error("Reset belum disetujui", { description: error.message }),
  });

  const loadOlderMutation = useMutation({
    mutationFn: () => getAdminSupportTicket(selectedReference, detailQuery.data?.messages?.length ?? 0),
    onSuccess: (olderTicket) => {
      queryClient.setQueryData(["admin-support-ticket", selectedReference], (current: typeof olderTicket | undefined) => (
        current
          ? { ...olderTicket, messages: mergeSupportMessages(olderTicket.messages, current.messages) }
          : olderTicket
      ));
    },
    onError: (error) => toast.error("Pesan sebelumnya belum dimuat", { description: error.message }),
  });

  const stats = useMemo(() => {
    const tickets = ticketsQuery.data?.tickets ?? [];
    return {
      total: ticketsQuery.data?.total ?? 0,
      waiting: tickets.filter((ticket) => ticket.status === "WAITING_ADMIN").length,
      unread: tickets.filter((ticket) => ticket.unread).length,
      recovery: tickets.filter((ticket) => ticket.category === "PASSWORD_RECOVERY").length,
    };
  }, [ticketsQuery.data]);

  const ticket = detailQuery.data;
  const canApprove = Boolean(
    ticket?.category === "PASSWORD_RECOVERY" &&
      ticket.account_name &&
      ["PENDING", "EXPIRED"].includes(ticket.password_reset.status) &&
      !["CLOSED", "RESOLVED"].includes(ticket.status),
  );

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[30px] border border-white/70 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_24%),linear-gradient(135deg,#ffffff_0%,#eef9f4_100%)] p-5 shadow-[0_22px_55px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-none dark:bg-slate-900 dark:shadow-none sm:p-7">
        <div className="flex gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-[18px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><Inbox className="size-6" /></span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">Support workspace</p><h1 className="mt-1 font-heading text-2xl font-semibold text-slate-950 dark:text-white sm:text-3xl">Inbox Bantuan Pengguna</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">Balas kendala, cocokkan identitas pemohon, dan berikan persetujuan reset tanpa pernah mengirim password melalui chat.</p></div></div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Total tiket" value={stats.total} icon={MessageSquareText} tone="sky" />
        <Stat label="Perlu dibalas (hal.)" value={stats.waiting} icon={Clock3} tone="amber" />
        <Stat label="Belum dibaca (hal.)" value={stats.unread} icon={CircleAlert} tone="rose" />
        <Stat label="Pemulihan akun (hal.)" value={stats.recovery} icon={KeyRound} tone="emerald" />
      </section>

      <section className="grid min-h-[620px] gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="rounded-[28px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-none">
          <div className="relative"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ID, nama, NIS, atau judul..." className="h-11 rounded-2xl pl-10" /></div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{statusOptions.map((option) => <button key={option.value} type="button" onClick={() => { setTicketOffset(0); setStatus(option.value); }} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition active:scale-[0.97] ${status === option.value ? "border-emerald-500 bg-emerald-600 text-white" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"}`}>{option.label}</button>)}</div>
          <div className="mt-4 max-h-[580px] space-y-2 overflow-y-auto pr-1">
            {ticketsQuery.isLoading ? <div className="flex min-h-48 items-center justify-center"><LoaderCircle className="animate-spin text-emerald-500" /></div> : null}
            {ticketsQuery.error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">{ticketsQuery.error.message}</div> : null}
            {!ticketsQuery.isLoading && !ticketsQuery.error && (ticketsQuery.data?.tickets.length ?? 0) === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 p-7 text-center dark:border-slate-700"><TicketCheck className="mx-auto size-8 text-emerald-500" /><p className="mt-3 font-semibold">Inbox sudah bersih</p><p className="mt-1 text-xs leading-5 text-slate-500">Tidak ada tiket pada filter ini.</p></div> : null}
            {(ticketsQuery.data?.tickets ?? []).map((item) => <button key={item.reference_code} type="button" onClick={() => setSearchParams({ ticket: item.reference_code })} className={`w-full rounded-[20px] border p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-300 active:scale-[0.985] ${selectedReference === item.reference_code ? "border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/35" : "border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-950/45"}`}><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.13em] text-emerald-600 dark:text-emerald-300">{item.reference_code}</span><div className="flex items-center gap-2">{item.priority === "HIGH" ? <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">PRIORITAS</span> : null}{item.unread ? <span className="size-2 rounded-full bg-rose-500" aria-label="Belum dibaca" /> : null}</div></div><p className="mt-2 line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white">{item.requester_name}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.subject}</p><div className="mt-3 flex items-center justify-between gap-2"><SupportStatusBadge status={item.status} /><span className="text-[10px] text-slate-400">{formatSupportDate(item.last_message_at)}</span></div></button>)}
          </div>
          <TicketPager total={ticketsQuery.data?.total ?? 0} offset={ticketOffset} pageSize={ticketPageSize} loaded={ticketsQuery.data?.tickets.length ?? 0} onPrevious={() => setTicketOffset((current) => Math.max(0, current - ticketPageSize))} onNext={() => setTicketOffset((current) => current + ticketPageSize)} />
        </aside>

        <div className="space-y-4">
          {ticket ? (
            <div className="flex flex-wrap items-center gap-2 rounded-[22px] border border-slate-200 bg-white/90 p-3 dark:border-slate-700 dark:bg-slate-900/90">
              <select value={ticket.status} onChange={(event) => { const nextStatus = event.target.value; if (nextStatus === "CLOSED" && ticket.status !== "CLOSED") { setCloseOpen(true); return; } updateMutation.mutate({ status: nextStatus }); }} disabled={updateMutation.isPending} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold dark:border-slate-600 dark:bg-slate-950"><option value="WAITING_ADMIN">Menunggu admin</option><option value="WAITING_USER">Menunggu pengguna</option><option value="RESOLVED">Selesai</option><option value="CLOSED">Ditutup</option></select>
              <button type="button" onClick={() => updateMutation.mutate({ priority: ticket.priority === "HIGH" ? "NORMAL" : "HIGH" })} className={`h-10 rounded-xl border px-4 text-sm font-semibold transition active:scale-[0.97] ${ticket.priority === "HIGH" ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200" : "border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"}`}>{ticket.priority === "HIGH" ? "Prioritas tinggi" : "Prioritas normal"}</button>
              {ticket.category === "PASSWORD_RECOVERY" ? <Button type="button" variant="success" className="ml-auto h-10 rounded-xl px-4" disabled={!canApprove || approveMutation.isPending} onClick={() => setApproveOpen(true)}><ShieldCheck /> {ticket.password_reset.status === "APPROVED" ? "Reset sudah disetujui" : ticket.password_reset.status === "COMPLETED" ? "Password diperbarui" : "Setujui reset"}</Button> : null}
            </div>
          ) : null}
          {detailQuery.isLoading ? <div className="flex min-h-[520px] items-center justify-center rounded-[28px] border border-slate-200 bg-white/90 dark:border-slate-700 dark:bg-slate-900"><LoaderCircle className="size-7 animate-spin text-emerald-500" /></div> : null}
          {detailQuery.error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">{detailQuery.error.message}</div> : null}
          {ticket ? <TicketConversation ticket={ticket} reply={reply} onReplyChange={setReply} onReply={() => replyMutation.mutate()} isReplying={replyMutation.isPending} onLoadOlder={() => loadOlderMutation.mutate()} isLoadingOlder={loadOlderMutation.isPending} adminView liveStatus={liveStatus} /> : null}
          {!selectedReference && !detailQuery.isLoading ? <div className="flex min-h-[520px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white/70 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60"><Inbox className="size-10 text-emerald-500" /><h2 className="mt-4 font-heading text-xl font-semibold">Pilih tiket dari inbox</h2><p className="mt-2 text-sm text-slate-500">Detail identitas, percakapan, dan tindakan keamanan akan tampil di sini.</p></div> : null}
        </div>
      </section>

      <PremiumModal open={approveOpen} onOpenChange={setApproveOpen} title="Konfirmasi reset password" description="Persetujuan membuka akses bagi pemohon untuk membuat password baru." icon={ShieldCheck} className="sm:!max-w-[620px]" footer={<div className={premiumModalActionsClassName}><Button type="button" variant="secondary" className="h-11 rounded-xl px-5" onClick={() => setApproveOpen(false)}>Batal</Button><Button type="button" variant="success" className="h-11 rounded-xl px-5" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate()}>{approveMutation.isPending ? <LoaderCircle className="animate-spin" /> : <CheckCircle2 />} Konfirmasi persetujuan</Button></div>}>
        <div className="space-y-4"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-100"><strong>Periksa sebelum menyetujui.</strong> Cocokkan nama pemohon, NIS/username, dan akun terdeteksi. Jangan meminta atau mengirim password melalui percakapan.</div>{ticket ? <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-900"><p><span className="text-slate-500">Tiket:</span> <strong>{ticket.reference_code}</strong></p><p><span className="text-slate-500">Pemohon:</span> <strong>{ticket.requester_name}</strong></p><p><span className="text-slate-500">Akun:</span> <strong>{ticket.account_name || "Belum terdeteksi"}</strong></p><p><span className="text-slate-500">Identitas:</span> <strong>{ticket.account_identifier || "-"}</strong></p></div> : null}</div>
      </PremiumModal>
      <PremiumModal open={closeOpen} onOpenChange={setCloseOpen} title="Tutup tiket ini?" description="Tiket tertutup tidak dapat dibalas kembali oleh pemohon." icon={CircleAlert} className="sm:!max-w-[580px]" footer={<div className={premiumModalActionsClassName}><Button type="button" variant="secondary" className="h-11 rounded-xl px-5" onClick={() => setCloseOpen(false)}>Batal</Button><Button type="button" variant="destructive" className="h-11 rounded-xl px-5" disabled={updateMutation.isPending} onClick={() => updateMutation.mutate({ status: "CLOSED" }, { onSuccess: () => setCloseOpen(false) })}>{updateMutation.isPending ? <LoaderCircle className="animate-spin" /> : <CheckCircle2 />} Tutup tiket</Button></div>}>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-100"><strong>Pastikan tidak ada tindakan lanjutan.</strong> Untuk kendala yang sudah selesai, pilih status <em>Selesai</em>. Gunakan <em>Ditutup</em> hanya untuk tiket duplikat, tidak sah, atau yang tidak dapat diverifikasi.</div>
      </PremiumModal>
    </div>
  );
}

function TicketPager({ total, offset, pageSize, loaded, onPrevious, onNext }: { total: number; offset: number; pageSize: number; loaded: number; onPrevious: () => void; onNext: () => void }) {
  if (total <= pageSize) return null;
  const start = loaded === 0 ? 0 : offset + 1;
  const end = Math.min(offset + loaded, total);
  return <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400"><span>{start}–{end} dari {total}</span><div className="flex gap-1"><Button type="button" variant="secondary" size="icon-sm" aria-label="Halaman sebelumnya" disabled={offset === 0} onClick={onPrevious}><ChevronLeft /></Button><Button type="button" variant="secondary" size="icon-sm" aria-label="Halaman berikutnya" disabled={offset + pageSize >= total} onClick={onNext}><ChevronRight /></Button></div></div>;
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Inbox; tone: "sky" | "amber" | "rose" | "emerald" }) {
  const colors = { sky: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300", amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300", rose: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300", emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" }[tone];
  return <article className="flex items-center justify-between gap-3 rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="mt-2 font-heading text-2xl font-semibold text-slate-950 dark:text-white">{value}</p></div><span className={`flex size-11 items-center justify-center rounded-2xl ${colors}`}><Icon className="size-5" /></span></article>;
}
