"use client";

import { FieldGroup, ModalActions } from "@/features/admin/management/shared/section-ui";
import { PremiumModal } from "@/components/modals/premium-modal";
import { Badge } from "@/components/ui/badge";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { RadixSelectField } from "@/components/ui/radix-select";
import {
  type FieldErrors,
  hasFieldErrors,
  validateRequired,
} from "@/lib/form-validation";
import type { AdminUser, AdminUserPayload } from "@/types/admin";
import { FilePenLine, UserCog } from "lucide-react";
import { useState } from "react";

const INPUT_CN =
  "h-14 rounded-[1.25rem] border-slate-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_14px_30px_rgba(15,23,42,0.05)] focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-200/80";

const CREATE_ROLE_OPTIONS = [
  { value: "ADMIN", label: "ADMIN" },
];

const EDIT_ROLE_OPTIONS = [
  { value: "ADMIN", label: "ADMIN" },
  { value: "TEACHER", label: "TEACHER" },
];

const EMPTY_FORM: AdminUserPayload = {
  name: "",
  role: "ADMIN",
  username: "",
  nis: "",
  password: "",
};

export function validateRoleUserForm(
  form: AdminUserPayload,
  isEdit: boolean,
): FieldErrors<keyof AdminUserPayload> {
  const errors: FieldErrors<keyof AdminUserPayload> = {};
  validateRequired(errors, "name", form.name, "Nama akun");
  validateRequired(errors, "role", form.role, "Role");
  validateRequired(errors, "username", form.username, "Username");
  if (!isEdit) validateRequired(errors, "password", form.password, "Password login");
  return errors;
}

export function roleDescription(role: AdminUser["role"]) {
  switch (role) {
    case "ADMIN":
      return "Kontrol penuh dashboard dan master data";
    case "TEACHER":
      return "Akun dasar guru untuk modul pengajaran";
    default:
      return "-";
  }
}

export function UserRoleBadge({ role }: { role: AdminUser["role"] }) {
  const className =
    role === "ADMIN"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-sky-200 bg-sky-50 text-sky-700";

  return (
    <Badge variant="outline" className={className}>
      {role}
    </Badge>
  );
}

export function UserCreateModal({
  open,
  onOpenChange,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSubmit: (payload: AdminUserPayload) => void;
}) {
  const [form, setForm] = useState<AdminUserPayload>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors<keyof AdminUserPayload>>({});

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  };

  const handleSubmit = () => {
    const nextErrors = validateRoleUserForm(form, false);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(form);
  };

  return (
    <PremiumModal open={open} onOpenChange={handleOpenChange} title="Tambah Administrator" description="Buat akun administrator baru. Akun guru dibuat dari section Guru agar profil mengajar langsung lengkap." icon={UserCog}>
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Nama Akun">
            <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Masukkan nama akun" className={INPUT_CN} />
            <FieldError message={errors.name} />
          </FieldGroup>
          <FieldGroup label="Role">
            <RadixSelectField value={form.role} onValueChange={(v) => setForm((prev) => ({ ...prev, role: v as AdminUser["role"] }))} placeholder="Pilih role" options={CREATE_ROLE_OPTIONS} />
            <FieldError message={errors.role} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Username">
            <Input value={form.username} onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value, nis: "" }))} placeholder="Masukkan username" className={INPUT_CN} />
            <FieldError message={errors.username} />
          </FieldGroup>
          <FieldGroup label="Password Login">
            <Input value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="Masukkan password login" className={INPUT_CN} />
            <FieldError message={errors.password} />
          </FieldGroup>
        </div>

        <ModalActions isPending={isPending} onCancel={() => handleOpenChange(false)} onSubmit={handleSubmit} submitLabel="Simpan Role Staff" />
      </div>
    </PremiumModal>
  );
}

export function UserEditModal({
  user,
  open,
  onOpenChange,
  isPending,
  onSubmit,
}: {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSubmit: (payload: AdminUserPayload) => void;
}) {
  const [form, setForm] = useState<AdminUserPayload>(() =>
    user
      ? {
          name: user.name,
          role: user.role,
          username: user.username ?? "",
          nis: user.nis ?? "",
          password: "",
        }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<FieldErrors<keyof AdminUserPayload>>({});

  const handleSubmit = () => {
    const nextErrors = validateRoleUserForm(form, true);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(form);
  };

  if (!user) return null;

  return (
    <PremiumModal open={open} onOpenChange={onOpenChange} title="Edit Role Staff" description="Perbarui nama akun, role, username, dan password bila memang perlu diganti." icon={FilePenLine}>
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Nama Akun">
            <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Masukkan nama akun" className={INPUT_CN} />
            <FieldError message={errors.name} />
          </FieldGroup>
          <FieldGroup label="Role">
            <RadixSelectField value={form.role} onValueChange={(v) => setForm((prev) => ({ ...prev, role: v as AdminUser["role"] }))} placeholder="Pilih role" options={EDIT_ROLE_OPTIONS} />
            <FieldError message={errors.role} />
          </FieldGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Username">
            <Input value={form.username} onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value, nis: "" }))} placeholder="Masukkan username" className={INPUT_CN} />
            <FieldError message={errors.username} />
          </FieldGroup>
          <FieldGroup label="Password Baru">
            <Input value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="Kosongkan jika tidak diubah" className={INPUT_CN} />
            <FieldError message={errors.password} />
          </FieldGroup>
        </div>

        <ModalActions isPending={isPending} onCancel={() => onOpenChange(false)} onSubmit={handleSubmit} submitLabel="Update Role Staff" />
      </div>
    </PremiumModal>
  );
}
