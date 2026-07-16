import { z } from "zod";

const scheduleSchema = z
  .object({
    hari: z.string().min(1, "Hari wajib dipilih"),
    jam_mulai: z.string().min(1, "Jam mulai wajib diisi"),
    jam_selesai: z.string().min(1, "Jam selesai wajib diisi"),
    room_id: z.string(),
    effective_from: z.string(),
    effective_until: z.string(),
    is_active: z.boolean(),
  })
  .refine((value) => value.jam_selesai > value.jam_mulai, {
    message: "Jam selesai harus lebih besar dari jam mulai",
    path: ["jam_selesai"],
  });

export const subjectSchema = z.object({
  code: z.string().trim().min(1, "Kode mapel wajib diisi").max(30, "Maksimal 30 karakter"),
  name: z.string().trim().min(1, "Nama mapel wajib diisi").max(150, "Maksimal 150 karakter"),
  group: z.string().trim().max(100, "Maksimal 100 karakter"),
  description: z.string().trim(),
  scope: z.enum(["ALL", "SMP", "SMA", "SMK"]),
  major_ids: z.array(z.string()),
  is_active: z.boolean(),
});

export const teachingAssignmentSchema = z.object({
  teacher_id: z.string().min(1, "Guru wajib dipilih"),
  subject_id: z.string().min(1, "Mapel wajib dipilih"),
  class_id: z.string().min(1, "Kelas wajib dipilih"),
  school_year_id: z.string().min(1, "Tahun ajaran wajib dipilih"),
  assignment_role: z.enum(["PRIMARY", "ASSISTANT", "SUBSTITUTE"]),
  is_primary: z.boolean(),
  effective_from: z.string(),
  effective_until: z.string(),
  is_active: z.boolean(),
  schedules: z.array(scheduleSchema).min(1, "Minimal satu jadwal mengajar wajib ditambahkan"),
});

export type SubjectFormValues = z.infer<typeof subjectSchema>;
export type TeachingAssignmentFormValues = z.infer<typeof teachingAssignmentSchema>;
