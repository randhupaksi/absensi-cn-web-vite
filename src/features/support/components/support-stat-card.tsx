import type { LucideIcon } from "lucide-react";

type SupportStatTone = "sky" | "amber" | "rose" | "emerald";

type SupportStatCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: SupportStatTone;
};

const toneClasses: Record<SupportStatTone, string> = {
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  emerald:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

export function SupportStatCard({
  label,
  value,
  icon: Icon,
  tone,
}: SupportStatCardProps) {
  return (
    <article className="relative flex items-start justify-between gap-3 rounded-[24px] border border-white/70 bg-white/90 p-3 shadow-[0_14px_34px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-none sm:p-4">
      <div className="min-w-0">
        <p className="whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:text-[10px] sm:tracking-[0.14em]">
          {label}
        </p>
        <p className="mt-2 font-heading text-2xl font-semibold text-slate-950 dark:text-white">
          {value}
        </p>
      </div>
      <span
        className={`absolute right-3 top-3 flex size-10 shrink-0 items-center justify-center rounded-full sm:static sm:size-11 ${toneClasses[tone]}`}
      >
        <Icon className="size-5" />
      </span>
    </article>
  );
}
