/* oxlint-disable react/only-export-components -- This is the feature presentation API: a badge component shares its labels and display formatters. */

import { cn } from "@/lib/utils";
import type { SupportTicket, SupportTicketStatus } from "@/types/support";

export const supportStatusLabels: Record<SupportTicketStatus, string> = {
  OPEN: "Baru",
  WAITING_ADMIN: "Menunggu Admin",
  WAITING_USER: "Menunggu Balasanmu",
  RESOLVED: "Selesai",
  CLOSED: "Ditutup",
};

export const supportCategoryLabels = {
  PASSWORD_RECOVERY: "Lupa password",
  ACCOUNT_ACCESS: "Akses akun",
  ATTENDANCE: "Absensi",
  SCHEDULE: "Jadwal & kelas",
  TECHNICAL: "Kendala teknis",
  OTHER: "Lainnya",
} as const;

const supportDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function SupportStatusBadge({
  status,
  adminView = false,
  passwordResetStatus,
}: {
  status: SupportTicketStatus;
  adminView?: boolean;
  passwordResetStatus?: SupportTicket["password_reset"]["status"];
}) {
  const label =
    adminView &&
    status === "WAITING_USER" &&
    passwordResetStatus === "APPROVED"
      ? "Reset disetujui"
      : adminView && status === "WAITING_USER"
        ? "Menunggu Balasan Pengguna"
      : supportStatusLabels[status];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        status === "WAITING_ADMIN" &&
          "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200",
        (status === "OPEN" ||
          (status === "WAITING_USER" && passwordResetStatus !== "APPROVED")) &&
          "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950/50 dark:text-sky-200",
        status === "WAITING_USER" &&
          passwordResetStatus === "APPROVED" &&
          "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200",
        status === "RESOLVED" &&
          "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200",
        status === "CLOSED" &&
          "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",
      )}
    >
      {label}
    </span>
  );
}

export function SupportDecisionBadge() {
  return (
    <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-rose-300 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:border-rose-700 dark:bg-rose-950/50 dark:text-rose-200">
      Ditolak
    </span>
  );
}

export function formatSupportDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return supportDateFormatter.format(date);
}

export function formatSupportName(value?: string) {
  return (value ?? "")
    .trim()
    .toLocaleLowerCase("id-ID")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      word
        .split("-")
        .map((part) =>
          part
            ? `${part.charAt(0).toLocaleUpperCase("id-ID")}${part.slice(1)}`
            : part,
        )
        .join("-"),
    )
    .join(" ");
}

export function formatSupportSystemMessage(value?: string) {
  const message = (value ?? "").trim();
  if (
    message.startsWith("Admin telah mengonfirmasi permintaan.") &&
    message.includes("Kamu sekarang dapat membuat password baru")
  ) {
    return "Permintaan reset password telah dikonfirmasi. Password baru dapat dibuat melalui tombol yang tersedia pada tiket ini.";
  }
  return message;
}

export function formatSupportRequesterName(value?: string, portal?: string) {
  return portal === "student" ? formatSupportName(value) : (value ?? "").trim();
}
