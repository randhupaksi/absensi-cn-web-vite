"use client";

import {
  AttendanceStatusPill,
  formatCheckInTime,
  formatFriendlyDate,
  normalizeAttachmentUrl,
} from "@/features/bk/components/common";
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
import { Calendar } from "@/components/ui/calendar";
import { FieldError } from "@/components/ui/field-error";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadixSelectField } from "@/components/ui/radix-select";
import { Textarea } from "@/components/ui/textarea";
import { type FieldErrors, hasFieldErrors, validateRequired } from "@/lib/form-validation";
import type { StaffAttendanceRecord, StaffAttendanceReviewPayload } from "@/types/staff";
import { id as localeID } from "date-fns/locale";
import { ArrowUpRight, BadgeCheck, CalendarClock, Image as ImageIcon } from "lucide-react";
import { useState } from "react";

export const reviewStatusOptions = [
  { value: "hadir", label: "Hadir" },
  { value: "telat", label: "Telat" },
  { value: "izin", label: "Izin" },
  { value: "sakit", label: "Sakit" },
  { value: "alfa", label: "Alfa" },
];

export function AttendanceDateButton({
  selectedDate,
  onSelectDate,
}: {
  selectedDate?: Date;
  onSelectDate: (date?: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button type="button" variant="outline" />}
        className="h-14 rounded-[22px] border-slate-300/80 bg-white/84 px-4 text-left text-slate-700 shadow-[0_14px_28px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.92)] transition-[border-color,box-shadow,background-color] hover:border-emerald-400 hover:bg-emerald-50/70 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_16px_32px_rgba(15,23,42,0.07)]"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
            <CalendarClock className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Tanggal</p>
            <p className="text-sm font-medium text-slate-700">
              {selectedDate ? formatFriendlyDate(selectedDate) : "Pilih tanggal"}
            </p>
          </div>
          <ArrowUpRight className="size-4 text-emerald-700" />
        </div>
      </PopoverTrigger>
      <PopoverContent
        sideOffset={10}
        className="w-auto rounded-[24px] border border-emerald-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] p-4 shadow-[0_24px_54px_rgba(15,23,42,0.12)]"
      >
        <PopoverHeader className="px-2 pt-1 pb-2">
          <PopoverTitle className="text-sm font-semibold text-slate-900">Pilih tanggal absensi</PopoverTitle>
        </PopoverHeader>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => { onSelectDate(date); setOpen(false); }}
          locale={localeID}
          buttonVariant="ghost"
        />
      </PopoverContent>
    </Popover>
  );
}

export function AttendanceReviewModal({
  record,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  record: StaffAttendanceRecord;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: StaffAttendanceReviewPayload) => void;
  isPending: boolean;
}) {
  const [status, setStatus] = useState(record.status.toLowerCase());
  const [verificationNote, setVerificationNote] = useState(
    record.verification_note || record.notes || "",
  );
  const [errors, setErrors] = useState<FieldErrors<"status" | "verification_note">>({});

  const handleSubmit = () => {
    const nextErrors: FieldErrors<"status" | "verification_note"> = {};
    validateRequired(nextErrors, "status", status, "Status final");
    validateRequired(nextErrors, "verification_note", verificationNote, "Catatan review BK");
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit({ status, verification_note: verificationNote });
  };

  return (
    <PremiumModal
      open
      onOpenChange={onOpenChange}
      title={`Review ${record.student_name}`}
      description="Perbarui status dan catatan verifikasi dari perspektif BK."
      icon={BadgeCheck}
      className="sm:!max-w-[760px]"
    >
      <div className="grid gap-5">
        <div className="rounded-[22px] border border-emerald-100/70 bg-white/92 p-4">
          <p className="text-base font-semibold text-slate-900">{record.student_name}</p>
          <p className="mt-1 text-sm text-slate-500">{record.nis} - {record.class_name}</p>
          <p className="mt-1 text-sm text-slate-500">
            {formatFriendlyDate(record.attendance_date)} - {formatCheckInTime(record.check_in_at)}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className={premiumModalFieldClassName}>
            <label className={premiumModalLabelClassName}>Status final</label>
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
            <label className={premiumModalLabelClassName}>Verifikasi</label>
            <div className="flex h-12 items-center rounded-[18px] border border-emerald-100/80 bg-white/90 px-4 text-sm text-slate-600">
              {record.verified_at ? "Sudah pernah direview" : "Belum pernah direview"}
            </div>
          </div>
        </div>

        <div className={premiumModalFieldClassName}>
          <label className={premiumModalLabelClassName}>Catatan review BK</label>
          <p className={premiumModalHelperClassName}>Catatan ini membantu membaca alasan perubahan status.</p>
          <Textarea
            value={verificationNote}
            onChange={(event) => setVerificationNote(event.target.value)}
            placeholder="Tulis catatan review BK"
            className="min-h-[140px] rounded-[20px]"
          />
          <FieldError message={errors.verification_note} />
        </div>

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
            {isPending ? "Menyimpan..." : "Simpan Review"}
          </Button>
        </div>
      </div>
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
  const photoUrl = record?.photo_url ? normalizeAttachmentUrl(record.photo_url) : undefined;

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
