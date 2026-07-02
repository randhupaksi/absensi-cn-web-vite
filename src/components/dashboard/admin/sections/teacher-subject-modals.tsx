"use client";

import { FieldGroup, ModalActions } from "@/components/dashboard/admin/sections/section-ui";
import { PremiumModal } from "@/components/modals/premium-modal";
import { FieldError } from "@/components/ui/field-error";
import { RadixSelectField } from "@/components/ui/radix-select";
import { type FieldErrors, hasFieldErrors, validateRequired } from "@/lib/form-validation";
import type {
  AdminClass,
  AdminSchoolYear,
  AdminSubject,
  AdminSubjectScheduleInput,
  AdminTeacherProfile,
  AdminTeacherSubjectAssignment,
  AdminTeacherSubjectAssignmentPayload,
} from "@/types/admin";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export function validateTeacherSubjectAssignmentForm(
  form: AdminTeacherSubjectAssignmentPayload,
): FieldErrors<keyof AdminTeacherSubjectAssignmentPayload> {
  const errors: FieldErrors<keyof AdminTeacherSubjectAssignmentPayload> = {};
  validateRequired(errors, "teacher_id", form.teacher_id, "Guru");
  validateRequired(errors, "subject_id", form.subject_id, "Mapel");
  validateRequired(errors, "class_id", form.class_id, "Kelas");
  validateRequired(errors, "school_year_id", form.school_year_id, "Tahun ajaran");
  validateRequired(errors, "is_active", String(form.is_active), "Status assignment");
  return errors;
}

const ACTIVE_OPTIONS = [
  { value: "true", label: "Aktif" },
  { value: "false", label: "Nonaktif" },
];

const HARI_OPTIONS = [
  { value: "senin", label: "Senin" },
  { value: "selasa", label: "Selasa" },
  { value: "rabu", label: "Rabu" },
  { value: "kamis", label: "Kamis" },
  { value: "jumat", label: "Jumat" },
  { value: "sabtu", label: "Sabtu" },
];

const EMPTY_FORM: AdminTeacherSubjectAssignmentPayload = {
  teacher_id: "",
  subject_id: "",
  class_id: "",
  school_year_id: "",
  is_active: true,
  schedules: [],
};

const EMPTY_SCHEDULE: AdminSubjectScheduleInput = { hari: "senin", jam_mulai: "", jam_selesai: "" };

type SharedProps = {
  teacherProfiles: AdminTeacherProfile[];
  subjects: AdminSubject[];
  classes: AdminClass[];
  schoolYears: AdminSchoolYear[];
  isPending: boolean;
  onSubmit: (payload: AdminTeacherSubjectAssignmentPayload) => void;
};

function ScheduleRows({
  rows,
  onChange,
}: {
  rows: AdminSubjectScheduleInput[];
  onChange: (rows: AdminSubjectScheduleInput[]) => void;
}) {
  const add = () => onChange([...rows, { ...EMPTY_SCHEDULE }]);
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof AdminSubjectScheduleInput, value: string) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));

  return (
    <FieldGroup label="Jadwal Mengajar">
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              value={row.hari}
              onChange={(e) => update(i, "hari", e.target.value)}
              className="w-28 shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
            >
              {HARI_OPTIONS.map((h) => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
            <input
              type="time"
              value={row.jam_mulai}
              onChange={(e) => update(i, "jam_mulai", e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
              placeholder="Mulai"
            />
            <span className="text-xs text-slate-400">–</span>
            <input
              type="time"
              value={row.jam_selesai}
              onChange={(e) => update(i, "jam_selesai", e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
              placeholder="Selesai"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-500 transition hover:border-emerald-400 hover:text-emerald-600"
        >
          <Plus className="size-3.5" />
          Tambah Jadwal
        </button>
      </div>
    </FieldGroup>
  );
}

export function TeacherSubjectAssignmentCreateModal({
  open,
  onOpenChange,
  teacherProfiles,
  subjects,
  classes,
  schoolYears,
  isPending,
  onSubmit,
}: { open: boolean; onOpenChange: (open: boolean) => void } & SharedProps) {
  const [form, setForm] = useState<AdminTeacherSubjectAssignmentPayload>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors<keyof AdminTeacherSubjectAssignmentPayload>>({});

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  };

  const handleSubmit = () => {
    const nextErrors = validateTeacherSubjectAssignmentForm(form);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(form);
  };

  const set = <K extends keyof AdminTeacherSubjectAssignmentPayload>(
    key: K,
    value: AdminTeacherSubjectAssignmentPayload[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <PremiumModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Tambah Assignment Mapel"
      description="Buat relasi guru ke mapel dan kelas untuk tahun ajaran yang relevan."
      icon={BookOpen}
    >
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Guru">
            <RadixSelectField value={form.teacher_id} onValueChange={(v) => set("teacher_id", v)} placeholder="Pilih guru" options={teacherProfiles.map((t) => ({ value: t.id, label: t.name, description: t.username || t.id }))} />
            <FieldError message={errors.teacher_id} />
          </FieldGroup>
          <FieldGroup label="Mapel">
            <RadixSelectField value={form.subject_id} onValueChange={(v) => set("subject_id", v)} placeholder="Pilih mapel" options={subjects.map((s) => ({ value: s.id, label: s.name, description: s.code }))} />
            <FieldError message={errors.subject_id} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Kelas">
            <RadixSelectField value={form.class_id} onValueChange={(v) => set("class_id", v)} placeholder="Pilih kelas" options={classes.map((c) => ({ value: c.id, label: c.display_name, description: c.school_year_name }))} />
            <FieldError message={errors.class_id} />
          </FieldGroup>
          <FieldGroup label="Tahun Ajaran">
            <RadixSelectField value={form.school_year_id} onValueChange={(v) => set("school_year_id", v)} placeholder="Pilih tahun ajaran" options={schoolYears.map((y) => ({ value: y.id, label: y.name }))} />
            <FieldError message={errors.school_year_id} />
          </FieldGroup>
        </div>

        <FieldGroup label="Status Assignment">
          <RadixSelectField value={String(form.is_active)} onValueChange={(v) => set("is_active", v === "true")} placeholder="Pilih status" options={ACTIVE_OPTIONS} />
          <FieldError message={errors.is_active} />
        </FieldGroup>

        <ScheduleRows
          rows={form.schedules ?? []}
          onChange={(rows) => set("schedules", rows)}
        />

        <ModalActions isPending={isPending} onCancel={() => handleOpenChange(false)} onSubmit={handleSubmit} submitLabel="Simpan Assignment Mapel" />
      </div>
    </PremiumModal>
  );
}

export function TeacherSubjectAssignmentEditModal({
  assignment,
  open,
  onOpenChange,
  teacherProfiles,
  subjects,
  classes,
  schoolYears,
  isPending,
  onSubmit,
}: { assignment: AdminTeacherSubjectAssignment | null; open: boolean; onOpenChange: (open: boolean) => void } & SharedProps) {
  const [form, setForm] = useState<AdminTeacherSubjectAssignmentPayload>(() =>
    assignment
      ? {
          teacher_id: assignment.teacher_id,
          subject_id: assignment.subject_id,
          class_id: assignment.class_id,
          school_year_id: assignment.school_year_id,
          is_active: assignment.is_active,
          schedules: assignment.schedules?.map(({ hari, jam_mulai, jam_selesai }) => ({
            hari,
            jam_mulai,
            jam_selesai,
          })) ?? [],
        }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<FieldErrors<keyof AdminTeacherSubjectAssignmentPayload>>({});

  const handleSubmit = () => {
    const nextErrors = validateTeacherSubjectAssignmentForm(form);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(form);
  };

  const set = <K extends keyof AdminTeacherSubjectAssignmentPayload>(
    key: K,
    value: AdminTeacherSubjectAssignmentPayload[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  if (!assignment) return null;

  return (
    <PremiumModal open={open} onOpenChange={onOpenChange} title="Edit Assignment Mapel" description="Perbarui relasi guru, mapel, kelas, dan tahun ajaran sesuai kebutuhan." icon={BookOpen}>
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Guru">
            <RadixSelectField value={form.teacher_id} onValueChange={(v) => set("teacher_id", v)} placeholder="Pilih guru" options={teacherProfiles.map((t) => ({ value: t.id, label: t.name, description: t.username || t.id }))} />
            <FieldError message={errors.teacher_id} />
          </FieldGroup>
          <FieldGroup label="Mapel">
            <RadixSelectField value={form.subject_id} onValueChange={(v) => set("subject_id", v)} placeholder="Pilih mapel" options={subjects.map((s) => ({ value: s.id, label: s.name, description: s.code }))} />
            <FieldError message={errors.subject_id} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Kelas">
            <RadixSelectField value={form.class_id} onValueChange={(v) => set("class_id", v)} placeholder="Pilih kelas" options={classes.map((c) => ({ value: c.id, label: c.display_name, description: c.school_year_name }))} />
            <FieldError message={errors.class_id} />
          </FieldGroup>
          <FieldGroup label="Tahun Ajaran">
            <RadixSelectField value={form.school_year_id} onValueChange={(v) => set("school_year_id", v)} placeholder="Pilih tahun ajaran" options={schoolYears.map((y) => ({ value: y.id, label: y.name }))} />
            <FieldError message={errors.school_year_id} />
          </FieldGroup>
        </div>

        <FieldGroup label="Status Assignment">
          <RadixSelectField value={String(form.is_active)} onValueChange={(v) => set("is_active", v === "true")} placeholder="Pilih status" options={ACTIVE_OPTIONS} />
          <FieldError message={errors.is_active} />
        </FieldGroup>

        <ScheduleRows
          rows={form.schedules ?? []}
          onChange={(rows) => set("schedules", rows)}
        />

        <ModalActions isPending={isPending} onCancel={() => onOpenChange(false)} onSubmit={handleSubmit} submitLabel="Update Assignment Mapel" />
      </div>
    </PremiumModal>
  );
}
