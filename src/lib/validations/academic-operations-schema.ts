import { z } from "zod";

export const scheduleOverrideSchema = z
  .object({
    schedule_id: z.string().min(1, "Jadwal wajib dipilih"),
    original_date: z.string().min(1, "Tanggal asal wajib diisi"),
    override_type: z.enum(["CANCELLED", "RESCHEDULED", "SUBSTITUTE"]),
    replacement_date: z.string(),
    replacement_start_time: z.string(),
    replacement_end_time: z.string(),
    substitute_teacher_id: z.string(),
    reason: z.string().trim().min(1, "Alasan wajib diisi"),
    status: z.enum(["ACTIVE", "CANCELLED", "APPLIED"]),
  })
  .superRefine((value, context) => {
    if (value.override_type === "RESCHEDULED") {
      if (!value.replacement_date)
        context.addIssue({
          code: "custom",
          path: ["replacement_date"],
          message: "Tanggal pengganti wajib diisi",
        });
      if (!value.replacement_start_time)
        context.addIssue({
          code: "custom",
          path: ["replacement_start_time"],
          message: "Jam mulai wajib diisi",
        });
      if (!value.replacement_end_time)
        context.addIssue({
          code: "custom",
          path: ["replacement_end_time"],
          message: "Jam selesai wajib diisi",
        });
    }
    if (value.override_type === "SUBSTITUTE" && !value.substitute_teacher_id)
      context.addIssue({
        code: "custom",
        path: ["substitute_teacher_id"],
        message: "Guru pengganti wajib dipilih",
      });
  });

export type ScheduleOverrideFormValues = z.infer<typeof scheduleOverrideSchema>;
