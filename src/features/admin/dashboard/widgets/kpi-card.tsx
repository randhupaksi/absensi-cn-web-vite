"use client";

import type { LucideIcon } from "lucide-react";
import { getAccentTone } from "@/lib/ui/accent-tone";

type KpiCardProps = {
  label: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  accentClass: string;
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  accentClass,
}: KpiCardProps) {
  return (
    <article className="rounded-[22px] border border-slate-200/70 bg-white/82 p-3.5 shadow-[0_16px_34px_rgba(150,163,184,0.12)] backdrop-blur transition-transform duration-200 ease-out hover:-translate-y-[3px] motion-reduce:transition-none dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-none sm:rounded-[26px] sm:p-4">
      <div className="flex h-full items-center gap-2.5 min-[380px]:gap-3 xl:gap-4">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-full border-2 bg-transparent shadow-none min-[380px]:size-10 xl:size-12 ${getAccentTone(accentClass)}`}
        >
          <Icon className="size-4 stroke-[1.8] xl:size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400 dark:text-slate-400 xl:text-xs">
            {label}
          </p>
          <p className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 min-[380px]:text-2xl xl:text-[1.75rem]">
            {value}
          </p>
        </div>
      </div>
    </article>
  );
}
