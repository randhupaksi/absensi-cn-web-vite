"use client";

import { FieldGroup, ModalActions } from "@/components/dashboard/admin/sections/section-ui";
import { PremiumModal } from "@/components/modals/premium-modal";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/ui/field-error";
import { RadixSelectField } from "@/components/ui/radix-select";
import { bkScopeSchema, type BKScopeFormValues } from "@/lib/validations/bk-scope-schema";
import type { AdminSchoolUnit, AdminTeacherProfile } from "@/types/admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserCog } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

type BKAssignmentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teachers: AdminTeacherProfile[];
  units: AdminSchoolUnit[];
  initialValues?: BKScopeFormValues;
  isPending: boolean;
  onSubmit: (values: BKScopeFormValues) => void;
};

export function BKAssignmentModal({
  open,
  onOpenChange,
  teachers,
  units,
  initialValues,
  isPending,
  onSubmit,
}: BKAssignmentModalProps) {
  const isEditing = Boolean(initialValues?.user_id);
  const form = useForm<BKScopeFormValues>({
    resolver: zodResolver(bkScopeSchema),
    defaultValues: initialValues ?? { user_id: "", school_unit_ids: [] },
  });

  useEffect(() => {
    form.reset(initialValues ?? { user_id: "", school_unit_ids: [] });
  }, [form, initialValues]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      form.reset({ user_id: "", school_unit_ids: [] });
    }
  };

  return (
    <PremiumModal
      open={open}
      onOpenChange={handleOpenChange}
      title={isEditing ? "Edit Penempatan BK" : "Tambahkan Penempatan BK"}
      description="Tetapkan capability BK kepada guru dan batasi data yang dapat diakses berdasarkan unit sekolah."
      icon={UserCog}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
        <FieldGroup label="Pilih Guru">
          <Controller
            control={form.control}
            name="user_id"
            render={({ field }) => (
              <RadixSelectField
                value={field.value}
                onValueChange={field.onChange}
                placeholder={teachers.length === 0 ? "Semua guru sudah ditempatkan sebagai BK" : "Pilih guru"}
                options={teachers.map((teacher) => ({
                  value: teacher.user_id,
                  label: teacher.name,
                  description: teacher.username,
                }))}
              />
            )}
          />
          <FieldError message={form.formState.errors.user_id?.message} />
        </FieldGroup>

        <FieldGroup label="Unit yang dapat diakses">
          <Controller
            control={form.control}
            name="school_unit_ids"
            render={({ field }) => (
              <div className="grid gap-3 sm:grid-cols-2">
                {units.filter((unit) => unit.is_active).map((unit) => {
                  const selected = field.value.includes(unit.id);
                  return (
                    <label
                      key={unit.id}
                      className="flex min-h-14 cursor-pointer items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-4 text-sm text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40"
                    >
                      <Checkbox
                        checked={selected}
                        onCheckedChange={(checked) =>
                          field.onChange(
                            checked
                              ? [...field.value, unit.id]
                              : field.value.filter((id) => id !== unit.id),
                          )
                        }
                      />
                      <span><b>{unit.code}</b> · {unit.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          />
          <FieldError message={form.formState.errors.school_unit_ids?.message} />
        </FieldGroup>

        <ModalActions
          isPending={isPending}
          onCancel={() => handleOpenChange(false)}
          onSubmit={form.handleSubmit(onSubmit)}
          submitLabel={isEditing ? "Simpan Cakupan" : "Tambahkan BK"}
        />
      </form>
    </PremiumModal>
  );
}
