import { z } from "zod";

const baseTeacherProfileSchema = z.object({
  name: z.string().trim().min(1, "Nama guru wajib diisi."),
  username: z.string().trim().min(1, "Username login wajib diisi."),
  gender: z.enum(["MALE", "FEMALE"], { message: "Jenis kelamin wajib dipilih." }),
  is_active: z.boolean(),
});

export const createTeacherProfileSchema = baseTeacherProfileSchema.extend({
  password: z.string().trim().min(1, "Password wajib diisi."),
});

export const editTeacherProfileSchema = baseTeacherProfileSchema.extend({
  password: z.string().trim(),
});

export type TeacherProfileFormValues = z.infer<typeof createTeacherProfileSchema>;
