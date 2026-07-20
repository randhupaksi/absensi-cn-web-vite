"use client";

import { PremiumModal, premiumModalFieldClassName, premiumModalHelperClassName, premiumModalLabelClassName } from "@/components/modals/premium-modal";
import { FieldError } from "@/components/ui/field-error";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadixSelectField } from "@/components/ui/radix-select";
import { Textarea } from "@/components/ui/textarea";
import { ModalActions } from "@/features/admin/management/shared/section-ui";
import { jakartaDateKey } from "@/features/admin/management/holidays/date-utils";
import { schoolHolidaySchema, type SchoolHolidayFormValues } from "@/lib/validations/school-holiday-schema";
import type { AdminSchoolHoliday } from "@/types/admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useEffect } from "react";

const INPUT_CLASS = "h-14 rounded-[1.25rem] border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]";

const HOLIDAY_TYPE_OPTIONS = [
  { value: "NATIONAL", label: "Libur Nasional", description: "Hari libur resmi nasional" },
  { value: "COLLECTIVE_LEAVE", label: "Cuti Bersama", description: "Cuti bersama yang berlaku untuk sekolah" },
  { value: "SCHOOL", label: "Libur Sekolah", description: "Libur semester atau kebijakan internal" },
];

type SchoolHolidayFormModalProps = {
  item: AdminSchoolHoliday | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSubmit: (values: SchoolHolidayFormValues) => void;
};

export function SchoolHolidayFormModal({ item, open, onOpenChange, isPending, onSubmit }: SchoolHolidayFormModalProps) {
  const form = useForm<SchoolHolidayFormValues>({
    resolver: zodResolver(schoolHolidaySchema),
    defaultValues: holidayValues(item),
  });

  useEffect(() => {
    if (open) form.reset(holidayValues(item));
  }, [form, item, open]);

  return (
    <PremiumModal
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit Periode Libur" : "Tambah Periode Libur"}
      description="Tanggal aktif otomatis dikecualikan dari absensi, alfa, statistik, rekap, dan sesi mapel."
      icon={CalendarDays}
      className="sm:!max-w-2xl"
      footer={
        <ModalActions
          isPending={isPending}
          onCancel={() => onOpenChange(false)}
          onSubmit={() => void form.handleSubmit(onSubmit)()}
          submitLabel={item ? "Simpan Perubahan" : "Tambah Libur"}
        />
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className={premiumModalFieldClassName}>
          <label htmlFor="holiday-name" className={premiumModalLabelClassName}>Nama Libur</label>
          <Input
            id="holiday-name"
            className={INPUT_CLASS}
            placeholder="Contoh: Hari Kemerdekaan Republik Indonesia"
            aria-invalid={Boolean(form.formState.errors.name)}
            {...form.register("name")}
          />
          <FieldError message={form.formState.errors.name?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className={premiumModalFieldClassName}>
            <label className={premiumModalLabelClassName}>Kategori</label>
            <Controller
              control={form.control}
              name="holiday_type"
              render={({ field }) => (
                <RadixSelectField value={field.value} onValueChange={field.onChange} placeholder="Pilih kategori" options={HOLIDAY_TYPE_OPTIONS} />
              )}
            />
            <FieldError message={form.formState.errors.holiday_type?.message} />
          </div>
          <div className={premiumModalFieldClassName}>
            <label className={premiumModalLabelClassName}>Status Kebijakan</label>
            <Controller
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <RadixSelectField
                  value={String(field.value)}
                  onValueChange={(value) => field.onChange(value === "true")}
                  placeholder="Pilih status"
                  options={[
                    { value: "true", label: "Aktif", description: "Tanggal diperlakukan sebagai hari libur" },
                    { value: "false", label: "Nonaktif", description: "Disimpan tanpa memengaruhi absensi" },
                  ]}
                />
              )}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <CalendarDateField
                label="Tanggal Mulai"
                value={field.value}
                onChange={field.onChange}
                error={form.formState.errors.start_date?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <CalendarDateField
                label="Tanggal Selesai"
                value={field.value}
                onChange={field.onChange}
                minDate={form.watch("start_date")}
                error={form.formState.errors.end_date?.message}
              />
            )}
          />
        </div>

        <div className={premiumModalFieldClassName}>
          <label htmlFor="holiday-description" className={premiumModalLabelClassName}>Catatan <span className="font-normal text-slate-400">(opsional)</span></label>
          <p className={premiumModalHelperClassName}>Tambahkan dasar keputusan atau keterangan internal agar periode mudah dikenali.</p>
          <Textarea id="holiday-description" className="min-h-24 rounded-[1.25rem] border-slate-200/80 bg-white px-4 py-3" placeholder="Contoh: Berdasarkan kalender pendidikan tahun ajaran berjalan." {...form.register("description")} />
          <FieldError message={form.formState.errors.description?.message} />
        </div>
      </form>
    </PremiumModal>
  );
}

function CalendarDateField({
  label,
  value,
  onChange,
  minDate,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  error?: string;
}) {
  const selectedDate = value ? parseISO(value) : undefined;
  const minimumDate = minDate ? parseISO(minDate) : undefined;

  return (
    <div className={premiumModalFieldClassName}>
      <label className={premiumModalLabelClassName}>{label}</label>
      <Popover>
        <PopoverTrigger
          render={<Button type="button" variant="outline" />}
          className={`${INPUT_CLASS} w-full justify-between font-normal`}
          aria-label={label}
        >
          <span className={selectedDate ? "text-slate-700" : "text-slate-400"}>
            {selectedDate ? format(selectedDate, "dd/MM/yyyy") : `Pilih ${label.toLowerCase()}`}
          </span>
          <CalendarDays className="size-4 shrink-0 text-emerald-600" />
        </PopoverTrigger>
        <PopoverContent
          sideOffset={8}
          className="w-auto rounded-[24px] border border-emerald-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] p-3 shadow-[0_24px_54px_rgba(15,23,42,0.12)]"
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : "")}
            disabled={minimumDate ? { before: minimumDate } : undefined}
            locale={localeID}
            buttonVariant="ghost"
            captionLayout="dropdown"
            startMonth={new Date(new Date().getFullYear() - 5, 0)}
            endMonth={new Date(new Date().getFullYear() + 10, 11)}
          />
        </PopoverContent>
      </Popover>
      <FieldError message={error} />
    </div>
  );
}

function holidayValues(item: AdminSchoolHoliday | null): SchoolHolidayFormValues {
  const today = jakartaDateKey();
  return {
    name: item?.name ?? "",
    holiday_type: item?.holiday_type ?? "NATIONAL",
    start_date: item?.start_date ?? today,
    end_date: item?.end_date ?? today,
    description: item?.description ?? "",
    is_active: item?.is_active ?? true,
  };
}
