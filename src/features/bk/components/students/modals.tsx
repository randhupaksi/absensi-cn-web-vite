"use client";

import {
  AttendanceStatusPill,
  formatCheckInTime,
  formatFriendlyDate,
  formatGender,
  getInitials,
  SubmissionStatusPill,
} from "@/features/bk/components/common";
import { ModalContentSkeleton } from "@/components/loading/loading-system";
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
import { Textarea } from "@/components/ui/textarea";
import { type FieldErrors, hasFieldErrors, validateRequired } from "@/lib/form-validation";
import type { StaffBKStudentDetail } from "@/types/staff";
import {
  BadgeCheck,
  BookHeart,
  NotebookPen,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { type ReactNode, useState } from "react";

function MiniStatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "permission" | "sick" | "danger";
}) {
  const className =
    tone === "success"
      ? "border-emerald-200 bg-emerald-100/90"
      : tone === "permission"
        ? "border-sky-200 bg-sky-100/90"
        : tone === "sick"
          ? "border-violet-200 bg-violet-100/90"
          : "border-rose-200 bg-rose-100/90";

  return (
    <div className={`rounded-[20px] border px-4 py-4 shadow-[0_14px_28px_rgba(15,23,42,0.08)] ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">{value}</p>
    </div>
  );
}

function DetailListCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof BookHeart;
  children: ReactNode;
}) {
  return (
    <div className={`${premiumModalSurfaceClassName} p-4`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-base font-semibold text-slate-900">{title}</p>
        <Icon className="size-4.5 text-emerald-600" />
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function StudentDetailModal({
  open,
  onOpenChange,
  detail,
  isLoading,
  errorMessage,
  onCreateNote,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: StaffBKStudentDetail | null;
  isLoading: boolean;
  errorMessage?: string;
  onCreateNote: (studentId: string) => void;
}) {
  const student = detail?.student;

  return (
    <PremiumModal
      open={open}
      onOpenChange={onOpenChange}
      title={student ? `Detail ${student.name}` : "Detail Siswa"}
      description="Lihat identitas, riwayat absensi, pengajuan, dan catatan pembinaan siswa."
      icon={UserRound}
      className="sm:!max-w-[1040px]"
    >
      {errorMessage ? (
        <EmptyState icon={ShieldAlert} title="Detail belum bisa dimuat" description={errorMessage} />
      ) : isLoading || !detail || !student ? (
        <ModalContentSkeleton fields={8} />
      ) : (
        <div className="grid gap-5">
          <div className="grid items-start gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className={`${premiumModalSurfaceClassName} p-5`}>
              <div className="flex items-start gap-4">
                <span className="flex size-14 items-center justify-center rounded-[22px] bg-[linear-gradient(180deg,#effcf6_0%,#dff7eb_100%)] text-base font-semibold text-emerald-800">
                  {getInitials(student.name)}
                </span>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold tracking-normal text-slate-950">
                    {student.name}
                  </h3>
                  <div className="grid gap-2 pt-2 text-sm text-slate-600 sm:grid-cols-2">
                    <p>NIS: {student.nis}</p>
                    <p>NISN: {student.nisn || "-"}</p>
                    <p>Kelas: {student.class_name || "-"}</p>
                    <p>Gender: {formatGender(student.gender)}</p>
                    <p>NISN: {student.nisn || "-"}</p>
                    <p>Tahun ajaran: {student.school_year_name || "-"}</p>
                  </div>
                  <Button
                    type="button"
                    className="mt-2 h-11 rounded-[16px] bg-emerald-700 px-4 text-white hover:bg-emerald-800"
                    onClick={() => onCreateNote(student.id)}
                  >
                    <NotebookPen className="size-4" />
                    Tambah Catatan BK
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStatCard label="Hadir" value={detail.attendance_summary.present} tone="success" />
              <MiniStatCard label="Izin" value={detail.attendance_summary.permission} tone="permission" />
              <MiniStatCard label="Sakit" value={detail.attendance_summary.sick} tone="sick" />
              <MiniStatCard label="Alfa" value={detail.attendance_summary.alpha} tone="danger" />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <DetailListCard title="Riwayat Absensi" icon={BadgeCheck}>
              {detail.recent_attendance.length === 0 ? (
                <EmptyState icon={BadgeCheck} title="Belum ada absensi" description="Riwayat absensi siswa akan tampil di sini." compact />
              ) : (
                detail.recent_attendance.slice(0, 6).map((record) => (
                  <div key={record.id} className="rounded-[18px] border border-slate-100 bg-slate-50/85 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatFriendlyDate(record.attendance_date)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatCheckInTime(record.check_in_at)}
                        </p>
                      </div>
                      <AttendanceStatusPill status={record.status} />
                    </div>
                  </div>
                ))
              )}
            </DetailListCard>

            <DetailListCard title="Pengajuan" icon={ShieldAlert}>
              {detail.recent_submissions.length === 0 ? (
                <EmptyState icon={ShieldAlert} title="Belum ada pengajuan" description="Izin atau sakit siswa akan tampil di sini." compact />
              ) : (
                detail.recent_submissions.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-[18px] border border-slate-100 bg-slate-50/85 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.type}</p>
                        <p className="line-clamp-1 text-xs text-slate-500">{item.reason}</p>
                      </div>
                      <SubmissionStatusPill status={item.status} />
                    </div>
                  </div>
                ))
              )}
            </DetailListCard>

            <DetailListCard title="Catatan BK" icon={BookHeart}>
              {detail.counseling_notes.length === 0 ? (
                <EmptyState icon={BookHeart} title="Belum ada catatan" description="Catatan pembinaan siswa akan tampil di sini." compact />
              ) : (
                detail.counseling_notes.slice(0, 6).map((note) => (
                  <div key={note.id} className="rounded-[18px] border border-slate-100 bg-slate-50/85 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{note.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{note.note}</p>
                  </div>
                ))
              )}
            </DetailListCard>
          </div>
        </div>
      )}
    </PremiumModal>
  );
}

export function CounselingNoteCreateModal({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { title: string; note: string }) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<FieldErrors<"title" | "note">>({});

  const handleSubmit = () => {
    const nextErrors: FieldErrors<"title" | "note"> = {};
    validateRequired(nextErrors, "title", title, "Judul catatan");
    validateRequired(nextErrors, "note", note, "Catatan pembinaan");
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit({ title, note });
  };

  return (
    <PremiumModal
      open={open}
      onOpenChange={onOpenChange}
      title="Tambah Catatan BK"
      description="Catat tindak lanjut pembinaan siswa agar histori konseling tetap rapi."
      icon={NotebookPen}
      className="sm:!max-w-[720px]"
    >
      <div className="grid gap-5">
        <div className={premiumModalFieldClassName}>
          <label className={premiumModalLabelClassName}>Judul catatan</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Contoh: Tindak lanjut alfa berulang"
            className="h-12 rounded-[18px] border border-slate-300/80 bg-white/90 px-4 text-sm text-slate-700 outline-none transition-[border-color,box-shadow,background-color] hover:border-emerald-400 hover:bg-emerald-50/25 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16)] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200/80"
          />
          <FieldError message={errors.title} />
        </div>
        <div className={premiumModalFieldClassName}>
          <label className={premiumModalLabelClassName}>Catatan pembinaan</label>
          <p className={premiumModalHelperClassName}>
            Tulis ringkasan observasi, tindak lanjut, atau rencana komunikasi.
          </p>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Tulis catatan BK"
            className="min-h-[150px] rounded-[20px]"
          />
          <FieldError message={errors.note} />
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
            {isPending ? "Menyimpan..." : "Simpan Catatan"}
          </Button>
        </div>
      </div>
    </PremiumModal>
  );
}
