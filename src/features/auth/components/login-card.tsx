"use client";

import { LoginForm } from "@/features/auth/components/login-form";
import { Badge } from "@/components/ui/badge";
import { AppImage as Image } from "@/components/media/app-image";
import { ShieldCheck, Sparkles } from "lucide-react";
import { PortalType } from "@/lib/validations/login-schema";

type LoginCardProps = {
  portal: PortalType;
};

const portalContent = {
  student: {
    badge: "Portal Siswa",
    title: "Citra Negara",
    subtitle:
      "Masuk dengan NIS untuk melakukan absensi dan melihat riwayat kehadiran",
    intro: "Akses absensi siswa",
    introDetail: "Gunakan NIS sekolah dan password akun siswa",
    formShell:
      "auth-theme-surface student-login-form-shell rounded-[1.7rem] border border-emerald-100/90 bg-white/94 p-4 shadow-[0_20px_52px_rgba(15,118,110,0.11),inset_0_1px_0_rgba(255,255,255,0.92)] md:bg-white/58 md:backdrop-blur-md dark:border-emerald-800/70 dark:bg-slate-900 dark:shadow-none dark:md:bg-slate-900/95 dark:md:backdrop-blur-none sm:p-5",
    footer:
      "Copyright 2026 Sekolah Citra Negara · Developed by Randhu Paksi Membumi · All rights reserved",
  },
  staff: {
    badge: "Portal Staff",
    title: "Citra Negara",
    subtitle: "Masuk dengan username untuk walas, guru mapel, dan guru BK",
    intro: "Akses operasional sekolah",
    introDetail: "Gunakan username yang sudah terdaftar oleh sistem",
    formShell:
      "auth-theme-surface staff-login-form-shell rounded-[1.7rem] border border-emerald-100/90 bg-white/94 p-4 shadow-[0_20px_52px_rgba(15,118,110,0.11),inset_0_1px_0_rgba(255,255,255,0.92)] md:bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(236,253,245,0.46))] md:backdrop-blur-md dark:border-emerald-800/70 dark:bg-slate-900 dark:shadow-none dark:md:bg-slate-900/95 dark:md:backdrop-blur-none sm:p-5",
    footer:
      "Copyright 2026 Sekolah Citra Negara · Developed by Randhu Paksi Membumi · All rights reserved",
  },
} satisfies Record<
  PortalType,
  {
    badge: string;
    title: string;
    subtitle: string;
    intro: string;
    introDetail: string;
    formShell: string;
    footer: string;
  }
>;

export function LoginCard({ portal }: LoginCardProps) {
  const content = portalContent[portal];

  return (
    <section className="relative">
      <div className="absolute inset-0 hidden rounded-[2.2rem] bg-[linear-gradient(135deg,rgba(62,184,129,0.14),rgba(255,255,255,0.16),rgba(162,215,140,0.08))] blur-lg md:block" />
      <div className="auth-theme-surface relative overflow-hidden rounded-[1.7rem] border border-white/80 bg-white/96 p-4 shadow-[0_28px_90px_rgba(22,85,58,0.14)] min-[380px]:rounded-[2rem] min-[380px]:p-5 md:rounded-[2.2rem] md:border-white/60 md:bg-white/62 md:backdrop-blur-md dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_28px_90px_rgba(0,0,0,0.48)] dark:md:bg-slate-900/95 dark:md:backdrop-blur-none sm:p-7 lg:p-8">
        <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(255,255,255,0))] dark:hidden" />

        <div className="relative space-y-5 sm:space-y-6">
          <div className="space-y-4 sm:space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <Badge className="rounded-full border border-white/70 bg-white/65 px-3.5 py-1 text-emerald-800 shadow-sm hover:bg-white/65 dark:border-emerald-700/60 dark:bg-emerald-950/55 dark:text-emerald-200 dark:shadow-none dark:hover:bg-emerald-950/70">
                  <Sparkles className="size-4" />
                  {content.badge}
                </Badge>
                <div className="flex items-center gap-3 min-[380px]:gap-4 sm:gap-5">
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 hidden rounded-full bg-emerald-200/30 blur-md md:block dark:hidden" />
                    <div className="relative size-14 min-[380px]:size-16 sm:size-22">
                      <Image
                        src="/images/optimized/logo-sma-smk-yatkj-ui.png"
                        alt="Logo Sekolah Citra Negara"
                        fill
                        sizes="88px"
                        className="object-contain drop-shadow-[0_10px_22px_rgba(22,85,58,0.14)] dark:drop-shadow-none"
                        priority
                      />
                    </div>
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    <h1 className="font-heading text-[clamp(1.3rem,7.2vw,1.85rem)] font-semibold leading-[1.05] tracking-tight text-slate-950 [overflow-wrap:anywhere] dark:text-slate-100 sm:text-[2rem]">
                      {content.title}
                    </h1>
                    <p className="max-w-sm text-[0.82rem] leading-5 text-slate-600 dark:text-slate-300 min-[380px]:text-sm min-[380px]:leading-6 sm:text-[15px]">
                      {content.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              <div className="hidden md:block">
                <div className="relative">
                  <div className="absolute inset-0 rounded-[1.6rem] bg-emerald-200/45 blur-md dark:hidden" />
                  <div className="relative rounded-[1.45rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.62))] p-3.5 shadow-[0_16px_38px_rgba(16,24,40,0.1),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-md dark:border-slate-700 dark:bg-slate-800 dark:shadow-none dark:backdrop-blur-none">
                    <ShieldCheck className="size-[1.05rem] text-emerald-700 dark:text-emerald-300" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {content.intro}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{content.introDetail}</p>
            </div>
          </div>

          <div className={content.formShell}>
            <LoginForm key={portal} portal={portal} />
          </div>

          <div className="flex items-center justify-center gap-3 px-1 text-center text-[0.68rem] leading-4 text-slate-500 dark:text-slate-400 min-[380px]:text-xs min-[380px]:leading-5">
            <p>{content.footer}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
