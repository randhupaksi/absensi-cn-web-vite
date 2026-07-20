"use client";

import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import { AttendanceLocationEvidence } from "@/features/attendance/components/location-evidence";
import {
  PremiumModal,
  premiumModalActionsClassName,
  premiumModalFieldClassName,
  premiumModalHelperClassName,
  premiumModalLabelClassName,
} from "@/components/modals/premium-modal";
import { Button } from "@/components/ui/button";
import { ProtectedApiImage } from "@/components/security/protected-api-asset";
import { FieldError } from "@/components/ui/field-error";
import { RadixSelectField } from "@/components/ui/radix-select";
import { Textarea } from "@/components/ui/textarea";
import { type FieldErrors, hasFieldErrors, validateRequired } from "@/lib/form-validation";
import { formatDisplayLabel } from "@/lib/utils";
import type { StaffAttendanceRecord, StaffAttendanceReviewPayload } from "@/types/staff";
import { format, parseISO } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { BadgeCheck, ImageIcon } from "lucide-react";
import { useState } from "react";

export const reviewStatusOptions = [
  { value: "hadir", label: "Hadir" },
  { value: "izin", label: "Izin" },
  { value: "sakit", label: "Sakit" },
  { value: "alfa", label: "Alfa" },
];

export function formatFriendlyDate(value: string | Date) {
  try {
    const date = value instanceof Date ? value : parseISO(value);
    return format(date, "dd MMMM yyyy", { locale: localeID });
  } catch {
    return typeof value === "string" ? value : format(value, "dd MMMM yyyy", { locale: localeID });
  }
}

export function formatCheckInTime(value?: string) {
  if (!value) return "Absen masuk belum tercatat";
  try {
    const date = parseISO(value);
    return format(date, "HH:mm 'WIB'", { locale: localeID });
  } catch {
    return value;
  }
}

export function AttendanceStatusPill({ status, compact = false }: { status: string; compact?: boolean }) {
  const normalized = status.toLowerCase();
  let className = "border-slate-200 bg-slate-100 text-slate-600";

  if (normalized === "hadir") {
    className = "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (normalized === "alfa") {
    className = "border-rose-200 bg-rose-50 text-rose-700";
  } else if (normalized === "izin") {
    className = "border-sky-200 bg-sky-50 text-sky-700";
  } else if (normalized === "sakit") {
    className = "border-violet-200 bg-violet-50 text-violet-700";
  }

  const compactLabel: Record<string, string> = { hadir: "H", izin: "I", sakit: "S", alfa: "A" };
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {compact ? compactLabel[normalized] ?? formatDisplayLabel(status) : formatDisplayLabel(status)}
    </span>
  );
}

export function AttendanceReviewModal({
  record,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  record: StaffAttendanceRecord | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: StaffAttendanceReviewPayload) => void;
  isPending: boolean;
}) {
  const [status, setStatus] = useState(record?.status.toLowerCase() ?? "alfa");
  const [verificationNote, setVerificationNote] = useState(
    record?.verification_note || record?.notes || "",
  );
  const [errors, setErrors] = useState<FieldErrors<"status" | "verification_note">>({});
  const isFinalPresent = status === "hadir";

  const handleSubmit = () => {
    const nextErrors: FieldErrors<"status" | "verification_note"> = {};
    validateRequired(nextErrors, "status", status, "Status final");
    if (!isFinalPresent) {
      validateRequired(nextErrors, "verification_note", verificationNote, "Catatan review");
    }
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit({ status, verification_note: isFinalPresent ? "" : verificationNote });
  };

  return (
    <PremiumModal
      open={Boolean(record)}
      onOpenChange={onOpenChange}
      title={record ? `Koreksi ${record.student_name}` : "Koreksi Absensi"}
      description="Perbarui status absensi bila hasil panggil nama atau pengecekan guru berbeda dengan status otomatis."
      icon={BadgeCheck}
      className="sm:!max-w-[760px]"
    >
      {record ? (
        <div className="grid gap-5">
          <div className="rounded-[22px] border border-emerald-100/70 bg-white/92 p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-900">{record.student_name}</p>
                <p className="text-sm text-slate-500">
                  {record.nis} • {record.class_name}
                </p>
                <p className="text-sm text-slate-500">
                  {formatFriendlyDate(record.attendance_date)} • {formatCheckInTime(record.check_in_at)}
                </p>
              </div>
              <AttendanceStatusPill status={record.status} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className={premiumModalFieldClassName}>
              <label className={premiumModalLabelClassName}>Status setelah koreksi</label>
              <RadixSelectField
                value={status}
                onValueChange={setStatus}
                options={reviewStatusOptions}
                placeholder="Pilih status final"
                triggerClassName="h-12 rounded-[18px]"
              />
              <FieldError message={errors.status} />
            </div>
            <div className={premiumModalFieldClassName}>
              <label className={premiumModalLabelClassName}>Riwayat koreksi</label>
              <div className="flex h-12 items-center rounded-[18px] border border-emerald-100/80 bg-white/90 px-4 text-sm text-slate-600">
                {record.verified_at ? "Sudah pernah dikoreksi" : "Belum ada koreksi guru"}
              </div>
            </div>
          </div>

          {!isFinalPresent ? (
            <div className={premiumModalFieldClassName}>
              <label className={premiumModalLabelClassName}>Catatan koreksi</label>
              <p className={premiumModalHelperClassName}>
                Catatan ini membantu walas dan BK memahami alasan perubahan status.
              </p>
              <Textarea
                value={verificationNote}
                onChange={(event) => setVerificationNote(event.target.value)}
                placeholder="Tulis alasan koreksi singkat"
                className="min-h-[140px] rounded-[20px]"
              />
              <FieldError message={errors.verification_note} />
            </div>
          ) : null}

          <div className={premiumModalActionsClassName}>
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-[18px] px-5"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              className="h-12 rounded-[18px] bg-emerald-700 px-5 text-white hover:bg-emerald-800"
              disabled={isPending}
              onClick={handleSubmit}
            >
              {isPending ? "Menyimpan..." : "Simpan Koreksi"}
            </Button>
          </div>
        </div>
      ) : null}
    </PremiumModal>
  );
}

export function AttendanceProofModal({
  record,
  onOpenChange,
}: {
  record: StaffAttendanceRecord | null;
  onOpenChange: (open: boolean) => void;
}) {
  const photoUrl = record?.photo_url;

  return (
    <PremiumModal
      open={Boolean(record)}
      onOpenChange={onOpenChange}
      title={record ? `Bukti ${record.student_name}` : "Bukti Absensi"}
      description="Preview foto absensi siswa tanpa membuka tab baru."
      icon={ImageIcon}
      className="sm:!max-w-[760px]"
    >
      {record ? (
        <div className="grid gap-4">
          <div className="rounded-[22px] border border-emerald-100/70 bg-white/92 p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-900">{record.student_name}</p>
                <p className="text-sm text-slate-500">
                  {record.nis} • {record.class_name}
                </p>
                <p className="text-sm text-slate-500">
                  {formatFriendlyDate(record.attendance_date)} • {formatCheckInTime(record.check_in_at)}
                </p>
              </div>
              <AttendanceStatusPill status={record.status} />
            </div>
          </div>

          <div className="overflow-hidden rounded-[26px] border border-emerald-100/80 bg-[linear-gradient(180deg,#f8fffb_0%,#eefbf4_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]">
            {photoUrl ? (
              <ProtectedApiImage
                src={photoUrl}
                alt={`Bukti absensi ${record.student_name}`}
                className="max-h-[62vh] w-full rounded-[20px] object-contain"
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
