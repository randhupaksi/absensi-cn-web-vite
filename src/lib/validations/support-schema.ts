import { z } from "zod";

export const publicSupportTicketSchema = z
  .object({
    portal: z.enum(["student", "staff"]),
    identifier: z.string().trim(),
    requester_name: z.string().trim().min(3, "Nama minimal 3 karakter").max(150),
    message: z
      .string()
      .trim()
      .min(20, "Ceritakan kendala minimal 20 karakter")
      .max(1500, "Pesan maksimal 1500 karakter"),
    acknowledged_risk: z
      .boolean()
      .refine((value) => value, "Konfirmasi keamanan wajib disetujui"),
  })
  .superRefine((value, context) => {
    if (value.portal === "student" && !/^\d{8,10}$/.test(value.identifier)) {
      context.addIssue({ code: "custom", path: ["identifier"], message: "NIS harus terdiri dari 8 sampai 10 digit" });
    }
    if (value.portal === "staff" && !/^[a-zA-Z0-9._-]{3,50}$/.test(value.identifier)) {
      context.addIssue({ code: "custom", path: ["identifier"], message: "Username staff belum valid" });
    }
  });

export type PublicSupportTicketForm = z.infer<typeof publicSupportTicketSchema>;

export const supportTicketSchema = z.object({
  category: z.enum(["PASSWORD_RECOVERY", "ACCOUNT_ACCESS", "TECHNICAL", "OTHER"]),
  subject: z.string().trim().min(5, "Judul minimal 5 karakter").max(180),
  message: z.string().trim().min(10, "Pesan minimal 10 karakter").max(1500),
});

export type SupportTicketForm = z.infer<typeof supportTicketSchema>;

export const resetPasswordSchema = z
  .object({
    new_password: z.string().trim().min(8, "Password minimal 8 karakter").max(72),
    confirm_password: z.string().trim(),
  })
  .refine((value) => value.new_password === value.confirm_password, {
    path: ["confirm_password"],
    message: "Konfirmasi password belum sama",
  });

export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
