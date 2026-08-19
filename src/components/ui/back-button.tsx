import { ArrowLeft } from "lucide-react";
import type { MouseEventHandler } from "react";

import { AppLink } from "@/components/router/app-link";

type BackButtonProps = {
  href: string;
  label?: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function BackButton({
  href,
  label = "Kembali",
  className = "",
  onClick,
}: BackButtonProps) {
  return (
    <AppLink
      href={href}
      onClick={onClick}
      className={`group inline-flex w-fit touch-manipulation items-center gap-2 rounded-full border border-slate-200/90 bg-white/80 px-3.5 py-2.5 text-sm font-semibold text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.05)] backdrop-blur-sm outline-none select-none transition-[background-color,border-color,box-shadow,color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 hover:shadow-[0_14px_28px_rgba(16,185,129,0.14)] active:translate-y-px active:scale-[0.96] active:duration-75 active:border-emerald-400 active:bg-emerald-100 active:text-emerald-900 focus:translate-y-px focus:scale-[0.96] focus:border-emerald-400 focus:bg-emerald-100 focus:text-emerald-900 focus-visible:ring-4 focus-visible:ring-emerald-200/80 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-200 dark:shadow-none dark:hover:border-emerald-500 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-100 dark:hover:shadow-none dark:active:border-emerald-500 dark:active:bg-emerald-950/80 dark:active:text-emerald-100 dark:focus:border-emerald-500 dark:focus:bg-emerald-950/60 dark:focus:text-emerald-100 dark:focus-visible:ring-emerald-400/25 ${className}`}
    >
      <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
      <span>{label}</span>
    </AppLink>
  );
}
