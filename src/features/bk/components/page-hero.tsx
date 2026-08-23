import { KpiCard } from "@/features/admin/dashboard/widgets/kpi-card";
import { Button } from "@/components/ui/button";
import { ExportImportActions } from "@/components/ui/export-import-actions";
import { LayoutPanelTop, Printer } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

type BkPageHeroProps = {
  badge: string;
  title: string;
  description: ReactNode;
  kpiCards: Array<ComponentProps<typeof KpiCard>>;
  onOpenReport: () => void;
  kpiGridClassName?: string;
  topClassName?: string;
  contentClassName?: string;
  actionClassName?: string;
  footer?: ReactNode;
};

export function BkPageHero({
  badge,
  title,
  description,
  kpiCards,
  onOpenReport,
  kpiGridClassName = "grid grid-cols-2 items-start gap-3 xl:grid-cols-4",
  topClassName = "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between",
  contentClassName = "space-y-4",
  actionClassName = "flex justify-start lg:justify-end",
  footer,
}: BkPageHeroProps) {
  return (
    <div className="relative flex flex-col gap-4 border-b border-slate-200/80 pb-4 dark:border-slate-700 sm:gap-5 sm:pb-5">
      <div className={topClassName}>
        <div className={contentClassName}>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)] dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300 dark:shadow-none sm:px-3.5 sm:py-2 sm:text-[11px] sm:tracking-[0.22em]">
            <LayoutPanelTop className="size-3.5" />
            {badge}
          </div>
          <div className="space-y-2">
            <h2 className="text-[clamp(1.65rem,8vw,2rem)] font-semibold leading-tight tracking-normal text-slate-950 dark:text-slate-100 sm:text-[2.35rem]">
              {title}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base sm:leading-7">
              {description}
            </p>
          </div>
        </div>
        <div className={actionClassName}>
          <ExportImportActions
            exportAction={{ onClick: onOpenReport, label: "Export Laporan" }}
          />
        </div>
      </div>

      <div className={kpiGridClassName}>
        {kpiCards.map((item) => (
          <div key={item.label}>
            <KpiCard {...item} />
          </div>
        ))}
      </div>

      {footer}
    </div>
  );
}
