"use client";

import { ShieldEllipsis } from "lucide-react";
import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";

type RoleDistributionTableProps = {
  totalUsers: number;
  rows: Array<{
    label: string;
    count: number;
    caption: string;
    colorClass: string;
    barClass: string;
  }>;
};

export function RoleDistributionTable({
  totalUsers,
  rows,
}: RoleDistributionTableProps) {
  const hasData = rows.some((row) => row.count > 0);

  return (
    <article className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xl font-semibold text-slate-950">Akun dan Penugasan Sistem</p>
          <p className="mt-1 text-sm text-slate-500">
            Komposisi role akun serta capability BK yang aktif di sistem
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          {totalUsers} akun
        </span>
      </div>

      {hasData ? (
        <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-100 bg-[linear-gradient(180deg,#fcfffd_0%,#f4faf6_100%)]">
          <div className="grid grid-cols-[1.2fr_0.65fr_1fr] border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            <span>Kategori</span>
            <span>Jumlah</span>
            <span>Proporsi</span>
          </div>

          <div className="divide-y divide-slate-100">
            {rows.map((row) => {
              const percentage = totalUsers > 0 ? Math.round((row.count / totalUsers) * 100) : 0;

              return (
                <div
                  key={row.label}
                  className="grid grid-cols-[1.2fr_0.65fr_1fr] items-center gap-4 px-5 py-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className={`size-3 rounded-full ${row.colorClass}`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {row.label}
                        </p>
                        <p className="truncate text-sm text-slate-500">{row.caption}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-slate-900">{row.count}</div>

                  <div className="space-y-2">
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${row.barClass}`}
                        style={{ width: `${Math.max(percentage, row.count > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                    <p className="text-xs font-medium text-slate-500">{percentage}% dari total akun</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState
            icon={ShieldEllipsis}
            compact
            title="Belum ada akun sistem"
            description="Ringkasan akan tampil setelah akun dan penugasan operasional mulai tersimpan."
          />
        </div>
      )}
    </article>
  );
}
