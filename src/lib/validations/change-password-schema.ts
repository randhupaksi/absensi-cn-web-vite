import { z } from "zod";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password awal wajib diisi."),
    newPassword: z.string().min(8, "Password baru minimal 8 karakter."),
    confirmation: z.string().min(1, "Konfirmasi password wajib diisi."),
  })
  .refine((values) => values.newPassword === values.confirmation, {
    path: ["confirmation"],
    message: "Konfirmasi password belum sama.",
  })
  .refine((values) => values.currentPassword !== values.newPassword, {
    path: ["newPassword"],
    message: "Password baru harus berbeda dari password awal.",
  });

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
