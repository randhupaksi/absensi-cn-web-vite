import { AdminShell } from "@/features/admin/shell/shell";
import { Button } from "@/components/ui/button";
import { RadixSelectField } from "@/components/ui/radix-select";
import { Textarea } from "@/components/ui/textarea";
import {
  ModalActions,
  SearchFilterBar,
} from "@/features/admin/management/shared/section-ui";
import { PremiumModal } from "@/components/modals/premium-modal";
import {
  mergeSupportMessages,
  TicketConversation,
  SupportStatusBadge,
  formatSupportDate,
  formatSupportRequesterName,
} from "@/features/support/components/ticket-ui";
import { useSupportTicketLive } from "@/features/support/hooks/use-support-ticket-live";
import {
  approveAdminPasswordReset,
  getAdminSupportTicket,
  getAdminSupportTickets,
  rejectAdminPasswordReset,
  replyAdminSupportTicket,
  updateAdminSupportTicket,
} from "@/services/support.service";
import type { SupportTicket, SupportTicketStatus } from "@/types/support";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Fingerprint,
  Inbox,
  KeyRound,
  LoaderCircle,
  MessageSquareText,
  ShieldCheck,
  TicketCheck,
  Ticket,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const statusOptions: Array<{
  value: "ALL" | SupportTicketStatus;
  label: string;
}> = [
  { value: "ALL", label: "Semua" },
  { value: "WAITING_ADMIN", label: "Perlu dibalas" },
  { value: "WAITING_USER", label: "Menunggu pengguna" },
  { value: "RESOLVED", label: "Selesai" },
  { value: "CLOSED", label: "Ditutup" },
];

const ticketPageSize = 5;

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
  const [resetDecision, setResetDecision] = useState<"APPROVE" | "REJECT">(
    "APPROVE",
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionHovered, setRejectionHovered] = useState(false);
  const [rejectionFocused, setRejectionFocused] = useState(false);
  const [ticketOffset, setTicketOffset] = useState(0);
  const shouldScrollToDetail = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!approveOpen) return;
    setResetDecision("APPROVE");
    setRejectionReason("");
  }, [approveOpen]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setCommittedSearch(search.trim()),
      250,
    );
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setTicketOffset(0);
  }, [status, committedSearch]);

  const ticketsQuery = useQuery({
    queryKey: ["admin-support-tickets", status, committedSearch, ticketOffset],
    queryFn: () =>
      getAdminSupportTickets({
        status,
        q: committedSearch,
        limit: ticketPageSize,
        offset: ticketOffset,
      }),
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
      return (currentTicket?.messages?.length ?? 0) >
        (nextTicket.messages?.length ?? 0)
        ? {
            ...nextTicket,
            messages: mergeSupportMessages(
              currentTicket?.messages,
              nextTicket.messages,
            ),
            messages_page: currentTicket?.messages_page,
          }
        : nextTicket;
    },
  });

  const liveStatus = useSupportTicketLive({
    liveToken: detailQuery.data?.live_token,
    enabled: Boolean(selectedReference),
    onTicketUpdated: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin-support-ticket", selectedReference],
      });
      void queryClient.invalidateQueries({
        queryKey: ["admin-support-tickets"],
      });
    },
    onRenew: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin-support-ticket", selectedReference],
      });
    },
  });

  useEffect(() => {
    if (!selectedReference && ticketsQuery.data?.tickets[0]) {
      setSearchParams(
        { ticket: ticketsQuery.data.tickets[0].reference_code },
        { replace: true },
      );
    }
  }, [selectedReference, setSearchParams, ticketsQuery.data]);

  useEffect(() => {
    if (!selectedReference || !shouldScrollToDetail.current) return;
    shouldScrollToDetail.current = false;
    window.requestAnimationFrame(() => {
      document
        .getElementById("support-ticket-detail")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [selectedReference]);

  const invalidate = (reference?: string) => {
    queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    if (reference)
      queryClient.invalidateQueries({
        queryKey: ["admin-support-ticket", reference],
      });
  };

  const replyMutation = useMutation({
    mutationFn: () => replyAdminSupportTicket(selectedReference, reply),
    onSuccess: (ticket) => {
      queryClient.setQueryData(
        ["admin-support-ticket", selectedReference],
        (current: typeof ticket | undefined) =>
          current
            ? {
                ...ticket,
                messages: mergeSupportMessages(
                  current.messages,
                  ticket.messages,
                ),
                messages_page: current.messages_page ?? ticket.messages_page,
              }
            : ticket,
      );
      invalidate();
      setReply("");
      toast.success("Balasan admin terkirim");
    },
    onError: (error) =>
      toast.error("Balasan belum terkirim", { description: error.message }),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { status?: string; priority?: string }) =>
      updateAdminSupportTicket(selectedReference, payload),
    onSuccess: (ticket) => {
      queryClient.setQueryData(
        ["admin-support-ticket", selectedReference],
        ticket,
      );
      invalidate();
      toast.success("Status tiket diperbarui");
    },
    onError: (error) =>
      toast.error("Status belum diperbarui", { description: error.message }),
  });

  const approveMutation = useMutation({
    mutationFn: () => approveAdminPasswordReset(selectedReference),
    onSuccess: (ticket) => {
      queryClient.setQueryData(
        ["admin-support-ticket", selectedReference],
        ticket,
      );
      invalidate();
      setApproveOpen(false);
      toast.success("Reset password disetujui", {
        description: "Pengguna dapat membuat password baru dari tiketnya.",
      });
    },
    onError: (error) =>
      toast.error("Reset belum disetujui", { description: error.message }),
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      rejectAdminPasswordReset(selectedReference, rejectionReason.trim()),
    onSuccess: (ticket) => {
      queryClient.setQueryData(
        ["admin-support-ticket", selectedReference],
        ticket,
      );
      invalidate();
      setApproveOpen(false);
      setRejectionReason("");
      toast.success("Pengajuan reset password ditolak", {
        description: "Alasan penolakan sudah dikirim ke pengguna.",
      });
    },
    onError: (error) =>
      toast.error("Penolakan belum diproses", { description: error.message }),
  });

  const loadOlderMutation = useMutation({
    mutationFn: () =>
      getAdminSupportTicket(
        selectedReference,
        detailQuery.data?.messages?.length ?? 0,
      ),
    onSuccess: (olderTicket) => {
      queryClient.setQueryData(
        ["admin-support-ticket", selectedReference],
        (current: typeof olderTicket | undefined) =>
          current
            ? {
                ...olderTicket,
                messages: mergeSupportMessages(
                  olderTicket.messages,
                  current.messages,
                ),
              }
            : olderTicket,
      );
    },
    onError: (error) =>
      toast.error("Pesan sebelumnya belum dimuat", {
        description: error.message,
      }),
  });

  const stats = useMemo(() => {
    const tickets = ticketsQuery.data?.tickets ?? [];
    return {
      total: ticketsQuery.data?.total ?? 0,
      waiting: tickets.filter((ticket) => ticket.status === "WAITING_ADMIN")
        .length,
      unread: tickets.filter((ticket) => ticket.unread).length,
      recovery: tickets.filter(
        (ticket) => ticket.category === "PASSWORD_RECOVERY",
      ).length,
    };
  }, [ticketsQuery.data]);

  const ticket = detailQuery.data;
  const canProcessReset = Boolean(
    ticket?.category === "PASSWORD_RECOVERY" &&
    ["PENDING", "EXPIRED"].includes(ticket.password_reset.status) &&
    !["CLOSED", "RESOLVED"].includes(ticket.status),
  );

  const resetProcessPending =
    approveMutation.isPending || rejectMutation.isPending;
  const rejectionReasonLength = rejectionReason.trim().length;
  const resetDecisionInvalid =
    resetDecision === "REJECT" && rejectionReasonLength < 10;
  const rejectionReasonInvalid =
    resetDecision === "REJECT" &&
    rejectionReasonLength > 0 &&
    rejectionReasonLength < 10;
  const rejectionSurfaceStyle = rejectionReasonInvalid
    ? rejectionFocused
      ? { borderColor: "rgba(244,63,94,0.82)", boxShadow: "0 0 0 3px rgba(244,63,94,0.22)" }
      : rejectionHovered
        ? { borderColor: "rgba(251,113,133,0.78)", boxShadow: "0 0 0 1px rgba(244,63,94,0.12)" }
        : undefined
    : rejectionFocused
      ? { borderColor: "rgba(16,185,129,0.82)", boxShadow: "0 0 0 3px rgba(16,185,129,0.22)" }
      : rejectionHovered
        ? { borderColor: "rgba(52,211,153,0.72)", boxShadow: "0 0 0 1px rgba(16,185,129,0.12)" }
        : { boxShadow: "0 14px 30px rgba(15,23,42,0.05)" };
  const resetActionLabel =
    ticket?.password_reset.status === "APPROVED"
      ? "Reset disetujui"
      : ticket?.password_reset.status === "COMPLETED"
      ? "Berhasil"
        : ticket?.status === "RESOLVED"
          ? "Pengajuan selesai"
          : "Proses pengajuan";

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[30px] border border-white/70 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_24%),linear-gradient(135deg,#ffffff_0%,#eef9f4_100%)] p-5 shadow-[0_22px_55px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-none dark:bg-slate-900 dark:shadow-none sm:p-7">
        <div className="flex min-w-0 gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[18px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <Inbox className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
              Support workspace
            </p>
            <h1 className="mt-1 break-words font-heading text-2xl font-semibold text-slate-950 dark:text-white sm:text-3xl">
              Inbox Bantuan<span className="hidden sm:inline"> Pengguna</span>
            </h1>
            <p className="mt-2 hidden max-w-3xl break-words text-sm leading-6 text-slate-500 dark:text-slate-400 sm:block">
              Kelola percakapan bantuan, cocokkan identitas pemohon, berikan
              keputusan pemulihan akun, dan pastikan setiap tindak lanjut
              tersampaikan dengan aman tanpa mengirim password melalui chat.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat
          label="Total tiket"
          value={stats.total}
          icon={MessageSquareText}
          tone="sky"
        />
        <Stat
          label="Perlu dibalas"
          value={stats.waiting}
          icon={Clock3}
          tone="amber"
        />
        <Stat
          label="Belum dibaca"
          value={stats.unread}
          icon={CircleAlert}
          tone="rose"
        />
        <Stat
          label="Pemulihan akun"
          value={stats.recovery}
          icon={KeyRound}
          tone="emerald"
        />
      </section>

      <section className="grid min-w-0 min-h-[620px] gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="h-fit min-w-0 w-full self-start rounded-[28px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-none">
          <SearchFilterBar
            value={search}
            onChange={setSearch}
            placeholder="Mulai dari ID, nama, NIS, atau judul..."
          />
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant="ghost"
                onClick={() => {
                  setTicketOffset(0);
                  setStatus(option.value);
                }}
                className={`h-auto shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition-none ${status === option.value ? "border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-600" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-emerald-950/50"}`}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="mt-4 max-h-[650px] space-y-2 overflow-y-auto overscroll-contain pr-0 sm:pr-3 [touch-action:pan-y] [-webkit-overflow-scrolling:touch]">
            {ticketsQuery.isLoading ? (
              <div className="flex min-h-48 items-center justify-center">
                <LoaderCircle className="animate-spin text-emerald-500" />
              </div>
            ) : null}
            {ticketsQuery.error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                {ticketsQuery.error.message}
              </div>
            ) : null}
            {!ticketsQuery.isLoading &&
            !ticketsQuery.error &&
            (ticketsQuery.data?.tickets.length ?? 0) === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-7 text-center dark:border-slate-700">
                <TicketCheck className="mx-auto size-8 text-emerald-500" />
                <p className="mt-3 font-semibold">Inbox sudah bersih</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Tidak ada tiket pada filter ini.
                </p>
              </div>
            ) : null}
            {(ticketsQuery.data?.tickets ?? []).map((item) => (
              <button
                key={item.reference_code}
                type="button"
                onClick={() => {
                  shouldScrollToDetail.current = true;
                  setSearchParams({ ticket: item.reference_code });
                }}
                className={`w-full rounded-[20px] border p-4 text-left transition-[border-color,transform] hover:border-emerald-300 dark:hover:!border-emerald-400/70 active:scale-[0.985] ${selectedReference === item.reference_code ? "border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/35" : "border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-950/45"}`}
              >
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-[10px] font-bold uppercase tracking-[0.13em] text-emerald-600 dark:text-emerald-300">
                    {item.reference_code}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    {item.priority === "HIGH" ? (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        PRIORITAS
                      </span>
                    ) : null}
                    {item.unread ? (
                      <span
                        className="size-2 rounded-full bg-rose-500"
                        aria-label="Belum dibaca"
                      />
                    ) : null}
                  </div>
                </div>
                <p className="mt-2 line-clamp-1 break-words text-sm font-semibold text-slate-900 dark:text-white">
                  {formatSupportRequesterName(item.requester_name, item.portal)}
                </p>
                <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {item.subject}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <SupportStatusBadge status={item.status} adminView />
                  <span className="shrink-0 text-[10px] text-slate-400">
                    {formatSupportDate(item.last_message_at)}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <TicketPager
            total={ticketsQuery.data?.total ?? 0}
            offset={ticketOffset}
            pageSize={ticketPageSize}
            loaded={ticketsQuery.data?.tickets.length ?? 0}
            onPrevious={() =>
              setTicketOffset((current) =>
                Math.max(0, current - ticketPageSize),
              )
            }
            onNext={() =>
              setTicketOffset((current) => current + ticketPageSize)
            }
          />
        </aside>

        <div
          id="support-ticket-detail"
          className="min-w-0 scroll-mt-4 space-y-4"
        >
          {detailQuery.isLoading ? (
            <div className="flex min-h-[520px] items-center justify-center rounded-[28px] border border-slate-200 bg-white/90 dark:border-slate-700 dark:bg-slate-900">
              <LoaderCircle className="size-7 animate-spin text-emerald-500" />
            </div>
          ) : null}
          {detailQuery.error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
              {detailQuery.error.message}
            </div>
          ) : null}
          {ticket ? (
            <TicketConversation
              ticket={ticket}
              reply={reply}
              onReplyChange={setReply}
              onReply={() => replyMutation.mutate()}
              isReplying={replyMutation.isPending}
              onLoadOlder={() => loadOlderMutation.mutate()}
              isLoadingOlder={loadOlderMutation.isPending}
              adminView
              liveStatus={liveStatus}
              adminToolbar={
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="hidden sm:inline-flex">
                    <SupportStatusBadge status={ticket.status} adminView />
                  </span>
                  <span
                    className={`hidden items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:inline-flex ${ticket.priority === "HIGH" ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200" : "border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"}`}
                  >
                    {ticket.priority === "HIGH"
                      ? "Prioritas tinggi"
                      : "Prioritas normal"}
                  </span>
                  <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        updateMutation.mutate({
                          priority:
                            ticket.priority === "HIGH" ? "NORMAL" : "HIGH",
                        })
                      }
                      className="h-10 min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm font-semibold transition-none text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 sm:flex-none sm:px-4"
                    >
                      Ubah prioritas
                    </Button>
                    {ticket.category === "PASSWORD_RECOVERY" ? (
                      <Button
                        type="button"
                        variant="success"
                        className="h-10 min-w-0 flex-1 rounded-xl px-3 sm:flex-none sm:px-4"
                        disabled={!canProcessReset || resetProcessPending}
                        onClick={() => {
                          setResetDecision("APPROVE");
                          setRejectionReason("");
                          setApproveOpen(true);
                        }}
                      >
                        <ShieldCheck /> {resetActionLabel}
                      </Button>
                    ) : null}
                  </div>
                </div>
              }
            />
          ) : null}
          {!selectedReference && !detailQuery.isLoading ? (
            <div className="flex min-h-[520px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white/70 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
              <Inbox className="size-10 text-emerald-500" />
              <h2 className="mt-4 font-heading text-xl font-semibold">
                Pilih tiket dari inbox
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Detail identitas, percakapan, dan tindakan keamanan akan tampil
                di sini.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <PremiumModal
        open={approveOpen}
        onOpenChange={(open) => {
          setApproveOpen(open);
          setResetDecision("APPROVE");
          setRejectionReason("");
        }}
        title="Proses pengajuan reset password"
        description="Tentukan keputusan setelah memeriksa kecocokan data pemohon."
        icon={resetDecision === "REJECT" ? CircleAlert : ShieldCheck}
        className="sm:!max-w-[620px]"
        footerClassName="!border-t-0 !bg-transparent dark:!bg-transparent"
        footer={
          <ModalActions
            className="!mt-0 !pt-4"
            isPending={resetProcessPending}
            onCancel={() => setApproveOpen(false)}
            onSubmit={() => {
              if (resetDecision === "APPROVE") approveMutation.mutate();
              else rejectMutation.mutate();
            }}
            submitLabel="Konfirmasi"
            submitIcon={resetDecision === "APPROVE" ? ShieldCheck : CircleAlert}
            submitDisabled={resetDecisionInvalid}
            submitVariant={
              resetDecision === "REJECT" ? "destructive" : "success"
            }
          />
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">
              Keputusan pengajuan
            </label>
            <RadixSelectField
              value={resetDecision}
              onValueChange={(value) =>
                setResetDecision(value as "APPROVE" | "REJECT")
              }
              placeholder="Pilih keputusan"
              options={[
                { value: "APPROVE", label: "Setujui pengajuan" },
                { value: "REJECT", label: "Tolak pengajuan" },
              ]}
              triggerClassName="h-12"
            />
          </div>
          {resetDecision === "APPROVE" ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-100">
              <strong>
                Jika disetujui, pengguna akan menerima pemberitahuan.
              </strong>{" "}
              Mereka dapat membuat password baru dari tiket ini. Tiket akan
              selesai otomatis setelah password baru berhasil dibuat.
            </div>
          ) : (
            <div>
              <label
                htmlFor="support-rejection-reason"
                className={`mb-2 block text-sm font-semibold ${rejectionReasonInvalid ? "text-rose-600 dark:text-rose-300" : "text-slate-800 dark:text-slate-100"}`}
              >
                Alasan penolakan <span className="text-rose-500">*</span>
              </label>
              <div
                className={`relative min-h-28 rounded-[1.25rem] border border-slate-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] transition-[border-color,box-shadow,background-color] hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.12),0_14px_30px_rgba(15,23,42,0.05)] focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-200/80 active:border-emerald-500 active:ring-4 active:ring-emerald-200/60 dark:border-slate-600 dark:bg-slate-900 dark:shadow-none dark:hover:border-emerald-400 dark:hover:bg-slate-800 dark:hover:shadow-[0_0_0_3px_rgba(52,211,153,0.2)] dark:focus-within:border-emerald-400 dark:focus-within:ring-4 dark:focus-within:ring-emerald-400/45 dark:active:border-emerald-400 dark:active:ring-4 dark:active:ring-emerald-400/35 ${rejectionReasonInvalid ? "!border-rose-500/80 !bg-rose-50/30 hover:!border-rose-500 focus-within:!border-rose-500 focus-within:!ring-rose-200/80 dark:!border-rose-500/70 dark:!bg-rose-950/20 dark:hover:!border-rose-400 dark:focus-within:!border-rose-400 dark:focus-within:!ring-rose-400/25" : ""}`}
                onMouseEnter={() => setRejectionHovered(true)}
                onMouseLeave={() => setRejectionHovered(false)}
                onPointerMove={() => setRejectionHovered(true)}
                onPointerLeave={() => setRejectionHovered(false)}
                onFocus={() => setRejectionFocused(true)}
                onBlur={() => setRejectionFocused(false)}
                style={rejectionSurfaceStyle}
              >
                <Textarea
                  id="support-rejection-reason"
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  maxLength={1000}
                  placeholder="Jelaskan data atau syarat yang belum sesuai..."
                  className="min-h-24 resize-none rounded-none border-0 bg-transparent px-0 py-3 hover:border-transparent hover:bg-transparent focus-visible:border-transparent focus-visible:ring-0 dark:!bg-transparent dark:hover:!bg-transparent dark:focus-visible:!bg-transparent"
                  aria-invalid={rejectionReasonInvalid}
                />
              </div>
              <p
                className={`mt-2 text-xs ${rejectionReasonInvalid ? "text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}
              >
                {rejectionReasonLength < 10
                  ? "Alasan wajib diisi minimal 10 karakter."
                  : "Alasan ini akan terlihat oleh pengguna pada tiketnya."}{" "}
                {rejectionReason.length}/1000
              </p>
            </div>
          )}
          {ticket ? (
            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-900">
              <ApprovalDetailRow
                icon={Ticket}
                label="Tiket"
                value={ticket.reference_code}
              />
              <ApprovalDetailRow
                icon={UserRound}
                label="Pemohon"
                value={formatSupportRequesterName(
                  ticket.requester_name,
                  ticket.portal,
                )}
              />
              <ApprovalDetailRow
                icon={UserRound}
                label="Akun"
                value={ticket.account_name || "Belum terdeteksi"}
              />
              <ApprovalDetailRow
                icon={Fingerprint}
                label="Identitas"
                value={ticket.account_identifier || "-"}
              />
            </div>
          ) : null}
        </div>
      </PremiumModal>
    </div>
  );
}

function TicketPager({
  total,
  offset,
  pageSize,
  loaded,
  onPrevious,
  onNext,
}: {
  total: number;
  offset: number;
  pageSize: number;
  loaded: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (total <= pageSize) return null;
  const start = loaded === 0 ? 0 : offset + 1;
  const end = Math.min(offset + loaded, total);
  return (
    <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
      <span>
        {start}–{end} dari {total}
      </span>
      <div className="flex gap-1">
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          aria-label="Halaman sebelumnya"
          disabled={offset === 0}
          onClick={onPrevious}
        >
          <ChevronLeft />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          aria-label="Halaman berikutnya"
          disabled={offset + pageSize >= total}
          onClick={onNext}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

function ApprovalDetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Ticket;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[1rem_5.5rem_0.5rem_minmax(0,1fr)] items-start gap-x-2">
      <Icon className="mt-0.5 size-4 text-slate-400" />
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-400">:</span>
      <strong className="min-w-0 break-words text-slate-800 dark:text-slate-100">
        {value}
      </strong>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Inbox;
  tone: "sky" | "amber" | "rose" | "emerald";
}) {
  const colors = {
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  }[tone];
  return (
    <article className="relative flex items-start justify-between gap-3 rounded-[24px] border border-white/70 bg-white/90 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-none sm:p-4">
      <div className="min-w-0">
        <p className="whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:text-[10px] sm:tracking-[0.14em]">
          {label}
        </p>
        <p className="mt-2 font-heading text-2xl font-semibold text-slate-950 dark:text-white">
          {value}
        </p>
      </div>
      <span
        className={`absolute right-3 top-3 flex size-10 shrink-0 items-center justify-center rounded-full sm:static sm:size-11 ${colors}`}
      >
        <Icon className="size-5" />
      </span>
    </article>
  );
}
