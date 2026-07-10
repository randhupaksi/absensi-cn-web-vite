"use client";

import { FieldGroup, ModalActions } from "@/features/admin/management/shared/section-ui";
import { PremiumModal } from "@/components/modals/premium-modal";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { RadixSelectField } from "@/components/ui/radix-select";
import {
  type FieldErrors,
  hasFieldErrors,
  validateRequired,
  validateTime,
} from "@/lib/form-validation";
import type { AdminAttendanceRule, AdminAttendanceRulePayload, AdminSchoolYear } from "@/types/admin";
import { TimerReset } from "lucide-react";
import { useState } from "react";

const INPUT_CN =
  "h-14 rounded-[1.25rem] border-slate-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_14px_30px_rgba(15,23,42,0.05)] focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-200/80";

const ACTIVE_OPTIONS = [
  { value: "true", label: "Aktif" },
  { value: "false", label: "Nonaktif" },
];

const EMPTY_FORM: AdminAttendanceRulePayload = {
  school_year_id: "",
  check_in_start: "06:30:00",
  on_time_until: "07:00:00",
  late_until: "07:30:00",
  is_active: true,
};

export function validateAttendanceRuleForm(
  form: AdminAttendanceRulePayload,
): FieldErrors<keyof AdminAttendanceRulePayload> {
  const errors: FieldErrors<keyof AdminAttendanceRulePayload> = {};
  validateRequired(errors, "school_year_id", form.school_year_id, "Tahun ajaran");
  validateTime(errors, "check_in_start", form.check_in_start, "Mulai absen");
  validateTime(errors, "on_time_until", form.on_time_until, "Batas tepat waktu");
  validateTime(errors, "late_until", form.late_until, "Batas telat");
  return errors;
}

function formatTimeInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 6);
  const hour = digits.slice(0, 2);
  const minute = digits.slice(2, 4);
  const second = digits.slice(4, 6);
  return [hour, minute, second].filter(Boolean).join(":");
}

function TimeInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(formatTimeInput(e.target.value))}
      placeholder={placeholder}
      inputMode="numeric"
      autoComplete="off"
      maxLength={8}
      className={`${INPUT_CN} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
    />
  );
}

export function AttendanceRuleCreateModal({
  open,
  onOpenChange,
  schoolYears,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolYears: AdminSchoolYear[];
  isPending: boolean;
  onSubmit: (payload: AdminAttendanceRulePayload) => void;
}) {
  const [form, setForm] = useState<AdminAttendanceRulePayload>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors<keyof AdminAttendanceRulePayload>>({});

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  };

  const handleSubmit = () => {
    const nextErrors = validateAttendanceRuleForm(form);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(form);
  };

  return (
    <PremiumModal open={open} onOpenChange={handleOpenChange} title="Tambah Aturan Absensi" description="Atur window hadir, telat, dan cutoff absensi per tahun ajaran." icon={TimerReset}>
      <div className="grid gap-5">
        <FieldGroup label="Tahun Ajaran">
          <RadixSelectField value={form.school_year_id} onValueChange={(v) => setForm((prev) => ({ ...prev, school_year_id: v }))} placeholder="Pilih tahun ajaran" options={schoolYears.map((y) => ({ value: y.id, label: y.name }))} />
          <FieldError message={errors.school_year_id} />
        </FieldGroup>

        <div className="grid gap-4 md:grid-cols-3">
          <FieldGroup label="Mulai Absen">
            <TimeInput value={form.check_in_start} onChange={(v) => setForm((prev) => ({ ...prev, check_in_start: v }))} placeholder="06:30:00" />
            <FieldError message={errors.check_in_start} />
          </FieldGroup>
          <FieldGroup label="Batas Tepat Waktu">
            <TimeInput value={form.on_time_until} onChange={(v) => setForm((prev) => ({ ...prev, on_time_until: v }))} placeholder="07:00:00" />
            <FieldError message={errors.on_time_until} />
          </FieldGroup>
          <FieldGroup label="Batas Telat">
            <TimeInput value={form.late_until} onChange={(v) => setForm((prev) => ({ ...prev, late_until: v }))} placeholder="07:30:00" />
            <FieldError message={errors.late_until} />
          </FieldGroup>
        </div>

        <FieldGroup label="Status Rule">
          <RadixSelectField value={String(form.is_active)} onValueChange={(v) => setForm((prev) => ({ ...prev, is_active: v === "true" }))} placeholder="Pilih status" options={ACTIVE_OPTIONS} />
          <FieldError message={errors.is_active} />
        </FieldGroup>

        <ModalActions isPending={isPending} onCancel={() => handleOpenChange(false)} onSubmit={handleSubmit} submitLabel="Simpan Aturan Absensi" />
      </div>
    </PremiumModal>
  );
}

export function AttendanceRuleEditModal({
  rule,
  open,
  onOpenChange,
  schoolYears,
  isPending,
  onSubmit,
}: {
  rule: AdminAttendanceRule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolYears: AdminSchoolYear[];
  isPending: boolean;
  onSubmit: (payload: AdminAttendanceRulePayload) => void;
}) {
  const [form, setForm] = useState<AdminAttendanceRulePayload>(() =>
    rule
      ? {
          school_year_id: rule.school_year_id,
          check_in_start: rule.check_in_start,
          on_time_until: rule.on_time_until,
          late_until: rule.late_until,
          is_active: rule.is_active,
        }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<FieldErrors<keyof AdminAttendanceRulePayload>>({});

  const handleSubmit = () => {
    const nextErrors = validateAttendanceRuleForm(form);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(form);
  };

  if (!rule) return null;

  return (
    <PremiumModal open={open} onOpenChange={onOpenChange} title="Edit Aturan Absensi" description="Perbarui window hadir, telat, dan cutoff absensi untuk tahun ajaran yang dipilih." icon={TimerReset}>
      <div className="grid gap-5">
        <FieldGroup label="Tahun Ajaran">
          <RadixSelectField value={form.school_year_id} onValueChange={(v) => setForm((prev) => ({ ...prev, school_year_id: v }))} placeholder="Pilih tahun ajaran" options={schoolYears.map((y) => ({ value: y.id, label: y.name }))} />
          <FieldError message={errors.school_year_id} />
        </FieldGroup>

        <div className="grid gap-4 md:grid-cols-3">
          <FieldGroup label="Mulai Absen">
            <TimeInput value={form.check_in_start} onChange={(v) => setForm((prev) => ({ ...prev, check_in_start: v }))} placeholder="06:30:00" />
            <FieldError message={errors.check_in_start} />
          </FieldGroup>
          <FieldGroup label="Batas Tepat Waktu">
            <TimeInput value={form.on_time_until} onChange={(v) => setForm((prev) => ({ ...prev, on_time_until: v }))} placeholder="07:00:00" />
            <FieldError message={errors.on_time_until} />
          </FieldGroup>
          <FieldGroup label="Batas Telat">
            <TimeInput value={form.late_until} onChange={(v) => setForm((prev) => ({ ...prev, late_until: v }))} placeholder="07:30:00" />
            <FieldError message={errors.late_until} />
          </FieldGroup>
        </div>

        <FieldGroup label="Status Rule">
          <RadixSelectField value={String(form.is_active)} onValueChange={(v) => setForm((prev) => ({ ...prev, is_active: v === "true" }))} placeholder="Pilih status" options={ACTIVE_OPTIONS} />
          <FieldError message={errors.is_active} />
        </FieldGroup>

        <ModalActions isPending={isPending} onCancel={() => onOpenChange(false)} onSubmit={handleSubmit} submitLabel="Update Aturan Absensi" />
      </div>
    </PremiumModal>
  );
}
