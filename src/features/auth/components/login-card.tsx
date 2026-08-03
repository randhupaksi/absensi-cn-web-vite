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
    title: "Absensi CN",
    subtitle: "Masuk dengan NIS untuk melakukan absensi dan melihat riwayat kehadiran.",
    intro: "Akses absensi siswa.",
    introDetail: "Gunakan NIS sekolah dan password akun siswa.",
    formShell:
      "rounded-[1.7rem] border border-emerald-100/90 bg-white/58 p-4 shadow-[0_20px_52px_rgba(15,118,110,0.11),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-md sm:p-5",
    footer: "Copyright 2026 Sekolah Citra Negara · Developed by Randhu Paksi Membumi · All rights reserved.",
  },
  staff: {
    badge: "Portal Staff",
    title: "Ruang Staf CN",
    subtitle: "Masuk dengan username untuk wali kelas, BK, dan admin sekolah.",
    intro: "Akses operasional sekolah.",
    introDetail: "Gunakan username staff yang sudah terdaftar oleh admin.",
    formShell:
      "rounded-[1.7rem] border border-emerald-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(236,253,245,0.46))] p-4 shadow-[0_20px_52px_rgba(15,118,110,0.11),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-md sm:p-5",
    footer: "Copyright 2026 Sekolah Citra Negara · Developed by Randhu Paksi Membumi · All rights reserved.",
  },
} satisfies Record<PortalType, {
  badge: string;
  title: string;
  subtitle: string;
  intro: string;
  introDetail: string;
  formShell: string;
  footer: string;
}>;

export function LoginCard({ portal }: LoginCardProps) {
  const content = portalContent[portal];

  return (
    <section className="relative">
      <div className="absolute inset-0 rounded-[2.2rem] bg-[linear-gradient(135deg,rgba(62,184,129,0.14),rgba(255,255,255,0.16),rgba(162,215,140,0.08))] blur-lg" />
      <div className="relative overflow-hidden rounded-[2.2rem] border border-white/60 bg-white/62 p-5 shadow-[0_28px_90px_rgba(22,85,58,0.14)] backdrop-blur-md sm:p-7 lg:p-8">
        <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(255,255,255,0))]" />

        <div className="relative space-y-6">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <Badge className="rounded-full border border-white/70 bg-white/65 px-3.5 py-1 text-emerald-800 shadow-sm hover:bg-white/65">
                  <Sparkles className="size-4" />
                  {content.badge}
                </Badge>
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 rounded-full bg-emerald-200/30 blur-md" />
                    <div className="relative h-22 w-22">
                      <Image
                        src="/images/optimized/logo-sma-smk-yatkj-ui.png"
                        alt="Logo Sekolah Citra Negara"
                        fill
                        sizes="88px"
                        className="object-contain drop-shadow-[0_10px_22px_rgba(22,85,58,0.14)]"
                        priority
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
                      {content.title}
                    </h1>
                    <p className="max-w-sm text-sm leading-6 text-slate-600 sm:text-[15px]">
                      {content.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              <div className="hidden md:block">
                <div className="relative">
                  <div className="absolute inset-0 rounded-[1.6rem] bg-emerald-200/45 blur-md" />
                  <div className="relative rounded-[1.45rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.62))] p-3.5 shadow-[0_16px_38px_rgba(16,24,40,0.1),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-md">
                    <ShieldCheck className="size-[1.05rem] text-emerald-700" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">
                {content.intro}
              </p>
              <p className="text-sm text-slate-500">
                {content.introDetail}
              </p>
            </div>

          </div>

          <div className={content.formShell}>
            <LoginForm key={portal} portal={portal} />
          </div>

          <div className="flex items-center justify-center gap-3 text-center text-xs text-slate-500">
            <p>{content.footer}</p>
           
          </div>
        </div>
      </div>
    </section>
  );
}
