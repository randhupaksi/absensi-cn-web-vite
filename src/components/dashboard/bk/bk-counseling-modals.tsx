"use client";

import { formatDateTime } from "@/components/dashboard/bk/bk-common";
import {
  PremiumModal,
  premiumModalActionsClassName,
  premiumModalFieldClassName,
  premiumModalHelperClassName,
  premiumModalLabelClassName,
  premiumModalSurfaceClassName,
} from "@/components/modals/premium-modal";
import { Button } from "@/components/ui/button";
import { ComboboxField } from "@/components/ui/combobox-field";
import { FieldError } from "@/components/ui/field-error";
import { Textarea } from "@/components/ui/textarea";
import { type FieldErrors, hasFieldErrors, validateRequired } from "@/lib/form-validation";
import type { StaffCounselingNote } from "@/types/staff";
import { BookHeart, Edit3, Plus } from "lucide-react";
import { useState } from "react";

export function CounselingDetailModal({
  note,
  onOpenChange,
}: {
  note: StaffCounselingNote | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <PremiumModal
      open={Boolean(note)}
      onOpenChange={onOpenChange}
      title={note ? note.title : "Detail Catatan BK"}
      description="Baca catatan pembinaan dan konteks siswa secara lengkap."
      icon={BookHeart}
      className="sm:!max-w-[760px]"
    >
      {note ? (
        <div className="grid gap-5">
          <div className={`${premiumModalSurfaceClassName} p-5`}>
            <p className="text-base font-semibold text-slate-900">{note.student_name}</p>
            <p className="mt-1 text-sm text-slate-500">
              {note.nis} - {note.class_name || "Kelas belum tersedia"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Dibuat oleh {note.created_by_name || "-"} pada {formatDateTime(note.created_at)}
            </p>
          </div>
          <div className={`${premiumModalSurfaceClassName} p-5`}>
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{note.note}</p>
          </div>
        </div>
      ) : null}
    </PremiumModal>
  );
}

export function CounselingFormModal({
  open,
  onOpenChange,
  students,
  note,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Array<{ id: string; name: string; nis: string; class_name?: string }>;
  note?: StaffCounselingNote | null;
  onSubmit: (payload: { student_id: string; title: string; note: string }) => void;
  isPending: boolean;
}) {
  const [studentId, setStudentId] = useState(note?.student_id ?? "Pilih");
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.note ?? "");
  const [errors, setErrors] = useState<FieldErrors<"student_id" | "title" | "note">>({});

  const studentOptions = [
    { value: "Pilih", label: "Pilih siswa" },
    ...students.map((student) => ({
      value: student.id,
      label: `${student.name} - ${student.class_name || "Kelas belum tersedia"}`,
    })),
  ];

  const handleSubmit = () => {
    const nextErrors: FieldErrors<"student_id" | "title" | "note"> = {};
    validateRequired(nextErrors, "student_id", studentId === "Pilih" ? "" : studentId, "Siswa");
    validateRequired(nextErrors, "title", title, "Judul catatan");
    validateRequired(nextErrors, "note", body, "Catatan pembinaan");
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit({ student_id: studentId, title, note: body });
  };

  return (
    <PremiumModal
      open={open}
      onOpenChange={onOpenChange}
      title={note ? "Edit Catatan BK" : "Tambah Catatan BK"}
      description="Lengkapi catatan pembinaan siswa dengan informasi yang jelas dan mudah ditinjau."
      icon={note ? Edit3 : Plus}
      className="sm:!max-w-[760px]"
    >
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className={premiumModalFieldClassName}>
            <label className={premiumModalLabelClassName}>Siswa</label>
            <ComboboxField
              value={studentId}
              onValueChange={setStudentId}
              options={studentOptions}
              placeholder="Pilih siswa"
              searchPlaceholder="Cari nama atau kelas siswa..."
              triggerClassName="h-12 rounded-[18px]"
            />
            <FieldError message={errors.student_id} />
          </div>
          <div className={premiumModalFieldClassName}>
            <label className={premiumModalLabelClassName}>Judul catatan</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Contoh: Follow up alfa berulang"
              className="h-12 rounded-[18px] border border-slate-300/80 bg-white/90 px-4 text-sm text-slate-700 outline-none transition-[border-color,box-shadow,background-color] hover:border-emerald-400 hover:bg-emerald-50/25 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16)] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200/80"
            />
            <FieldError message={errors.title} />
          </div>
        </div>
        <div className={premiumModalFieldClassName}>
          <label className={premiumModalLabelClassName}>Catatan pembinaan</label>
          <p className={premiumModalHelperClassName}>Tuliskan observasi, tindak lanjut, atau rekomendasi BK.</p>
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
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
            {isPending ? "Menyimpan..." : note ? "Update Catatan" : "Simpan Catatan"}
          </Button>
        </div>
      </div>
    </PremiumModal>
  );
}
