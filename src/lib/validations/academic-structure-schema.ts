import { z } from "zod";

export const PROGRAM_TYPES_BY_LEVEL = {
  SMP: ["GENERAL"],
  SMA: ["GENERAL", "SCIENCE", "SOCIAL"],
  SMK: ["VOCATIONAL"],
} as const;

export type AcademicProgramType =
  (typeof PROGRAM_TYPES_BY_LEVEL)[keyof typeof PROGRAM_TYPES_BY_LEVEL][number];

export function getProgramTypesForLevel(level: string): AcademicProgramType[] {
  return (
    PROGRAM_TYPES_BY_LEVEL[
      level.trim().toUpperCase() as keyof typeof PROGRAM_TYPES_BY_LEVEL
    ]?.slice() ?? []
  );
}

export function defaultProgramTypeForLevel(level: string): AcademicProgramType {
  return getProgramTypesForLevel(level)[0] ?? "GENERAL";
}

export function isClassPlacementAllowed(
  level: string,
  grade: string,
  programType: string,
) {
  const normalizedLevel = level.trim().toUpperCase();
  const normalizedGrade = grade.trim().toUpperCase();
  const normalizedProgramType = programType.trim().toUpperCase();
  const isKnownGrade =
    (normalizedLevel === "SMP" &&
      ["VII", "VIII", "IX"].includes(normalizedGrade)) ||
    (["SMA", "SMK"].includes(normalizedLevel) &&
      ["X", "XI", "XII"].includes(normalizedGrade));

  if (
    !isKnownGrade ||
    !getProgramTypesForLevel(normalizedLevel).includes(
      normalizedProgramType as AcademicProgramType,
    )
  ) {
    return false;
  }
  if (normalizedLevel === "SMA") {
    return normalizedGrade === "X"
      ? normalizedProgramType === "GENERAL"
      : normalizedProgramType !== "GENERAL";
  }
  return true;
}

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
