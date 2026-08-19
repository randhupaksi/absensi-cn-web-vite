"use client";

import { Badge } from "@/components/ui/badge";
import { AppLink as Link } from "@/components/router/app-link";
import { Leaf, ShieldCheck } from "lucide-react";
import { FaArrowLeft } from "react-icons/fa";

export function LoginShowcase() {
  return (
    <section className="relative hidden min-h-[560px] lg:flex lg:items-center">
      <div className="pointer-events-none absolute left-[8%] top-[24%] h-44 w-44 rounded-full bg-emerald-200/20 blur-3xl dark:hidden" />
      <div className="relative z-10 max-w-xl space-y-5 pt-2">
        <div className="flex flex-col items-start gap-8">
          <div className="w-full">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-full border border-white/75 bg-white/76 px-3.5 py-2 text-sm font-medium text-slate-700 shadow-[0_12px_28px_rgba(15,23,42,0.08)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:text-emerald-800 hover:shadow-[0_18px_36px_rgba(22,85,58,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:shadow-none dark:backdrop-blur-none dark:hover:border-emerald-600 dark:hover:bg-slate-800 dark:hover:text-emerald-200"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-[linear-gradient(180deg,#ffffff_0%,#ecfdf5_100%)] text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_18px_rgba(22,85,58,0.1)] transition-transform duration-200 group-hover:-translate-x-0.5 dark:bg-slate-800 dark:text-emerald-300 dark:shadow-none">
                <FaArrowLeft className="size-4" />
              </span>
              <span className="leading-none">Kembali ke beranda</span>
            </Link>
          </div>

          <Badge className="w-fit rounded-full border border-emerald-200/70 bg-white/60 px-4 py-1 text-emerald-800 shadow-sm hover:bg-white/60 dark:border-emerald-700/60 dark:bg-emerald-950/50 dark:text-emerald-200 dark:shadow-none dark:hover:bg-emerald-950/70">
            <Leaf className="size-4" />
            Sistem Sekolah Terintegrasi
          </Badge>
        </div>

        <div className="space-y-4">
          <h1 className="max-w-lg font-heading text-5xl font-semibold leading-[1.08] tracking-[-0.04em] text-slate-950 dark:text-slate-100 xl:text-6xl xl:leading-[1.08]">
            Kehadiran digital untuk sekolah modern
          </h1>
          <p className="max-w-md text-base leading-8 text-slate-600 dark:text-slate-300">
            Pengalaman masuk yang elegan, terarah, dan dirancang untuk
            lingkungan sekolah yang profesional.
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <div className="rounded-full border border-white/65 bg-white/55 p-2.5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900 dark:shadow-none dark:backdrop-blur-none">
            <ShieldCheck className="size-4 text-emerald-700 dark:text-emerald-300" />
          </div>
          <p>Portal login dengan validasi peran yang terjaga.</p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 dark:hidden">
        <div className="absolute left-[4%] top-[14%] h-64 w-64 rounded-full bg-emerald-300/22 blur-3xl" />
        <div className="absolute bottom-[12%] left-[18%] h-72 w-72 rounded-full bg-lime-200/16 blur-3xl" />
        <div className="absolute bottom-[18%] left-[2%] h-px w-56 bg-gradient-to-r from-transparent via-white/55 to-transparent" />
      </div>
    </section>
  );
}
