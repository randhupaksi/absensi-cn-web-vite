import { cn } from "@/lib/utils";
import { Check, FileSpreadsheet, FileText, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function QuestionBlock({
  icon: Icon,
  label,
  answered,
  children,
}: {
  icon: LucideIcon;
  label: string;
  answered?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.3rem] border p-4 transition-all duration-300",
        answered
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-slate-200 bg-slate-50/40",
      )}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full transition-all duration-300",
            answered
              ? "bg-emerald-600 text-white shadow-[0_4px_10px_rgba(5,150,105,0.28)]"
              : "bg-slate-100 text-slate-400",
          )}
        >
          <Icon className="size-3.5" />
        </span>
        <p className="text-[0.88rem] font-semibold text-slate-800">{label}</p>
      </div>
      {children}
    </div>
  );
}

export function ReportRadio({
  selected,
  label,
  badge,
  onClick,
}: {
  selected: boolean;
  label: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-[0.9rem] border px-4 py-3 text-left text-sm outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500/30",
        selected
          ? "border-emerald-300 bg-white text-emerald-900 shadow-[0_0_0_2px_rgba(5,150,105,0.12)]"
          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/40",
      )}
    >
      <span
        className={cn(
          "flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-all",
          selected ? "border-emerald-600 bg-emerald-600" : "border-slate-300 bg-white",
        )}
      >
        {selected && <span className="size-2 rounded-full bg-white" />}
      </span>
      <span className="flex-1 font-medium">{label}</span>
      {badge !== undefined && (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold",
            selected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export function ReportCheckbox({
  checked,
  onChange,
  label,
  badge,
  disabled,
}: {
  checked: boolean;
  onChange?: (value: boolean) => void;
  label: string;
  badge?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "flex items-center gap-3 rounded-[0.9rem] border px-4 py-3 text-left text-sm outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500/30",
        disabled
          ? "cursor-default border-emerald-200 bg-emerald-50/60 text-emerald-800"
          : checked
            ? "border-emerald-300 bg-white text-emerald-900 shadow-[0_0_0_2px_rgba(5,150,105,0.10)]"
            : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/30",
      )}
    >
      <span
        className={cn(
          "flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border-2 transition-all",
          checked ? "border-emerald-600 bg-emerald-600" : "border-slate-300 bg-white",
        )}
      >
        {checked && <Check className="size-3 text-white" />}
      </span>
      <span className="flex-1 font-medium">{label}</span>
      {badge && (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-400">
          {badge}
        </span>
      )}
    </button>
  );
}

export type ReportFormat = "pdf" | "excel";

export function ReportFormatQuestion({
  value,
  onChange,
}: {
  value: ReportFormat | null;
  onChange: (value: ReportFormat) => void;
}) {
  return (
    <QuestionBlock icon={value === "excel" ? FileSpreadsheet : FileText} label="Pilih format laporan" answered={value !== null}>
      <div className="grid gap-2 sm:grid-cols-2">
        <ReportRadio
          selected={value === "pdf"}
          label="PDF - siap baca & cetak"
          onClick={() => onChange("pdf")}
        />
        <ReportRadio
          selected={value === "excel"}
          label="Excel - siap olah & rekap"
          onClick={() => onChange("excel")}
        />
      </div>
    </QuestionBlock>
  );
}
