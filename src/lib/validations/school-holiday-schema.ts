import { z } from "zod";

export const schoolHolidaySchema = z
  .object({
    name: z.string().trim().min(1, "Nama libur wajib diisi").max(150, "Maksimal 150 karakter"),
    holiday_type: z.enum(["NATIONAL", "COLLECTIVE_LEAVE", "SCHOOL"]),
    start_date: z.string().min(1, "Tanggal mulai wajib dipilih"),
    end_date: z.string().min(1, "Tanggal selesai wajib dipilih"),
    description: z.string().trim().max(1000, "Maksimal 1000 karakter"),
    is_active: z.boolean(),
  })
  .refine((value) => !value.start_date || !value.end_date || value.end_date >= value.start_date, {
    message: "Tanggal selesai harus sama atau setelah tanggal mulai",
    path: ["end_date"],
  });

export type SchoolHolidayFormValues = z.infer<typeof schoolHolidaySchema>;
