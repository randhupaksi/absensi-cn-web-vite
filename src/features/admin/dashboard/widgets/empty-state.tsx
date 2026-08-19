"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  compact?: boolean;
  tone?: "default" | "notice";
  className?: string;
  action?: ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  compact = false,
  tone = "default",
  className,
  action,
}: EmptyStateProps) {
  const iconTone =
    tone === "notice"
      ? "bg-amber-50 text-amber-600 ring-1 ring-amber-100"
      : "bg-white text-slate-400 dark:bg-slate-800 dark:text-slate-300";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/85 text-center dark:border-slate-700 dark:bg-slate-900/80",
        compact ? "gap-3 p-5" : "gap-4 p-8",
        className,
      )}
    >
      <div
        className={`flex size-12 items-center justify-center rounded-2xl shadow-sm ${iconTone}`}
      >
        <Icon className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
        {description ? (
          <p className="max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
