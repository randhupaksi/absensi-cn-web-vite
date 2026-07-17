import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  LoaderCircle,
  type LucideIcon,
} from "lucide-react";

export type ProcessStepState = "pending" | "active" | "complete" | "error";

export type ProcessStep = {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  state: ProcessStepState;
};

export function ProcessStatus({
  steps,
  progress,
  className,
}: {
  steps: ProcessStep[];
  progress?: number;
  className?: string;
}) {
  return (
    <section
      aria-label="Status proses absensi"
      aria-live="polite"
      className={cn(
        "rounded-[1.3rem] border border-emerald-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(240,253,244,0.72))] p-4 shadow-[0_14px_32px_rgba(15,118,110,0.07)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-emerald-700/75">
            Status proses
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            Bukti kehadiran sedang disiapkan
          </p>
        </div>
        {progress !== undefined ? (
          <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold tabular-nums text-emerald-700">
            {Math.round(progress)}%
          </span>
        ) : null}
      </div>

      {progress !== undefined ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-emerald-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-5">
        {steps.map((step) => (
          <ProcessStepItem key={step.id} step={step} />
        ))}
      </div>
    </section>
  );
}

function ProcessStepItem({ step }: { step: ProcessStep }) {
  const Icon = step.icon;
  const StateIcon =
    step.state === "complete"
      ? CheckCircle2
      : step.state === "active"
        ? LoaderCircle
        : step.state === "error"
          ? AlertTriangle
          : Circle;

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2.5 transition-colors",
        step.state === "complete" && "border-emerald-100 bg-emerald-50/80 text-emerald-700",
        step.state === "active" && "border-sky-200 bg-sky-50 text-sky-700",
        step.state === "error" && "border-rose-200 bg-rose-50 text-rose-700",
        step.state === "pending" && "border-slate-100 bg-slate-50/70 text-slate-400",
      )}
      title={step.description}
    >
      <span className="relative flex size-5 shrink-0 items-center justify-center">
        {Icon && step.state !== "active" ? <Icon className="size-4" /> : null}
        {!Icon || step.state === "active" ? (
          <StateIcon className={cn("size-4", step.state === "active" && "animate-spin motion-reduce:animate-none")} />
        ) : null}
      </span>
      <span className="truncate text-[0.68rem] font-semibold">{step.label}</span>
    </div>
  );
}
