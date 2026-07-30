import { PremiumModal, premiumModalFieldClassName, premiumModalLabelClassName } from "@/components/modals/premium-modal";
import { Button } from "@/components/ui/button";
import { AsyncButton } from "@/components/ui/async-button";
import { Calendar } from "@/components/ui/calendar";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadixSelectField } from "@/components/ui/radix-select";
import { Textarea } from "@/components/ui/textarea";
import { scheduleOverrideSchema, type ScheduleOverrideFormValues } from "@/lib/validations/academic-operations-schema";
import type { AdminScheduleOverride, AdminSubjectScheduleOverview, AdminTeacherProfile } from "@/types/admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { CalendarDays, CalendarSync, Save } from "lucide-react";
import { Controller, useForm, type Control } from "react-hook-form";
import { useEffect, useState } from "react";

const inputClass = "h-14 rounded-[1.25rem] border-slate-200/80 bg-white px-4 text-sm";

function Footer({ formId, pending, onCancel, submitLabel }: { formId: string; pending: boolean; onCancel: () => void; submitLabel: string }) {
  return <div className="flex flex-row items-center justify-between gap-3">
    <Button type="button" variant="outline" className="h-12 rounded-[1.1rem] px-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-200 hover:text-slate-950 hover:shadow-[0_14px_28px_rgba(15,23,42,0.14)] active:translate-y-0 active:scale-[0.96] active:bg-slate-300" onClick={onCancel} disabled={pending}>Batal</Button>
    <AsyncButton type="submit" form={formId} className="h-12 rounded-[1.1rem] bg-emerald-700 px-5 text-white shadow-[0_20px_40px_rgba(22,101,52,0.2)] transition-all duration-200 hover:bg-emerald-800 active:scale-[0.96] active:bg-emerald-900" isPending={pending} pendingLabel="Menyimpan..." icon={Save}>{submitLabel}</AsyncButton>
  </div>;
}

export function ScheduleOverrideModal({ open, item, schedules, teachers, pending, onOpenChange, onSubmit }: { open: boolean; item: AdminScheduleOverride | null; schedules: AdminSubjectScheduleOverview[]; teachers: AdminTeacherProfile[]; pending: boolean; onOpenChange: (open: boolean) => void; onSubmit: (values: ScheduleOverrideFormValues) => void }) {
  const form = useForm<ScheduleOverrideFormValues>({ resolver: zodResolver(scheduleOverrideSchema), defaultValues: overrideValues(item) });
  useEffect(() => { if (open) form.reset(overrideValues(item)); }, [form, item, open]);
  const type = form.watch("override_type");
  return <PremiumModal open={open} onOpenChange={onOpenChange} icon={CalendarSync} title={item ? "Ubah Perubahan Jadwal" : "Tambah Perubahan Jadwal"} description="Batalkan, jadwalkan ulang, atau tetapkan guru pengganti untuk satu tanggal." className="sm:!max-w-3xl" footer={<Footer formId="override-form" pending={pending} onCancel={() => onOpenChange(false)} submitLabel={item ? "Update Jadwal" : "Simpan Jadwal"} />}>
    <form id="override-form" onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <SelectField label="Jadwal" value={form.watch("schedule_id")} onChange={(value) => form.setValue("schedule_id", value, { shouldValidate: true })} options={schedules.map((x) => ({ value: x.id, label: `${x.subject_code} · ${x.class_name}`, description: `${x.teacher_name} · ${x.hari} ${x.jam_mulai}-${x.jam_selesai}` }))} error={form.formState.errors.schedule_id?.message} />
      <SelectField label="Jenis Perubahan" value={type} onChange={(value) => form.setValue("override_type", value as ScheduleOverrideFormValues["override_type"])} options={[{ value: "CANCELLED", label: "Dibatalkan" }, { value: "RESCHEDULED", label: "Dijadwalkan Ulang" }, { value: "SUBSTITUTE", label: "Guru Pengganti" }]} error={form.formState.errors.override_type?.message} />
      <DateField control={form.control} name="original_date" label="Tanggal Asal" error={form.formState.errors.original_date?.message} />
      <SelectField label="Status" value={form.watch("status")} onChange={(value) => form.setValue("status", value as ScheduleOverrideFormValues["status"])} options={[{ value: "ACTIVE", label: "Aktif" }, { value: "APPLIED", label: "Sudah Diterapkan" }, { value: "CANCELLED", label: "Dibatalkan" }]} error={form.formState.errors.status?.message} />
      {type === "RESCHEDULED" ? <><DateField control={form.control} name="replacement_date" label="Tanggal Pengganti" error={form.formState.errors.replacement_date?.message} /><div className="grid grid-cols-2 gap-3"><div className={premiumModalFieldClassName}><label className={premiumModalLabelClassName}>Mulai</label><Input type="time" className={inputClass} {...form.register("replacement_start_time")} /></div><div className={premiumModalFieldClassName}><label className={premiumModalLabelClassName}>Selesai</label><Input type="time" className={inputClass} {...form.register("replacement_end_time")} /></div></div></> : null}
      {type === "SUBSTITUTE" ? <SelectField label="Guru Pengganti" value={form.watch("substitute_teacher_id")} onChange={(value) => form.setValue("substitute_teacher_id", value, { shouldValidate: true })} options={teachers.filter((x) => x.is_active).map((x) => ({ value: x.id, label: x.name, description: x.username }))} error={form.formState.errors.substitute_teacher_id?.message} /> : null}
      <div className={`${premiumModalFieldClassName} sm:col-span-2`}><label className={premiumModalLabelClassName}>Alasan</label><Textarea className="min-h-24 rounded-[1.25rem] border-slate-200" placeholder="Jelaskan alasan perubahan jadwal ini…" {...form.register("reason")} /><FieldError message={form.formState.errors.reason?.message} /></div>
    </form>
  </PremiumModal>;
}

function SelectField({ label, value, onChange, options, error }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string; description?: string }[]; error?: string }) {
  const searchable = label.toLowerCase().includes("guru") || label.toLowerCase().includes("kelas");
  const searchPlaceholder = label.toLowerCase().includes("guru")
    ? "Cari nama atau username guru..."
    : label.toLowerCase().includes("kelas")
      ? "Cari kelas..."
      : "Cari data...";
  const emptyText = label.toLowerCase().includes("guru")
    ? "Guru tidak ditemukan."
    : label.toLowerCase().includes("kelas")
      ? "Kelas tidak ditemukan."
      : "Tidak ditemukan.";

  return <div className={premiumModalFieldClassName}><label className={premiumModalLabelClassName}>{label}</label><RadixSelectField value={value} onValueChange={onChange} placeholder={`Pilih ${label.toLowerCase()}`} searchable={searchable} searchPlaceholder={searchPlaceholder} emptyText={emptyText} options={options} /><FieldError message={error} /></div>;
}

function DateField({ control, name, label, error }: { control: Control<ScheduleOverrideFormValues>; name: "original_date" | "replacement_date"; label: string; error?: string }) {
  return (
    <div className={premiumModalFieldClassName}>
      <label className={premiumModalLabelClassName}>{label}</label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <DatePickerPopover
            value={field.value ? parseISO(field.value) : undefined}
            onChange={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
            placeholder={`Pilih ${label.toLowerCase()}`}
          />
        )}
      />
      <FieldError message={error} />
    </div>
  );
}

function DatePickerPopover({ value, onChange, placeholder }: { value: Date | undefined; onChange: (date: Date | undefined) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button type="button" variant="outline" />}
        className={`${inputClass} w-full justify-start`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-emerald-600" />
          <span className={`truncate ${value ? "text-slate-700" : "text-slate-400"}`}>
            {value ? format(value, "d MMM yyyy", { locale: localeID }) : placeholder}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent
        sideOffset={8}
        className="w-auto rounded-[24px] border border-emerald-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] p-4 shadow-[0_24px_54px_rgba(15,23,42,0.12)]"
      >
        <Calendar mode="single" selected={value} onSelect={(date) => { onChange(date); setOpen(false); }} locale={localeID} buttonVariant="ghost" />
      </PopoverContent>
    </Popover>
  );
}

function overrideValues(item: AdminScheduleOverride | null): ScheduleOverrideFormValues { return { schedule_id: item?.schedule_id ?? "", original_date: item?.original_date ?? "", override_type: item?.override_type === "RESCHEDULED" || item?.override_type === "SUBSTITUTE" ? item.override_type : "CANCELLED", replacement_date: item?.replacement_date ?? "", replacement_start_time: item?.replacement_start_time ?? "", replacement_end_time: item?.replacement_end_time ?? "", substitute_teacher_id: item?.substitute_teacher_id ?? "", reason: item?.reason ?? "", status: item?.status === "APPLIED" || item?.status === "CANCELLED" ? item.status : "ACTIVE" }; }
