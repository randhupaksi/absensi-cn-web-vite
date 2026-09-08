import { AdminShell } from "@/features/admin/shell/shell";
import { Button } from "@/components/ui/button";
import { SearchFilterBar } from "@/features/admin/management/shared/section-ui";
import { AdminPasswordResetModal } from "@/features/support/components/admin-password-reset-modal";
import { SupportStatCard } from "@/features/support/components/support-stat-card";
import {
  SupportStatusBadge,
  formatSupportDate,
  formatSupportRequesterName,
} from "@/features/support/components/ticket-display";
import { TicketConversation } from "@/features/support/components/ticket-ui";
import { TicketPager } from "@/features/support/components/ticket-pager";
import {
  mergeOlderTicketMessages,
  mergeTicketDetail,
  supportQueryKeys,
} from "@/features/support/lib/ticket-cache";
import { useSupportTicketLive } from "@/features/support/hooks/use-support-ticket-live";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
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
  CircleAlert,
  Clock3,
  Inbox,
  KeyRound,
  LoaderCircle,
  MessageSquareText,
  ShieldCheck,
  TicketCheck,
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

const defaultTicketPageSize = 5;

export function AdminSupportPage() {
  return <AdminShell>{() => <AdminSupportContent />}</AdminShell>;
}

function AdminSupportContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedReference = searchParams.get("ticket") ?? "";
  const [status, setStatus] = useState<"ALL" | SupportTicketStatus>("ALL");
  const [search, setSearch] = useState("");
  const [reply, setReply] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [ticketOffset, setTicketOffset] = useState(0);
  const [ticketPageSize, setTicketPageSize] = useState(defaultTicketPageSize);
  const shouldScrollToDetail = useRef(false);
  const queryClient = useQueryClient();
  const committedSearch = useDebouncedValue(search.trim(), 250);
  const activeListQueryKey = [
    ...supportQueryKeys.adminTickets(),
    status,
    committedSearch,
    ticketOffset,
  ] as const;

  useEffect(() => {
    setTicketOffset(0);
  }, [status, committedSearch]);

  const ticketsQuery = useQuery({
    queryKey: activeListQueryKey,
    queryFn: () =>
      getAdminSupportTickets({
        status,
        q: committedSearch,
        limit: ticketPageSize,
        offset: ticketOffset,
      }),
    refetchInterval: 60_000,
    placeholderData: (previousData) => previousData,
  });
  const detailQuery = useQuery({
    queryKey: supportQueryKeys.adminTicket(selectedReference),
    queryFn: () => getAdminSupportTicket(selectedReference),
    enabled: Boolean(selectedReference),
    refetchInterval: 60_000,
    structuralSharing: (current, next) =>
      mergeTicketDetail(
        current as SupportTicket | undefined,
        next as SupportTicket,
      ),
  });

  const liveStatus = useSupportTicketLive({
    liveToken: detailQuery.data?.live_token,
    enabled: Boolean(selectedReference),
    onTicketUpdated: () => {
      void queryClient.invalidateQueries({
        queryKey: supportQueryKeys.adminTicket(selectedReference),
      });
      void queryClient.invalidateQueries({
        queryKey: activeListQueryKey,
        exact: true,
      });
    },
    onRenew: () => {
      void queryClient.invalidateQueries({
        queryKey: supportQueryKeys.adminTicket(selectedReference),
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

  const replyMutation = useMutation({
    mutationFn: () => replyAdminSupportTicket(selectedReference, reply),
    onSuccess: (ticket) => {
      queryClient.setQueryData(
        supportQueryKeys.adminTicket(selectedReference),
        (current: typeof ticket | undefined) =>
          mergeTicketDetail(current, ticket),
      );
      void queryClient.invalidateQueries({
        queryKey: activeListQueryKey,
        exact: true,
      });
      setReply("");
      toast.success("Balasan admin terkirim");
    },
    onError: (error) =>
      toast.error("Balasan belum terkirim", { description: error.message }),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: {
      status?: SupportTicketStatus;
      priority?: "NORMAL" | "HIGH";
    }) => updateAdminSupportTicket(selectedReference, payload),
    onSuccess: (ticket) => {
      queryClient.setQueryData(
        supportQueryKeys.adminTicket(selectedReference),
        ticket,
      );
      void queryClient.invalidateQueries({
        queryKey: activeListQueryKey,
        exact: true,
      });
      toast.success("Status tiket diperbarui");
    },
    onError: (error) =>
      toast.error("Status belum diperbarui", { description: error.message }),
  });

  const approveMutation = useMutation({
    mutationFn: () => approveAdminPasswordReset(selectedReference),
    onSuccess: (ticket) => {
      queryClient.setQueryData(
        supportQueryKeys.adminTicket(selectedReference),
        ticket,
      );
      void queryClient.invalidateQueries({
        queryKey: activeListQueryKey,
        exact: true,
      });
      setApproveOpen(false);
      toast.success("Reset password disetujui", {
        description: "Pengguna dapat membuat password baru dari tiketnya.",
      });
    },
    onError: (error) =>
      toast.error("Reset belum disetujui", { description: error.message }),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) =>
      rejectAdminPasswordReset(selectedReference, reason),
    onSuccess: (ticket) => {
      queryClient.setQueryData(
        supportQueryKeys.adminTicket(selectedReference),
        ticket,
      );
      void queryClient.invalidateQueries({
        queryKey: activeListQueryKey,
        exact: true,
      });
      setApproveOpen(false);
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
        supportQueryKeys.adminTicket(selectedReference),
        (current: typeof olderTicket | undefined) =>
          mergeOlderTicketMessages(current, olderTicket),
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
        <div className="grid min-w-0 gap-x-4 gap-y-3 sm:grid-cols-[3rem_minmax(0,1fr)]">
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
          </div>
          <p className="col-span-full max-w-5xl break-words text-sm leading-6 text-slate-500 dark:text-slate-400 sm:block">
            Kelola percakapan bantuan, cocokkan identitas pemohon, berikan
            keputusan pemulihan akun, dan pastikan setiap tindak lanjut
            tersampaikan dengan aman tanpa mengirim password melalui chat.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SupportStatCard
          label="Total tiket"
          value={stats.total}
          icon={MessageSquareText}
          tone="sky"
        />
        <SupportStatCard
          label="Perlu dibalas"
          value={stats.waiting}
          icon={Clock3}
          tone="amber"
        />
        <SupportStatCard
          label="Belum dibaca"
          value={stats.unread}
          icon={CircleAlert}
          tone="rose"
        />
        <SupportStatCard
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
            onPageSizeChange={(nextPageSize) => {
              setTicketPageSize(nextPageSize);
              setTicketOffset(0);
            }}
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
                        onClick={() => setApproveOpen(true)}
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

      <AdminPasswordResetModal
        open={approveOpen}
        ticket={ticket}
        isSubmitting={resetProcessPending}
        onOpenChange={setApproveOpen}
        onApprove={() => approveMutation.mutate()}
        onReject={(reason) => rejectMutation.mutate(reason)}
      />
    </div>
  );
}
