import { downloadBlob } from "@/lib/download-file";
import { getClassDisplayName } from "@/lib/class-display-name";
import { createStudentRosterXlsx, type StudentRosterExcelClass } from "@/lib/reports/light-xlsx-writer";
import type { AdminClass, AdminStudent, AdminStudentClassMembership } from "@/types/admin";

const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type StudentRosterExportInput = {
  students: AdminStudent[];
  memberships: AdminStudentClassMembership[];
  classes: AdminClass[];
  allowedClassIds?: Set<string>;
};

export async function exportStudentRosterExcel({
  students,
  memberships,
  classes,
  allowedClassIds,
}: StudentRosterExportInput) {
  const studentsById = new Map(students.map((student) => [student.id, student]));
  const activeMembershipsByClass = new Map<string, AdminStudentClassMembership[]>();

  memberships
    .filter((membership) => membership.is_active && (!allowedClassIds || allowedClassIds.has(membership.class_id)))
    .forEach((membership) => {
      const items = activeMembershipsByClass.get(membership.class_id) ?? [];
      items.push(membership);
      activeMembershipsByClass.set(membership.class_id, items);
    });

  const classRows = classes
    .filter((classItem) => classItem.is_active && (!allowedClassIds || allowedClassIds.has(classItem.id)))
    .sort(compareClassesForRoster)
    .map((classItem) => {
      const rows = (activeMembershipsByClass.get(classItem.id) ?? [])
        .map((membership) => {
          const student = studentsById.get(membership.student_id);
          if (!student) return undefined;
          return {
            name: student.name,
            nis: student.nis,
            nisn: student.nisn,
            gender: student.gender,
            isActive: student.is_active,
            joinedAt: membership.joined_at,
          };
        })
        .filter((student): student is NonNullable<typeof student> => Boolean(student))
        .sort((left, right) => left.name.localeCompare(right.name, "id", { sensitivity: "base" }));

      return {
        className: getClassDisplayName(classItem),
        schoolYearName: classItem.school_year_name,
        gradeLabel: formatRosterGrade(classItem.grade),
        majorCode: classItem.major_code,
        majorName: classItem.major_name,
        schoolUnitCode: classItem.school_unit_code,
        rows,
      };
    });

  const sheetsByMajor = new Map<string, {
    gradeLabel: string;
    majorCode: string;
    majorName: string;
    classes: StudentRosterExcelClass[];
  }>();

  classRows.forEach((classRow) => {
    const key = `${classRow.schoolUnitCode}:${classRow.gradeLabel}:${classRow.majorCode}`;
    const sheet = sheetsByMajor.get(key) ?? {
      gradeLabel: classRow.gradeLabel,
      majorCode: classRow.majorCode,
      majorName: classRow.majorName,
      classes: [],
    };
    sheet.classes.push({
      className: classRow.className,
      schoolYearName: classRow.schoolYearName,
      rows: classRow.rows,
    });
    sheetsByMajor.set(key, sheet);
  });

  const majorSheets = [...sheetsByMajor.values()].sort((left, right) =>
    Number(left.gradeLabel) - Number(right.gradeLabel)
    || left.majorCode.localeCompare(right.majorCode, "id"),
  );

  const buffer = createStudentRosterXlsx({
    title: "Data Siswa Per Tingkat dan Jurusan",
    subtitle: "Sekolah Citra Negara - Sistem Informasi Absensi Sekolah",
    sheets: majorSheets,
    footerLabel: "ABSENSI CN - Data siswa per tingkat dan jurusan",
  });
  const blob = new Blob([buffer], { type: MIME_XLSX });
  downloadBlob(blob, `Data-Siswa-Per-Tingkat-dan-Jurusan-${new Date().toISOString().slice(0, 10)}.xlsx`);

  return majorSheets.length;
}

function compareClassesForRoster(left: AdminClass, right: AdminClass) {
  return left.school_year_name.localeCompare(right.school_year_name, "id", { numeric: true })
    || left.school_unit_code.localeCompare(right.school_unit_code, "id")
    || left.grade.localeCompare(right.grade, "id", { numeric: true })
    || left.major_code.localeCompare(right.major_code, "id")
    || left.name.localeCompare(right.name, "id", { numeric: true });
}

function formatRosterGrade(grade: string) {
  return ({ X: "10", XI: "11", XII: "12" } as Record<string, string>)[grade.toUpperCase()] ?? grade;
}
