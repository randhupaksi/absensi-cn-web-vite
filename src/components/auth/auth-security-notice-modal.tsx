"use client";

import { Button } from "@/components/ui/button";
import { PremiumModal, premiumModalSubmitButtonClassName } from "@/components/modals/premium-modal";
import {
  clearAuthSession,
  subscribeAuthSecurityNotice,
  type AuthSecurityNotice,
} from "@/lib/auth";
import { ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

function formatResetTime(value?: string) {
  if (!value) return "waktu reset tidak tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "waktu reset tidak tersedia";
  return date.toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export function AuthSecurityNoticeModal() {
  const [notice, setNotice] = useState<AuthSecurityNotice | null>(null);

  useEffect(() => subscribeAuthSecurityNotice(setNotice), []);

  const logoutAndLoginAgain = () => {
    if (!notice) return;
    const loginPath = notice.loginPath;
    clearAuthSession();
    setNotice(null);
    window.location.replace(loginPath);
  };

  return (
    <PremiumModal
      open={Boolean(notice)}
      onOpenChange={() => undefined}
      title="Password akun direset"
      description="Sesi kamu dihentikan untuk menjaga keamanan akun."
      icon={ShieldAlert}
      disablePointerDismissal
      hideCloseButton
      footer={
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={logoutAndLoginAgain}
            className={premiumModalSubmitButtonClassName}
          >
            Logout &amp; Login Ulang
          </Button>
        </div>
      }
    >
      <div className="rounded-2xl border border-amber-300/40 bg-amber-50/80 p-4 text-sm leading-6 text-slate-700 dark:border-amber-400/25 dark:bg-amber-950/25 dark:text-slate-200">
        Password akun kamu telah direset oleh{" "}
        <span className="font-semibold text-slate-900 dark:text-white">
          {notice?.resetBy?.trim() || "administrator"}
        </span>{" "}
        pada{" "}
        <span className="font-semibold text-slate-900 dark:text-white">
          {formatResetTime(notice?.resetAt)}
        </span>
        . Silakan logout lalu login ulang menggunakan password baru.
      </div>
    </PremiumModal>
  );
}
