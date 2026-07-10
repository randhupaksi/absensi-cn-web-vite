"use client";

import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import {
  PremiumModal,
  premiumModalActionsClassName,
  premiumModalFieldClassName,
  premiumModalHelperClassName,
  premiumModalLabelClassName,
  premiumModalSurfaceClassName,
} from "@/components/modals/premium-modal";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { RadixSelectField } from "@/components/ui/radix-select";
import { Textarea } from "@/components/ui/textarea";
import { resolveApiAssetUrl } from "@/lib/config/site";
import { type FieldErrors, hasFieldErrors, validateRequired } from "@/lib/form-validation";
import { formatDisplayLabel } from "@/lib/utils";
import type { StaffSubmission } from "@/types/staff";
import {
  ArrowUpRight,
  ClipboardCheck,
  Eye,
  FileImage,
  PencilLine,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

export const reviewStatusOptions = [
  { value: "menunggu", label: "Menunggu" },
  { value: "diterima", label: "Diterima" },
  { value: "ditolak", label: "Ditolak" },
];

export function formatDate(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function normalizeSubmissionStatus(value?: string) {
  return (value || "").toLowerCase().trim();
}

export function isImageAttachment(attachment: string) {
  return /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(attachment);
}

export function normalizeSubmissionAttachment(attachment: string) {
  return resolveApiAssetUrl(attachment);
}

export function openSubmissionAttachment(attachment?: string) {
  if (!attachment || typeof window === "undefined") return;
  window.open(normalizeSubmissionAttachment(attachment), "_blank", "noopener,noreferrer");
}

export function SubmissionTypePill({ type }: { type: string }) {
  const normalized = type.toUpperCase();
  let className = "border-slate-200 bg-slate-100 text-slate-600";
  if (normalized === "IZIN") className = "border-sky-200 bg-sky-50 text-sky-700";
  else if (normalized === "SAKIT") className = "border-rose-200 bg-rose-50 text-rose-700";
  else if (normalized === "DISPENSASI") className = "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {formatDisplayLabel(type)}
    </span>
  );
}

export function SubmissionStatusPill({ status }: { status: string }) {
  const normalized = normalizeSubmissionStatus(status);
  let className = "border-slate-200 bg-slate-100 text-slate-600";
  if (normalized === "menunggu") className = "border-amber-200 bg-amber-50 text-amber-700";
  else if (normalized === "diterima") className = "border-emerald-200 bg-emerald-50 text-emerald-700";
  else if (normalized === "ditolak") className = "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {formatDisplayLabel(status)}
    </span>
  );
}

export function SubmissionDetailModal({
  submission,
  onOpenChange,
}: {
  submission: StaffSubmission | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <PremiumModal
      open={Boolean(submission)}
      onOpenChange={onOpenChange}
      title={submission ? `Detail ${submission.student_name}` : "Detail Pengajuan"}
      description="Lihat alasan pengajuan, lampiran, dan riwayat tanggapan wali kelas secara lengkap."
      icon={Eye}
      className="sm:!max-w-[920px]"
    >
      {submission ? (
        <div className="grid items-start gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="grid gap-4">
            <div className={`${premiumModalSurfaceClassName} p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                      {submission.student_name}
                    </h3>
                    <SubmissionStatusPill status={submission.status} />
                    <SubmissionTypePill type={submission.type} />
                  </div>
                  <p className="text-sm text-slate-500">
                    {submission.nis} • {submission.class_name || "Kelas belum tersambung"}
                  </p>
                </div>
                {submission.attachment ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-[16px]"
                    onClick={() => openSubmissionAttachment(submission.attachment)}
                  >
                    <ArrowUpRight className="size-4" />
                    Buka Lampiran
                  </Button>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <p>Dibuat: {formatDateTime(submission.created_at)}</p>
                <p>Diperbarui: {formatDateTime(submission.updated_at)}</p>
                <p>Reviewer: {submission.reviewed_by_name || "-"}</p>
                <p>Ditinjau: {formatDateTime(submission.reviewed_at)}</p>
              </div>
            </div>

            <div className={`${premiumModalSurfaceClassName} p-5`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900">Alasan Pengajuan</p>
                  <p className="text-sm text-slate-500">Pesan asli yang dikirim siswa</p>
                </div>
                <ClipboardCheck className="size-4.5 text-emerald-600" />
              </div>
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {submission.reason}
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className={`${premiumModalSurfaceClassName} p-5`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900">Lampiran</p>
                  <p className="text-sm text-slate-500">Preview bukti jika tersedia</p>
                </div>
                <FileImage className="size-4.5 text-emerald-600" />
              </div>

              {submission.attachment ? (
                isImageAttachment(submission.attachment) ? (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-[20px] border border-emerald-100 bg-slate-50/80">
                      <img
                        src={normalizeSubmissionAttachment(submission.attachment)}
                        alt={`Lampiran ${submission.student_name}`}
                        className="h-[240px] w-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-[16px]"
                      onClick={() => openSubmissionAttachment(submission.attachment)}
                    >
                      Lihat ukuran penuh
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-5 text-center">
                    <FileImage className="mx-auto size-8 text-slate-400" />
                    <p className="mt-3 text-sm font-medium text-slate-700">Lampiran tersedia</p>
                    <p className="mt-1 text-sm text-slate-500">Buka lampiran untuk melihat file asli.</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 rounded-[16px]"
                      onClick={() => openSubmissionAttachment(submission.attachment)}
                    >
                      Buka file
                    </Button>
                  </div>
                )
              ) : (
                <EmptyState
                  icon={FileImage}
                  title="Tidak ada lampiran"
                  description="Siswa belum menyertakan foto atau file pendukung."
                  compact
                />
              )}
            </div>

            <div className={`${premiumModalSurfaceClassName} p-5`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900">Tanggapan Walas</p>
                  <p className="text-sm text-slate-500">Catatan review terbaru</p>
                </div>
                <ShieldCheck className="size-4.5 text-emerald-600" />
              </div>

              {submission.review_note ? (
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {submission.review_note}
                </p>
              ) : (
                <EmptyState
                  icon={ClipboardCheck}
                  title="Belum ada tanggapan"
                  description="Catatan review walas akan tampil setelah pengajuan ditinjau."
                  compact
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </PremiumModal>
  );
}

export function SubmissionReviewModal({
  submission,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  submission: StaffSubmission | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { status: string; review_note: string }) => void;
  isPending: boolean;
}) {
  const [status, setStatus] = useState(
    submission ? normalizeSubmissionStatus(submission.status) : "menunggu",
  );
  const [reviewNote, setReviewNote] = useState(submission?.review_note || "");
  const [errors, setErrors] = useState<FieldErrors<"status" | "review_note">>({});

  const handleSubmit = () => {
    const nextErrors: FieldErrors<"status" | "review_note"> = {};
    validateRequired(nextErrors, "status", status, "Status final");
    validateRequired(nextErrors, "review_note", reviewNote, "Catatan tanggapan");
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit({ status, review_note: reviewNote });
  };

  return (
    <PremiumModal
      open={Boolean(submission)}
      onOpenChange={onOpenChange}
      title={submission ? `Review ${submission.student_name}` : "Review Pengajuan"}
      description="Berikan keputusan dan tanggapan wali kelas untuk pengajuan izin, sakit, atau dispensasi."
      icon={PencilLine}
      className="sm:!max-w-[760px]"
    >
      {submission ? (
        <div className="grid gap-5">
          <div className={`${premiumModalSurfaceClassName} p-4`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-900">{submission.student_name}</p>
                <p className="text-sm text-slate-500">
                  {submission.nis} • {submission.class_name || "Kelas belum tersambung"}
                </p>
                <p className="text-sm text-slate-500">
                  Dibuat {formatDateTime(submission.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <SubmissionStatusPill status={submission.status} />
                <SubmissionTypePill type={submission.type} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className={premiumModalFieldClassName}>
              <label className={premiumModalLabelClassName}>Status final</label>
              <RadixSelectField
                value={status}
                onValueChange={setStatus}
                options={reviewStatusOptions}
                placeholder="Pilih status akhir"
                triggerClassName="h-12 rounded-[18px]"
              />
              <FieldError message={errors.status} />
            </div>
            <div className={premiumModalFieldClassName}>
              <label className={premiumModalLabelClassName}>Lampiran</label>
              <div className="flex h-12 items-center rounded-[18px] border border-emerald-100/80 bg-white/90 px-4 text-sm text-slate-600">
                {submission.attachment ? "Tersedia untuk ditinjau" : "Tidak ada lampiran"}
              </div>
            </div>
          </div>

          <div className={premiumModalFieldClassName}>
            <label className={premiumModalLabelClassName}>Catatan tanggapan</label>
            <p className={premiumModalHelperClassName}>
              Catatan ini akan terlihat pada riwayat pengajuan siswa dan panel monitoring walas.
            </p>
            <Textarea
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
              placeholder="Tulis tanggapan atau alasan keputusan walas"
              className="min-h-[140px] rounded-[20px]"
            />
            <FieldError message={errors.review_note} />
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
              {isPending ? "Menyimpan..." : "Simpan Tanggapan"}
            </Button>
          </div>
        </div>
      ) : null}
    </PremiumModal>
  );
}
