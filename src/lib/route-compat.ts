const legacyStudentRoutePrefix = "/dashboard/siswa";
const canonicalStudentRoutePrefix = "/dashboard/student";

export function normalizeAppRoute(value: string) {
  return value.replace(
    new RegExp(`^${legacyStudentRoutePrefix}(?=/|$)`),
    canonicalStudentRoutePrefix,
  );
}
