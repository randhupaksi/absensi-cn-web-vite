import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  colorClass: string;
};

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  colorClass,
}: StatCardProps) {
  return (
    <Card className="border-white/70 bg-white/80 shadow-sm backdrop-blur">
      <CardContent className="flex items-start justify-between p-4 xl:p-6">
        <div className="space-y-0.5 xl:space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 xl:text-sm xl:font-normal xl:normal-case xl:tracking-normal">
            {label}
          </p>
          <p className="text-2xl font-semibold tracking-tight text-slate-950 xl:text-3xl">
            {value}
          </p>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <div
          className={cn(
            "rounded-2xl p-2.5 xl:p-3",
            colorClass,
          )}
        >
          <Icon className="size-4 xl:size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
