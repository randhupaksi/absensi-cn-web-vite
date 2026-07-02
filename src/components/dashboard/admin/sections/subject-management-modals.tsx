"use client";

import { FieldError } from "@/components/ui/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PremiumModal,
  premiumModalFieldClassName,
  premiumModalLabelClassName,
} from "@/components/modals/premium-modal";
import { RadixSelectField } from "@/components/ui/radix-select";
import {
  subjectSchema,
  teachingAssignmentSchema,
  type SubjectFormValues,
  type TeachingAssignmentFormValues,
} from "@/lib/validations/subject-schema";
import type {
  AdminClass,
  AdminSchoolYear,
  AdminSubject,
  AdminTeacherProfile,
  AdminTeacherSubjectAssignment,
} from "@/types/admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpenCheck, Plus, Sparkles, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useEffect } from "react";

const INPUT_CN =
  "h-14 rounded-[1.25rem] border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]";

const activeOptions = [
  { value: "true", label: "Aktif" },
  { value: "false", label: "Nonaktif" },
];

const dayOptions = [
  { value: "senin", label: "Senin" },
  { value: "selasa", label: "Selasa" },
  { value: "rabu", label: "Rabu" },
  { value: "kamis", label: "Kamis" },
  { value: "jumat", label: "Jumat" },
  { value: "sabtu", label: "Sabtu" },
  { value: "minggu", label: "Minggu" },
];

type SubjectModalProps = {
  subject: AdminSubject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSubmit: (values: SubjectFormValues) => void;
};

export function SubjectFormModal({
  subject,
  open,
  onOpenChange,
  isPending,
  onSubmit,
}: SubjectModalProps) {
  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: subjectValues(subject),
  });

  useEffect(() => {
    if (open) form.reset(subjectValues(subject));
  }, [form, open, subject]);

  return (
    <PremiumModal
      open={open}
      onOpenChange={onOpenChange}
      title={subject ? "Edit Mapel" : "Tambah Mapel"}
      description="Kelola identitas mapel yang akan dipakai pada penempatan guru dan jadwal kelas."
      icon={BookOpenCheck}
      className="sm:!max-w-2xl"
      footer={
        <ModalActions
          formId="subject-form"
          isPending={isPending}
          onCancel={() => onOpenChange(false)}
          submitLabel={subject ? "Simpan Perubahan" : "Tambah Mapel"}
        />
      }
    >
      <form id="subject-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={premiumModalFieldClassName}>
            <label htmlFor="subject-code" className={premiumModalLabelClassName}>Kode Mapel</label>
            <Input
              id="subject-code"
              className={`${INPUT_CN} uppercase`}
              placeholder="Contoh: MTK"
              aria-invalid={Boolean(form.formState.errors.code)}
              {...form.register("code", { setValueAs: (value: string) => value.toUpperCase() })}
            />
            <FieldError message={form.formState.errors.code?.message} />
          </div>
          <div className={premiumModalFieldClassName}>
            <label htmlFor="subject-group" className={premiumModalLabelClassName}>Kelompok Mapel</label>
            <Input
              id="subject-group"
              className={INPUT_CN}
              placeholder="Contoh: Kejuruan"
              aria-invalid={Boolean(form.formState.errors.group)}
              {...form.register("group")}
            />
            <FieldError message={form.formState.errors.group?.message} />
          </div>
        </div>

        <div className={premiumModalFieldClassName}>
          <label htmlFor="subject-name" className={premiumModalLabelClassName}>Nama Mapel</label>
          <Input
            id="subject-name"
            className={INPUT_CN}
            placeholder="Contoh: Matematika"
            aria-invalid={Boolean(form.formState.errors.name)}
            {...form.register("name")}
          />
          <FieldError message={form.formState.errors.name?.message} />
        </div>

        <div className={premiumModalFieldClassName}>
          <label className={premiumModalLabelClassName}>Status Mapel</label>
          <Controller
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <RadixSelectField
                value={String(field.value)}
                onValueChange={(value) => field.onChange(value === "true")}
                placeholder="Pilih status"
                options={activeOptions}
              />
            )}
          />
        </div>
      </form>
    </PremiumModal>
  );
}

type AssignmentModalProps = {
  assignment: AdminTeacherSubjectAssignment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teachers: AdminTeacherProfile[];
  subjects: AdminSubject[];
  classes: AdminClass[];
  schoolYears: AdminSchoolYear[];
  isPending: boolean;
  onSubmit: (values: TeachingAssignmentFormValues) => void;
};

export function TeachingAssignmentFormModal({
  assignment,
  open,
  onOpenChange,
  teachers,
  subjects,
  classes,
  schoolYears,
  isPending,
  onSubmit,
}: AssignmentModalProps) {
  const form = useForm<TeachingAssignmentFormValues>({
    resolver: zodResolver(teachingAssignmentSchema),
    defaultValues: assignmentValues(assignment),
  });
  const schedules = useFieldArray({ control: form.control, name: "schedules" });

  useEffect(() => {
    if (open) form.reset(assignmentValues(assignment));
  }, [assignment, form, open]);

  return (
    <PremiumModal
      open={open}
      onOpenChange={onOpenChange}
      title={assignment ? "Edit Jadwal Mengajar" : "Tambah Jadwal Mengajar"}
      description="Hubungkan guru, mapel, kelas, tahun ajaran, dan slot waktu dalam satu penempatan."
      icon={BookOpenCheck}
      className="sm:!max-w-4xl"
      footer={
        <ModalActions
          formId="teaching-assignment-form"
          isPending={isPending}
          onCancel={() => onOpenChange(false)}
          submitLabel={assignment ? "Simpan Jadwal" : "Tambah Jadwal"}
        />
      }
    >
      <form id="teaching-assignment-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <SelectController
            control={form.control}
            name="teacher_id"
            label="Guru Pengajar"
            placeholder="Pilih guru"
            options={teachers.filter((item) => item.is_active).map((item) => ({
              value: item.id,
              label: item.name,
              description: item.username || undefined,
            }))}
            error={form.formState.errors.teacher_id?.message}
          />
          <SelectController
            control={form.control}
            name="subject_id"
            label="Mata Pelajaran"
            placeholder="Pilih mapel"
            options={subjects.filter((item) => item.is_active).map((item) => ({
              value: item.id,
              label: item.name,
              description: item.code,
            }))}
            error={form.formState.errors.subject_id?.message}
          />
          <SelectController
            control={form.control}
            name="class_id"
            label="Kelas"
            placeholder="Pilih kelas"
            options={classes.filter((item) => item.is_active).map((item) => ({
              value: item.id,
              label: item.display_name,
              description: item.school_year_name,
            }))}
            error={form.formState.errors.class_id?.message}
          />
          <SelectController
            control={form.control}
            name="school_year_id"
            label="Tahun Ajaran"
            placeholder="Pilih tahun ajaran"
            options={schoolYears.filter((item) => item.is_active).map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            error={form.formState.errors.school_year_id?.message}
          />
        </div>

        <div className={premiumModalFieldClassName}>
          <label className={premiumModalLabelClassName}>Status Penempatan</label>
          <Controller
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <RadixSelectField
                value={String(field.value)}
                onValueChange={(value) => field.onChange(value === "true")}
                placeholder="Pilih status"
                options={activeOptions}
              />
            )}
          />
        </div>

        {/* Slot Jadwal */}
        <div className="rounded-[26px] border border-emerald-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(243,252,248,0.96)_100%)] p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Slot Jadwal</h3>
              <p className="text-xs text-slate-500">Tambahkan satu atau beberapa hari dan jam mengajar.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-2.5 rounded-[18px] border-emerald-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(238,252,245,0.98)_100%)] px-3.5 text-sm font-semibold text-emerald-900 shadow-[0_10px_20px_rgba(15,23,42,0.04)] hover:border-emerald-300"
              onClick={() => schedules.append({ hari: "senin", jam_mulai: "", jam_selesai: "" })}
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_6px_12px_rgba(16,185,129,0.2)]">
                <Plus className="size-3" />
              </span>
              Tambah Slot
            </Button>
          </div>

          <div className="space-y-3">
            {schedules.fields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-3 rounded-[20px] border border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fcfa_100%)] p-4 shadow-[0_6px_14px_rgba(15,23,42,0.03)] md:grid-cols-[1fr_1fr_1fr_auto] md:items-start"
              >
                <div className={premiumModalFieldClassName}>
                  <label className={premiumModalLabelClassName}>Hari</label>
                  <Controller
                    control={form.control}
                    name={`schedules.${index}.hari`}
                    render={({ field: controllerField }) => (
                      <RadixSelectField
                        value={controllerField.value}
                        onValueChange={controllerField.onChange}
                        placeholder="Pilih hari"
                        options={dayOptions}
                      />
                    )}
                  />
                </div>
                <div className={premiumModalFieldClassName}>
                  <label htmlFor={`schedule-start-${index}`} className={premiumModalLabelClassName}>Jam Mulai</label>
                  <Input
                    id={`schedule-start-${index}`}
                    type="time"
                    className={INPUT_CN}
                    {...form.register(`schedules.${index}.jam_mulai`)}
                  />
                  <FieldError message={form.formState.errors.schedules?.[index]?.jam_mulai?.message} />
                </div>
                <div className={premiumModalFieldClassName}>
                  <label htmlFor={`schedule-end-${index}`} className={premiumModalLabelClassName}>Jam Selesai</label>
                  <Input
                    id={`schedule-end-${index}`}
                    type="time"
                    className={INPUT_CN}
                    {...form.register(`schedules.${index}.jam_selesai`)}
                  />
                  <FieldError message={form.formState.errors.schedules?.[index]?.jam_selesai?.message} />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Hapus slot jadwal ${index + 1}`}
                  className="size-10 rounded-[14px] border-rose-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,242,242,0.98)_100%)] text-rose-500 shadow-[0_8px_16px_rgba(15,23,42,0.04)] hover:border-rose-300 hover:bg-rose-50 md:mt-7"
                  onClick={() => schedules.remove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <FieldError message={form.formState.errors.schedules?.root?.message ?? form.formState.errors.schedules?.message} />
        </div>

      </form>
    </PremiumModal>
  );
}

function SelectController({ control, name, label, placeholder, options, error }: {
  control: ReturnType<typeof useForm<TeachingAssignmentFormValues>>["control"];
  name: "teacher_id" | "subject_id" | "class_id" | "school_year_id";
  label: string;
  placeholder: string;
  options: { value: string; label: string; description?: string }[];
  error?: string;
}) {
  return (
    <div className={premiumModalFieldClassName}>
      <label className={premiumModalLabelClassName}>{label}</label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <RadixSelectField
            value={field.value as string}
            onValueChange={field.onChange}
            placeholder={placeholder}
            options={options}
          />
        )}
      />
      <FieldError message={error} />
    </div>
  );
}

function ModalActions({ formId, isPending, onCancel, submitLabel }: { formId: string; isPending: boolean; onCancel: () => void; submitLabel: string }) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="outline"
        className="h-12 rounded-[1.1rem] border-slate-200 px-5 text-sm font-semibold text-slate-600"
        onClick={onCancel}
        disabled={isPending}
      >
        Batal
      </Button>
      <Button
        type="submit"
        form={formId}
        className="h-12 rounded-[1.1rem] bg-[linear-gradient(135deg,#0f766e_0%,#166534_100%)] px-5 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(22,101,52,0.2)] hover:opacity-95"
        disabled={isPending}
      >
        <Sparkles className="size-4" />
        {isPending ? "Menyimpan..." : submitLabel}
      </Button>
    </div>
  );
}

function subjectValues(subject: AdminSubject | null): SubjectFormValues {
  return {
    code: subject?.code ?? "",
    name: subject?.name ?? "",
    group: subject?.group ?? "",
    is_active: subject?.is_active ?? true,
  };
}

function assignmentValues(assignment: AdminTeacherSubjectAssignment | null): TeachingAssignmentFormValues {
  return {
    teacher_id: assignment?.teacher_id ?? "",
    subject_id: assignment?.subject_id ?? "",
    class_id: assignment?.class_id ?? "",
    school_year_id: assignment?.school_year_id ?? "",
    is_active: assignment?.is_active ?? true,
    schedules: assignment?.schedules.map(({ hari, jam_mulai, jam_selesai }) => ({ hari, jam_mulai, jam_selesai })) ?? [
      { hari: "senin", jam_mulai: "", jam_selesai: "" },
    ],
  };
}
