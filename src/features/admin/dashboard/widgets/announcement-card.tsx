"use client";

import { BellDot, BadgeAlert } from "lucide-react";
import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import type { AdminDashboardData } from "@/types/admin";

type AnnouncementCardProps = {
  announcements: AdminDashboardData["announcements"];
};

export function AnnouncementCard({ announcements }: AnnouncementCardProps) {
  const hasData = announcements.length > 0;

  return (
    <article className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xl font-semibold text-slate-950">Papan Pengumuman</p>
          <p className="mt-1 text-sm text-slate-500">
            Notifikasi operasional admin
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
          Terbaru
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {hasData ? (
          announcements.slice(0, 5).map((item) => (
            <article
              key={item.id}
              className="rounded-[24px] border border-slate-100 bg-slate-50/95 p-4"
            >
              <div className="flex gap-4">
                <span
                  className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${getAnnouncementToneClass(item.tone)}`}
                >
                  <BadgeAlert className="size-4" />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-sm leading-6 text-slate-500">{item.description}</p>
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            icon={BellDot}
            title="Belum ada pengumuman"
            description="Notifikasi operasional admin akan tampil di sini saat sistem memiliki informasi penting."
          />
        )}
      </div>
    </article>
  );
}

function getAnnouncementToneClass(tone: string) {
  switch (tone) {
    case "warning":
      return "bg-amber-100 text-amber-700";
    case "success":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-sky-100 text-sky-700";
  }
}
