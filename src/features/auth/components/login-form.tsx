"use client";

import { PremiumInput } from "@/features/auth/components/premium-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getDashboardPathForUser, saveAuthSession } from "@/lib/auth";
import {
  loginSchema,
  type LoginSchema,
  type PortalType,
} from "@/lib/validations/login-schema";
import {
  login,
  LoginRateLimitError,
  type AuthLoginResponse,
  type LoginRateLimitKind,
} from "@/services/auth.service";
import { formatPersonName } from "@/lib/format-person-name";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  EyeOff,
  AlertTriangle,
  LoaderCircle,
  LogIn,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type LoginFormProps = {
  portal: PortalType;
};

const formContent = {
  student: {
    identifierLabel: "NIS",
    identifierPlaceholder: "Masukkan NIS",
    identifierHelper: "Gunakan NIS sesuai data sekolah",
    passwordHelper: "Masukkan password dari akun siswa anda",
    submitLabel: "Masuk sebagai Siswa",
    submittingLabel: "Memproses absensi",
    buttonClass:
      "border-emerald-300/40 bg-[linear-gradient(135deg,#149a73_0%,#50b98c_56%,#a8d38a_100%)] shadow-[0_18px_44px_rgba(20,154,115,0.24)] hover:shadow-[0_22px_56px_rgba(20,154,115,0.3)]",
  },
  staff: {
    identifierLabel: "Username Staff",
    identifierPlaceholder: "Masukkan username staff",
    identifierHelper: "Untuk wali kelas, guru mapel, dan guru BK",
    passwordHelper: "Gunakan password akun yang sudah terdaftar",
    submitLabel: "Masuk ke Portal Staff",
    submittingLabel: "Memverifikasi staff",
    buttonClass:
      "border-teal-300/45 bg-[linear-gradient(135deg,#0f766e_0%,#149a73_52%,#65c586_100%)] shadow-[0_18px_44px_rgba(15,118,110,0.22)] hover:shadow-[0_22px_56px_rgba(15,118,110,0.28)]",
  },
} satisfies Record<
  PortalType,
  {
    identifierLabel: string;
    identifierPlaceholder: string;
    identifierHelper: string;
    passwordHelper: string;
    submitLabel: string;
    submittingLabel: string;
    buttonClass: string;
  }
>;

export function LoginForm({ portal }: LoginFormProps) {
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [rateLimitKind, setRateLimitKind] = useState<LoginRateLimitKind | null>(
    null,
  );
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const content = formContent[portal];

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      portal,
      nis: "",
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginSchema) => {
    setRateLimitKind(null);
    try {
      const result = await login(values);
      const response = result.data as AuthLoginResponse;

      // Guard against stale data from a previous account/role on this tab
      // (e.g. session expired without an explicit logout).
      queryClient.clear();
      saveAuthSession(response);

      const formattedName = formatPersonName(response.user.name);
      const welcomeName =
        portal === "student" ? formattedName.split(" ")[0] : formattedName;
      toast.success("Berhasil masuk", {
        description: `Selamat datang, ${welcomeName}`,
      });

      if (typeof window !== "undefined") {
        window.setTimeout(() => {
          window.location.replace(getDashboardPathForUser(response.user));
        }, 700);
      }
    } catch (error) {
      if (error instanceof LoginRateLimitError) {
        setRateLimitKind(error.kind);
        setRateLimitSeconds(error.retryAfterSeconds);
        return;
      }
      toast.error("Gagal masuk", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat menghubungkan ke server",
      });
    }
  };

  const isRateLimited = rateLimitSeconds > 0;

  useEffect(() => {
    if (!isRateLimited) return;
    const timer = window.setInterval(() => {
      setRateLimitSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [isRateLimited]);

  useEffect(() => {
    if (rateLimitSeconds === 0) setRateLimitKind(null);
  }, [rateLimitSeconds]);

  const isSubmitting = form.formState.isSubmitting;
  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={portal === "staff" ? "space-y-5" : "space-y-4"}
    >
      <input type="hidden" {...form.register("portal")} value={portal} />

      {portal === "student" ? (
        <div className="space-y-2">
          <Label htmlFor="nis" className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {content.identifierLabel}
          </Label>
          <PremiumInput
            id="nis"
            icon={UserRound}
            inputMode="numeric"
            maxLength={10}
            placeholder={content.identifierPlaceholder}
            {...form.register("nis")}
            onChange={(e) => {
              const filtered = e.target.value.replace(/\D/g, "").slice(0, 10);
              form.setValue("nis", filtered, {
                shouldValidate: !!form.formState.errors.nis,
              });
            }}
          />
          {form.formState.errors.nis ? (
            <p className="text-sm text-rose-600">
              {form.formState.errors.nis.message}
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-300">{content.identifierHelper}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Label
            htmlFor="username"
            className="text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            {content.identifierLabel}
          </Label>
          <PremiumInput
            id="username"
            icon={ShieldCheck}
            placeholder={content.identifierPlaceholder}
            {...form.register("username")}
          />
          {form.formState.errors.username ? (
            <p className="text-sm text-rose-600">
              {form.formState.errors.username.message}
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">{content.identifierHelper}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label
          htmlFor="password"
          className="text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          Password
        </Label>
        <PremiumInput
          id="password"
          icon={LockKeyhole}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Masukkan Password"
          trailing={
            <button
              type="button"
              data-press-managed
              onClick={() => setShowPassword((value) => !value)}
              className="flex size-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-200"
              aria-label={
                showPassword ? "Sembunyikan password" : "Tampilkan password"
              }
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          }
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="text-sm text-rose-600">
            {form.formState.errors.password.message}
          </p>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-300">{content.passwordHelper}</p>
        )}
      </div>

      {isRateLimited && rateLimitKind ? (
        <div
          role="alert"
          className={`flex items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-left text-sm ${
            rateLimitKind === "locked"
              ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/45 dark:text-amber-100"
              : "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-700/60 dark:bg-sky-950/45 dark:text-sky-100"
          }`}
        >
          <AlertTriangle
            className={`mt-0.5 size-4 shrink-0 ${
              rateLimitKind === "locked" ? "text-amber-600 dark:text-amber-300" : "text-sky-600 dark:text-sky-300"
            }`}
            aria-hidden="true"
          />
          <p>
            <span className="font-semibold">
              {rateLimitKind === "locked"
                ? "Terlalu banyak percobaan login"
                : "Server sedang ramai menerima login"}
            </span>{" "}
            Coba lagi dalam{" "}
            <span className="font-semibold tabular-nums">
              {formatCountdown(rateLimitSeconds)}
            </span>
          </p>
        </div>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting || isRateLimited}
        aria-busy={isSubmitting || isRateLimited}
        className={`group relative h-12 w-full overflow-hidden rounded-[1.15rem] px-5 text-[14px] font-semibold transition-[transform,box-shadow,filter] duration-200 disabled:cursor-not-allowed disabled:!opacity-100 ${isRateLimited ? "!border-emerald-200 !bg-emerald-100 !text-emerald-700 !shadow-none hover:!scale-100 active:!scale-100 dark:!border-emerald-700 dark:!bg-emerald-950 dark:!text-emerald-200" : `text-white hover:scale-[1.01] active:scale-[0.99] ${content.buttonClass}`}`}
      >
        <span className="relative flex items-center justify-center gap-2">
          <span className="inline-flex size-4 shrink-0 items-center justify-center">
            {isSubmitting || isRateLimited ? (
              <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
            ) : (
              <LogIn className="size-4" />
            )}
          </span>
          <span>
            {isRateLimited
              ? "Tunggu sebentar"
              : isSubmitting
                ? content.submittingLabel
                : content.submitLabel}
          </span>
        </span>
      </Button>
    </form>
  );
}
