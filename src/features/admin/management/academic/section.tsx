"use client";

import {
  ActionButtons,
  AddButton,
  DataTable,
  DataTableBody,
  DataTableCard,
  DataTableCell,
  DataTableHeadRow,
  DataTableRow,
  MobileDataCard,
  MobileDataField,
  MobileDataFooter,
  MobileDataHeader,
  MobileDataList,
  ModalActions,
  StatusBadge,
  usePagination,
} from "@/features/admin/management/shared/section-ui";
import { DeleteConfirmationModal } from "@/components/modals/delete-confirmation-modal";
import {
  PremiumModal,
  premiumModalFieldClassName,
  premiumModalLabelClassName,
} from "@/components/modals/premium-modal";
import { Badge } from "@/components/ui/badge";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { RadixSelectField } from "@/components/ui/radix-select";
import {
  programSchema,
  schoolUnitSchema,
  type ProgramFormValues,
  type SchoolUnitFormValues,
} from "@/lib/validations/academic-structure-schema";
import {
  createAdminMajor,
  createAdminSchoolUnit,
  deleteAdminMajor,
  deleteAdminSchoolUnit,
  updateAdminMajor,
  updateAdminSchoolUnit,
} from "@/services/admin.service";
import type { AdminMajor, AdminSchoolUnit } from "@/types/admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Network, School } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export type AcademicStructureTab = "units" | "majors";

type AcademicStructureTabContentProps = {
  activeTab: AcademicStructureTab;
  units: AdminSchoolUnit[];
  majors: AdminMajor[];
  isLoading: boolean;
};

type DeleteTarget = {
  id: string;
  label: string;
  kind: AcademicStructureTab;
};

const inputClass = "h-14 rounded-[1.25rem] border-slate-200/80 bg-white px-4 text-sm placeholder:text-slate-400";

export function AcademicStructureTabContent({
  activeTab,
  units,
  majors,
  isLoading,
}: AcademicStructureTabContentProps) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<AdminSchoolUnit | null>(null);
  const [editingMajor, setEditingMajor] = useState<AdminMajor | null>(null);
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);
  const { pageItems: pageUnits, pagination: unitsPagination } = usePagination(units);
  const { pageItems: pageMajors, pagination: majorsPagination } = usePagination(majors);
  const isUnitsTab = activeTab === "units";

  useEffect(() => {
    setCreateOpen(false);
    setEditingUnit(null);
    setEditingMajor(null);
    setDeleting(null);
  }, [activeTab]);

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-school-units"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-majors"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] }),
    ]);

  const finish = async (message: string) => {
    toast.success(message);
    setCreateOpen(false);
    setEditingUnit(null);
    setEditingMajor(null);
    setDeleting(null);
    await refresh();
  };

  const createUnit = useMutation({
    mutationFn: createAdminSchoolUnit,
    onSuccess: () => finish("Unit sekolah berhasil ditambahkan."),
    onError: errorToast,
  });
  const updateUnit = useMutation({
    mutationFn: ({ id, values }: { id: string; values: SchoolUnitFormValues }) =>
      updateAdminSchoolUnit(id, values),
    onSuccess: () => finish("Unit sekolah berhasil diperbarui."),
    onError: errorToast,
  });
  const removeUnit = useMutation({
    mutationFn: deleteAdminSchoolUnit,
    onSuccess: () => finish("Unit sekolah berhasil dihapus."),
    onError: errorToast,
  });
  const createMajor = useMutation({
    mutationFn: createAdminMajor,
    onSuccess: () => finish("Program berhasil ditambahkan."),
    onError: errorToast,
  });
  const updateMajor = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProgramFormValues }) =>
      updateAdminMajor(id, values),
    onSuccess: () => finish("Program berhasil diperbarui."),
    onError: errorToast,
  });
  const removeMajor = useMutation({
    mutationFn: deleteAdminMajor,
    onSuccess: () => finish("Program berhasil dihapus."),
    onError: errorToast,
  });

  const isFormPending =
    createUnit.isPending || updateUnit.isPending || createMajor.isPending || updateMajor.isPending;

  return (
    <>
      <div className="mt-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {isUnitsTab ? "Unit Sekolah" : "Program / Jurusan"}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {isUnitsTab
                ? "Kelola struktur unit SMP, SMA, dan SMK yang menjadi batas data akademik."
                : "Kelola jurusan dan program pembelajaran yang dipakai dalam pembentukan kelas."}
            </p>
          </div>
          <AddButton
            label={isUnitsTab ? "Unit Sekolah" : "Program"}
            onClick={() => setCreateOpen(true)}
          />
        </div>

        {isUnitsTab ? (
          <DataTableCard
            isLoading={isLoading}
            columnCount={5}
            isEmpty={units.length === 0}
            emptyTitle="Belum ada unit sekolah"
            emptyDescription="Tambahkan unit SMP, SMA, atau SMK untuk memulai struktur akademik."
            icon={School}
            pagination={unitsPagination}
            mobileView={
              <MobileDataList>
                {pageUnits.map((item) => (
                  <MobileDataCard key={item.id}>
                    <MobileDataHeader
                      leading={
                        <span className="flex size-11 items-center justify-center rounded-full bg-emerald-50 font-mono text-xs font-semibold text-emerald-700">
                          {item.code}
                        </span>
                      }
                      title={item.name}
                      subtitle={educationLevelLabel(item.education_level)}
                      badge={<StatusBadge isActive={item.is_active} />}
                    />
                    <MobileDataFooter>
                      <ActionButtons
                        onEdit={() => setEditingUnit(item)}
                        onDelete={() =>
                          setDeleting({ id: item.id, label: item.name, kind: "units" })
                        }
                        isDeletePending={removeUnit.isPending}
                      />
                    </MobileDataFooter>
                  </MobileDataCard>
                ))}
              </MobileDataList>
            }
          >
            <DataTable>
              <DataTableHeadRow labels={["Kode", "Nama", "Jenjang", "Status", "Aksi"]} />
              <DataTableBody>
                {pageUnits.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-semibold">{item.code}</DataTableCell>
                    <DataTableCell>{item.name}</DataTableCell>
                    <DataTableCell>{educationLevelLabel(item.education_level)}</DataTableCell>
                    <DataTableCell>
                      <StatusBadge isActive={item.is_active} />
                    </DataTableCell>
                    <DataTableCell>
                      <ActionButtons
                        onEdit={() => setEditingUnit(item)}
                        onDelete={() =>
                          setDeleting({ id: item.id, label: item.name, kind: "units" })
                        }
                        isDeletePending={removeUnit.isPending}
                      />
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          </DataTableCard>
        ) : (
          <DataTableCard
            isLoading={isLoading}
            columnCount={6}
            isEmpty={majors.length === 0}
            emptyTitle="Belum ada program"
            emptyDescription="Tambahkan program SMP, peminatan SMA, atau jurusan SMK."
            icon={Building2}
            pagination={majorsPagination}
            mobileView={
              <MobileDataList>
                {pageMajors.map((item) => (
                  <MobileDataCard key={item.id}>
                    <MobileDataHeader
                      leading={
                        <span className="flex size-11 items-center justify-center rounded-full bg-emerald-50 font-mono text-xs font-semibold text-emerald-700">
                          {item.code}
                        </span>
                      }
                      title={item.name}
                      subtitle={programTypeLabel(item.program_type)}
                      badge={<StatusBadge isActive={item.is_active} />}
                    />
                    <div className="mt-4">
                      <MobileDataField
                        label="Unit"
                        value={
                          <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-50 text-emerald-700"
                          >
                            {item.school_unit_code}
                          </Badge>
                        }
                      />
                    </div>
                    <MobileDataFooter>
                      <ActionButtons
                        onEdit={() => setEditingMajor(item)}
                        onDelete={() =>
                          setDeleting({ id: item.id, label: item.name, kind: "majors" })
                        }
                        isDeletePending={removeMajor.isPending}
                      />
                    </MobileDataFooter>
                  </MobileDataCard>
                ))}
              </MobileDataList>
            }
          >
            <DataTable>
              <DataTableHeadRow labels={["Kode", "Nama", "Unit", "Jenis Program", "Status", "Aksi"]} />
              <DataTableBody>
                {pageMajors.map((item) => (
                  <DataTableRow key={item.id}>
                    <DataTableCell className="font-semibold">{item.code}</DataTableCell>
                    <DataTableCell>{item.name}</DataTableCell>
                    <DataTableCell>
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700"
                      >
                        {item.school_unit_code}
                      </Badge>
                    </DataTableCell>
                    <DataTableCell>{programTypeLabel(item.program_type)}</DataTableCell>
                    <DataTableCell>
                      <StatusBadge isActive={item.is_active} />
                    </DataTableCell>
                    <DataTableCell>
                      <ActionButtons
                        onEdit={() => setEditingMajor(item)}
                        onDelete={() =>
                          setDeleting({ id: item.id, label: item.name, kind: "majors" })
                        }
                        isDeletePending={removeMajor.isPending}
                      />
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          </DataTableCard>
        )}
      </div>

      {(isUnitsTab && createOpen) || editingUnit ? (
        <SchoolUnitModal
          open
          item={editingUnit}
          pending={isFormPending}
          onOpenChange={(open) => {
            if (!open) {
              setCreateOpen(false);
              setEditingUnit(null);
            }
          }}
          onSubmit={(values) =>
            editingUnit ? updateUnit.mutate({ id: editingUnit.id, values }) : createUnit.mutate(values)
          }
        />
      ) : null}

      {(!isUnitsTab && createOpen) || editingMajor ? (
        <MajorModal
          open
          item={editingMajor}
          units={units}
          pending={isFormPending}
          onOpenChange={(open) => {
            if (!open) {
              setCreateOpen(false);
              setEditingMajor(null);
            }
          }}
          onSubmit={(values) =>
            editingMajor
              ? updateMajor.mutate({ id: editingMajor.id, values })
              : createMajor.mutate(values)
          }
        />
      ) : null}

      <DeleteConfirmationModal
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Hapus struktur akademik?"
        description={deleting?.label ?? ""}
        warning="Unit atau jurusan yang sudah dipakai kelas tidak dapat dihapus; nonaktifkan untuk menjaga histori."
        onConfirm={() => {
          if (!deleting) return;
          if (deleting.kind === "units") removeUnit.mutate(deleting.id);
          else removeMajor.mutate(deleting.id);
        }}
        isPending={removeUnit.isPending || removeMajor.isPending}
      />
    </>
  );
}

function SchoolUnitModal({
  open,
  item,
  pending,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  item: AdminSchoolUnit | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SchoolUnitFormValues) => void;
}) {
  const form = useForm<SchoolUnitFormValues>({
    resolver: zodResolver(schoolUnitSchema),
    defaultValues: unitValues(item),
  });

  useEffect(() => {
    if (open) form.reset(unitValues(item));
  }, [form, item, open]);

  return (
    <PremiumModal
      open={open}
      onOpenChange={onOpenChange}
      icon={School}
      title={item ? "Edit Unit Sekolah" : "Tambah Unit Sekolah"}
      description="Unit menjadi batas utama data SMP, SMA, dan SMK."
      footer={
        <ModalActions
          isPending={pending}
          onCancel={() => onOpenChange(false)}
          onSubmit={form.handleSubmit(onSubmit)}
          submitLabel={item ? "Simpan Perubahan" : "Simpan Unit"}
        />
      }
    >
      <form id="unit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 min-[480px]:grid-cols-2">
          <InputField form={form} name="code" label="Kode Unit" placeholder="Contoh: SMK" />
          <InputField form={form} name="name" label="Nama Unit" placeholder="Contoh: SMK Citra Negara" />
        </div>
        <SelectControl
          control={form.control}
          name="education_level"
          label="Jenjang"
          options={[
            { value: "SMK", label: "Sekolah Menengah Kejuruan" },
            { value: "SMA", label: "Sekolah Menengah Atas" },
            { value: "SMP", label: "Sekolah Menengah Pertama" },
          ]}
        />
        <SelectControl
          control={form.control}
          name="is_active"
          label="Status"
          options={[
            { value: "true", label: "Aktif" },
            { value: "false", label: "Nonaktif" },
          ]}
        />
      </form>
    </PremiumModal>
  );
}

function MajorModal({
  open,
  item,
  units,
  pending,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  item: AdminMajor | null;
  units: AdminSchoolUnit[];
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ProgramFormValues) => void;
}) {
  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programSchema),
    defaultValues: majorValues(item),
  });

  useEffect(() => {
    if (open) form.reset(majorValues(item));
  }, [form, item, open]);

  return (
    <PremiumModal
      open={open}
      onOpenChange={onOpenChange}
      icon={Network}
      title={item ? "Edit Program / Jurusan" : "Tambah Program / Jurusan"}
      description="Tetapkan unit sekolah dan tipe program agar dapat dipakai saat membentuk kelas."
      footer={
        <ModalActions
          isPending={pending}
          onCancel={() => onOpenChange(false)}
          onSubmit={form.handleSubmit(onSubmit)}
          submitLabel={item ? "Simpan Perubahan" : "Simpan Program"}
        />
      }
    >
      <form id="major-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <SelectControl
          control={form.control}
          name="school_unit_id"
          label="Unit Sekolah"
          options={units
            .filter((unit) => unit.is_active)
            .map((unit) => ({ value: unit.id, label: `${unit.code} · ${unit.name}` }))}
        />
        <div className="grid gap-4 min-[480px]:grid-cols-2">
          <InputField form={form} name="code" label="Kode Program" placeholder="Contoh: PPLG atau IPA" />
          <InputField form={form} name="name" label="Nama Program" placeholder="Contoh: Pengembangan Perangkat Lunak dan Gim" />
        </div>
        <SelectControl
          control={form.control}
          name="program_type"
          label="Tipe Program"
          options={[
            { value: "VOCATIONAL", label: "Kejuruan" },
            { value: "GENERAL", label: "Umum" },
            { value: "SCIENCE", label: "Sains" },
            { value: "SOCIAL", label: "Sosial" },
          ]}
        />
        <SelectControl
          control={form.control}
          name="is_active"
          label="Status"
          options={[
            { value: "true", label: "Aktif" },
            { value: "false", label: "Nonaktif" },
          ]}
        />
      </form>
    </PremiumModal>
  );
}

function InputField<T extends SchoolUnitFormValues | ProgramFormValues>({
  form,
  name,
  label,
  placeholder,
}: {
  form: ReturnType<typeof useForm<T>>;
  name: "code" | "name";
  label: string;
  placeholder: string;
}) {
  return (
    <div className={premiumModalFieldClassName}>
      <label className={premiumModalLabelClassName}>{label}</label>
      <Input className={inputClass} placeholder={placeholder} {...form.register(name as never)} />
      <FieldError message={(form.formState.errors[name] as { message?: string } | undefined)?.message} />
    </div>
  );
}

function SelectControl<T extends SchoolUnitFormValues | ProgramFormValues>({
  control,
  name,
  label,
  options,
}: {
  control: ReturnType<typeof useForm<T>>["control"];
  name: string;
  label: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className={premiumModalFieldClassName}>
      <label className={premiumModalLabelClassName}>{label}</label>
      <Controller
        control={control}
        name={name as never}
        render={({ field }) => (
          <RadixSelectField
            value={typeof field.value === "boolean" ? String(field.value) : String(field.value ?? "")}
            onValueChange={(value) => field.onChange(name === "is_active" ? value === "true" : value)}
            placeholder={`Pilih ${label.toLowerCase()}`}
            options={options}
          />
        )}
      />
    </div>
  );
}

function unitValues(item: AdminSchoolUnit | null): SchoolUnitFormValues {
  return {
    code: item?.code ?? "",
    name: item?.name ?? "",
    education_level: item?.education_level ?? "",
    is_active: item?.is_active ?? true,
  };
}

function educationLevelLabel(value: string) {
  const labels: Record<string, string> = {
    SMP: "Sekolah Menengah Pertama",
    SMA: "Sekolah Menengah Atas",
    SMK: "Sekolah Menengah Kejuruan",
  };
  return labels[value.toUpperCase()] ?? value;
}

function majorValues(item: AdminMajor | null): ProgramFormValues {
  return {
    school_unit_id: item?.school_unit_id ?? "",
    code: item?.code ?? "",
    name: item?.name ?? "",
    program_type:
      item?.program_type === "GENERAL" ||
      item?.program_type === "SCIENCE" ||
      item?.program_type === "SOCIAL"
        ? item.program_type
        : "VOCATIONAL",
    is_active: item?.is_active ?? true,
  };
}

function programTypeLabel(programType: AdminMajor["program_type"]) {
  const labels: Record<string, string> = {
    VOCATIONAL: "Kejuruan",
    GENERAL: "Umum",
    SCIENCE: "Sains",
    SOCIAL: "Sosial",
  };

  return labels[programType] ?? programType;
}

function errorToast(error: Error) {
  toast.error(error.message);
}
