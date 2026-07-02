import { z } from "zod";

export const portalSchema = z.enum(["student", "staff"]);

export const loginSchema = z
  .object({
    portal: portalSchema,
    nis: z.string().optional(),
    username: z.string().optional(),
    password: z
      .string()
      .min(6, "Password minimal 6 karakter."),
  })
  .superRefine((values, ctx) => {
    if (values.portal === "student") {
      if (!values.nis || values.nis.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["nis"],
          message: "NIS wajib diisi.",
        });
      } else if (!/^\d{10}$/.test(values.nis.trim())) {
        ctx.addIssue({
          code: "custom",
          path: ["nis"],
          message: "NIS harus terdiri dari 10 digit angka.",
        });
      }
    }

    if (values.portal === "staff") {
      if (!values.username || values.username.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["username"],
          message: "Username wajib diisi.",
        });
      }
    }
  });

export type LoginSchema = z.infer<typeof loginSchema>;
export type PortalType = z.infer<typeof portalSchema>;
