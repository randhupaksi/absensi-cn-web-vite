import { PremiumModal, premiumModalFieldClassName, premiumModalLabelClassName } from "@/components/modals/premium-modal";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { RadixSelectField } from "@/components/ui/radix-select";
import { Textarea } from "@/components/ui/textarea";
import {
  roomSchema,
  scheduleOverrideSchema,
  type RoomFormValues,
  type ScheduleOverrideFormValues,
} from "@/lib/validations/academic-operations-schema";
import type { AdminRoom, AdminScheduleOverride, AdminSchoolUnit, AdminSubjectScheduleOverview, AdminTeacherProfile } from "@/types/admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarSync, DoorOpen, Save } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useEffect } from "react";

const inputClass = "h-14 rounded-[1.25rem] border-slate-200/80 bg-white px-4 text-sm";
const booleanOptions = [{ value: "true", label: "Aktif" }, { value: "false", label: "Nonaktif" }];

function Footer({ formId, pending, onCancel }: { formId: string; pending: boolean; onCancel: () => void }) {
  return <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
    <Button type="button" variant="outline" className="h-12 rounded-[1.1rem] px-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-200 hover:text-slate-950 hover:shadow-[0_14px_28px_rgba(15,23,42,0.14)] active:translate-y-0 active:scale-[0.96] active:bg-slate-300" onClick={onCancel} disabled={pending}>Batal</Button>
    <Button type="submit" form={formId} className="h-12 rounded-[1.1rem] bg-emerald-700 px-5 text-white shadow-[0_20px_40px_rgba(22,101,52,0.2)] transition-all duration-200 hover:bg-emerald-800 active:scale-[0.96] active:bg-emerald-900" disabled={pending}><Save className="size-4" />{pending ? "Menyimpan..." : "Simpan"}</Button>
  </div>;
}

export function RoomModal({ open, item, schoolUnits, pending, onOpenChange, onSubmit }: { open: boolean; item: AdminRoom | null; schoolUnits: AdminSchoolUnit[]; pending: boolean; onOpenChange: (open: boolean) => void; onSubmit: (values: RoomFormValues) => void }) {
  const form = useForm<RoomFormValues>({ resolver: zodResolver(roomSchema), defaultValues: roomValues(item) });
  useEffect(() => { if (open) form.reset(roomValues(item)); }, [form, item, open]);
  return <PremiumModal open={open} onOpenChange={onOpenChange} icon={DoorOpen} title={item ? "Edit Ruangan" : "Tambah Ruangan"} description="Kelola ruang kelas, laboratorium, dan fasilitas yang dapat dipakai jadwal." className="sm:!max-w-2xl" footer={<Footer formId="room-form" pending={pending} onCancel={() => onOpenChange(false)} />}>
    <form id="room-form" onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <SelectField label="Unit Sekolah" value={form.watch("school_unit_id")} onChange={(value) => form.setValue("school_unit_id", value, { shouldValidate: true })} options={schoolUnits.filter((x) => x.is_active).map((x) => ({ value: x.id, label: x.name, description: x.code }))} error={form.formState.errors.school_unit_id?.message} />
      <SelectField label="Tipe Ruangan" value={form.watch("room_type")} onChange={(value) => form.setValue("room_type", value)} options={[{ value: "CLASSROOM", label: "Ruang Kelas" }, { value: "LAB", label: "Laboratorium" }, { value: "HALL", label: "Aula" }, { value: "OTHER", label: "Lainnya" }]} error={form.formState.errors.room_type?.message} />
      <TextField form={form} name="code" label="Kode Ruangan" placeholder="R-101" />
      <TextField form={form} name="name" label="Nama Ruangan" placeholder="Ruang 101" />
      <div className={premiumModalFieldClassName}><label className={premiumModalLabelClassName}>Kapasitas</label><Input type="number" min={1} className={inputClass} {...form.register("capacity", { valueAsNumber: true })} /><FieldError message={form.formState.errors.capacity?.message} /></div>
      <BooleanField control={form.control} name="is_active" label="Status" trueLabel="Aktif" falseLabel="Nonaktif" />
    </form>
  </PremiumModal>;
}

export function ScheduleOverrideModal({ open, item, schedules, rooms, teachers, pending, onOpenChange, onSubmit }: { open: boolean; item: AdminScheduleOverride | null; schedules: AdminSubjectScheduleOverview[]; rooms: AdminRoom[]; teachers: AdminTeacherProfile[]; pending: boolean; onOpenChange: (open: boolean) => void; onSubmit: (values: ScheduleOverrideFormValues) => void }) {
  const form = useForm<ScheduleOverrideFormValues>({ resolver: zodResolver(scheduleOverrideSchema), defaultValues: overrideValues(item) });
  useEffect(() => { if (open) form.reset(overrideValues(item)); }, [form, item, open]);
  const type = form.watch("override_type");
  return <PremiumModal open={open} onOpenChange={onOpenChange} icon={CalendarSync} title={item ? "Edit Perubahan Jadwal" : "Tambah Perubahan Jadwal"} description="Batalkan, pindahkan, ganti ruangan, atau tetapkan guru pengganti untuk satu tanggal." className="sm:!max-w-3xl" footer={<Footer formId="override-form" pending={pending} onCancel={() => onOpenChange(false)} />}>
    <form id="override-form" onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <SelectField label="Jadwal" value={form.watch("schedule_id")} onChange={(value) => form.setValue("schedule_id", value, { shouldValidate: true })} options={schedules.map((x) => ({ value: x.id, label: `${x.subject_code} · ${x.class_name}`, description: `${x.teacher_name} · ${x.hari} ${x.jam_mulai}-${x.jam_selesai}` }))} error={form.formState.errors.schedule_id?.message} />
      <SelectField label="Jenis Perubahan" value={type} onChange={(value) => form.setValue("override_type", value as ScheduleOverrideFormValues["override_type"])} options={[{ value: "CANCELLED", label: "Dibatalkan" }, { value: "RESCHEDULED", label: "Dijadwalkan Ulang" }, { value: "SUBSTITUTE", label: "Guru Pengganti" }, { value: "ROOM_CHANGED", label: "Ganti Ruangan" }]} error={form.formState.errors.override_type?.message} />
      <div className={premiumModalFieldClassName}><label className={premiumModalLabelClassName}>Tanggal Asal</label><Input type="date" className={inputClass} {...form.register("original_date")} /><FieldError message={form.formState.errors.original_date?.message} /></div>
      <SelectField label="Status" value={form.watch("status")} onChange={(value) => form.setValue("status", value as ScheduleOverrideFormValues["status"])} options={[{ value: "ACTIVE", label: "Aktif" }, { value: "APPLIED", label: "Sudah Diterapkan" }, { value: "CANCELLED", label: "Dibatalkan" }]} error={form.formState.errors.status?.message} />
      {type === "RESCHEDULED" ? <><div className={premiumModalFieldClassName}><label className={premiumModalLabelClassName}>Tanggal Pengganti</label><Input type="date" className={inputClass} {...form.register("replacement_date")} /><FieldError message={form.formState.errors.replacement_date?.message} /></div><div className="grid grid-cols-2 gap-3"><div className={premiumModalFieldClassName}><label className={premiumModalLabelClassName}>Mulai</label><Input type="time" className={inputClass} {...form.register("replacement_start_time")} /></div><div className={premiumModalFieldClassName}><label className={premiumModalLabelClassName}>Selesai</label><Input type="time" className={inputClass} {...form.register("replacement_end_time")} /></div></div></> : null}
      {type === "ROOM_CHANGED" ? <SelectField label="Ruangan Pengganti" value={form.watch("replacement_room_id")} onChange={(value) => form.setValue("replacement_room_id", value, { shouldValidate: true })} options={rooms.filter((x) => x.is_active).map((x) => ({ value: x.id, label: x.name, description: `${x.school_unit_code} · ${x.code}` }))} error={form.formState.errors.replacement_room_id?.message} /> : null}
      {type === "SUBSTITUTE" ? <SelectField label="Guru Pengganti" value={form.watch("substitute_teacher_id")} onChange={(value) => form.setValue("substitute_teacher_id", value, { shouldValidate: true })} options={teachers.filter((x) => x.is_active).map((x) => ({ value: x.id, label: x.name, description: x.username }))} error={form.formState.errors.substitute_teacher_id?.message} /> : null}
      <div className={`${premiumModalFieldClassName} sm:col-span-2`}><label className={premiumModalLabelClassName}>Alasan</label><Textarea className="min-h-24 rounded-[1.25rem] border-slate-200" {...form.register("reason")} /><FieldError message={form.formState.errors.reason?.message} /></div>
    </form>
  </PremiumModal>;
}

function SelectField({ label, value, onChange, options, error }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string; description?: string }[]; error?: string }) {
  return <div className={premiumModalFieldClassName}><label className={premiumModalLabelClassName}>{label}</label><RadixSelectField value={value} onValueChange={onChange} placeholder={`Pilih ${label.toLowerCase()}`} options={options} /><FieldError message={error} /></div>;
}

function BooleanField<T extends RoomFormValues>({ control, name, label, trueLabel, falseLabel }: { control: ReturnType<typeof useForm<T>>["control"]; name: "is_active"; label: string; trueLabel: string; falseLabel: string }) {
  return <div className={premiumModalFieldClassName}><label className={premiumModalLabelClassName}>{label}</label><Controller control={control} name={name as never} render={({ field }) => <RadixSelectField value={String(field.value)} onValueChange={(value) => field.onChange(value === "true")} placeholder="Pilih status" options={[{ ...booleanOptions[0], label: trueLabel }, { ...booleanOptions[1], label: falseLabel }]} />} /></div>;
}

function TextField({ form, name, label, placeholder }: { form: ReturnType<typeof useForm<RoomFormValues>>; name: "code" | "name"; label: string; placeholder: string }) {
  return <div className={premiumModalFieldClassName}><label className={premiumModalLabelClassName}>{label}</label><Input className={inputClass} placeholder={placeholder} {...form.register(name)} /><FieldError message={form.formState.errors[name]?.message} /></div>;
}

function roomValues(item: AdminRoom | null): RoomFormValues { return { school_unit_id: item?.school_unit_id ?? "", code: item?.code ?? "", name: item?.name ?? "", room_type: item?.room_type ?? "CLASSROOM", capacity: item?.capacity ?? 36, is_active: item?.is_active ?? true }; }
function overrideValues(item: AdminScheduleOverride | null): ScheduleOverrideFormValues { return { schedule_id: item?.schedule_id ?? "", original_date: item?.original_date ?? "", override_type: item?.override_type === "RESCHEDULED" || item?.override_type === "SUBSTITUTE" || item?.override_type === "ROOM_CHANGED" ? item.override_type : "CANCELLED", replacement_date: item?.replacement_date ?? "", replacement_start_time: item?.replacement_start_time ?? "", replacement_end_time: item?.replacement_end_time ?? "", replacement_room_id: item?.replacement_room_id ?? "", substitute_teacher_id: item?.substitute_teacher_id ?? "", reason: item?.reason ?? "", status: item?.status === "APPLIED" || item?.status === "CANCELLED" ? item.status : "ACTIVE" }; }
