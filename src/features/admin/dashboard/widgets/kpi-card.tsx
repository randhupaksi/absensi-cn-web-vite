"use client";

import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

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
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="rounded-[26px] border border-white/75 bg-white/82 p-4 shadow-[0_16px_34px_rgba(150,163,184,0.12)] backdrop-blur"
    >
      <div className="flex h-full items-center gap-3 xl:gap-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-2xl shadow-sm xl:size-12 ${accentClass}`}
        >
          <Icon className="size-4 xl:size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400 xl:text-xs">
            {label}
          </p>
          <p className="text-2xl font-semibold tracking-tight text-slate-950 xl:text-[1.75rem]">
            {value}
          </p>
        </div>
      </div>
    </motion.article>
  );
}
