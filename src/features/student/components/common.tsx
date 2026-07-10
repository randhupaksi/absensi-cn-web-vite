"use client";

import { Badge } from "@/components/ui/badge";
import { resolveApiAssetUrl } from "@/lib/config/site";
import { formatDisplayLabel } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { id as localeID } from "date-fns/locale";

export function formatStudentDate(value?: string) {
  if (!value) return "-";
  try {
    return format(parseISO(value), "dd MMMM yyyy", { locale: localeID });
  } catch {
    return value;
  }
}

export function formatStudentDateTime(value?: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatStudentTime(value?: string) {
  if (!value) return "-";
  try {
    return format(parseISO(value), "HH:mm 'WIB'", { locale: localeID });
  } catch {
    return value;
  }
}

export function formatClock(value?: string) {
  if (!value) return "-";
  return value.slice(0, 5);
}

export function studentAttachmentUrl(value?: string) {
  return resolveApiAssetUrl(value);
}

export function StudentStatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  let className = "border-slate-200 bg-slate-100 text-slate-600";

  if (normalized === "hadir") {
    className = "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (normalized === "telat") {
    className = "border-amber-200 bg-amber-50 text-amber-700";
  } else if (normalized === "alfa") {
    className = "border-rose-200 bg-rose-50 text-rose-700";
  } else if (normalized === "izin" || normalized === "sakit") {
    className = "border-sky-200 bg-sky-50 text-sky-700";
  }

  return <Badge className={className}>{formatDisplayLabel(status)}</Badge>;
}

export function StudentSubmissionPill({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  let className = "border-slate-200 bg-slate-100 text-slate-600";

  if (normalized === "menunggu") {
    className = "border-amber-200 bg-amber-50 text-amber-700";
  } else if (normalized === "diterima") {
    className = "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (normalized === "ditolak") {
    className = "border-rose-200 bg-rose-50 text-rose-700";
  } else if (normalized === "izin") {
    className = "border-sky-200 bg-sky-50 text-sky-700";
  } else if (normalized === "sakit") {
    className = "border-rose-200 bg-rose-50 text-rose-700";
  }

  return <Badge className={className}>{formatDisplayLabel(value)}</Badge>;
}
