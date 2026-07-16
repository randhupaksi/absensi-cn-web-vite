"use client";

import { FieldGroup, ModalActions } from "@/features/admin/management/shared/section-ui";
import { PremiumModal } from "@/components/modals/premium-modal";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { RadixSelectField } from "@/components/ui/radix-select";
import { type FieldErrors, hasFieldErrors, validateRequired } from "@/lib/form-validation";
import type { AdminClass, AdminClassPayload, AdminMajor, AdminSchoolUnit, AdminSchoolYear } from "@/types/admin";
import { Building2 } from "lucide-react";
import { useState } from "react";

type ClassFormState = {
  school_unit_id: string;
  grade: string;
  name: string;
  major_id: string;
  school_year_id: string;
  capacity: number;
  is_active: boolean;
};

type ClassFormField = keyof ClassFormState;

const EMPTY_FORM: ClassFormState = {
  school_unit_id: "",
  grade: "",
  name: "",
  major_id: "",
  school_year_id: "",
  capacity: 36,
  is_active: true,
};

const GRADE_OPTIONS = ["X", "XI", "XII"];

const INPUT_CN =
  "h-14 rounded-[1.25rem] border-slate-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_14px_30px_rgba(15,23,42,0.05)] focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-200/80";

export function ClassFormModal({
  title,
  description,
  open,
  initialData,
  majors,
  schoolUnits,
  schoolYears,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: {
  title: string;
  description: string;
  open: boolean;
  initialData?: AdminClass;
  majors: AdminMajor[];
  schoolUnits: AdminSchoolUnit[];
  schoolYears: AdminSchoolYear[];
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AdminClassPayload) => void;
}) {
  const [form, setForm] = useState<ClassFormState>(() =>
    initialData
      ? {
          school_unit_id: initialData.school_unit_id,
          grade: initialData.grade,
          name: initialData.name,
          major_id: initialData.major_id,
          school_year_id: initialData.school_year_id,
          capacity: initialData.capacity || 36,
          is_active: initialData.is_active,
        }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<FieldErrors<ClassFormField>>({});

  const validate = () => {
    const nextErrors: FieldErrors<ClassFormField> = {};
    validateRequired(nextErrors, "grade", form.grade, "Tingkat kelas");
	validateRequired(nextErrors, "school_unit_id", form.school_unit_id, "Unit sekolah");
    validateRequired(nextErrors, "name", form.name, "Nama rombel");
    validateRequired(nextErrors, "major_id", form.major_id, "Jurusan");
    validateRequired(nextErrors, "school_year_id", form.school_year_id, "Tahun ajaran");
    setErrors(nextErrors);
    return !hasFieldErrors(nextErrors);
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      school_unit_id: form.school_unit_id,
      grade: form.grade,
      name: form.name.trim(),
      major_id: form.major_id,
      school_year_id: form.school_year_id,
      capacity: form.capacity,
      is_active: form.is_active,
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  };

  return (
    <PremiumModal open={open} onOpenChange={handleOpenChange} icon={Building2} title={title} description={description}>
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Tingkat">
            <RadixSelectField
              value={form.grade}
              onValueChange={(value) => setForm((prev) => ({ ...prev, grade: value }))}
              placeholder="Pilih tingkat"
              options={GRADE_OPTIONS.map((grade) => ({ value: grade, label: grade }))}
            />
            <FieldError message={errors.grade} />
          </FieldGroup>

          <FieldGroup label="Nama Rombel">
            <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Contoh: 1" className={INPUT_CN} />
            <FieldError message={errors.name} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Unit Sekolah">
            <RadixSelectField
              value={form.school_unit_id}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, school_unit_id: value, major_id: "" }))
              }
              placeholder="Pilih unit sekolah"
              options={schoolUnits
                .filter((unit) => unit.is_active)
                .map((unit) => ({ value: unit.id, label: `${unit.code} - ${unit.name}` }))}
            />
            <FieldError message={errors.school_unit_id} />
          </FieldGroup>
          <FieldGroup label="Jurusan">
            <RadixSelectField
              value={form.major_id}
              onValueChange={(value) => setForm((prev) => ({ ...prev, major_id: value }))}
              placeholder="Pilih jurusan"
              options={majors
                .filter((major) => !form.school_unit_id || major.school_unit_id === form.school_unit_id)
                .map((major) => ({ value: major.id, label: `${major.code} - ${major.name}` }))}
            />
            <FieldError message={errors.major_id} />
          </FieldGroup>

          <FieldGroup label="Tahun Ajaran">
            <RadixSelectField
              value={form.school_year_id}
              onValueChange={(value) => setForm((prev) => ({ ...prev, school_year_id: value }))}
              placeholder="Pilih tahun ajaran"
              options={schoolYears.map((year) => ({ value: year.id, label: year.name }))}
            />
            <FieldError message={errors.school_year_id} />
          </FieldGroup>
        </div>

		<FieldGroup label="Kapasitas Kelas">
		  <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm((prev) => ({ ...prev, capacity: Number(e.target.value) || 36 }))} className={INPUT_CN} />
		</FieldGroup>

        <FieldGroup label="Status Kelas">
          <RadixSelectField
            value={form.is_active ? "active" : "inactive"}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, is_active: value === "active" }))
            }
            placeholder="Pilih status kelas"
            options={[
              { value: "active", label: "Aktif" },
              { value: "inactive", label: "Nonaktif" },
            ]}
          />
        </FieldGroup>

        <ModalActions
          isPending={isSubmitting ?? false}
          onCancel={() => handleOpenChange(false)}
          onSubmit={handleSubmit}
          submitLabel={initialData ? "Update Kelas" : "Simpan Kelas"}
        />
      </div>
    </PremiumModal>
  );
}
