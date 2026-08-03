/** Formats a person's display name without changing the stored/API value. */
export function formatPersonName(name?: string | null) {
  if (!name) return "";
  return name
    .trim()
    .toLocaleLowerCase("id-ID")
    .split(/\s+/)
    .map((part) => part ? `${part.charAt(0).toLocaleUpperCase("id-ID")}${part.slice(1)}` : part)
    .join(" ");
}
