import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDisplayLabel(value: string) {
  const normalized = value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\p{L}/gu, (match) => match.toUpperCase())

  const localizedLabels: Record<string, string> = {
    Active: "Aktif",
    Inactive: "Nonaktif",
  }

  return localizedLabels[normalized] ?? normalized
}
