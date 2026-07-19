import { ArrowLeft } from "lucide-react";

import { AppLink } from "@/components/router/app-link";

type BackButtonProps = {
  href: string;
  label?: string;
  className?: string;
};

export function BackButton({ href, label = "Kembali", className = "" }: BackButtonProps) {
  return (
    <AppLink
      href={href}
      className={`group inline-flex w-fit items-center gap-2 rounded-full border border-slate-200/90 bg-white/80 px-3.5 py-2.5 text-sm font-semibold text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.05)] backdrop-blur-sm transition-[background-color,border-color,box-shadow,color,transform] duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 hover:shadow-[0_14px_28px_rgba(16,185,129,0.14)] active:translate-y-0 active:scale-[0.97] active:border-emerald-400 active:bg-emerald-100 active:text-emerald-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200/80 ${className}`}
    >
      <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
      <span>{label}</span>
    </AppLink>
  );
}
