/* oxlint-disable react/only-export-components -- This feature module intentionally exports its component and reusable status predicate together. */

import { RefreshCw } from "lucide-react";
import type { StaffAttendanceRecord } from "@/types/staff";
import { formatDisplayLabel } from "@/lib/utils";

export function AttendanceStatusChangeNotice({
  record,
  compact = false,
}: {
  record: StaffAttendanceRecord;
  compact?: boolean;
}) {
  const statusChanged = hasAttendanceStatusChange(record);
  const previousStatus = record.previous_status || "";
  if (!statusChanged || !previousStatus) return null;

  const actor = record.status_changed_by
    ? ` oleh ${record.status_changed_by}`
    : "";
  const role = record.status_changed_by_role
    ? ` (${formatDisplayLabel(record.status_changed_by_role)})`
    : "";

  return (
    <div
      className={
        compact
          ? "ml-auto flex w-max max-w-full min-w-0 items-center justify-end gap-1.5 text-right text-[0.68rem] font-medium text-amber-700 dark:text-amber-300"
          : "flex items-start gap-2.5 rounded-[1rem] border border-amber-200/80 bg-amber-50/75 px-3 py-2.5 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/35 dark:text-amber-200"
      }
    >
      <RefreshCw className={compact ? "mt-0.5 size-3.5" : "mt-0.5 size-4"} />
      <div className="min-w-0">
        <p className="font-semibold">
          {compact ? "Status diperbarui" : "Status absensi diperbarui"}
        </p>
        {!compact ? (
          <p className="mt-0.5 text-xs leading-5 opacity-85">
            {formatDisplayLabel(previousStatus)} → {formatDisplayLabel(record.status)}
            {actor}
            {role}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function hasAttendanceStatusChange(record: StaffAttendanceRecord) {
  return Boolean(record.status_changed);
}
