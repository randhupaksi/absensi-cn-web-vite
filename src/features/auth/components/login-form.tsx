"use client";

import { PremiumInput } from "@/features/auth/components/premium-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getDashboardPathForUser, saveAuthSession } from "@/lib/auth";
import { loginSchema, type LoginSchema, type PortalType } from "@/lib/validations/login-schema";
import { login, type AuthLoginResponse } from "@/services/auth.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LogIn,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useRouter } from "@/lib/router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type LoginFormProps = {
  portal: PortalType;
};

const formContent = {
  student: {
    identifierLabel: "NIS",
    identifierPlaceholder: "Masukkan NIS",
    identifierHelper: "Gunakan 10 digit angka sesuai NIS sekolah.",
    passwordHelper: "Masukkan password dari akun siswa anda.",
    submitLabel: "Masuk sebagai Siswa",
    submittingLabel: "Memproses absensi...",
    buttonClass:
      "border-emerald-300/40 bg-[linear-gradient(135deg,#149a73_0%,#50b98c_56%,#a8d38a_100%)] shadow-[0_18px_44px_rgba(20,154,115,0.24)] hover:shadow-[0_22px_56px_rgba(20,154,115,0.3)]",
  },
  staff: {
    identifierLabel: "Username Staff",
    identifierPlaceholder: "Masukkan Username Staff",
    identifierHelper: "Untuk wali kelas, BK, dan admin.",
    passwordHelper: "Gunakan password staff yang sudah terdaftar.",
    submitLabel: "Masuk ke Portal Staff",
    submittingLabel: "Memverifikasi staff...",
    buttonClass:
      "border-teal-300/45 bg-[linear-gradient(135deg,#0f766e_0%,#149a73_52%,#65c586_100%)] shadow-[0_18px_44px_rgba(15,118,110,0.22)] hover:shadow-[0_22px_56px_rgba(15,118,110,0.28)]",
  },
} satisfies Record<PortalType, {
  identifierLabel: string;
  identifierPlaceholder: string;
  identifierHelper: string;
  passwordHelper: string;
  submitLabel: string;
  submittingLabel: string;
  buttonClass: string;
}>;

export function LoginForm({ portal }: LoginFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const prefersReducedMotion = useReducedMotion();
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
    try {
      const result = await login(values);
      const response = result.data as AuthLoginResponse;

      // Guard against stale data from a previous account/role on this tab
      // (e.g. session expired without an explicit logout).
      queryClient.clear();
      saveAuthSession(response);

      toast.success("Login berhasil", {
        description: `Selamat datang, ${response.user.name}.`,
      });

      router.push(getDashboardPathForUser(response.user));
    } catch (error) {
      toast.error("Login gagal", {
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat menghubungkan ke server.",
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={portal === "staff" ? "space-y-5" : "space-y-4"}>
      <input type="hidden" {...form.register("portal")} value={portal} />

      <AnimatePresence mode="wait" initial={false}>
        {portal === "student" ? (
          <motion.div
            key="student-fields"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -10, scale: 0.985 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 10, scale: 0.985 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="space-y-2"
          >
            <Label htmlFor="nis" className="text-sm font-medium text-slate-700">
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
                form.setValue("nis", filtered, { shouldValidate: !!form.formState.errors.nis });
              }}
            />
            {form.formState.errors.nis ? (
              <p className="text-sm text-rose-600">
                {form.formState.errors.nis.message}
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                {content.identifierHelper}
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="staff-fields"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 10, scale: 0.985 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -10, scale: 0.985 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="space-y-2"
          >
            <Label
              htmlFor="username"
              className="text-sm font-medium text-slate-700"
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
              <p className="text-xs text-slate-500">
                {content.identifierHelper}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-slate-700">
          Password
        </Label>
        <PremiumInput
          id="password"
          icon={LockKeyhole}
          type={showPassword ? "text" : "password"}
          placeholder="Masukkan Password"
          trailing={
            <motion.button
              type="button"
              whileHover={{ scale: 1.08, rotate: showPassword ? -5 : 5 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setShowPassword((value) => !value)}
              className="flex size-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700"
              aria-label={
                showPassword ? "Sembunyikan password" : "Tampilkan password"
              }
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </motion.button>
          }
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="text-sm text-rose-600">
            {form.formState.errors.password.message}
          </p>
        ) : (
          <p className="text-xs text-slate-500">
            {content.passwordHelper}
          </p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={form.formState.isSubmitting}
        className={`group relative h-12 w-full overflow-hidden rounded-[1.15rem] px-5 text-[14px] font-semibold text-white transition duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 ${content.buttonClass}`}
      >
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-[-45%] w-[42%] bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.28),transparent)]"
          animate={{ x: ["0%", "360%"] }}
          transition={{
            duration: 3.6,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <AnimatePresence mode="wait" initial={false}>
          {form.formState.isSubmitting ? (
            <motion.span
              key="loading"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              className="relative flex items-center gap-2"
            >
              <LoaderCircle className="size-4 animate-spin" />
              {content.submittingLabel}
            </motion.span>
          ) : (
            <motion.span
              key={portal}
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              className="relative flex items-center gap-2"
            >
              {content.submitLabel}
              <motion.span
                initial={false}
                animate={prefersReducedMotion ? undefined : { x: [0, 3, 0] }}
                transition={prefersReducedMotion ? undefined : { repeat: Number.POSITIVE_INFINITY, duration: 1.8 }}
                className="inline-flex"
              >
                <LogIn className="size-4" />
              </motion.span>
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </form>
  );
}
