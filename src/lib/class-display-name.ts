type ClassDisplaySource = {
  display_name: string;
  class_type?: string | null;
};

/** Hide the default regular type while keeping plus classes explicit. */
export function getClassDisplayName(classItem: ClassDisplaySource) {
  const withoutRegular = classItem.display_name
    .replace(/\bREGULER\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (classItem.class_type?.toUpperCase() === "PLUS" && !/\bPLUS\b/i.test(withoutRegular)) {
    return `${withoutRegular} PLUS`;
  }

  return withoutRegular;
}
