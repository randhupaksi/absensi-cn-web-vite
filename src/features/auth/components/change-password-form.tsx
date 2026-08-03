"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PremiumInput } from "@/features/auth/components/premium-input";
import { getDashboardPathForUser, getAuthSession, saveAuthSession } from "@/lib/auth";
import { changePasswordSchema, type ChangePasswordSchema } from "@/lib/validations/change-password-schema";
import { changeInitialPassword } from "@/services/auth.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type PasswordField = "currentPassword" | "newPassword" | "confirmation";

const fieldCopy: Record<PasswordField, { label: string; placeholder: string; autoComplete: string }> = {
  currentPassword: {
    label: "Password awal",
    placeholder: "Masukkan password dari sekolah",
    autoComplete: "current-password",
  },
  newPassword: {
    label: "Password baru",
    placeholder: "Minimal 8 karakter",
    autoComplete: "new-password",
  },
  confirmation: {
    label: "Konfirmasi password baru",
    placeholder: "Ulangi password baru",
    autoComplete: "new-password",
  },
};

export function ChangePasswordForm() {
  const [visibleFields, setVisibleFields] = useState<Record<PasswordField, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmation: false,
  });
  const form = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmation: "" },
  });

  const toggleVisibility = (field: PasswordField) => {
    setVisibleFields((current) => ({ ...current, [field]: !current[field] }));
  };

  const onSubmit = async (values: ChangePasswordSchema) => {
    try {
      await changeInitialPassword({
        current_password: values.currentPassword,
        new_password: values.newPassword,
      });

      const session = getAuthSession();
      if (!session) {
        window.location.replace("/login/student");
        return;
      }
      const updatedSession = {
        ...session,
        user: { ...session.user, must_change_password: false },
      };
      saveAuthSession(updatedSession);
      toast.success("Password berhasil diperbarui", {
        description: "Akunmu sekarang menggunakan password pribadi.",
      });
      window.location.replace(getDashboardPathForUser(updatedSession.user));
    } catch (error) {
      toast.error("Password belum diperbarui", {
        description: error instanceof Error ? error.message : "Silakan coba lagi.",
      });
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {(Object.keys(fieldCopy) as PasswordField[]).map((field) => {
        const copy = fieldCopy[field];
        const error = form.formState.errors[field]?.message;
        const isVisible = visibleFields[field];

        return (
          <div key={field} className="space-y-2">
            <Label htmlFor={field} className="text-sm font-medium text-slate-700">
              {copy.label}
            </Label>
            <PremiumInput
              id={field}
              icon={field === "currentPassword" ? KeyRound : LockKeyhole}
              type={isVisible ? "text" : "password"}
              autoComplete={copy.autoComplete}
              placeholder={copy.placeholder}
              aria-invalid={Boolean(error)}
              trailing={
                <button
                  type="button"
                  data-press-managed
                  onClick={() => toggleVisibility(field)}
                  className="flex size-8 items-center justify-center rounded-full text-slate-400 transition-[color,background-color,transform] hover:bg-emerald-50 hover:text-emerald-700 active:scale-90"
                  aria-label={isVisible ? `Sembunyikan ${copy.label.toLowerCase()}` : `Tampilkan ${copy.label.toLowerCase()}`}
                >
                  {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              }
              {...form.register(field)}
            />
            {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
          </div>
        );
      })}

      <div className="flex items-start gap-3 rounded-[1.1rem] border border-emerald-100 bg-emerald-50/75 px-4 py-3.5">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-700" />
        <p className="text-xs leading-5 text-emerald-800">
          Gunakan password yang hanya kamu ketahui. Password ini menggantikan password awal dari sekolah.
        </p>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="h-12 w-full rounded-[1.15rem] bg-[linear-gradient(135deg,#087f5b_0%,#149a73_54%,#63bf8d_100%)] px-5 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(16,137,99,0.25)] transition-[transform,box-shadow,filter] duration-200 hover:scale-[1.01] hover:shadow-[0_22px_52px_rgba(16,137,99,0.3)] active:scale-[0.99] disabled:cursor-wait disabled:opacity-100"
      >
        <span className="flex items-center justify-center gap-2">
          {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
          {isSubmitting ? "Menyimpan password..." : "Simpan password pribadi"}
        </span>
      </Button>
    </form>
  );
}
