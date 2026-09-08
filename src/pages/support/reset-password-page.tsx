import { AnimatedBackground } from "@/features/auth/components/animated-background";
import { PremiumInput } from "@/features/auth/components/premium-input";
import { AppImage } from "@/components/media/app-image";
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
import { CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [token] = useState(readResetToken);
  const portal = searchParams.get("portal") === "staff" ? "staff" : "student";
  const navigate = useNavigate();
  const loginHref = portal === "staff" ? "/login/staff" : "/login/student";
  const [showPassword, setShowPassword] = useState(false);
  const [completed, setCompleted] = useState(false);
  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { new_password: "", confirm_password: "" },
  });
  const mutation = useMutation({
    mutationFn: (values: ResetPasswordForm) => completePasswordReset(token, values.new_password),
    onSuccess: () => setCompleted(true),
    onError: (error) => toast.error("Password belum dapat disimpan", { description: error.message }),
  });

  useEffect(() => {
    if (!token) return;
    navigate(`/support/reset-password?portal=${portal}`, { replace: true });
  }, [navigate, portal, token]);

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#f3fbf7_0%,#e3f3ec_52%,#edf7f3_100%)] px-4 py-16 dark:bg-none dark:bg-slate-950">
      <AnimatedBackground />
      <ThemeToggle placement="fixed" />
      <section className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-emerald-200/80 bg-white/95 shadow-[0_30px_90px_rgba(15,23,42,0.15)] dark:border-slate-700 dark:bg-slate-900/95">
        <header className="flex items-center gap-4 border-b border-emerald-100 bg-emerald-50/60 p-6 dark:border-emerald-900 dark:bg-emerald-950/20">
          <AppImage src="/images/optimized/logo-sma-smk-yatkj-ui.png" alt="Logo Citra Negara" width={52} height={52} className="size-12 object-contain" />
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">Pemulihan akun</p><h1 className="mt-1 font-heading text-2xl font-semibold text-slate-950 dark:text-white">Buat password baru</h1></div>
        </header>

        {completed ? (
          <div className="p-6 sm:p-8">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><CheckCircle2 className="size-7" /></div>
            <h2 className="mt-5 font-heading text-2xl font-semibold text-slate-950 dark:text-white">Password berhasil diperbarui</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">Semua sesi lama telah dihentikan. Sekarang masuk kembali menggunakan password yang baru kamu buat.</p>
            <AppLink href={loginHref} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(5,150,105,0.25)] transition hover:-translate-y-0.5 hover:bg-emerald-700 active:scale-[0.98]"><ShieldCheck className="size-4" /> Kembali ke login</AppLink>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="p-6 sm:p-8">
            {!token ? <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">Sesi reset tidak ditemukan. Buka kembali tiketmu lalu tekan tombol “Buat password baru”.</div> : null}
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900 dark:border-sky-800 dark:bg-sky-950/35 dark:text-sky-100">Sesi ini berlaku 20 menit dan hanya dapat digunakan sekali. Jangan gunakan password yang pernah kamu kirim kepada orang lain.</div>
            <div className="mt-6 space-y-5">
              <PasswordField id="new-password" label="Password baru" error={form.formState.errors.new_password?.message} show={showPassword} onToggle={() => setShowPassword((value) => !value)} registration={form.register("new_password")} />
              <PasswordField id="confirm-password" label="Konfirmasi password" error={form.formState.errors.confirm_password?.message} show={showPassword} onToggle={() => setShowPassword((value) => !value)} registration={form.register("confirm_password")} />
            </div>
            <Button type="submit" variant="success" className="mt-7 h-12 w-full rounded-2xl" disabled={!token || mutation.isPending}>
              {mutation.isPending ? <LoaderCircle className="animate-spin" /> : <KeyRound />} Simpan password baru
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}

function readResetToken() {
  if (typeof window !== "undefined") {
    const tokenFromFragment = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("token");
    if (tokenFromFragment) return tokenFromFragment;
  }
  return "";
}

function PasswordField({ id, label, error, show, onToggle, registration }: { id: string; label: string; error?: string; show: boolean; onToggle: () => void; registration: UseFormRegisterReturn }) {
  return <div className="space-y-2"><Label htmlFor={id} className="text-sm font-semibold">{label}</Label><PremiumInput id={id} icon={KeyRound} type={show ? "text" : "password"} autoComplete="new-password" placeholder="Minimal 8 karakter" trailing={<button type="button" onClick={onToggle} className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950"><span className="sr-only">Tampilkan password</span>{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>} {...registration} />{error ? <p className="text-sm text-rose-600">{error}</p> : null}</div>;
}
