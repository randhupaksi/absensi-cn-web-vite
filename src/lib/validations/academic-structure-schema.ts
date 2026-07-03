import { z } from "zod";

export const schoolUnitSchema = z.object({
  code: z.string().trim().min(1, "Kode unit wajib diisi").max(20),
  name: z.string().trim().min(1, "Nama unit wajib diisi").max(150),
  education_level: z.string().trim().min(1, "Jenjang wajib dipilih"),
  is_active: z.boolean(),
});

export const programSchema = z.object({
  school_unit_id: z.string().min(1, "Unit sekolah wajib dipilih"),
  code: z.string().trim().min(1, "Kode program wajib diisi").max(30),
  name: z.string().trim().min(1, "Nama program wajib diisi").max(150),
  program_type: z.enum(["VOCATIONAL", "GENERAL", "SCIENCE", "SOCIAL"]),
  is_active: z.boolean(),
});

export type SchoolUnitFormValues = z.infer<typeof schoolUnitSchema>;
export type ProgramFormValues = z.infer<typeof programSchema>;
