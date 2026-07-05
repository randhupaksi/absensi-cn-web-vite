import { ActionButtons, AddButton, DataTable, DataTableBody, DataTableCard, DataTableCell, DataTableHeadRow, DataTableRow, SectionTabSwitch, StatCard, StatusBadge } from "@/components/dashboard/admin/sections/section-ui";
import { DeleteConfirmationModal } from "@/components/modals/delete-confirmation-modal";
import { PremiumModal, premiumModalFieldClassName, premiumModalLabelClassName } from "@/components/modals/premium-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { RadixSelectField } from "@/components/ui/radix-select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { programSchema, schoolUnitSchema, type ProgramFormValues, type SchoolUnitFormValues } from "@/lib/validations/academic-structure-schema";
import { createAdminMajor, createAdminSchoolUnit, deleteAdminMajor, deleteAdminSchoolUnit, updateAdminMajor, updateAdminSchoolUnit } from "@/services/admin.service";
import type { AdminMajor, AdminSchoolUnit } from "@/types/admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Network, School } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type StructureTab = "units" | "programs";
const inputClass = "h-14 rounded-[1.25rem] border-slate-200/80 bg-white px-4 text-sm";

export function AcademicStructureSection({ units, programs, isLoading }: { units: AdminSchoolUnit[]; programs: AdminMajor[]; isLoading: boolean }) {
  const client = useQueryClient();
  const [tab, setTab] = useState<StructureTab>("units");
  const [createOpen, setCreateOpen] = useState(false);
  const [unit, setUnit] = useState<AdminSchoolUnit | null>(null);
  const [program, setProgram] = useState<AdminMajor | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; label: string; kind: StructureTab } | null>(null);
  const refresh = () => Promise.all([client.invalidateQueries({ queryKey: ["admin-school-units"] }), client.invalidateQueries({ queryKey: ["admin-majors"] }), client.invalidateQueries({ queryKey: ["admin-classes"] })]);
  const done = async (message: string) => { toast.success(message); setCreateOpen(false); setUnit(null); setProgram(null); setDeleting(null); await refresh(); };
  const createUnit = useMutation({ mutationFn: createAdminSchoolUnit, onSuccess: () => done("Unit sekolah berhasil ditambahkan."), onError: errorToast });
  const editUnit = useMutation({ mutationFn: ({ id, values }: { id: string; values: SchoolUnitFormValues }) => updateAdminSchoolUnit(id, values), onSuccess: () => done("Unit sekolah berhasil diperbarui."), onError: errorToast });
  const removeUnit = useMutation({ mutationFn: deleteAdminSchoolUnit, onSuccess: () => done("Unit sekolah berhasil dihapus."), onError: errorToast });
  const createProgram = useMutation({ mutationFn: createAdminMajor, onSuccess: () => done("Program berhasil ditambahkan."), onError: errorToast });
  const editProgram = useMutation({ mutationFn: ({ id, values }: { id: string; values: ProgramFormValues }) => updateAdminMajor(id, values), onSuccess: () => done("Program berhasil diperbarui."), onError: errorToast });
  const removeProgram = useMutation({ mutationFn: deleteAdminMajor, onSuccess: () => done("Program berhasil dihapus."), onError: errorToast });
  const pending = createUnit.isPending || editUnit.isPending || createProgram.isPending || editProgram.isPending;

  return <>
    <section className="mt-6 rounded-[30px] border border-white/75 bg-white/95 p-4 shadow-[0_28px_80px_rgba(28,77,61,0.1)] sm:p-5 lg:p-6">
      <Tabs value={tab} onValueChange={(value) => { setTab(value as StructureTab); setCreateOpen(false); }}>
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-8 sm:gap-6"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Multi-unit Foundation</p><h2 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">Unit & Program Sekolah</h2><p className="mt-2 text-sm leading-6 text-slate-600">Satu struktur untuk SMA dan SMK; kelas, siswa, mapel, dan jadwal mengikuti relasi ini.</p></div>
      <div className="grid grid-cols-2 gap-3"><StatCard label="Unit Aktif" value={units.filter((x) => x.is_active).length} icon={School} accentClass="from-emerald-500 to-teal-500" /><StatCard label="Program Aktif" value={programs.filter((x) => x.is_active).length} icon={Network} accentClass="from-sky-500 to-emerald-500" /></div>
      <SectionTabSwitch tabs={[{ value: "units", label: "Unit Sekolah", icon: School }, { value: "programs", label: "Program/Jurusan", icon: Network }]} />
      </div>
        <div className="mt-3 flex justify-end"><AddButton label={tab === "units" ? "Unit Sekolah" : "Program"} onClick={() => setCreateOpen(true)} /></div>
        <TabsContent value="units" className="mt-4"><DataTableCard isLoading={isLoading} columnCount={5} isEmpty={!units.length} emptyTitle="Belum ada unit sekolah" emptyDescription="Tambahkan SMA atau SMK." icon={School}><DataTable><DataTableHeadRow labels={["Kode", "Nama", "Jenjang", "Status", "Aksi"]} /><DataTableBody>{units.map((item) => <DataTableRow key={item.id}><DataTableCell><b>{item.code}</b></DataTableCell><DataTableCell>{item.name}</DataTableCell><DataTableCell>{item.education_level}</DataTableCell><DataTableCell><StatusBadge isActive={item.is_active} /></DataTableCell><DataTableCell><ActionButtons onEdit={() => setUnit(item)} onDelete={() => setDeleting({ id: item.id, label: item.name, kind: "units" })} /></DataTableCell></DataTableRow>)}</DataTableBody></DataTable></DataTableCard></TabsContent>
        <TabsContent value="programs" className="mt-4"><DataTableCard isLoading={isLoading} columnCount={6} isEmpty={!programs.length} emptyTitle="Belum ada program" emptyDescription="Tambahkan jurusan SMK atau program umum SMA." icon={Building2}><DataTable><DataTableHeadRow labels={["Kode", "Nama", "Unit", "Tipe", "Status", "Aksi"]} /><DataTableBody>{programs.map((item) => <DataTableRow key={item.id}><DataTableCell><b>{item.code}</b></DataTableCell><DataTableCell>{item.name}</DataTableCell><DataTableCell><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">{item.school_unit_code}</Badge></DataTableCell><DataTableCell>{item.program_type}</DataTableCell><DataTableCell><StatusBadge isActive={item.is_active} /></DataTableCell><DataTableCell><ActionButtons onEdit={() => setProgram(item)} onDelete={() => setDeleting({ id: item.id, label: item.name, kind: "programs" })} /></DataTableCell></DataTableRow>)}</DataTableBody></DataTable></DataTableCard></TabsContent>
      </Tabs>
    </section>
    <SchoolUnitModal open={(tab === "units" && createOpen) || Boolean(unit)} item={unit} pending={pending} onOpenChange={(open) => { if (!open) { setCreateOpen(false); setUnit(null); } }} onSubmit={(values) => unit ? editUnit.mutate({ id: unit.id, values }) : createUnit.mutate(values)} />
    <ProgramModal open={(tab === "programs" && createOpen) || Boolean(program)} item={program} units={units} pending={pending} onOpenChange={(open) => { if (!open) { setCreateOpen(false); setProgram(null); } }} onSubmit={(values) => program ? editProgram.mutate({ id: program.id, values }) : createProgram.mutate(values)} />
    <DeleteConfirmationModal open={Boolean(deleting)} onOpenChange={(open) => { if (!open) setDeleting(null); }} title="Hapus struktur akademik?" description={deleting?.label ?? ""} warning="Unit atau program yang sudah dipakai kelas tidak dapat dihapus; nonaktifkan untuk menjaga histori." onConfirm={() => { if (!deleting) return; if (deleting.kind === "units") removeUnit.mutate(deleting.id); else removeProgram.mutate(deleting.id); }} isPending={removeUnit.isPending || removeProgram.isPending} />
  </>;
}

function SchoolUnitModal({ open, item, pending, onOpenChange, onSubmit }: { open: boolean; item: AdminSchoolUnit | null; pending: boolean; onOpenChange: (open: boolean) => void; onSubmit: (values: SchoolUnitFormValues) => void }) {
  const form = useForm<SchoolUnitFormValues>({ resolver: zodResolver(schoolUnitSchema), defaultValues: unitValues(item) }); useEffect(() => { if (open) form.reset(unitValues(item)); }, [form, item, open]);
  return <PremiumModal open={open} onOpenChange={onOpenChange} icon={School} title={item ? "Edit Unit Sekolah" : "Tambah Unit Sekolah"} description="Unit menjadi batas utama data SMA dan SMK." footer={<Footer formId="unit-form" pending={pending} onCancel={() => onOpenChange(false)} />}><form id="unit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"><InputField form={form} name="code" label="Kode Unit" /><InputField form={form} name="name" label="Nama Unit" /><SelectControl control={form.control} name="education_level" label="Jenjang" options={[{ value: "SMK", label: "Sekolah Menengah Kejuruan" }, { value: "SMA", label: "Sekolah Menengah Atas" }]} /><SelectControl control={form.control} name="is_active" label="Status" options={[{ value: "true", label: "Aktif" }, { value: "false", label: "Nonaktif" }]} /></form></PremiumModal>;
}
function ProgramModal({ open, item, units, pending, onOpenChange, onSubmit }: { open: boolean; item: AdminMajor | null; units: AdminSchoolUnit[]; pending: boolean; onOpenChange: (open: boolean) => void; onSubmit: (values: ProgramFormValues) => void }) {
  const form = useForm<ProgramFormValues>({ resolver: zodResolver(programSchema), defaultValues: programValues(item) }); useEffect(() => { if (open) form.reset(programValues(item)); }, [form, item, open]);
  return <PremiumModal open={open} onOpenChange={onOpenChange} icon={Network} title={item ? "Edit Program" : "Tambah Program"} description="Gunakan VOCATIONAL untuk jurusan SMK dan GENERAL untuk SMA umum." footer={<Footer formId="program-form" pending={pending} onCancel={() => onOpenChange(false)} />}><form id="program-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"><SelectControl control={form.control} name="school_unit_id" label="Unit Sekolah" options={units.filter((x) => x.is_active).map((x) => ({ value: x.id, label: `${x.code} · ${x.name}` }))} /><InputField form={form} name="code" label="Kode Program" /><InputField form={form} name="name" label="Nama Program" /><SelectControl control={form.control} name="program_type" label="Tipe Program" options={[{ value: "VOCATIONAL", label: "Kejuruan" }, { value: "GENERAL", label: "Umum" }, { value: "SCIENCE", label: "Sains" }, { value: "SOCIAL", label: "Sosial" }]} /><SelectControl control={form.control} name="is_active" label="Status" options={[{ value: "true", label: "Aktif" }, { value: "false", label: "Nonaktif" }]} /></form></PremiumModal>;
}

function Footer({ formId, pending, onCancel }: { formId: string; pending: boolean; onCancel: () => void }) { return <div className="flex justify-end gap-3"><Button variant="outline" onClick={onCancel} disabled={pending}>Batal</Button><Button type="submit" form={formId} className="bg-emerald-700 text-white" disabled={pending}>{pending ? "Menyimpan..." : "Simpan"}</Button></div>; }
function errorToast(error: Error) { toast.error(error.message); }
function InputField<T extends SchoolUnitFormValues | ProgramFormValues>({ form, name, label }: { form: ReturnType<typeof useForm<T>>; name: "code" | "name"; label: string }) { return <div className={premiumModalFieldClassName}><label className={premiumModalLabelClassName}>{label}</label><Input className={inputClass} {...form.register(name as never)} /><FieldError message={(form.formState.errors[name] as { message?: string } | undefined)?.message} /></div>; }
function SelectControl<T extends SchoolUnitFormValues | ProgramFormValues>({ control, name, label, options }: { control: ReturnType<typeof useForm<T>>["control"]; name: string; label: string; options: { value: string; label: string }[] }) { return <div className={premiumModalFieldClassName}><label className={premiumModalLabelClassName}>{label}</label><Controller control={control} name={name as never} render={({ field }) => <RadixSelectField value={typeof field.value === "boolean" ? String(field.value) : String(field.value ?? "")} onValueChange={(value) => field.onChange(name === "is_active" ? value === "true" : value)} placeholder={`Pilih ${label.toLowerCase()}`} options={options} />} /></div>; }
function unitValues(item: AdminSchoolUnit | null): SchoolUnitFormValues { return { code: item?.code ?? "", name: item?.name ?? "", education_level: item?.education_level ?? "", is_active: item?.is_active ?? true }; }
function programValues(item: AdminMajor | null): ProgramFormValues { return { school_unit_id: item?.school_unit_id ?? "", code: item?.code ?? "", name: item?.name ?? "", program_type: item?.program_type === "GENERAL" || item?.program_type === "SCIENCE" || item?.program_type === "SOCIAL" ? item.program_type : "VOCATIONAL", is_active: item?.is_active ?? true }; }
