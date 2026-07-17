"use client";

import { AdminShell } from "@/features/admin/shell/shell";
import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import { FileText } from "lucide-react";
import { motion } from "motion/react";

type AdminPlaceholderPageProps = {
  title: string;
  subtitle: string;
  description: string;
};

export function AdminPlaceholderPage({
  title,
  subtitle,
  description,
}: AdminPlaceholderPageProps) {

  return (
    <AdminShell>
      {() => (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="rounded-[28px] border border-white/70 bg-white/82 p-5 shadow-[0_24px_60px_rgba(28,77,61,0.08)] backdrop-blur-xl sm:p-6"
        >
          <div className="border-b border-slate-200/80 pb-4">
            <h2 className="text-[1.9rem] font-semibold tracking-tight text-slate-950">
              {title}
            </h2>
            <p className="mt-1 text-base text-slate-600">{subtitle}</p>
          </div>

          <div className="mt-6">
            <EmptyState
              icon={FileText}
              title={`Section ${title} sedang disiapkan`}
              description={description}
            />
          </div>
        </motion.section>
      )}
    </AdminShell>
  );
}
