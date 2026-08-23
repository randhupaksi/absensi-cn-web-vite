import { FileDown, FileSpreadsheet } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ExportImportAction = {
  onClick: () => void;
  label?: ReactNode;
  pending?: boolean;
  pendingLabel?: ReactNode;
  disabled?: boolean;
  hideOutline?: boolean;
};

type ExportImportActionsProps = {
  exportAction?: ExportImportAction;
  importAction?: ExportImportAction;
  className?: string;
};

export function ExportImportActions({
  exportAction,
  importAction,
  className,
}: ExportImportActionsProps) {
  if (!exportAction && !importAction) return null;

  return (
    <div
      className={cn(
        "flex flex-row gap-2 sm:flex-row sm:gap-3 lg:justify-end",
        className,
      )}
    >
      {exportAction ? (
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-14 min-w-0 flex-1 gap-1.5 rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(240,253,244,0.98)_100%)] px-2 text-[11px] font-semibold text-emerald-800 shadow-[0_16px_30px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.96)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(236,253,245,1)_100%)] hover:text-emerald-950 disabled:cursor-wait sm:flex-none sm:gap-2 sm:px-5 sm:text-sm",
            exportAction.hideOutline
              ? "!border-transparent hover:!border-transparent dark:!border-transparent"
              : "border-emerald-200/80 hover:border-emerald-300 dark:border-transparent dark:hover:border-transparent",
          )}
          onClick={exportAction.onClick}
          disabled={exportAction.disabled || exportAction.pending}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_10px_20px_rgba(5,150,105,0.2)] sm:size-8">
            <FileDown className="size-4" />
          </span>
          {exportAction.pending
            ? (exportAction.pendingLabel ?? "Membuat file...")
            : (exportAction.label ?? "Export")}
        </Button>
      ) : null}

      {importAction ? (
        <Button
          type="button"
          variant="outline"
          className="h-14 min-w-0 flex-1 gap-1.5 rounded-[22px] border-teal-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(240,253,250,0.98)_100%)] px-2 text-[11px] font-semibold text-teal-800 shadow-[0_16px_30px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.96)] hover:border-teal-300 hover:bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(230,252,248,1)_100%)] hover:text-teal-950 dark:border-transparent dark:hover:border-transparent disabled:cursor-wait sm:flex-none sm:gap-2 sm:px-5 sm:text-sm"
          onClick={importAction.onClick}
          disabled={importAction.disabled || importAction.pending}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white shadow-[0_10px_20px_rgba(13,148,136,0.2)] sm:size-8">
            <FileSpreadsheet className="size-4" />
          </span>
          {importAction.pending
            ? (importAction.pendingLabel ?? "Memproses...")
            : (importAction.label ?? "Import Excel")}
        </Button>
      ) : null}
    </div>
  );
}
