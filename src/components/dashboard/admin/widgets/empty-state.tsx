"use client";

import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  compact?: boolean;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  compact = false,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={`flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/85 text-center ${
        compact ? "gap-3 p-5" : "gap-4 p-8"
      }`}
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
        <Icon className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        {description ? (
          <p className="max-w-sm text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>
    </motion.div>
  );
}
