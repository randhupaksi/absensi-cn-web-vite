"use client";

import { FieldGroup, ModalActions } from "@/features/admin/management/shared/section-ui";
import { PremiumModal } from "@/components/modals/premium-modal";
import { Badge } from "@/components/ui/badge";
import { ComboboxField } from "@/components/ui/combobox-field";
import { FieldError } from "@/components/ui/field-error";
import { RadixSelectField } from "@/components/ui/radix-select";
import { type FieldErrors, hasFieldErrors, validateRequired } from "@/lib/form-validation";
import type {
  AdminClass,
  AdminSchoolYear,
  AdminStudent,
  AdminStudentClassMembership,
  AdminStudentClassMembershipPayload,
} from "@/types/admin";
import { GraduationCap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const membershipStatusOptions = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "TRANSFERRED", label: "Pindah Kelas" },
  { value: "GRADUATED", label: "Lulus" },
  { value: "INACTIVE", label: "Nonaktif" },
];

export function deriveMembershipIsActive(status: string) {
  return status === "ACTIVE";
}

export function formatDateTime(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("id-ID");
}

export function validateStudentMembershipForm(
  form: AdminStudentClassMembershipPayload,
): FieldErrors<keyof AdminStudentClassMembershipPayload> {
  const errors: FieldErrors<keyof AdminStudentClassMembershipPayload> = {};
  validateRequired(errors, "student_id", form.student_id, "Siswa");
  validateRequired(errors, "class_id", form.class_id, "Kelas");
  validateRequired(errors, "school_year_id", form.school_year_id, "Tahun ajaran");
  validateRequired(errors, "status", form.status, "Status penempatan");
  return errors;
}

function formatBadgeLabel(value: string) {
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export function MembershipStatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toUpperCase();
  const label =
    membershipStatusOptions.find((option) => option.value === normalizedStatus)?.label ??
    formatBadgeLabel(status);
  const className =
    normalizedStatus === "ACTIVE"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalizedStatus === "TRANSFERRED"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : normalizedStatus === "GRADUATED"
          ? "border-sky-200 bg-sky-50 text-sky-700"
          : "border-slate-200 bg-slate-100 text-slate-500";

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

const EMPTY_FORM: AdminStudentClassMembershipPayload = {
  student_id: "",
  class_id: "",
  school_year_id: "",
  status: "ACTIVE",
  joined_at: "",
  left_at: "",
  is_active: true,
};

type SharedProps = {
  students: AdminStudent[];
  memberships: AdminStudentClassMembership[];
  classes: AdminClass[];
  schoolYears: AdminSchoolYear[];
  isPending: boolean;
  onSubmit: (payload: AdminStudentClassMembershipPayload) => void;
};

function getStudentClassLabel(
  studentId: string,
  memberships: AdminStudentClassMembership[],
  schoolYearId: string,
) {
  return (
    memberships.find((membership) =>
      membership.student_id === studentId &&
      membership.school_year_id === schoolYearId &&
      membership.is_active,
    )
      ?.class_name ?? "Belum ditempatkan"
  );
}

function getStudentOptions(
  students: AdminStudent[],
  memberships: AdminStudentClassMembership[],
  schoolYearId: string,
  currentMembershipId?: string,
) {
  if (!schoolYearId) return [];

  return students
    .filter((student) => !memberships.some((membership) =>
      membership.id !== currentMembershipId &&
      membership.student_id === student.id &&
      membership.school_year_id === schoolYearId &&
      membership.is_active,
    ))
    .map((student) => ({
      value: student.id,
      label: `${student.name} - ${getStudentClassLabel(student.id, memberships, schoolYearId)}`,
    }));
}

function ClassPlacementFields({
  classes,
  schoolYearId,
  classId,
  onClassChange,
  classError,
}: {
  classes: AdminClass[];
  schoolYearId: string;
  classId: string;
  onClassChange: (classId: string) => void;
  classError?: string;
}) {
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [selectedMajorId, setSelectedMajorId] = useState("");
  const yearClasses = useMemo(
    () => classes.filter((item) => item.is_active && item.school_year_id === schoolYearId),
    [classes, schoolYearId],
  );
  const selectedClass = yearClasses.find((item) => item.id === classId);

  useEffect(() => {
    if (!selectedClass) return;
    setSelectedUnitId(selectedClass.school_unit_id);
    setSelectedMajorId(selectedClass.major_id);
  }, [selectedClass]);

  const unitOptions = useMemo(() => {
    const units = new Map<string, AdminClass>();
    yearClasses.forEach((item) => units.set(item.school_unit_id, item));

    return [...units.values()]
      .sort((left, right) => left.school_unit_code.localeCompare(right.school_unit_code, "id"))
      .map((item) => ({
        value: item.school_unit_id,
        label: schoolLevelLabel(item.school_unit_code),
        description: item.school_unit_name,
      }));
  }, [yearClasses]);

  const majorOptions = useMemo(() => {
    const majors = new Map<string, AdminClass>();
    yearClasses
      .filter((item) => !selectedUnitId || item.school_unit_id === selectedUnitId)
      .forEach((item) => majors.set(item.major_id, item));

    return [...majors.values()]
      .sort((left, right) => left.major_name.localeCompare(right.major_name, "id"))
      .map((item) => ({
        value: item.major_id,
        label: item.major_name,
        description: schoolLevelLabel(item.school_unit_code),
      }));
  }, [selectedUnitId, yearClasses]);

  const classOptions = useMemo(
    () => yearClasses
      .filter((item) => !selectedUnitId || item.school_unit_id === selectedUnitId)
      .filter((item) => !selectedMajorId || item.major_id === selectedMajorId)
      .sort(compareClasses)
      .map((item) => ({
        value: item.id,
        label: item.display_name,
        description: `${item.major_name} · ${item.school_year_name}`,
      })),
    [selectedMajorId, selectedUnitId, yearClasses],
  );

  const changeUnit = (unitId: string) => {
    setSelectedUnitId(unitId);
    setSelectedMajorId("");
    if (selectedClass && selectedClass.school_unit_id !== unitId) onClassChange("");
  };

  const changeMajor = (majorId: string) => {
    setSelectedMajorId(majorId);
    if (selectedClass && selectedClass.major_id !== majorId) onClassChange("");
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <FieldGroup label="Jenjang">
          <RadixSelectField
            value={selectedUnitId}
            onValueChange={changeUnit}
            placeholder="Pilih jenjang sekolah"
            options={unitOptions}
          />
        </FieldGroup>
        <FieldGroup label="Jurusan">
          <RadixSelectField
            value={selectedMajorId}
            onValueChange={changeMajor}
            placeholder="Pilih jurusan"
            options={majorOptions}
          />
        </FieldGroup>
      </div>
      <FieldGroup label="Kelas">
        <RadixSelectField
          value={classId}
          onValueChange={(nextClassId) => {
            onClassChange(nextClassId);
            const nextClass = yearClasses.find((item) => item.id === nextClassId);
            if (nextClass) {
              setSelectedUnitId(nextClass.school_unit_id);
              setSelectedMajorId(nextClass.major_id);
            }
          }}
          placeholder="Pilih kelas"
          options={classOptions}
        />
        <FieldError message={classError} />
      </FieldGroup>
    </>
  );
}

export function StudentMembershipCreateModal({
  open,
  onOpenChange,
  students,
  memberships,
  classes,
  schoolYears,
  isPending,
  onSubmit,
}: { open: boolean; onOpenChange: (open: boolean) => void } & SharedProps) {
  const [form, setForm] = useState<AdminStudentClassMembershipPayload>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors<keyof AdminStudentClassMembershipPayload>>({});
  const availableStudentOptions = getStudentOptions(students, memberships, form.school_year_id);

  useEffect(() => {
    if (!open || form.school_year_id || schoolYears.length === 0) return;
    setForm((previous) => ({ ...previous, school_year_id: schoolYears[0].id }));
  }, [form.school_year_id, open, schoolYears]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  };

  const handleSubmit = () => {
    const payload = { ...form, is_active: deriveMembershipIsActive(form.status) };
    const nextErrors = validateStudentMembershipForm(payload);
    if (payload.student_id && !availableStudentOptions.some((option) => option.value === payload.student_id)) {
      nextErrors.student_id = "Siswa sudah memiliki penempatan aktif pada tahun ajaran ini.";
    }
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(payload);
  };

  return (
    <PremiumModal open={open} onOpenChange={handleOpenChange} title="Tambah Penempatan Kelas" description="Hubungkan siswa ke kelas aktif per tahun ajaran tanpa menghilangkan riwayat akademik." icon={GraduationCap}>
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Tahun Ajaran">
            <RadixSelectField value={form.school_year_id} onValueChange={(v) => setForm((prev) => ({ ...prev, school_year_id: v, student_id: "", class_id: "" }))} placeholder="Pilih tahun ajaran" options={schoolYears.map((y) => ({ value: y.id, label: y.name }))} />
            <FieldError message={errors.school_year_id} />
          </FieldGroup>
          <FieldGroup label="Siswa">
            <ComboboxField value={form.student_id} onValueChange={(v) => setForm((prev) => ({ ...prev, student_id: v }))} disabled={!form.school_year_id} placeholder={form.school_year_id ? "Pilih siswa" : "Pilih tahun ajaran terlebih dahulu"} searchPlaceholder="Cari nama atau NIS siswa..." emptyText="Semua siswa sudah memiliki penempatan aktif pada tahun ini." options={availableStudentOptions} />
            <FieldError message={errors.student_id} />
          </FieldGroup>
        </div>

        <ClassPlacementFields
          key={form.school_year_id}
          classes={classes}
          schoolYearId={form.school_year_id}
          classId={form.class_id}
          onClassChange={(classId) => setForm((prev) => ({ ...prev, class_id: classId }))}
          classError={errors.class_id}
        />

        <FieldGroup label="Status Penempatan">
          <RadixSelectField value={form.status} onValueChange={(v) => setForm((prev) => ({ ...prev, status: v, is_active: deriveMembershipIsActive(v) }))} placeholder="Pilih status" options={membershipStatusOptions} />
          <FieldError message={errors.status} />
        </FieldGroup>

        <ModalActions isPending={isPending} onCancel={() => handleOpenChange(false)} onSubmit={handleSubmit} submitLabel="Simpan Penempatan" />
      </div>
    </PremiumModal>
  );
}

export function StudentMembershipEditModal({
  membership,
  open,
  onOpenChange,
  students,
  memberships,
  classes,
  schoolYears,
  isPending,
  onSubmit,
}: { membership: AdminStudentClassMembership | null; open: boolean; onOpenChange: (open: boolean) => void } & SharedProps) {
  const [form, setForm] = useState<AdminStudentClassMembershipPayload>(() =>
    membership
      ? {
          student_id: membership.student_id,
          class_id: membership.class_id,
          school_year_id: membership.school_year_id,
          status: membership.status,
          joined_at: membership.joined_at ?? "",
          left_at: membership.left_at ?? "",
          is_active: membership.is_active,
        }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<FieldErrors<keyof AdminStudentClassMembershipPayload>>({});

  useEffect(() => {
    if (!open || form.school_year_id || schoolYears.length === 0) return;
    setForm((previous) => ({ ...previous, school_year_id: schoolYears[0].id }));
  }, [form.school_year_id, open, schoolYears]);

  const handleSubmit = () => {
    const payload = { ...form, is_active: deriveMembershipIsActive(form.status) };
    const nextErrors = validateStudentMembershipForm(payload);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(payload);
  };

  if (!membership) return null;

  return (
    <PremiumModal open={open} onOpenChange={onOpenChange} title="Edit Penempatan Kelas" description="Perbarui rombel siswa per tahun ajaran tanpa menghilangkan struktur riwayatnya." icon={GraduationCap}>
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Tahun Ajaran">
            <RadixSelectField value={form.school_year_id} onValueChange={(v) => setForm((prev) => ({ ...prev, school_year_id: v, student_id: "", class_id: "" }))} placeholder="Pilih tahun ajaran" options={schoolYears.map((y) => ({ value: y.id, label: y.name }))} />
            <FieldError message={errors.school_year_id} />
          </FieldGroup>
          <FieldGroup label="Siswa">
            <ComboboxField value={form.student_id} onValueChange={(v) => setForm((prev) => ({ ...prev, student_id: v }))} disabled={!form.school_year_id} placeholder={form.school_year_id ? "Pilih siswa" : "Pilih tahun ajaran terlebih dahulu"} searchPlaceholder="Cari nama atau NIS siswa..." emptyText="Semua siswa sudah memiliki penempatan aktif pada tahun ini." options={getStudentOptions(students, memberships, form.school_year_id, membership.id)} />
            <FieldError message={errors.student_id} />
          </FieldGroup>
        </div>

        <ClassPlacementFields
          key={form.school_year_id}
          classes={classes}
          schoolYearId={form.school_year_id}
          classId={form.class_id}
          onClassChange={(classId) => setForm((prev) => ({ ...prev, class_id: classId }))}
          classError={errors.class_id}
        />

        <FieldGroup label="Status Penempatan">
          <RadixSelectField value={form.status} onValueChange={(v) => setForm((prev) => ({ ...prev, status: v, is_active: deriveMembershipIsActive(v) }))} placeholder="Pilih status" options={membershipStatusOptions} />
          <FieldError message={errors.status} />
        </FieldGroup>

        <ModalActions isPending={isPending} onCancel={() => onOpenChange(false)} onSubmit={handleSubmit} submitLabel="Update Penempatan" />
      </div>
    </PremiumModal>
  );
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
