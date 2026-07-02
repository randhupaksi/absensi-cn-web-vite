"use client";

import { FieldGroup, ModalActions } from "@/components/dashboard/admin/sections/section-ui";
import { PremiumModal } from "@/components/modals/premium-modal";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import {
  type FieldErrors,
  hasFieldErrors,
  validateMinLength,
  validateRequired,
} from "@/lib/form-validation";
import type { AdminUser, AdminUserPayload } from "@/types/admin";
import { FilePenLine, ShieldCheck } from "lucide-react";
import { useState } from "react";

const INPUT_CN =
  "h-14 rounded-[1.25rem] border-slate-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_14px_30px_rgba(15,23,42,0.05)] focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-200/80";

const EMPTY_FORM: AdminUserPayload = {
  name: "",
  role: "ADMIN",
  username: "",
  nis: "",
  password: "",
};

export function validateAdminUserForm(
  form: AdminUserPayload,
  isEdit: boolean,
): FieldErrors<keyof AdminUserPayload> {
  const errors: FieldErrors<keyof AdminUserPayload> = {};
  validateRequired(errors, "name", form.name, "Nama administrator");
  validateRequired(errors, "username", form.username, "Username login");
  validateMinLength(errors, "password", form.password, 6, isEdit ? "Password baru" : "Password login", {
    allowEmpty: isEdit,
  });
  return errors;
}

export function AdminCreateModal({
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
    const nextErrors = validateAdminUserForm(form, false);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(form);
  };

  return (
    <PremiumModal open={open} onOpenChange={handleOpenChange} title="Tambah Admin" description="Buat akun administrator baru dengan akses penuh ke dashboard dan master data." icon={ShieldCheck}>
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Nama Administrator">
            <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Masukkan nama admin" className={INPUT_CN} />
            <FieldError message={errors.name} />
          </FieldGroup>
          <FieldGroup label="Username Login">
            <Input value={form.username} onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))} placeholder="Masukkan username admin" className={INPUT_CN} />
            <FieldError message={errors.username} />
          </FieldGroup>
        </div>

        <FieldGroup label="Password Login">
          <Input value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="Minimal 6 karakter" className={INPUT_CN} />
          <FieldError message={errors.password} />
        </FieldGroup>

        <ModalActions isPending={isPending} onCancel={() => handleOpenChange(false)} onSubmit={handleSubmit} submitLabel="Simpan Admin" />
      </div>
    </PremiumModal>
  );
}

export function AdminEditModal({
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
          role: "ADMIN",
          username: user.username ?? "",
          nis: "",
          password: "",
        }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<FieldErrors<keyof AdminUserPayload>>({});

  const handleSubmit = () => {
    const nextErrors = validateAdminUserForm(form, true);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSubmit(form);
  };

  if (!user) return null;

  return (
    <PremiumModal open={open} onOpenChange={onOpenChange} title="Edit Admin" description="Perbarui identitas akun administrator dan isi password hanya jika memang ingin diganti." icon={FilePenLine}>
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup label="Nama Administrator">
            <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Masukkan nama admin" className={INPUT_CN} />
            <FieldError message={errors.name} />
          </FieldGroup>
          <FieldGroup label="Username Login">
            <Input value={form.username} onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))} placeholder="Masukkan username admin" className={INPUT_CN} />
            <FieldError message={errors.username} />
          </FieldGroup>
        </div>

        <FieldGroup label="Password Baru">
          <Input value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="Kosongkan jika tidak diubah" className={INPUT_CN} />
          <FieldError message={errors.password} />
        </FieldGroup>

        <ModalActions isPending={isPending} onCancel={() => onOpenChange(false)} onSubmit={handleSubmit} submitLabel="Update Admin" />
      </div>
    </PremiumModal>
  );
}
