"use client";

import { FieldGroup, ModalActions } from "@/features/admin/management/shared/section-ui";
import { PremiumModal } from "@/components/modals/premium-modal";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { RadixSelectField } from "@/components/ui/radix-select";
import { createStudentProfileSchema, editStudentProfileSchema, type StudentProfileFormValues } from "@/lib/validations/student-profile-schema";
import type { AdminClass, AdminStudent, AdminStudentPayload } from "@/types/admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { FilePenLine, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

const GENDER_OPTIONS = [{ value: "MALE", label: "Laki-laki" }, { value: "FEMALE", label: "Perempuan" }];
const ACTIVE_OPTIONS = [{ value: "true", label: "Aktif" }, { value: "false", label: "Nonaktif" }];
const EMPTY_FORM: StudentProfileFormValues = { name: "", nis: "", nisn: "", password: "", gender: "MALE", class_id: "", is_active: true };

export function formatGender(gender?: string) { return gender === "MALE" || gender === "L" ? "Laki-laki" : gender === "FEMALE" || gender === "P" ? "Perempuan" : "-"; }

type CommonProps = { open: boolean; onOpenChange: (open: boolean) => void; classes: AdminClass[]; isPending: boolean; onSubmit: (payload: AdminStudentPayload) => void };

export function StudentProfileCreateModal({ open, onOpenChange, classes, isPending, onSubmit }: CommonProps) {
  const form = useForm<StudentProfileFormValues>({ resolver: zodResolver(createStudentProfileSchema), defaultValues: EMPTY_FORM });
  const handleOpenChange = (nextOpen: boolean) => { onOpenChange(nextOpen); if (!nextOpen) form.reset(EMPTY_FORM); };
  return <StudentFormModal open={open} onOpenChange={handleOpenChange} title="Tambah Profil Siswa" description="Buat akun, profil, dan penempatan kelas siswa dalam satu proses." icon={UsersRound} form={form} classes={classes} isPending={isPending} onSubmit={onSubmit} submitLabel="Simpan Profil Siswa" />;
}

export function StudentProfileEditModal({ student, currentClassId, open, onOpenChange, classes, isPending, onSubmit }: CommonProps & { student: AdminStudent | null; currentClassId?: string }) {
  const defaults: StudentProfileFormValues = student ? { name: student.name, nis: student.nis, nisn: student.nisn ?? "", password: "", gender: student.gender === "FEMALE" ? "FEMALE" : "MALE", class_id: currentClassId ?? "", is_active: student.is_active } : EMPTY_FORM;
  const form = useForm<StudentProfileFormValues>({ resolver: zodResolver(editStudentProfileSchema), defaultValues: defaults });
  if (!student) return null;
  return <StudentFormModal open={open} onOpenChange={onOpenChange} title="Edit Profil Siswa" description="Perbarui akun, profil, dan kelas siswa tanpa menghapus histori." icon={FilePenLine} form={form} classes={classes} isPending={isPending} onSubmit={onSubmit} submitLabel="Update Profil Siswa" />;
}

function StudentFormModal({ open, onOpenChange, title, description, icon, form, classes, isPending, onSubmit, submitLabel }: CommonProps & { title: string; description: string; icon: typeof UsersRound; form: ReturnType<typeof useForm<StudentProfileFormValues>>; submitLabel: string }) {
  const errors = form.formState.errors;
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [selectedMajorId, setSelectedMajorId] = useState("");
  const selectedClassId = useWatch({ control: form.control, name: "class_id" });
  const activeClasses = useMemo(
    () => classes.filter((item) => item.is_active),
    [classes],
  );
  const selectedClass = activeClasses.find((item) => item.id === selectedClassId);

  useEffect(() => {
    if (!open) return;
    const initialClass = activeClasses.find((item) => item.id === form.getValues("class_id"));
    setSelectedUnitId(initialClass?.school_unit_id ?? "");
    setSelectedMajorId(initialClass?.major_id ?? "");
  }, [activeClasses, form, open]);

  const unitOptions = useMemo(() => {
    const units = new Map<string, AdminClass>();
    activeClasses.forEach((item) => units.set(item.school_unit_id, item));

    return [...units.values()]
      .sort((left, right) => left.school_unit_code.localeCompare(right.school_unit_code, "id"))
      .map((item) => ({
        value: item.school_unit_id,
        label: schoolLevelLabel(item.school_unit_code),
        description: item.school_unit_name,
      }));
  }, [activeClasses]);

  const majorOptions = useMemo(() => {
    const majors = new Map<string, AdminClass>();
    activeClasses
      .filter((item) => !selectedUnitId || item.school_unit_id === selectedUnitId)
      .forEach((item) => majors.set(item.major_id, item));

    return [...majors.values()]
      .sort((left, right) => left.major_name.localeCompare(right.major_name, "id"))
      .map((item) => ({
        value: item.major_id,
        label: item.major_name,
        description: schoolLevelLabel(item.school_unit_code),
      }));
  }, [activeClasses, selectedUnitId]);

  const classOptions = useMemo(
    () => activeClasses
      .filter((item) => !selectedUnitId || item.school_unit_id === selectedUnitId)
      .filter((item) => !selectedMajorId || item.major_id === selectedMajorId)
      .sort(compareClasses)
      .map((item) => ({
        value: item.id,
        label: item.display_name,
        description: `${item.major_name} · ${item.school_year_name}`,
      })),
    [activeClasses, selectedMajorId, selectedUnitId],
  );

  const changeUnit = (unitId: string) => {
    setSelectedUnitId(unitId);
    setSelectedMajorId("");
    if (selectedClass && selectedClass.school_unit_id !== unitId) {
      form.setValue("class_id", "", { shouldValidate: true });
    }
  };

  const changeMajor = (majorId: string) => {
    setSelectedMajorId(majorId);
    if (selectedClass && selectedClass.major_id !== majorId) {
      form.setValue("class_id", "", { shouldValidate: true });
    }
  };

  return <PremiumModal open={open} onOpenChange={onOpenChange} title={title} description={description} icon={icon}>
    <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <FieldGroup label="Nama Siswa"><Input {...form.register("name")} placeholder="Masukkan nama siswa" className="h-14" /><FieldError message={errors.name?.message} /></FieldGroup>
        <FieldGroup label="Password Login"><Input type="password" {...form.register("password")} placeholder="Minimal 6 karakter; kosongkan saat edit" className="h-14" /><FieldError message={errors.password?.message} /></FieldGroup>
        <FieldGroup label="NIS"><Input inputMode="numeric" maxLength={10} {...form.register("nis")} placeholder="10 digit NIS" className="h-14" /><FieldError message={errors.nis?.message} /></FieldGroup>
        <FieldGroup label="NISN"><Input inputMode="numeric" maxLength={10} {...form.register("nisn")} placeholder="10 digit NISN" className="h-14" /><FieldError message={errors.nisn?.message} /></FieldGroup>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FieldGroup label="Jenjang">
          <RadixSelectField value={selectedUnitId} onValueChange={changeUnit} placeholder="Pilih jenjang sekolah" options={unitOptions} />
        </FieldGroup>
        <FieldGroup label="Jurusan">
          <RadixSelectField value={selectedMajorId} onValueChange={changeMajor} placeholder="Pilih jurusan" options={majorOptions} />
        </FieldGroup>
      </div>
      <FieldGroup label="Kelas"><Controller control={form.control} name="class_id" render={({ field }) => <RadixSelectField value={field.value} onValueChange={(classId) => {
        field.onChange(classId);
        const selected = activeClasses.find((item) => item.id === classId);
        if (selected) {
          setSelectedUnitId(selected.school_unit_id);
          setSelectedMajorId(selected.major_id);
        }
      }} placeholder="Pilih kelas siswa" options={classOptions} />} /><FieldError message={errors.class_id?.message} /></FieldGroup>
      <div className="grid gap-4 md:grid-cols-2">
        <FieldGroup label="Jenis Kelamin"><Controller control={form.control} name="gender" render={({ field }) => <RadixSelectField value={field.value} onValueChange={field.onChange} placeholder="Pilih jenis kelamin" options={GENDER_OPTIONS} />} /><FieldError message={errors.gender?.message} /></FieldGroup>
        <FieldGroup label="Status Aktif"><Controller control={form.control} name="is_active" render={({ field }) => <RadixSelectField value={String(field.value)} onValueChange={(value) => field.onChange(value === "true")} placeholder="Pilih status" options={ACTIVE_OPTIONS} />} /><FieldError message={errors.is_active?.message} /></FieldGroup>
      </div>
      <ModalActions isPending={isPending} onCancel={() => onOpenChange(false)} onSubmit={form.handleSubmit(onSubmit)} submitLabel={submitLabel} />
    </form>
  </PremiumModal>;
}

function schoolLevelLabel(schoolUnitCode: string) {
  const code = schoolUnitCode.toUpperCase();
  if (code.includes("SMP")) return "SMP";
  if (code.includes("SMK")) return "SMK";
  if (code.includes("SMA")) return "SMA";
  return schoolUnitCode;
}

function compareClasses(left: AdminClass, right: AdminClass) {
  return left.major_name.localeCompare(right.major_name, "id")
    || gradeOrder(left.grade) - gradeOrder(right.grade)
    || left.grade.localeCompare(right.grade, "id", { numeric: true })
    || left.name.localeCompare(right.name, "id", { numeric: true })
    || left.display_name.localeCompare(right.display_name, "id", { numeric: true });
}

function gradeOrder(grade: string) {
  const order: Record<string, number> = { VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };
  return order[grade.toUpperCase()] ?? Number.MAX_SAFE_INTEGER;
}
