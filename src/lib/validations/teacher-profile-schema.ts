import { z } from "zod";

const baseTeacherProfileSchema = z.object({
  name: z.string().trim().min(1, "Nama guru wajib diisi."),
  username: z.string().trim().min(1, "Username login wajib diisi."),
  gender: z.enum(["MALE", "FEMALE"], { message: "Jenis kelamin wajib dipilih." }),
  is_active: z.boolean(),
});

export const createTeacherProfileSchema = baseTeacherProfileSchema.extend({
  password: z.string().trim().min(6, "Password minimal 6 karakter."),
});

export const editTeacherProfileSchema = baseTeacherProfileSchema.extend({
  password: z.string().trim().refine((value) => value.length === 0 || value.length >= 6, {
    message: "Password minimal 6 karakter.",
  }),
});

export type TeacherProfileFormValues = z.infer<typeof createTeacherProfileSchema>;
