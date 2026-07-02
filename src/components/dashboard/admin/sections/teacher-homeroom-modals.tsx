"use client";

import { FieldGroup, ModalActions } from "@/components/dashboard/admin/sections/section-ui";
import { PremiumModal } from "@/components/modals/premium-modal";
import { FieldError } from "@/components/ui/field-error";
import { RadixSelectField } from "@/components/ui/radix-select";
import { type FieldErrors, hasFieldErrors, validateRequired } from "@/lib/form-validation";
import type {
  AdminClass,
  AdminHomeroomAssignment,
  AdminHomeroomAssignmentPayload,
  AdminSchoolYear,
  AdminTeacherProfile,
} from "@/types/admin";
import { GraduationCap } from "lucide-react";
import { useState } from "react";

export function validateHomeroomAssignmentForm(
  form: AdminHomeroomAssignmentPayload,
): FieldErrors<keyof AdminHomeroomAssignmentPayload> {
  const errors: FieldErrors<keyof AdminHomeroomAssignmentPayload> = {};
  validateRequired(errors, "teacher_id", form.teacher_id, "Guru");
  validateRequired(errors, "class_id", form.class_id, "Kelas");
  validateRequired(errors, "school_year_id", form.school_year_id, "Tahun ajaran");
  validateRequired(errors, "is_active", String(form.is_active), "Status assignment");
  return errors;
}

const ACTIVE_OPTIONS = [
  { value: "true", label: "Aktif" },
  { value: "false", label: "Nonaktif" },
];

const EMPTY_FORM: AdminHomeroomAssignmentPayload = {
  teacher_id: "",
  class_id: "",
  school_year_id: "",
  is_active: true,
};

type SharedProps = {
  teacherProfiles: AdminTeacherProfile[];
  classes: AdminClass[];
  schoolYears: AdminSchoolYear[];
  isPending: boolean;
  onSubmit: (payload: AdminHomeroomAssignmentPayload) => void;
};

export function HomeroomAssignmentCreateModal({
  open,
  onOpenChange,
  teacherProfiles,
  classes,
  schoolYears,
  isPending,
  onSubmit,
}: { open: boolean; onOpenChange: (open: boolean) => void } & SharedProps) {
  const [form, setForm] = useState<AdminHomeroomAssignmentPayload>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors<keyof AdminHomeroomAssignmentPayload>>({});

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  };

  const handleSubmit = () => {
    const nextErrors = validateHomeroomAssignmentForm(form);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(form);
  };

  const set = <K extends keyof AdminHomeroomAssignmentPayload>(
    key: K,
    value: AdminHomeroomAssignmentPayload[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <PremiumModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Tambah Assignment Walas"
      description="Tentukan guru yang menjadi wali kelas untuk rombel dan tahun ajaran tertentu."
      icon={GraduationCap}
    >
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Guru">
            <RadixSelectField
              value={form.teacher_id}
              onValueChange={(v) => set("teacher_id", v)}
              placeholder="Pilih guru"
              options={teacherProfiles.map((t) => ({
                value: t.id,
                label: t.name,
                description: t.username || t.id,
              }))}
            />
            <FieldError message={errors.teacher_id} />
          </FieldGroup>
          <FieldGroup label="Kelas">
            <RadixSelectField
              value={form.class_id}
              onValueChange={(v) => set("class_id", v)}
              placeholder="Pilih kelas walas"
              options={classes.map((c) => ({
                value: c.id,
                label: c.display_name,
                description: c.school_year_name,
              }))}
            />
            <FieldError message={errors.class_id} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Tahun Ajaran">
            <RadixSelectField
              value={form.school_year_id}
              onValueChange={(v) => set("school_year_id", v)}
              placeholder="Pilih tahun ajaran"
              options={schoolYears.map((y) => ({ value: y.id, label: y.name }))}
            />
            <FieldError message={errors.school_year_id} />
          </FieldGroup>
          <FieldGroup label="Status Assignment">
            <RadixSelectField
              value={String(form.is_active)}
              onValueChange={(v) => set("is_active", v === "true")}
              placeholder="Pilih status"
              options={ACTIVE_OPTIONS}
            />
            <FieldError message={errors.is_active} />
          </FieldGroup>
        </div>

        <ModalActions
          isPending={isPending}
          onCancel={() => handleOpenChange(false)}
          onSubmit={handleSubmit}
          submitLabel="Simpan Assignment Walas"
        />
      </div>
    </PremiumModal>
  );
}

export function HomeroomAssignmentEditModal({
  assignment,
  open,
  onOpenChange,
  teacherProfiles,
  classes,
  schoolYears,
  isPending,
  onSubmit,
}: { assignment: AdminHomeroomAssignment | null; open: boolean; onOpenChange: (open: boolean) => void } & SharedProps) {
  const [form, setForm] = useState<AdminHomeroomAssignmentPayload>(() =>
    assignment
      ? {
          teacher_id: assignment.teacher_id,
          class_id: assignment.class_id,
          school_year_id: assignment.school_year_id,
          is_active: assignment.is_active,
        }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<FieldErrors<keyof AdminHomeroomAssignmentPayload>>({});

  const handleSubmit = () => {
    const nextErrors = validateHomeroomAssignmentForm(form);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(form);
  };

  const set = <K extends keyof AdminHomeroomAssignmentPayload>(
    key: K,
    value: AdminHomeroomAssignmentPayload[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  if (!assignment) return null;

  return (
    <PremiumModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Assignment Walas"
      description="Perbarui penugasan wali kelas untuk kelas dan tahun ajaran tertentu."
      icon={GraduationCap}
    >
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Guru">
            <RadixSelectField
              value={form.teacher_id}
              onValueChange={(v) => set("teacher_id", v)}
              placeholder="Pilih guru"
              options={teacherProfiles.map((t) => ({
                value: t.id,
                label: t.name,
                description: t.username || t.id,
              }))}
            />
            <FieldError message={errors.teacher_id} />
          </FieldGroup>
          <FieldGroup label="Kelas">
            <RadixSelectField
              value={form.class_id}
              onValueChange={(v) => set("class_id", v)}
              placeholder="Pilih kelas walas"
              options={classes.map((c) => ({
                value: c.id,
                label: c.display_name,
                description: c.school_year_name,
              }))}
            />
            <FieldError message={errors.class_id} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Tahun Ajaran">
            <RadixSelectField
              value={form.school_year_id}
              onValueChange={(v) => set("school_year_id", v)}
              placeholder="Pilih tahun ajaran"
              options={schoolYears.map((y) => ({ value: y.id, label: y.name }))}
            />
            <FieldError message={errors.school_year_id} />
          </FieldGroup>
          <FieldGroup label="Status Assignment">
            <RadixSelectField
              value={String(form.is_active)}
              onValueChange={(v) => set("is_active", v === "true")}
              placeholder="Pilih status"
              options={ACTIVE_OPTIONS}
            />
            <FieldError message={errors.is_active} />
          </FieldGroup>
        </div>

        <ModalActions
          isPending={isPending}
          onCancel={() => onOpenChange(false)}
          onSubmit={handleSubmit}
          submitLabel="Update Assignment Walas"
        />
      </div>
    </PremiumModal>
  );
}
