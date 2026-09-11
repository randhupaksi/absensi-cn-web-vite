import { AnimatedBackground } from "@/features/auth/components/animated-background";
import { PremiumInput } from "@/features/auth/components/premium-input";
import { AppLink } from "@/components/router/app-link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  resetPasswordSchema,
  type ResetPasswordForm,
} from "@/lib/validations/support-schema";
import { completePasswordReset } from "@/services/support.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  TimerReset,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [resetSession] = useState(readResetSession);
  const { token, expiresAt } = resetSession;
  const portal = searchParams.get("portal") === "staff" ? "staff" : "student";
  const navigate = useNavigate();
  const loginHref = portal === "staff" ? "/login/staff" : "/login/student";
  const [visibleFields, setVisibleFields] = useState({
    password: false,
    confirmation: false,
  });
  const [resetUnavailableReason, setResetUnavailableReason] = useState<
    "missing" | "expired" | null
  >(() =>
    !token
      ? "missing"
      : expiresAt !== undefined && Date.parse(expiresAt) <= Date.now()
        ? "expired"
        : null,
  );
  const resetUnavailable = resetUnavailableReason !== null;
  const [completed, setCompleted] = useState(false);
  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { new_password: "", confirm_password: "" },
  });
  const password = form.watch("new_password") ?? "";
  const confirmation = form.watch("confirm_password") ?? "";
  const passwordIsLongEnough = password.length >= 8;
  const passwordsMatch = confirmation.length > 0 && password === confirmation;
  const passwordStrength =
    password.length >= 12
      ? 3
      : passwordIsLongEnough
        ? 2
        : password.length > 0
          ? 1
          : 0;
  const mutation = useMutation({
    mutationFn: (values: ResetPasswordForm) =>
      completePasswordReset(token, values.new_password),
    onSuccess: () => setCompleted(true),
    onError: (error) => {
      if (isExpiredResetSession(error)) {
        setResetUnavailableReason("expired");
        return;
      }
      toast.error("Password belum dapat disimpan", {
        description: error.message,
      });
    },
  });

  useEffect(() => {
    if (!token) return;
    navigate(`/support/reset-password?portal=${portal}`, { replace: true });
  }, [navigate, portal, token]);

  useEffect(() => {
    if (!expiresAt || resetUnavailable || completed) return;
    const millisecondsRemaining = Date.parse(expiresAt) - Date.now();
    if (millisecondsRemaining <= 0) {
      setResetUnavailableReason("expired");
      return;
    }
    const timeout = window.setTimeout(
      () => setResetUnavailableReason("expired"),
      millisecondsRemaining,
    );
    return () => window.clearTimeout(timeout);
  }, [completed, expiresAt, resetUnavailable]);

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#f3fbf7_0%,#e3f3ec_52%,#edf7f3_100%)] px-4 py-10 dark:bg-none dark:bg-slate-950 sm:py-16">
      <AnimatedBackground />
      <ThemeToggle placement="fixed" />
      <section className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border-2 border-slate-300 bg-white/96 shadow-[0_28px_72px_rgba(15,23,42,0.13)] dark:border-slate-600 dark:bg-slate-900/95">
        <header className="relative overflow-hidden border-b border-emerald-100/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.96)_0%,rgba(255,255,255,0.96)_68%)] p-6 dark:border-slate-700/80 dark:bg-[linear-gradient(135deg,rgba(6,78,59,0.42),rgba(15,23,42,0.35))] sm:p-7">
          <div className="relative flex items-start gap-4 sm:items-center sm:gap-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#65d69d_0%,#149a73_48%,#087f5b_100%)] text-white shadow-[0_14px_28px_rgba(16,137,99,0.24)]">
              <KeyRound className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                Pemulihan akun
              </p>
              <h1 className="mt-1.5 font-heading text-[1.55rem] font-semibold tracking-[-0.035em] text-slate-950 dark:text-white sm:text-[1.7rem]">
                Buat password baru
              </h1>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">
                Buat password pribadi untuk mengamankan kembali akses akunmu.
              </p>
            </div>
          </div>
        </header>

        {completed ? (
          <div className="p-6 sm:p-8">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 className="size-7" />
            </div>
            <h2 className="mt-5 font-heading text-2xl font-semibold text-slate-950 dark:text-white">
              Password berhasil diperbarui
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Semua sesi lama telah dihentikan. Sekarang masuk kembali
              menggunakan password yang baru kamu buat.
            </p>
            <AppLink
              href={loginHref}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(5,150,105,0.25)] transition hover:-translate-y-0.5 hover:bg-emerald-700 active:scale-[0.98]"
            >
              <ShieldCheck className="size-4" /> Kembali ke login
            </AppLink>
          </div>
        ) : resetUnavailable ? (
          <div className="p-6 sm:p-8">
            <div className="rounded-[1.35rem] border border-rose-200 bg-rose-50/90 p-5 dark:border-rose-800/80 dark:bg-rose-950/35">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
                  <TimerReset className="size-5" />
                </span>
                <h2 className="font-heading text-xl font-semibold text-rose-950 dark:text-rose-100">
                  {resetUnavailableReason === "missing"
                    ? "Sesi reset tidak ditemukan"
                    : "Sesi reset telah kedaluwarsa"}
                </h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-rose-800 dark:text-rose-200">
                {resetUnavailableReason === "missing"
                  ? "Halaman ini hanya dapat digunakan melalui tombol “Buat password baru” dari tiket yang telah disetujui. Silakan kembali ke halaman login atau buka kembali tiketmu."
                  : "Tiket pemulihan ini sudah tidak dapat digunakan untuk membuat password baru. Silakan kembali ke halaman login, lalu ajukan reset password kembali bila masih diperlukan."}
              </p>
            </div>
            <Button
              type="button"
              variant="success"
              className="mt-6 h-12 w-full rounded-2xl"
              onClick={() => navigate(loginHref)}
            >
              <ShieldCheck className="size-4" /> Kembali ke halaman login
            </Button>
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="px-6 py-6 sm:px-7 sm:py-7"
          >
            <div className="flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-800 dark:border-amber-800/80 dark:bg-amber-950/35 dark:text-amber-100">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/70 dark:text-amber-200">
                <TimerReset className="size-4" />
              </span>
              <p>Sesi ini berlaku 20 menit dan hanya dapat digunakan sekali.</p>
            </div>

            <div className="mt-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-heading text-lg font-semibold text-slate-950 dark:text-white">
                    Atur password baru
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Gunakan minimal 8 karakter agar password mudah diingat namun
                    tetap aman.
                  </p>
                </div>
                <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 sm:block">
                  Langkah terakhir
                </span>
              </div>
              <div className="mt-4 space-y-5">
                <PasswordField
                  id="new-password"
                  label="Password baru"
                  error={form.formState.errors.new_password?.message}
                  show={visibleFields.password}
                  onToggle={() =>
                    setVisibleFields((current) => ({
                      ...current,
                      password: !current.password,
                    }))
                  }
                  registration={form.register("new_password")}
                />
                <PasswordMeter
                  level={passwordStrength}
                  passwordIsLongEnough={passwordIsLongEnough}
                />
                <div className="h-px bg-slate-200/80 dark:bg-slate-700/80" />
                <PasswordField
                  id="confirm-password"
                  label="Konfirmasi password"
                  placeholder="Ulangi password baru"
                  error={form.formState.errors.confirm_password?.message}
                  show={visibleFields.confirmation}
                  onToggle={() =>
                    setVisibleFields((current) => ({
                      ...current,
                      confirmation: !current.confirmation,
                    }))
                  }
                  registration={form.register("confirm_password")}
                />
                {confirmation ? (
                  <div
                    className={`flex items-center gap-2 text-xs font-medium ${passwordsMatch ? "text-emerald-700 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}
                  >
                    <span
                      className={`flex size-5 items-center justify-center rounded-full ${passwordsMatch ? "bg-emerald-100 dark:bg-emerald-950" : "bg-rose-100 dark:bg-rose-950"}`}
                    >
                      {passwordsMatch ? (
                        <Check className="size-3.5" />
                      ) : (
                        <span className="size-1.5 rounded-full bg-current" />
                      )}
                    </span>
                    {passwordsMatch
                      ? "Password sudah cocok"
                      : "Password belum sama"}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200/80 pt-5 dark:border-slate-700">
              <Button
                type="submit"
                variant="success"
                className="h-12 w-full rounded-2xl"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <KeyRound />
                )}{" "}
                {mutation.isPending
                  ? "Menyimpan password..."
                  : "Simpan password baru"}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500 dark:text-slate-400">
                <LockKeyhole className="size-3.5 text-emerald-600 dark:text-emerald-300" />{" "}
                Password disimpan aman dan tidak dapat dilihat oleh pihak
                sekolah.
              </p>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

function readResetSession() {
  if (typeof window !== "undefined") {
    const fragment = new URLSearchParams(
      window.location.hash.replace(/^#/, ""),
    );
    const token = fragment.get("token");
    if (token)
      return { token, expiresAt: fragment.get("expires_at") ?? undefined };
  }
  return { token: "", expiresAt: undefined };
}

function isExpiredResetSession(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "PASSWORD_RESET_TOKEN_INVALID"
  );
}

function PasswordField({
  id,
  label,
  placeholder = "Minimal 8 karakter",
  error,
  show,
  onToggle,
  registration,
}: {
  id: string;
  label: string;
  placeholder?: string;
  error?: string;
  show: boolean;
  onToggle: () => void;
  registration: UseFormRegisterReturn;
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-sm font-semibold text-slate-800 dark:text-slate-100"
      >
        {label}
      </Label>
      <PremiumInput
        id={id}
        icon={KeyRound}
        type={show ? "text" : "password"}
        autoComplete="new-password"
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        trailing={
          <button
            type="button"
            data-press-managed
            onClick={onToggle}
            className="flex size-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700 active:scale-90 dark:hover:bg-emerald-950"
            aria-label={
              show
                ? `Sembunyikan ${label.toLowerCase()}`
                : `Tampilkan ${label.toLowerCase()}`
            }
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
        {...registration}
      />
      {error ? (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PasswordMeter({
  level,
  passwordIsLongEnough,
}: {
  level: number;
  passwordIsLongEnough: boolean;
}) {
  const labels = ["Mulai buat password", "Cukup", "Baik", "Kuat"];
  return (
    <div className="rounded-xl bg-white/80 px-3 py-3 dark:bg-slate-900/75">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
          Kekuatan password
        </p>
        <p
          className={`text-xs font-semibold ${level >= 2 ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}
        >
          {labels[level]}
        </p>
      </div>
      <div className="mt-2 flex gap-1.5">
        {[1, 2, 3].map((segment) => (
          <span
            key={segment}
            className={`h-1.5 flex-1 rounded-full ${segment <= level ? (level === 1 ? "bg-amber-400" : "bg-emerald-500") : "bg-slate-200 dark:bg-slate-700"}`}
          />
        ))}
      </div>
      <p
        className={`mt-2 flex items-center gap-1.5 text-[11px] ${passwordIsLongEnough ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}
      >
        <Check className="size-3" /> Minimal 8 karakter
      </p>
    </div>
  );
}
