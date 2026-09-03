"use client";

import { PremiumModal } from "@/components/modals/premium-modal";
import { ModalActions } from "@/features/admin/management/shared/section-ui";
import {
  clearAuthSession,
  subscribeAuthSecurityNotice,
  type AuthSecurityNotice,
} from "@/lib/auth";
import { formatPersonName } from "@/lib/format-person-name";
import { CheckCheck, Info, ShieldAlert, ShieldCheck } from "lucide-react";
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

function formatGreetingName(name?: string) {
  const parts = formatPersonName(name).split(" ").filter(Boolean);
  if (!parts.length) return "Pengguna";

  const genericNames = new Set(["Ahmad", "Muhammad"]);
  let firstNameIndex = 0;
  while (
    firstNameIndex < parts.length - 1 &&
    genericNames.has(parts[firstNameIndex])
  ) {
    firstNameIndex += 1;
  }

  return parts[firstNameIndex];
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
      className="sm:!max-w-[720px]"
      overlayClassName="!bg-black/40 supports-backdrop-filter:!backdrop-blur-[2px]"
      footerClassName="!border-t-0 !bg-transparent !px-4 !py-4 dark:!bg-transparent sm:!px-[1.45rem] sm:!py-[1.1rem]"
      footer={
        <ModalActions
          isPending={false}
          onCancel={() => undefined}
          onSubmit={logoutAndLoginAgain}
          submitLabel="Konfirmasi"
          submitIcon={CheckCheck}
          showCancel={false}
          className="!mt-0"
        />
      }
    >
      <div className="space-y-3">
        <div className="flex gap-3 rounded-2xl border border-amber-300/40 bg-amber-50/80 p-4 text-sm leading-6 text-slate-700 dark:border-amber-400/25 dark:bg-amber-950/25 dark:text-slate-200">
          <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-200/70 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
            <ShieldCheck className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="mb-2 text-base font-semibold text-slate-900 dark:text-white">
              Hai, {formatGreetingName(notice?.userName)}!
            </p>
            <p className="font-semibold text-slate-900 dark:text-white">
              Pemberitahuan keamanan akun
            </p>
            <p className="mt-1">
              Password akun kamu telah direset oleh admin, {" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatPersonName(notice?.resetBy) || "Administrator"}
              </span>
              .
            </p>
            <dl className="mt-2 grid gap-1 text-[0.86rem] text-slate-600 dark:text-slate-300">
              <div className="flex flex-wrap gap-x-2">
                <dt className="font-medium">Waktu reset:</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  {formatResetTime(notice?.resetAt)}
                </dd>
              </div>
            </dl>
            <p className="mt-2">
              Sesi sebelumnya dihentikan untuk melindungi akunmu. Silakan login
              ulang menggunakan password baru dari admin.
            </p>
          </div>
        </div>

        <div className="flex gap-3 rounded-2xl border border-slate-300/60 bg-slate-100/75 p-4 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
          <Info className="mt-0.5 size-5 shrink-0 text-sky-600 dark:text-sky-300" />
          <p>
            Jika kamu tidak pernah meminta reset password atau lupa password baru, hubungi wali kelas
            agar dapat melakukan konfirmasi kepada admin sekolah.
          </p>
        </div>
      </div>
    </PremiumModal>
  );
}
