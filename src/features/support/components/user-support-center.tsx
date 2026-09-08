import { Button } from "@/components/ui/button";
import { DeleteConfirmationModal } from "@/components/modals/delete-confirmation-modal";
import {
  SupportTicketConversationSkeleton,
  SupportTicketListSkeleton,
} from "@/components/loading/loading-system";
import {
  PremiumModal,
  premiumModalFieldClassName,
  premiumModalLabelClassName,
} from "@/components/modals/premium-modal";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { RadixSelectField } from "@/components/ui/radix-select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ModalActions,
  SearchFilterBar,
} from "@/features/admin/management/shared/section-ui";
import {
  SupportDecisionBadge,
  SupportStatusBadge,
  formatSupportDate,
} from "@/features/support/components/ticket-display";
import { TicketConversation } from "@/features/support/components/ticket-ui";
import { TicketPager } from "@/features/support/components/ticket-pager";
import {
  markCachedSupportNotificationRead,
  mergeOlderTicketMessages,
  mergeTicketDetail,
  removeCachedUserTicket,
  supportQueryKeys,
  updateCachedTicketLists,
} from "@/features/support/lib/ticket-cache";
import { useSupportTicketLive } from "@/features/support/hooks/use-support-ticket-live";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  supportTicketSchema,
  type SupportTicketForm,
} from "@/lib/validations/support-schema";
import { normalizeAppRoute } from "@/lib/route-compat";
import {
  createMySupportTicket,
  deleteMySupportTicket,
  getMySupportNotifications,
  getMySupportTicket,
  getMySupportTickets,
  markMySupportNotificationRead,
  replyMySupportTicket,
} from "@/services/support.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BellRing,
  CheckCircle2,
  CircleAlert,
  Headphones,
  LifeBuoy,
  LoaderCircle,
  MessageSquareText,
  MessageSquarePlus,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import type {
  SupportNotification,
  SupportTicket,
} from "@/types/support";

const defaultTicketPageSize = 5;

export function UserSupportCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedReference = searchParams.get("ticket") ?? "";
  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState("");
  const [ticketOffset, setTicketOffset] = useState(0);
  const [ticketPageSize, setTicketPageSize] = useState(defaultTicketPageSize);
  const [deleteTarget, setDeleteTarget] = useState<SupportTicket | null>(null);
  const queryClient = useQueryClient();
  const committedQuery = useDebouncedValue(query.trim(), 250);

  const ticketsQuery = useQuery({
    queryKey: [
      ...supportQueryKeys.userTickets(),
      committedQuery,
      ticketOffset,
      ticketPageSize,
    ],
    queryFn: () =>
      getMySupportTickets({
        q: committedQuery || undefined,
        limit: ticketPageSize,
        offset: ticketOffset,
      }),
    placeholderData: (previousData) => previousData,
    refetchInterval: 60_000,
  });
  const detailQuery = useQuery({
    queryKey: supportQueryKeys.userTicket(selectedReference),
    queryFn: () => getMySupportTicket(selectedReference),
    enabled: Boolean(selectedReference),
    refetchInterval: 60_000,
    structuralSharing: (current, next) =>
      mergeTicketDetail(
        current as SupportTicket | undefined,
        next as SupportTicket,
      ),
  });
  const notificationsQuery = useQuery({
    queryKey: supportQueryKeys.userNotifications(),
    queryFn: getMySupportNotifications,
    refetchInterval: 60_000,
  });
  const liveStatus = useSupportTicketLive({
    liveToken: detailQuery.data?.live_token,
    enabled: Boolean(selectedReference),
    onTicketUpdated: () => {
      void queryClient.invalidateQueries({
        queryKey: supportQueryKeys.userTicket(selectedReference),
      });
      void queryClient.invalidateQueries({
        queryKey: supportQueryKeys.userTickets(),
      });
      void queryClient.invalidateQueries({
        queryKey: supportQueryKeys.userNotifications(),
      });
    },
    onRenew: () => {
      void queryClient.invalidateQueries({
        queryKey: supportQueryKeys.userTicket(selectedReference),
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

  const form = useForm<SupportTicketForm>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: { category: "TECHNICAL", subject: "", message: "" },
  });

  const createMutation = useMutation({
    mutationFn: createMySupportTicket,
    onSuccess: (result) => {
      // Refetch every cached page so a newly created ticket is reflected in
      // the inbox immediately and the total stays consistent with pagination.
      void queryClient.invalidateQueries({
        queryKey: supportQueryKeys.userTickets(),
      });
      setTicketOffset(0);
      queryClient.setQueryData(
        supportQueryKeys.userTicket(result.ticket.reference_code),
        result.ticket,
      );
      setSearchParams({ ticket: result.ticket.reference_code });
      setShowCreate(false);
      form.reset();
      toast.success("Tiket bantuan dibuat");
    },
    onError: (error) =>
      toast.error("Tiket belum dibuat", { description: error.message }),
  });

  const replyMutation = useMutation({
    mutationFn: () => replyMySupportTicket(selectedReference, reply),
    onSuccess: (ticket) => {
      queryClient.setQueryData(
        supportQueryKeys.userTicket(selectedReference),
        (current: typeof ticket | undefined) =>
          mergeTicketDetail(current, ticket),
      );
      updateCachedTicketLists(queryClient, "user", ticket);
      setReply("");
    },
    onError: (error) =>
      toast.error("Balasan belum terkirim", { description: error.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMySupportTicket,
    onSuccess: (_result, reference) => {
      removeCachedUserTicket(queryClient, reference);
      queryClient.removeQueries({
        queryKey: supportQueryKeys.userTicket(reference),
        exact: true,
      });
      if (selectedReference === reference) {
        setSearchParams({}, { replace: true });
      }
      setDeleteTarget(null);
      toast.success("Tiket berhasil dihapus");
    },
    onError: (error) =>
      toast.error("Tiket belum dihapus", { description: error.message }),
  });

  const markNotificationMutation = useMutation({
    mutationFn: markMySupportNotificationRead,
    onSuccess: (_result, notificationID) =>
      markCachedSupportNotificationRead(queryClient, notificationID),
  });

  const filteredTickets = ticketsQuery.data?.tickets ?? [];

  const loadOlderMutation = useMutation({
    mutationFn: () =>
      getMySupportTicket(
        selectedReference,
        detailQuery.data?.messages?.length ?? 0,
      ),
    onSuccess: (olderTicket) => {
      queryClient.setQueryData(
        supportQueryKeys.userTicket(selectedReference),
        (current: typeof olderTicket | undefined) =>
          mergeOlderTicketMessages(current, olderTicket),
      );
    },
    onError: (error) =>
      toast.error("Pesan sebelumnya belum dimuat", {
        description: error.message,
      }),
  });

  const openNotification = (notificationID: string, actionURL: string) => {
    const reference = new URL(
      normalizeAppRoute(actionURL),
      window.location.origin,
    ).searchParams.get("ticket");
    markNotificationMutation.mutate(notificationID);
    if (reference) setSearchParams({ ticket: reference });
  };

  return (
    <div className="space-y-5">
      <section className="min-w-0 overflow-hidden rounded-[30px] border border-white/70 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.25),transparent_26%),linear-gradient(135deg,#ffffff_0%,#f0faf5_100%)] p-4 shadow-[0_22px_55px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-none dark:bg-slate-900 dark:shadow-none sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[16px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 sm:size-12 sm:rounded-[18px]">
              <LifeBuoy className="size-5 sm:size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
                Pusat bantuan
              </p>
              <h1 className="mt-1 max-w-full font-heading text-2xl font-semibold leading-tight text-slate-950 dark:text-white sm:text-3xl">
                Percakapan langsung dengan admin
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Sampaikan kendala, pantau status, dan simpan seluruh jawaban
                dalam satu tiket.
              </p>
            </div>
          </div>
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    aria-label="Buka notifikasi tiket"
                  />
                }
                className="relative h-11 min-w-0 flex-1 rounded-2xl px-3 text-sm font-semibold sm:flex-none sm:px-5"
              >
                <BellRing className="size-4" />
                <span>Notifikasi</span>
                {(notificationsQuery.data?.unread_count ?? 0) > 0 ? (
                  <span className="-mr-1 flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-[0_4px_12px_rgba(244,63,94,0.3)]">
                    {notificationsQuery.data?.unread_count}
                  </span>
                ) : null}
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={10}
                className="w-[min(24rem,calc(100vw-2rem))] rounded-[1rem] border border-slate-200/90 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.16)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_24px_60px_rgba(0,0,0,0.42)]"
              >
                <PopoverHeader className="flex-row items-start justify-between gap-3 border-b border-slate-200/80 px-3 pb-3 pt-2 dark:border-slate-700">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-200">
                      <BellRing className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <PopoverTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Notifikasi tiket
                      </PopoverTitle>
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Balasan admin tersimpan di sini.
                      </p>
                    </div>
                  </div>
                  {(notificationsQuery.data?.unread_count ?? 0) > 0 ? (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-200">
                      {notificationsQuery.data?.unread_count} baru
                    </span>
                  ) : null}
                </PopoverHeader>
                <div className="max-h-80 space-y-2 overflow-y-auto px-1 py-2">
                  {notificationsQuery.isLoading ? (
                    <div className="flex items-center justify-center px-3 py-8">
                      <LoaderCircle className="size-5 animate-spin text-emerald-500" />
                    </div>
                  ) : notificationsQuery.data?.notifications.length ? (
                    notificationsQuery.data.notifications
                      .slice(0, 6)
                      .map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() =>
                            openNotification(
                              notification.id,
                              notification.action_url,
                            )
                          }
                          className={`w-full rounded-[0.85rem] border px-3 py-2.5 text-left transition-[border-color,background-color,transform,box-shadow] hover:border-emerald-300 hover:bg-emerald-50/60 active:scale-[0.985] ${notification.read ? "border-slate-200/80 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-950/35 dark:hover:!border-emerald-500 dark:hover:!bg-slate-800 dark:hover:!shadow-[0_0_0_2px_rgba(16,185,129,0.16)]" : "border-emerald-200 bg-emerald-50/80 shadow-[0_6px_16px_rgba(16,185,129,0.08)] dark:border-emerald-800 dark:bg-emerald-950/35 dark:hover:!border-emerald-500 dark:hover:!bg-emerald-950/65 dark:hover:!shadow-[0_0_0_2px_rgba(16,185,129,0.16)]"}`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span
                              className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${notification.read ? "bg-slate-200/80 text-slate-500 dark:bg-slate-800 dark:text-slate-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-200"}`}
                            >
                              <NotificationIcon notification={notification} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="line-clamp-1 min-w-0 text-xs font-semibold text-slate-900 dark:text-slate-100">
                                  {notification.title}
                                </p>
                                {!notification.read ? (
                                  <span
                                    className="mt-1 size-1.5 shrink-0 rounded-full bg-sky-500"
                                    aria-label="Belum dibaca"
                                  />
                                ) : null}
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                                {notification.description}
                              </p>
                              <p className="mt-1.5 text-[10px] text-slate-400">
                                {formatSupportDate(notification.created_at)}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                  ) : (
                    <div className="px-3 py-8 text-center">
                      <BellRing className="mx-auto size-6 text-slate-400" />
                      <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Belum ada notifikasi tiket
                      </p>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Button
              type="button"
              variant="success"
              className="h-11 min-w-0 flex-1 rounded-2xl px-3 text-sm font-semibold sm:flex-none sm:px-5"
              onClick={() => setShowCreate(true)}
            >
              <Plus /> Buat tiket
            </Button>
          </div>
        </div>
      </section>

      <PremiumModal
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open);
          if (!open) {
            form.reset();
            form.clearErrors();
          }
        }}
        title="Tiket bantuan baru"
        description="Ceritakan kendala, halaman terkait, dan langkah yang sudah dicoba."
        icon={MessageSquarePlus}
        className="sm:!max-w-2xl"
        footerClassName="!border-t-0 !bg-transparent dark:!bg-transparent"
        footer={
          <ModalActions
            className="!mt-0 !pt-4"
            isPending={createMutation.isPending}
            onCancel={() => {
              setShowCreate(false);
              form.reset();
              form.clearErrors();
            }}
            onSubmit={() =>
              void form.handleSubmit((values) =>
                createMutation.mutate(values),
              )()
            }
            submitLabel="Kirim tiket"
            submitIcon={MessageSquarePlus}
          />
        }
      >
        <form
          id="teacher-support-ticket-form"
          onSubmit={form.handleSubmit((values) =>
            createMutation.mutate(values),
          )}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={premiumModalFieldClassName}>
              <label className={premiumModalLabelClassName}>Kategori</label>
              <Controller
                name="category"
                control={form.control}
                render={({ field }) => (
                  <RadixSelectField
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Pilih kategori"
                    options={[
                      { value: "TECHNICAL", label: "Kendala teknis" },
                      { value: "ACCOUNT_ACCESS", label: "Akses akun" },
                      { value: "ATTENDANCE", label: "Absensi" },
                      { value: "SCHEDULE", label: "Jadwal & kelas" },
                      { value: "OTHER", label: "Lainnya" },
                    ]}
                    triggerClassName={
                      form.formState.errors.category
                        ? "h-14 !border-rose-500 focus-visible:!border-rose-500 focus-visible:!ring-rose-200 dark:!border-rose-400 dark:focus-visible:!ring-rose-400/25"
                        : "h-14"
                    }
                  />
                )}
              />
              <FieldError message={form.formState.errors.category?.message} />
            </div>
            <div className={premiumModalFieldClassName}>
              <label
                htmlFor="teacher-support-subject"
                className={premiumModalLabelClassName}
              >
                Judul kendala
              </label>
              <Input
                id="teacher-support-subject"
                {...form.register("subject")}
                placeholder="Contoh: Kamera tidak dapat dibuka"
                aria-invalid={Boolean(form.formState.errors.subject)}
                className="h-14 rounded-[1.25rem] px-4 text-sm"
              />
              <FieldError message={form.formState.errors.subject?.message} />
            </div>
          </div>
          <div className={premiumModalFieldClassName}>
            <label
              htmlFor="teacher-support-message"
              className={premiumModalLabelClassName}
            >
              Detail kendala
            </label>
            <Textarea
              id="teacher-support-message"
              {...form.register("message")}
              maxLength={1500}
              rows={5}
              aria-invalid={Boolean(form.formState.errors.message)}
              className="min-h-32 rounded-[1.25rem] px-4 py-3 text-sm"
              placeholder="Jelaskan halaman, waktu kejadian, dan pesan yang tampil..."
            />
            <div className="flex items-start justify-between gap-3">
              <FieldError message={form.formState.errors.message?.message} />
              <span className="ml-auto text-xs text-slate-400">
                {form.watch("message").length}/1500
              </span>
            </div>
          </div>
        </form>
      </PremiumModal>

      <section className="grid min-w-0 min-h-[560px] gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
        <aside className="min-w-0 h-fit self-start rounded-[28px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-none">
          <SearchFilterBar
            value={query}
            onChange={(value) => {
              setQuery(value);
              setTicketOffset(0);
            }}
            placeholder="Cari kode atau judul tiket"
            className="w-full"
          />
          <div className="mt-4 min-w-0 max-h-[650px] space-y-2 overflow-x-hidden overflow-y-auto overscroll-auto pr-1">
            {ticketsQuery.isLoading ? <SupportTicketListSkeleton /> : null}
            {!ticketsQuery.isLoading && filteredTickets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
                <Headphones className="mx-auto size-7 text-slate-400" />
                <p className="mt-3 font-semibold">Belum ada tiket</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Buat tiket ketika kamu membutuhkan bantuan admin.
                </p>
              </div>
            ) : null}
            {filteredTickets.map((ticket) => {
              const canDelete =
                ticket.status === "RESOLVED" || ticket.status === "CLOSED";
              return (
                <article
                  key={ticket.reference_code}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setSearchParams({ ticket: ticket.reference_code })
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSearchParams({ ticket: ticket.reference_code });
                    }
                  }}
                  className={`relative min-w-0 w-full overflow-hidden rounded-[20px] border px-4 pb-4 pt-2 text-left transition-[border-color] hover:border-emerald-300 dark:hover:!border-emerald-400/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 ${selectedReference === ticket.reference_code ? "border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/35" : "border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-950/45"}`}
                >
                  <div className="flex min-h-8 items-center justify-between gap-2">
                    <span className="min-w-0 truncate pr-2 text-[10px] font-bold uppercase tracking-[0.13em] text-emerald-600 dark:text-emerald-300">
                      {ticket.reference_code}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      {ticket.unread ? (
                        <span
                          className="size-2 rounded-full bg-rose-500"
                          aria-label="Ada balasan baru"
                        />
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          aria-label={`Hapus tiket ${ticket.reference_code}`}
                          title="Hapus tiket"
                          disabled={deleteMutation.isPending}
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteTarget(ticket);
                          }}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 transition-[color,background-color,transform] hover:bg-rose-50 hover:text-rose-600 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/70 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {ticket.subject}
                  </p>
                  <div className="mt-3 flex min-w-0 items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <SupportStatusBadge status={ticket.status} />
                      {ticket.password_reset.status === "REJECTED" ? (
                        <SupportDecisionBadge />
                      ) : null}
                    </div>
                    <span className="max-w-[42%] shrink-0 truncate text-[10px] text-slate-400">
                      {formatSupportDate(ticket.last_message_at)}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
          <TicketPager
            total={ticketsQuery.data?.total ?? 0}
            offset={ticketOffset}
            pageSize={ticketPageSize}
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

        <div className="min-w-0">
          {detailQuery.isLoading ? <SupportTicketConversationSkeleton /> : null}
          {detailQuery.data ? (
            <TicketConversation
              ticket={detailQuery.data}
              reply={reply}
              onReplyChange={setReply}
              onReply={() => replyMutation.mutate()}
              isReplying={replyMutation.isPending}
              onLoadOlder={() => loadOlderMutation.mutate()}
              isLoadingOlder={loadOlderMutation.isPending}
              liveStatus={liveStatus}
            />
          ) : null}
          {!selectedReference && !detailQuery.isLoading ? (
            <div className="flex min-h-[500px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white/70 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
              <ShieldCheck className="size-10 text-emerald-500" />
              <h2 className="mt-4 font-heading text-xl font-semibold">
                Pilih tiket untuk membuka percakapan
              </h2>
            </div>
          ) : null}
        </div>
      </section>

      <DeleteConfirmationModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleteTarget(null);
        }}
        title="Hapus tiket bantuan?"
        description={
          deleteTarget
            ? `Tiket "${deleteTarget.subject}" dan seluruh percakapannya akan dihapus permanen.`
            : "Tiket bantuan ini akan dihapus permanen."
        }
        warning="Tindakan ini tidak dapat dibatalkan."
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.reference_code);
        }}
      />
    </div>
  );
}

function NotificationIcon({
  notification,
}: {
  notification: SupportNotification;
}) {
  if (
    notification.priority === "warning" ||
    notification.type.toLowerCase().includes("warning")
  ) {
    return <CircleAlert className="size-3.5" />;
  }
  if (
    notification.type.toLowerCase().includes("resolved") ||
    notification.type.toLowerCase().includes("complete")
  ) {
    return <CheckCircle2 className="size-3.5" />;
  }
  if (
    notification.type.toLowerCase().includes("reply") ||
    notification.type.toLowerCase().includes("message")
  ) {
    return <MessageSquareText className="size-3.5" />;
  }
  return <BellRing className="size-3.5" />;
}
