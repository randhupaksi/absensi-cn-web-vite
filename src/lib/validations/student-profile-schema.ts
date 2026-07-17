import { z } from "zod";

const exactDigits = (label: string) =>
  z.string().trim().regex(/^\d{10}$/, `${label} harus tepat 10 digit angka.`);

const validNIS = z.string().trim().regex(/^\d{8,10}$/, "NIS harus berupa angka yang valid.");

const baseStudentProfileSchema = z.object({
  name: z.string().trim().min(1, "Nama siswa wajib diisi."),
  nis: validNIS,
  nisn: exactDigits("NISN"),
  gender: z.enum(["MALE", "FEMALE"], { message: "Jenis kelamin wajib dipilih." }),
  class_id: z.string().trim().min(1, "Kelas wajib dipilih."),
  is_active: z.boolean(),
});

export const createStudentProfileSchema = baseStudentProfileSchema.extend({
  password: z.string().trim().min(1, "Password wajib diisi."),
});

export const editStudentProfileSchema = baseStudentProfileSchema.extend({
  password: z.string().trim(),
});

export type StudentProfileFormValues = z.infer<typeof createStudentProfileSchema>;
