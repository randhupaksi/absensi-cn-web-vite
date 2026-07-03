"use client";

import { FieldGroup, ModalActions } from "@/components/dashboard/admin/sections/section-ui";
import { PremiumModal } from "@/components/modals/premium-modal";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
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

const SELECT_TRIGGER_CN =
  "!h-14 !min-h-14 w-full data-[size=default]:!h-14 rounded-[1.25rem] border-slate-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 py-0 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_14px_30px_rgba(15,23,42,0.05)] focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-200/80 data-open:border-emerald-500 data-open:ring-4 data-open:ring-emerald-200/80 [&_[data-slot=select-value]]:flex [&_[data-slot=select-value]]:h-full [&_[data-slot=select-value]]:items-center [&_[data-slot=select-value]]:text-slate-700 [&_[data-slot=select-value]]:data-placeholder:text-slate-400 [&_svg]:text-slate-400";

const SELECT_TRIGGER_STYLE = { height: "3.5rem", minHeight: "3.5rem" } as const;

const SELECT_CONTENT_CN =
  "z-[9999] rounded-[1.25rem] border border-emerald-200/80 bg-white/96 p-2 text-slate-700 shadow-[0_22px_48px_rgba(15,23,42,0.16),0_8px_18px_rgba(16,185,129,0.08)] ring-0 backdrop-blur-xl";

const SELECT_ITEM_CN =
  "min-h-11 rounded-[0.95rem] px-3 py-2.5 pr-9 text-[0.92rem] font-medium text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50 focus:text-emerald-800 data-highlighted:bg-emerald-50 data-highlighted:text-emerald-800 data-selected:bg-emerald-100/80 data-selected:text-emerald-900";

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
            <Select value={form.grade} onValueChange={(v) => setForm((prev) => ({ ...prev, grade: v ?? "" }))}>
              <SelectTrigger className={SELECT_TRIGGER_CN} style={SELECT_TRIGGER_STYLE}>
                <span className={form.grade ? "text-slate-700" : "text-slate-400"}>
                  {form.grade || "Pilih tingkat"}
                </span>
              </SelectTrigger>
              <SelectContent className={SELECT_CONTENT_CN}>
                {GRADE_OPTIONS.map((grade) => (
                  <SelectItem key={grade} value={grade} className={SELECT_ITEM_CN}>{grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.grade} />
          </FieldGroup>

          <FieldGroup label="Nama Rombel">
            <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Contoh: 1" className={INPUT_CN} />
            <FieldError message={errors.name} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
		  <FieldGroup label="Unit Sekolah">
			<Select value={form.school_unit_id} onValueChange={(v) => setForm((prev) => ({ ...prev, school_unit_id: v ?? "", major_id: "" }))}>
			  <SelectTrigger className={SELECT_TRIGGER_CN} style={SELECT_TRIGGER_STYLE}><span className={form.school_unit_id ? "text-slate-700" : "text-slate-400"}>{schoolUnits.find((unit) => unit.id === form.school_unit_id)?.name ?? "Pilih unit"}</span></SelectTrigger>
			  <SelectContent className={SELECT_CONTENT_CN}>{schoolUnits.filter((unit) => unit.is_active).map((unit) => <SelectItem key={unit.id} value={unit.id} className={SELECT_ITEM_CN}>{unit.code} - {unit.name}</SelectItem>)}</SelectContent>
			</Select>
			<FieldError message={errors.school_unit_id} />
		  </FieldGroup>
          <FieldGroup label="Jurusan">
            <Select value={form.major_id} onValueChange={(v) => setForm((prev) => ({ ...prev, major_id: v ?? "" }))}>
              <SelectTrigger className={SELECT_TRIGGER_CN} style={SELECT_TRIGGER_STYLE}>
                <span className={form.major_id ? "text-slate-700" : "text-slate-400"}>
                  {majors.find((m) => m.id === form.major_id)?.code ?? "Pilih jurusan"}
                </span>
              </SelectTrigger>
              <SelectContent className={SELECT_CONTENT_CN}>
                {majors.filter((major) => !form.school_unit_id || major.school_unit_id === form.school_unit_id).map((major) => (
                  <SelectItem key={major.id} value={major.id} className={SELECT_ITEM_CN}>
                    {major.code} - {major.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.major_id} />
          </FieldGroup>

          <FieldGroup label="Tahun Ajaran">
            <Select value={form.school_year_id} onValueChange={(v) => setForm((prev) => ({ ...prev, school_year_id: v ?? "" }))}>
              <SelectTrigger className={SELECT_TRIGGER_CN} style={SELECT_TRIGGER_STYLE}>
                <span className={form.school_year_id ? "text-slate-700" : "text-slate-400"}>
                  {schoolYears.find((y) => y.id === form.school_year_id)?.name ?? "Pilih tahun ajaran"}
                </span>
              </SelectTrigger>
              <SelectContent className={SELECT_CONTENT_CN}>
                {schoolYears.map((year) => (
                  <SelectItem key={year.id} value={year.id} className={SELECT_ITEM_CN}>{year.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.school_year_id} />
          </FieldGroup>
        </div>

		<FieldGroup label="Kapasitas Kelas">
		  <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm((prev) => ({ ...prev, capacity: Number(e.target.value) || 36 }))} className={INPUT_CN} />
		</FieldGroup>

        <FieldGroup label="Status Kelas">
          <Select value={form.is_active ? "active" : "inactive"} onValueChange={(v) => setForm((prev) => ({ ...prev, is_active: v === "active" }))}>
            <SelectTrigger className={SELECT_TRIGGER_CN} style={SELECT_TRIGGER_STYLE}>
              <span className="text-slate-700">{form.is_active ? "Aktif" : "Nonaktif"}</span>
            </SelectTrigger>
            <SelectContent className={SELECT_CONTENT_CN}>
              <SelectItem value="active" className={SELECT_ITEM_CN}>Aktif</SelectItem>
              <SelectItem value="inactive" className={SELECT_ITEM_CN}>Nonaktif</SelectItem>
            </SelectContent>
          </Select>
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
