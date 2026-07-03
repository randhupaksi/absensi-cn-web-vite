import { z } from "zod";

export const subjectOfferingSchema = z.object({
  subject_id: z.string().min(1, "Mapel wajib dipilih"),
  class_id: z.string().min(1, "Kelas wajib dipilih"),
  school_year_id: z.string().min(1, "Tahun ajaran wajib dipilih"),
  weekly_hours: z.number().int().min(1, "Minimal 1 JP per minggu"),
  is_required: z.boolean(),
  is_active: z.boolean(),
});

export const roomSchema = z.object({
  school_unit_id: z.string().min(1, "Unit sekolah wajib dipilih"),
  code: z.string().trim().min(1, "Kode ruangan wajib diisi").max(30),
  name: z.string().trim().min(1, "Nama ruangan wajib diisi").max(150),
  room_type: z.string().trim().min(1, "Tipe ruangan wajib dipilih"),
  capacity: z.number().int().min(1, "Kapasitas minimal 1"),
  is_active: z.boolean(),
});

export const scheduleOverrideSchema = z.object({
  schedule_id: z.string().min(1, "Jadwal wajib dipilih"),
  original_date: z.string().min(1, "Tanggal asal wajib diisi"),
  override_type: z.enum(["CANCELLED", "RESCHEDULED", "SUBSTITUTE", "ROOM_CHANGED"]),
  replacement_date: z.string(),
  replacement_start_time: z.string(),
  replacement_end_time: z.string(),
  replacement_room_id: z.string(),
  substitute_teacher_id: z.string(),
  reason: z.string().trim().min(1, "Alasan wajib diisi"),
  status: z.enum(["ACTIVE", "CANCELLED", "APPLIED"]),
}).superRefine((value, context) => {
  if (value.override_type === "RESCHEDULED") {
    if (!value.replacement_date) context.addIssue({ code: "custom", path: ["replacement_date"], message: "Tanggal pengganti wajib diisi" });
    if (!value.replacement_start_time) context.addIssue({ code: "custom", path: ["replacement_start_time"], message: "Jam mulai wajib diisi" });
    if (!value.replacement_end_time) context.addIssue({ code: "custom", path: ["replacement_end_time"], message: "Jam selesai wajib diisi" });
  }
  if (value.override_type === "ROOM_CHANGED" && !value.replacement_room_id) context.addIssue({ code: "custom", path: ["replacement_room_id"], message: "Ruangan pengganti wajib dipilih" });
  if (value.override_type === "SUBSTITUTE" && !value.substitute_teacher_id) context.addIssue({ code: "custom", path: ["substitute_teacher_id"], message: "Guru pengganti wajib dipilih" });
});

export type SubjectOfferingFormValues = z.infer<typeof subjectOfferingSchema>;
export type RoomFormValues = z.infer<typeof roomSchema>;
export type ScheduleOverrideFormValues = z.infer<typeof scheduleOverrideSchema>;
