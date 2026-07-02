import { z } from "zod";

const exactDigits = (label: string) =>
  z.string().trim().regex(/^\d{10}$/, `${label} harus tepat 10 digit angka.`);

const baseStudentProfileSchema = z.object({
  name: z.string().trim().min(1, "Nama siswa wajib diisi."),
  nis: exactDigits("NIS"),
  nisn: exactDigits("NISN"),
  gender: z.enum(["MALE", "FEMALE"], { message: "Jenis kelamin wajib dipilih." }),
  class_id: z.string().trim().min(1, "Kelas wajib dipilih."),
  is_active: z.boolean(),
});

export const createStudentProfileSchema = baseStudentProfileSchema.extend({
  password: z.string().trim().min(6, "Password minimal 6 karakter."),
});

export const editStudentProfileSchema = baseStudentProfileSchema.extend({
  password: z.string().trim().refine((value) => value.length === 0 || value.length >= 6, {
    message: "Password minimal 6 karakter.",
  }),
});

export type StudentProfileFormValues = z.infer<typeof createStudentProfileSchema>;
