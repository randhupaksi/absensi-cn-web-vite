import { AnimatedBackground } from "@/features/auth/components/animated-background";
import { PremiumInput } from "@/features/auth/components/premium-input";
import { mergeSupportMessages, TicketConversation } from "@/features/support/components/ticket-ui";
import { useSupportTicketLive } from "@/features/support/hooks/use-support-ticket-live";
import { AppImage } from "@/components/media/app-image";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  publicSupportTicketSchema,
  type PublicSupportTicketForm,
} from "@/lib/validations/support-schema";
import {
  accessPublicSupportTicket,
  accessPublicSupportTicketByCode,
  createPublicSupportTicket,
  replyPublicSupportTicket,
  startPasswordReset,
} from "@/services/support.service";
import type { PublicTicketCredentials, SupportTicket } from "@/types/support";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Clipboard,
  Eye,
  EyeOff,
  GraduationCap,
  Hash,
  IdCard,
  Info,
  KeyRound,
  LifeBuoy,
  LoaderCircle,
  MessageSquareText,
  Search,
  ShieldAlert,
  Signature,
  UserRound,
} from "lucide-react";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const SESSION_KEY = "absensi-cn-support-ticket";

export default function SupportPage() {
  const [searchParams] = useSearchParams();
  const requestedPortal = searchParams.get("portal") === "staff" ? "staff" : "student";
  const [mode, setMode] = useState<"create" | "track">(
    searchParams.get("mode") === "track" ? "track" : "create",
  );
  const [credentials, setCredentials] = useState<PublicTicketCredentials | null>(() => readSavedCredentials());
  const [accessInput, setAccessInput] = useState("");
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [reply, setReply] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const form = useForm<PublicSupportTicketForm>({
    resolver: zodResolver(publicSupportTicketSchema),
    defaultValues: {
      portal: requestedPortal,
      identifier: "",
      requester_name: "",
      message: "",
      acknowledged_risk: false,
    },
  });
  const portal = form.watch("portal");

  const ticketQuery = useQuery({
    queryKey: ["public-support-ticket", credentials?.referenceCode],
    queryFn: () => accessPublicSupportTicket(credentials!.referenceCode, credentials!.accessCode),
    enabled: Boolean(credentials),
    refetchInterval: 60_000,
    retry: false,
    structuralSharing: (current, next) => {
      const currentTicket = current as SupportTicket | undefined;
      const nextTicket = next as SupportTicket;
      return (currentTicket?.messages?.length ?? 0) > (nextTicket.messages?.length ?? 0)
        ? { ...nextTicket, messages: mergeSupportMessages(currentTicket?.messages, nextTicket.messages), messages_page: currentTicket?.messages_page }
        : nextTicket;
    },
  });

  const liveStatus = useSupportTicketLive({
    liveToken: ticketQuery.data?.live_token,
    enabled: Boolean(credentials),
    onTicketUpdated: () => {
      void queryClient.invalidateQueries({ queryKey: ["public-support-ticket", credentials?.referenceCode] });
    },
    onRenew: () => {
      void queryClient.invalidateQueries({ queryKey: ["public-support-ticket", credentials?.referenceCode] });
    },
  });

  useEffect(() => {
    if (credentials) {
      setMode("track");
      setAccessInput(credentials.accessCode);
    }
  }, [credentials]);

  const createMutation = useMutation({
    mutationFn: createPublicSupportTicket,
    onSuccess: (result) => {
      const next = { referenceCode: result.ticket.reference_code, accessCode: result.access_code };
      saveCredentials(next);
      setCredentials(next);
      toast.success("Tiket berhasil dibuat", { description: "Simpan kode akses sebelum meninggalkan halaman." });
    },
    onError: (error) => {
      if (portal === "student" && error.message.includes("Data nama dan NIS belum sesuai")) {
        const message = "Nama lengkap dan NIS belum sesuai dengan data sekolah.";
        form.setError("requester_name", { type: "validate", message });
        form.setError("identifier", { type: "validate", message });
      }
      toast.error("Tiket belum berhasil dibuat", { description: error.message });
    },
  });

  const accessMutation = useMutation({
    mutationFn: () => accessPublicSupportTicketByCode(accessInput.trim()),
    onSuccess: (ticket) => {
      const next = { referenceCode: ticket.reference_code, accessCode: accessInput.trim() };
      saveCredentials(next);
      setCredentials(next);
      queryClient.setQueryData(["public-support-ticket", next.referenceCode], ticket);
    },
    onError: (error) => toast.error("Tiket tidak ditemukan", { description: error.message }),
  });

  const replyMutation = useMutation({
    mutationFn: () => replyPublicSupportTicket(credentials!.referenceCode, credentials!.accessCode, reply),
    onSuccess: (ticket) => {
      queryClient.setQueryData(["public-support-ticket", credentials?.referenceCode], (current: typeof ticket | undefined) => (
        current
          ? { ...ticket, messages: mergeSupportMessages(current.messages, ticket.messages), messages_page: current.messages_page ?? ticket.messages_page }
          : ticket
      ));
      setReply("");
      toast.success("Balasan terkirim");
    },
    onError: (error) => toast.error("Balasan belum terkirim", { description: error.message }),
  });

  const resetMutation = useMutation({
    mutationFn: () => startPasswordReset(credentials!.referenceCode, credentials!.accessCode),
    onSuccess: (session) => {
      navigate(`/support/reset-password?portal=${session.portal}#token=${encodeURIComponent(session.token)}`, { replace: false });
    },
    onError: (error) => toast.error("Sesi reset belum dapat dibuat", { description: error.message }),
  });

  const loadOlderMutation = useMutation({
    mutationFn: () => accessPublicSupportTicket(credentials!.referenceCode, credentials!.accessCode, ticketQuery.data?.messages?.length ?? 0),
    onSuccess: (olderTicket) => {
      queryClient.setQueryData(["public-support-ticket", credentials?.referenceCode], (current: typeof olderTicket | undefined) => (
        current
          ? { ...olderTicket, messages: mergeSupportMessages(olderTicket.messages, current.messages) }
          : olderTicket
      ));
    },
    onError: (error) => toast.error("Pesan sebelumnya belum dimuat", { description: error.message }),
  });

  const clearCredentials = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(SESSION_KEY);
    }
    setCredentials(null);
    setAccessInput("");
    createMutation.reset();
    queryClient.removeQueries({ queryKey: ["public-support-ticket"] });
    setMode("track");
  };

  const loginHref = portal === "staff" ? "/login/staff" : "/login/student";
  const justCreated = createMutation.data;
  const ticketView = Boolean(credentials);
  const returnToSupportHome = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    clearCredentials();
    setMode("create");
    navigate("/support", { replace: true });
  };

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[linear-gradient(180deg,#f3fbf7_0%,#e3f3ec_52%,#edf7f3_100%)] px-3 py-4 text-slate-800 dark:bg-none dark:bg-slate-950 dark:text-slate-100 sm:px-6 sm:py-5">
      <AnimatedBackground />
      <ThemeToggle placement="fixed" />
      <div className="relative mx-auto w-full max-w-6xl">
        <header className={`mb-5 flex items-center gap-4 ${ticketView ? "pt-0" : "justify-between pr-20"}`}>
          <BackButton href={ticketView ? "/support" : loginHref} label="Kembali" fixed={false} onClick={ticketView ? returnToSupportHome : undefined} />
          {!ticketView ? <div className="hidden items-center gap-3 sm:flex">
            <AppImage src="/images/optimized/logo-sma-smk-yatkj-ui.png" alt="Logo Citra Negara" width={36} height={36} className="size-9 object-contain" />
            <div>
              <p className="text-sm font-bold">Citra Negara</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pusat Bantuan Akun</p>
            </div>
          </div> : null}
        </header>

        <section className="grid gap-6">
        {!ticketView ? <>
          <aside className="rounded-[30px] border border-emerald-200/40 bg-emerald-950 p-5 text-white shadow-[0_26px_70px_rgba(6,78,59,0.22)] dark:border-emerald-800/55 sm:p-6 lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div className="lg:max-w-[52%]">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300"><LifeBuoy className="size-5" /></span>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Bantuan tanpa WhatsApp</p>
              <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Pulihkan akses akun dengan aman</h1>
              <p className="mt-2 text-sm leading-6 text-emerald-50/75">Kirim kendala, simpan kode akses, lalu pantau konfirmasi admin langsung dari halaman ini.</p>
            </div>
            <div className="mt-4 space-y-2 lg:mt-0 lg:w-[44%]">
              {[
                [ShieldAlert, "Admin akan mencocokkan identitas akun"],
                [MessageSquareText, "Balasan tampil di percakapan tiket"],
                [KeyRound, "Password dibuat sendiri setelah disetujui"],
              ].map(([Icon, label]) => (
                <div key={label as string} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-emerald-50">
                  <Icon className="size-4 shrink-0 text-emerald-300" /> {label as string}
                </div>
              ))}
            </div>
          </aside>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2 rounded-[22px] border border-slate-200 bg-white/85 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900/85">
              <ModeButton active={mode === "create"} onClick={() => setMode("create")} icon={MessageSquareText} label="Buat tiket" />
              <ModeButton active={mode === "track"} onClick={() => setMode("track")} icon={Search} label="Lacak tiket" />
            </div>

            {mode === "create" && !justCreated ? (
              <form onSubmit={form.handleSubmit((values) => createMutation.mutate(values))} className="rounded-[30px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_22px_60px_rgba(15,23,42,0.09)] dark:border-slate-700 dark:bg-slate-900/90 sm:p-7">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">Form pemulihan akun</p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold">Ceritakan kendala loginmu</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Respons tidak memastikan apakah akun terdaftar. Admin tetap melakukan pemeriksaan sebelum menyetujui reset.</p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200/80 bg-slate-100 p-1.5 dark:border-slate-700/80 dark:bg-slate-950/70">
                  {(["student", "staff"] as const).map((value) => (
                    <Button key={value} type="button" variant="ghost" aria-pressed={portal === value} onClick={() => form.setValue("portal", value)} className={`group relative inline-flex min-h-12 flex-col items-center justify-center gap-1.5 rounded-xl border px-4 py-3 text-sm font-semibold leading-none outline-none transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out hover:-translate-y-px active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-950 sm:flex-row ${portal === value ? "border-emerald-500 bg-emerald-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-emerald-600 dark:border-emerald-400/80 dark:bg-emerald-950/80 dark:text-emerald-100 dark:shadow-[inset_0_1px_0_rgba(110,231,183,0.12)] dark:hover:bg-emerald-950/80" : "border-transparent text-slate-500 hover:border-emerald-200/70 hover:bg-white/75 hover:text-emerald-800 hover:shadow-[inset_0_0_0_1px_rgba(148,163,184,0.28)] dark:border-transparent dark:text-slate-400 dark:hover:border-emerald-700/70 dark:hover:bg-slate-800/80 dark:hover:text-emerald-200 dark:hover:shadow-[inset_0_0_0_1px_rgba(110,231,183,0.16)]"}`}>
                      {value === "student" ? <UserRound className="size-4 shrink-0" aria-hidden="true" /> : <GraduationCap className="size-4 shrink-0" aria-hidden="true" />}
                      {value === "student" ? "Akun Siswa" : "Akun Guru"}
                    </Button>
                  ))}
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <FormField label="Nama lengkap" error={form.formState.errors.requester_name?.message}>
                    <PremiumInput icon={portal === "student" ? IdCard : Signature} placeholder="Nama sesuai data sekolah" autoComplete="name" {...form.register("requester_name")} />
                  </FormField>
                  <FormField label={portal === "student" ? "NIS" : "Username guru"} error={form.formState.errors.identifier?.message}>
                    <PremiumInput
                      icon={portal === "student" ? Hash : ShieldAlert}
                      placeholder={portal === "student" ? "Masukkan NIS (8–10 digit)" : "Masukkan username guru"}
                      inputMode={portal === "student" ? "numeric" : "text"}
                      pattern={portal === "student" ? "[0-9]*" : undefined}
                      maxLength={portal === "student" ? 10 : 50}
                      {...form.register("identifier")}
                      onChange={(event) => {
                        if (portal === "student") {
                          const value = event.currentTarget.value.replace(/\D/g, "").slice(0, 10);
                          event.currentTarget.value = value;
                          form.setValue("identifier", value, { shouldValidate: Boolean(form.formState.errors.identifier) });
                          return;
                        }
                        form.setValue("identifier", event.currentTarget.value, { shouldValidate: Boolean(form.formState.errors.identifier) });
                      }}
                    />
                  </FormField>
                </div>

                <div className="mt-5">
                  <FormField label="Keterangan kendala" error={form.formState.errors.message?.message}>
                    <Textarea rows={5} maxLength={1500} placeholder="Jelaskan kendala yang kamu alami secara singkat..." className="min-h-32 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950/60" {...form.register("message")} />
                  </FormField>
                </div>

                <Controller
                  control={form.control}
                  name="acknowledged_risk"
                  render={({ field }) => (
                    <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-100">
                      <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} className="mt-1" />
                      <span>Saya memahami bahwa password tidak akan dikirim melalui tiket dan admin mungkin meminta konfirmasi identitas tambahan.</span>
                    </label>
                  )}
                />
                {form.formState.errors.acknowledged_risk ? <p className="mt-2 text-sm text-rose-600">{form.formState.errors.acknowledged_risk.message}</p> : null}

                <Button type="submit" variant="success" disabled={createMutation.isPending} className="mt-6 h-12 w-full rounded-xl text-sm font-semibold">
                  {createMutation.isPending ? <LoaderCircle className="animate-spin" /> : <MessageSquareText />}
                  Kirim tiket ke admin
                </Button>
              </form>
            ) : null}

            {mode === "track" && !ticketQuery.data ? (
              <div className="rounded-[30px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_22px_60px_rgba(15,23,42,0.09)] dark:border-slate-700 dark:bg-slate-900/90 sm:p-7">
                <h2 className="font-heading text-2xl font-semibold">Lacak tiket bantuan</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Masukkan kode akses yang kamu simpan saat tiket dibuat. Kode ini adalah kunci untuk membuka tiketmu.</p>
                <div className="mt-6 space-y-5">
                  <FormField label="Kode akses tiket">
                    <PremiumInput icon={KeyRound} type={showAccessCode ? "text" : "password"} value={accessInput} onChange={(event) => setAccessInput(event.target.value.toUpperCase())} placeholder="XXXX-XXXX-XXXX" trailing={<button type="button" onClick={() => setShowAccessCode((value) => !value)} className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950"><span className="sr-only">Tampilkan kode akses</span>{showAccessCode ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>} />
                  </FormField>
                  <Button type="button" variant="success" className="h-12 w-full rounded-2xl" disabled={accessMutation.isPending || !accessInput.trim()} onClick={() => accessMutation.mutate()}>
                    {accessMutation.isPending ? <LoaderCircle className="animate-spin" /> : <Search />} Buka tiket
                  </Button>
                </div>
              </div>
            ) : null}

            {ticketQuery.isLoading ? <div className="flex min-h-64 items-center justify-center rounded-[30px] border border-slate-200 bg-white/90 dark:border-slate-700 dark:bg-slate-900"><LoaderCircle className="size-7 animate-spin text-emerald-500" /></div> : null}
            {ticketQuery.error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">{ticketQuery.error.message}</div> : null}
            {ticketQuery.data ? (
              <>
                <div className="flex justify-end">
                  <button type="button" onClick={clearCredentials} className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-300">
                    Lacak tiket lain
                  </button>
                </div>
                <TicketConversation ticket={ticketQuery.data} reply={reply} onReplyChange={setReply} onReply={() => replyMutation.mutate()} isReplying={replyMutation.isPending} onStartReset={() => resetMutation.mutate()} isStartingReset={resetMutation.isPending} onLoadOlder={() => loadOlderMutation.mutate()} isLoadingOlder={loadOlderMutation.isPending} liveStatus={liveStatus} />
              </>
            ) : null}
          </div>
        </> : null}

        {ticketView ? (
          <div className="space-y-5">
            {justCreated && !ticketQuery.data ? <CredentialCard accessCode={justCreated.access_code} onContinue={() => createMutation.reset()} /> : null}
            {ticketQuery.isLoading ? <div className="flex min-h-64 items-center justify-center rounded-[30px] border border-slate-200 bg-white/90 dark:border-slate-700 dark:bg-slate-900"><LoaderCircle className="size-7 animate-spin text-emerald-500" /></div> : null}
            {ticketQuery.error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">{ticketQuery.error.message}</div> : null}
            {ticketQuery.data && credentials ? <AccessCodeCard accessCode={credentials.accessCode} /> : null}
            {ticketQuery.data ? <TicketConversation ticket={ticketQuery.data} reply={reply} onReplyChange={setReply} onReply={() => replyMutation.mutate()} isReplying={replyMutation.isPending} onStartReset={() => resetMutation.mutate()} isStartingReset={resetMutation.isPending} onLoadOlder={() => loadOlderMutation.mutate()} isLoadingOlder={loadOlderMutation.isPending} liveStatus={liveStatus} /> : null}
          </div>
        ) : null}
        </section>
      </div>
    </main>
  );
}

function ModeButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Search; label: string }) {
  return <Button type="button" variant="ghost" aria-pressed={active} onClick={onClick} className={`h-11 w-full rounded-xl px-4 text-sm font-semibold ${active ? "bg-emerald-600 text-white shadow-[0_3px_10px_rgba(5,150,105,0.12)] hover:bg-emerald-600 hover:shadow-[0_3px_10px_rgba(5,150,105,0.12)] dark:bg-emerald-950/80 dark:text-emerald-100 dark:shadow-[0_2px_8px_rgba(16,185,129,0.08)] dark:hover:bg-emerald-950/80" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-300 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-200"}`}><Icon className="size-4" />{label}</Button>;
}

function FormField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <div className="space-y-2"><Label className="text-sm font-semibold">{label}</Label>{children}{error ? <p className="text-sm text-rose-600">{error}</p> : null}</div>;
}

function CredentialCard({ accessCode, onContinue }: { accessCode: string; onContinue: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(accessCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return (
    <section className="rounded-[30px] border border-emerald-300 bg-white/95 p-5 shadow-[0_22px_60px_rgba(15,23,42,0.09)] dark:border-emerald-800 dark:bg-slate-900/95 sm:p-7">
      <div className="flex gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><Check className="size-5" /></span><div><h2 className="font-heading text-2xl font-semibold">Tiket berhasil dibuat</h2><p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">Simpan satu kode ini. Kode akses adalah kunci untuk membuka kembali tiketmu.</p></div></div>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Kode akses tiket</p><div className="mt-2 flex items-center justify-between gap-4"><code className="min-w-0 break-all text-lg font-semibold tracking-[0.08em] text-slate-900 dark:text-white">{accessCode}</code><Button type="button" variant="success" className="h-10 shrink-0 rounded-xl px-4 shadow-none hover:shadow-none focus-visible:shadow-none" onClick={copy}>{copied ? <Check /> : <Clipboard />}{copied ? "Tersalin" : "Salin kode"}</Button></div></div>
      <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">Akses sementara tersimpan selama tab browser ini belum ditutup. Jika kode akses hilang, buat tiket pemulihan baru. Jangan unduh atau simpan kode pada perangkat umum.</p>
      <Button type="button" variant="success" className="mt-5 h-11 w-full rounded-2xl" onClick={onContinue}>Pantau balasan admin</Button>
    </section>
  );
}

function AccessCodeCard({ accessCode }: { accessCode: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(accessCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="rounded-[24px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-none sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Kode akses tiket</p>
          <code className="mt-1 block break-all text-lg font-semibold tracking-[0.08em] text-slate-900 dark:text-white">{accessCode}</code>
        </div>
        <Button type="button" variant="success" className="h-10 shrink-0 rounded-xl px-4 shadow-none hover:shadow-none focus-visible:shadow-none" onClick={copy}>
          {copied ? <Check /> : <Clipboard />}
          {copied ? "Tersalin" : "Salin kode"}
        </Button>
      </div>
      <div className="mt-3 flex gap-2.5 rounded-xl border border-sky-200/80 bg-sky-50/80 p-3 text-xs leading-5 text-sky-800 dark:border-sky-800/70 dark:bg-sky-950/30 dark:text-sky-200">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>Jika halaman percakapan tertutup, gunakan kode akses ini untuk membuka kembali tiketmu. Simpan di tempat yang aman.</p>
      </div>
    </section>
  );
}

function readSavedCredentials(): PublicTicketCredentials | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as PublicTicketCredentials;
    return value.referenceCode && value.accessCode ? value : null;
  } catch {
    return null;
  }
}

function saveCredentials(value: PublicTicketCredentials) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
}
