import { KpiCard } from "@/features/admin/dashboard/widgets/kpi-card";
import { Button } from "@/components/ui/button";
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
    <div className="relative flex flex-col gap-5 border-b border-slate-200/80 pb-5">
      <div className={topClassName}>
        <div className={contentClassName}>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/82 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
            <LayoutPanelTop className="size-3.5" />
            {badge}
          </div>
          <div className="space-y-2">
            <h2 className="text-[2rem] font-semibold tracking-normal text-slate-950 sm:text-[2.35rem]">
              {title}
            </h2>
            <p className="max-w-2xl text-[15px] leading-7 text-slate-600 sm:text-base">
              {description}
            </p>
          </div>
        </div>
        <div className={actionClassName}>
          <Button
            variant="outline"
            className="h-14 rounded-[22px] border-violet-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,255,0.98)_100%)] px-5 text-sm font-semibold text-violet-800 shadow-[0_16px_30px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.96)] hover:border-violet-300 hover:bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(237,233,254,1)_100%)] hover:text-violet-950"
            onClick={onOpenReport}
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-violet-600 text-white shadow-[0_10px_20px_rgba(124,58,237,0.2)]">
              <Printer className="size-4" />
            </span>
            Cetak Laporan
          </Button>
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
