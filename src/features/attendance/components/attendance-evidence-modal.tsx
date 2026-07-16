"use client";

import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import { AttendanceLocationEvidence } from "@/features/attendance/components/location-evidence";
import { PremiumModal } from "@/components/modals/premium-modal";
import { ProtectedApiImage } from "@/components/security/protected-api-asset";
import { Badge } from "@/components/ui/badge";
import { formatDisplayLabel } from "@/lib/utils";
import type { StaffAttendanceRecord } from "@/types/staff";
import { format, parseISO } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { Image as ImageIcon } from "lucide-react";

export function AttendanceEvidenceModal({
  record,
  onOpenChange,
}: {
  record: StaffAttendanceRecord | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <PremiumModal
      open={Boolean(record)}
      onOpenChange={onOpenChange}
      title={record ? `Bukti ${record.student_name}` : "Bukti Absensi"}
      description="Foto absensi dan validasi lokasi ditampilkan dalam satu bukti."
      icon={ImageIcon}
      className="sm:!max-w-[760px]"
    >
      {record ? (
        <div className="grid gap-4">
          <div className="rounded-[var(--radius-xl)] border border-emerald-100/70 bg-white/92 p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-900">{record.student_name}</p>
                <p className="text-sm text-slate-500">
                  {record.nis} - {record.class_name}
                </p>
                <p className="text-sm text-slate-500">
                  {formatFriendlyDate(record.attendance_date)} - {formatCheckInTime(record.check_in_at)}
                </p>
              </div>
              <EvidenceStatus status={record.status} />
            </div>
          </div>

          <div className="overflow-hidden rounded-[var(--radius-xl)] border border-emerald-100/80 bg-emerald-50/40 p-3">
            {record.photo_url ? (
              <ProtectedApiImage
                src={record.photo_url}
                alt={`Bukti absensi ${record.student_name}`}
                className="max-h-[55vh] w-full rounded-[var(--radius)] object-contain"
              />
            ) : (
              <EmptyState
                icon={ImageIcon}
                title="Bukti foto belum tersedia"
                description="Record ini belum memiliki foto absensi yang bisa ditampilkan."
                compact
              />
            )}
            <AttendanceLocationEvidence evidence={record} className="mt-4 px-1 pb-1" />
          </div>
        </div>
      ) : null}
    </PremiumModal>
  );
}

function EvidenceStatus({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const className =
    normalized === "hadir"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "telat"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : normalized === "alfa"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : normalized === "sakit"
            ? "border-violet-200 bg-violet-50 text-violet-700"
            : "border-sky-200 bg-sky-50 text-sky-700";
  return <Badge className={className}>{formatDisplayLabel(status)}</Badge>;
}

function formatFriendlyDate(value: string) {
  try {
    return format(parseISO(value), "dd MMMM yyyy", { locale: localeID });
  } catch {
    return value;
  }
}

function formatCheckInTime(value?: string) {
  if (!value) return "Check-in belum tercatat";
  try {
    return format(parseISO(value), "HH:mm 'WIB'", { locale: localeID });
  } catch {
    return value;
  }
}
