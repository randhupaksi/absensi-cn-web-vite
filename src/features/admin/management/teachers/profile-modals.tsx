"use client";

import { FieldGroup, ModalActions } from "@/features/admin/management/shared/section-ui";
import { PremiumModal } from "@/components/modals/premium-modal";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { RadixSelectField } from "@/components/ui/radix-select";
import {
  createTeacherProfileSchema,
  editTeacherProfileSchema,
  type TeacherProfileFormValues,
} from "@/lib/validations/teacher-profile-schema";
import type { AdminTeacherProfile } from "@/types/admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { FilePenLine } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

export type TeacherProfileCreatePayload = TeacherProfileFormValues;

const GENDER_OPTIONS = [
  { value: "MALE", label: "Laki-laki" },
  { value: "FEMALE", label: "Perempuan" },
];
const ACTIVE_OPTIONS = [
  { value: "true", label: "Aktif" },
  { value: "false", label: "Nonaktif" },
];
const EMPTY_FORM: TeacherProfileFormValues = { name: "", username: "", password: "", gender: "MALE", is_active: true };

export function TeacherProfileCreateModal({ open, onOpenChange, isPending, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; isPending: boolean; onSubmit: (payload: TeacherProfileCreatePayload) => void }) {
  const form = useForm<TeacherProfileFormValues>({ resolver: zodResolver(createTeacherProfileSchema), defaultValues: EMPTY_FORM });
  const handleOpenChange = (nextOpen: boolean) => { onOpenChange(nextOpen); if (!nextOpen) form.reset(EMPTY_FORM); };
  return (
    <PremiumModal open={open} onOpenChange={handleOpenChange} title="Tambah Profil Guru" description="Buat akun dan profil guru dalam satu proses." icon={FilePenLine}>
      <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Nama Guru"><Input {...form.register("name")} placeholder="Masukkan nama guru" className="h-14" /><FieldError message={form.formState.errors.name?.message} /></FieldGroup>
          <FieldGroup label="Username Login"><Input {...form.register("username")} placeholder="Masukkan username guru" className="h-14" /><FieldError message={form.formState.errors.username?.message} /></FieldGroup>
        </div>
        <FieldGroup label="Password Login"><Input type="password" {...form.register("password")} placeholder="Minimal 6 karakter" className="h-14" /><FieldError message={form.formState.errors.password?.message} /></FieldGroup>
        <TeacherSelectFields control={form.control} errors={form.formState.errors} />
        <ModalActions isPending={isPending} onCancel={() => handleOpenChange(false)} onSubmit={form.handleSubmit(onSubmit)} submitLabel="Simpan Profil Guru" />
      </form>
    </PremiumModal>
  );
}

export function TeacherProfileEditModal({ teacher, open, onOpenChange, isPending, onSubmit }: { teacher: AdminTeacherProfile | null; open: boolean; onOpenChange: (open: boolean) => void; isPending: boolean; onSubmit: (payload: TeacherProfileCreatePayload) => void }) {
  const defaults: TeacherProfileFormValues = teacher ? { name: teacher.name, username: teacher.username ?? "", password: "", gender: teacher.gender === "FEMALE" ? "FEMALE" : "MALE", is_active: teacher.is_active } : EMPTY_FORM;
  const form = useForm<TeacherProfileFormValues>({ resolver: zodResolver(editTeacherProfileSchema), defaultValues: defaults });
  if (!teacher) return null;
  return (
    <PremiumModal open={open} onOpenChange={onOpenChange} title="Edit Profil Guru" description="Perbarui akun dan profil guru dalam satu proses." icon={FilePenLine}>
      <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Nama Guru"><Input {...form.register("name")} placeholder="Masukkan nama guru" className="h-14" /><FieldError message={form.formState.errors.name?.message} /></FieldGroup>
          <FieldGroup label="Username Login"><Input {...form.register("username")} placeholder="Masukkan username guru" className="h-14" /><FieldError message={form.formState.errors.username?.message} /></FieldGroup>
        </div>
        <FieldGroup label="Password Baru"><Input type="password" {...form.register("password")} placeholder="Kosongkan jika tidak diubah" className="h-14" /><FieldError message={form.formState.errors.password?.message} /></FieldGroup>
        <TeacherSelectFields control={form.control} errors={form.formState.errors} />
        <ModalActions isPending={isPending} onCancel={() => onOpenChange(false)} onSubmit={form.handleSubmit(onSubmit)} submitLabel="Update Profil Guru" />
      </form>
    </PremiumModal>
  );
}

function TeacherSelectFields({ control, errors }: { control: ReturnType<typeof useForm<TeacherProfileFormValues>>["control"]; errors: ReturnType<typeof useForm<TeacherProfileFormValues>>["formState"]["errors"] }) {
  return <div className="grid gap-4 md:grid-cols-2">
    <FieldGroup label="Jenis Kelamin"><Controller control={control} name="gender" render={({ field }) => <RadixSelectField value={field.value} onValueChange={field.onChange} placeholder="Pilih jenis kelamin" options={GENDER_OPTIONS} />} /><FieldError message={errors.gender?.message} /></FieldGroup>
    <FieldGroup label="Status Aktif"><Controller control={control} name="is_active" render={({ field }) => <RadixSelectField value={String(field.value)} onValueChange={(value) => field.onChange(value === "true")} placeholder="Pilih status aktif" options={ACTIVE_OPTIONS} />} /><FieldError message={errors.is_active?.message} /></FieldGroup>
  </div>;
}
