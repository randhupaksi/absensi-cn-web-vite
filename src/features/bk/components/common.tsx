"use client";

import { Badge } from "@/components/ui/badge";
import { resolveApiAssetUrl } from "@/lib/config/site";
import { formatDisplayLabel } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { TableSkeleton as DetailedTableSkeleton } from "@/components/loading/loading-system";

export const classFilterOptions = (classes: Array<{ class_id: string; class_name: string; school_unit_code?: string }>) => [
  { value: "Semua", label: "Semua kelas" },
  ...classes.map((item) => ({
    value: item.class_id,
    label: item.school_unit_code ? `[${item.school_unit_code}] ${item.class_name}` : item.class_name,
  })),
];

export function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "BK";
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

export function formatFriendlyDate(value?: string | Date) {
  if (!value) return "-";
  try {
    const date = value instanceof Date ? value : parseISO(value);
    return format(date, "dd MMMM yyyy", { locale: localeID });
  } catch {
    return String(value);
  }
}

export function formatDateTime(value?: string) {
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

export function formatCheckInTime(value?: string) {
  if (!value) return "Belum absen masuk";
  try {
    return format(parseISO(value), "HH:mm 'WIB'", { locale: localeID });
  } catch {
    return value;
  }
}

export function formatGender(gender?: string) {
  switch ((gender ?? "").toUpperCase()) {
    case "MALE":
    case "L":
      return "Laki-laki";
    case "FEMALE":
    case "P":
      return "Perempuan";
    default:
      return "-";
  }
}

export function AttendanceStatusPill({ status, compact = false }: { status: string; compact?: boolean }) {
  const normalized = status.toLowerCase();
  let className = "border-slate-200 bg-slate-100 text-slate-600";

  if (normalized === "hadir") {
    className = "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (normalized === "alfa") {
    className = "border-rose-200 bg-rose-50 text-rose-700";
  } else if (normalized === "izin") {
    className = "border-sky-200 bg-sky-50 text-sky-700";
  } else if (normalized === "sakit") {
    className = "border-violet-200 bg-violet-50 text-violet-700";
  }

  const compactLabel: Record<string, string> = { hadir: "H", izin: "I", sakit: "S", alfa: "A" };
  return (
    <Badge className={className} title={formatDisplayLabel(status)}>
      {compact ? compactLabel[normalized] ?? formatDisplayLabel(status) : formatDisplayLabel(status)}
    </Badge>
  );
}

export function SubmissionTypePill({ type }: { type: string }) {
  const normalized = type.toUpperCase() === "SAKIT" ? "SAKIT" : "IZIN";
  let className = "border-slate-200 bg-slate-100 text-slate-600";

  if (normalized === "IZIN") {
    className = "border-sky-200 bg-sky-50 text-sky-700";
  } else if (normalized === "SAKIT") {
    className = "border-rose-200 bg-rose-50 text-rose-700";
  }

  return <Badge className={className}>{formatDisplayLabel(normalized)}</Badge>;
}

export function SubmissionStatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase().trim();
  let className = "border-slate-200 bg-slate-100 text-slate-600";

  if (normalized === "menunggu" || normalized === "pending") {
    className = "border-amber-200 bg-amber-50 text-amber-700";
  } else if (normalized === "diterima" || normalized === "approved") {
    className = "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (normalized === "ditolak" || normalized === "rejected") {
    className = "border-rose-200 bg-rose-50 text-rose-700";
  }

  return <Badge className={className}>{formatDisplayLabel(status)}</Badge>;
}

export function ReviewStatusPill({ reviewed }: { reviewed: boolean }) {
  return (
    <Badge
      className={
        reviewed
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-500"
      }
    >
      {reviewed ? "Direview" : "Belum"}
    </Badge>
  );
}

export function normalizeAttachmentUrl(attachment: string) {
  return resolveApiAssetUrl(attachment);
}

export function isImageAttachment(attachment: string) {
  return /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(attachment);
}

export function openAttachment(attachment?: string) {
  if (!attachment || typeof window === "undefined") return;
  window.open(normalizeAttachmentUrl(attachment), "_blank", "noopener,noreferrer");
}

export function TableSkeleton({ columns, rows = 6 }: { columns: number; rows?: number }) {
  return <DetailedTableSkeleton columns={columns} rows={rows} embedded />;
}
