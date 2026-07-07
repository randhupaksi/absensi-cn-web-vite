"use client";

import { EmptyState } from "@/components/dashboard/admin/widgets/empty-state";
import { ScrollableTabsWrapper } from "@/components/dashboard/admin/widgets/scrollable-tabs";
import {
  premiumModalActionsClassName,
  premiumModalFieldClassName,
  premiumModalHelperClassName,
  premiumModalLabelClassName,
} from "@/components/modals/premium-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { PencilLine, Plus, Save, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useRef, type ReactNode } from "react";

export function SearchFilterBar({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={`flex h-14 cursor-text items-center gap-3 rounded-[24px] border border-slate-300/80 bg-white/84 px-4 shadow-[0_14px_28px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.92)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-emerald-400 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(236,253,245,0.98)_100%)] hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_16px_32px_rgba(15,23,42,0.07)] ${className}`}
    >
      <span className="flex size-9 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#ffffff_0%,#f4faf7_100%)] text-slate-400 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
        <SlidersHorizontal className="size-4" />
      </span>
      <Search className="size-4 shrink-0 text-slate-400" />
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full min-w-[180px] bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:min-w-[240px]"
      />
    </div>
  );
}

export function AddButton({
  label,
  onClick,
}: {
  label?: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      className="h-14 rounded-[22px] border-emerald-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(238,252,245,0.98)_100%)] px-5 text-sm font-semibold text-emerald-900 shadow-[0_16px_30px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.96)] hover:border-emerald-300 hover:bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(228,250,239,1)_100%)] hover:text-emerald-950"
      onClick={onClick}
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_10px_20px_rgba(16,185,129,0.18)]">
        <Plus className="size-4" />
      </span>
      {label ? `Tambah ${label}` : "Tambah"}
    </Button>
  );
}

export function ModalActions({
  isPending,
  onCancel,
  onSubmit,
  submitLabel,
}: {
  isPending: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  return (
    <div className={premiumModalActionsClassName}>
      <Button
        variant="outline"
        className="h-12 rounded-[1.1rem] border-slate-200 px-5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-200 hover:text-slate-950 hover:shadow-[0_14px_28px_rgba(15,23,42,0.14)] active:translate-y-0 active:scale-[0.96] active:bg-slate-300"
        onClick={onCancel}
        disabled={isPending}
      >
        Batal
      </Button>
      <Button
        className="h-12 rounded-[1.1rem] bg-emerald-700 px-5 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(22,101,52,0.2)] transition-all duration-200 hover:bg-emerald-800 active:scale-[0.96] active:bg-emerald-900"
        onClick={onSubmit}
        disabled={isPending}
      >
        <Save className="size-4" />
        {isPending ? "Menyimpan..." : submitLabel}
      </Button>
    </div>
  );
}

export function FieldGroup({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <div className={premiumModalFieldClassName}>
      <label className={premiumModalLabelClassName}>{label}</label>
      {helper ? <p className={premiumModalHelperClassName}>{helper}</p> : null}
      {children}
    </div>
  );
}

export function DataTableCard({
  children,
  icon,
  emptyTitle,
  emptyDescription,
  isLoading,
  columnCount,
  isEmpty,
}: {
  children: ReactNode;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  isLoading: boolean;
  columnCount: number;
  isEmpty: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.08, ease: "easeOut" }}
      className="overflow-hidden rounded-[24px] border border-emerald-100/80"
    >
      {isLoading ? (
        <div className="overflow-x-auto">
          <LoadingTable columnCount={columnCount} />
        </div>
      ) : isEmpty ? (
        <div className="p-5">
          <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} compact />
        </div>
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
    </motion.div>
  );
}

export function LoadingTable({ columnCount }: { columnCount: number }) {
  return (
    <div className="space-y-3 px-4 py-4">
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <div
          key={`loading-row-${rowIndex}`}
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(120px, 1fr))` }}
        >
          {Array.from({ length: columnCount }).map((__, cellIndex) => (
            <div
              key={`loading-cell-${rowIndex}-${cellIndex}`}
              className="h-4 animate-pulse rounded-full bg-slate-100"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyRow({
  colSpan,
  icon,
  title,
  description,
}: {
  colSpan: number;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <tr className="bg-white">
      <td colSpan={colSpan} className="p-5">
        <EmptyState icon={icon} title={title} description={description} compact />
      </td>
    </tr>
  );
}

export function ActionButtons({
  onEdit,
  onDelete,
  isDeletePending,
}: {
  onEdit: () => void;
  onDelete: () => void;
  isDeletePending?: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="icon-sm"
        className="rounded-[14px] border-emerald-200/80 bg-white text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
        onClick={onEdit}
      >
        <PencilLine className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        className="rounded-[14px] border-red-200/80 bg-white text-red-500 hover:border-red-300 hover:bg-red-50 hover:text-red-500"
        onClick={onDelete}
        disabled={isDeletePending}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accentClass,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  accentClass: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[26px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,252,248,0.96)_100%)] p-4 shadow-[0_18px_34px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_54px_rgba(15,23,42,0.1)]">
      <div className="absolute right-[-10px] top-[-26px] h-24 w-24 rounded-full bg-emerald-100/40 blur-2xl transition duration-300 group-hover:scale-110" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <p className="text-[2.15rem] font-semibold tracking-[-0.04em] text-slate-950">{value}</p>
        </div>
        <div className="flex shrink-0 flex-col items-center text-right">
          <span
            className={`inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accentClass} text-white shadow-[0_14px_28px_rgba(15,23,42,0.16)]`}
          >
            <Icon className="size-5" />
          </span>
        </div>
      </div>
    </div>
  );
}

export type SectionTabItem = {
  value: string;
  label: string;
  icon: LucideIcon;
};

const TAB_GRID_COLS_CLASS: Record<number, string> = {
  2: "xl:grid-cols-2",
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
  5: "xl:grid-cols-5",
};

const SECTION_TAB_TRIGGER_CLASS =
  "shrink-0 rounded-[18px] border border-slate-200/40 bg-white/50 px-5 py-3 text-slate-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 hover:shadow-[0_10px_20px_rgba(16,185,129,0.16)] data-active:border-emerald-200 data-active:bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(236,253,245,0.98)_100%)] data-active:text-emerald-900 data-active:shadow-none xl:w-full";

export function SectionTabSwitch({ tabs }: { tabs: SectionTabItem[] }) {
  const gridColsClass = TAB_GRID_COLS_CLASS[tabs.length] ?? "";
  return (
    <ScrollableTabsWrapper>
      <TabsList
        className={`h-auto w-fit min-w-max gap-2 rounded-none bg-transparent p-0 xl:min-w-0 xl:grid xl:w-full ${gridColsClass}`}
      >
        {tabs.map(({ value, label, icon: Icon }) => (
          <TabsTrigger key={value} value={value} className={SECTION_TAB_TRIGGER_CLASS}>
            <Icon className="size-4" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </ScrollableTabsWrapper>
  );
}

export function DataTable({ children }: { children: ReactNode }) {
  // No fixed table-layout and no forced column widths: columns size to their
  // content and the table can grow past the card width. DataTableCard wraps
  // this in an `overflow-x-auto` container, so wide tables scroll horizontally
  // instead of squeezing every column to fit.
  return <table className="w-max min-w-full text-sm">{children}</table>;
}

export function DataTableHeadRow({ labels }: { labels: string[] }) {
  return (
    <thead className="bg-[linear-gradient(180deg,#eef8f2_0%,#e5f4eb_100%)] text-left text-slate-700">
      <tr>
        {labels.map((label) => (
          <th
            key={label}
            className={cn("whitespace-nowrap px-5 py-4 font-semibold", label === "Aksi" && "text-center")}
          >
            {label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function DataTableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-emerald-50 bg-white/92">{children}</tbody>;
}

export function DataTableRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr className={`transition-colors hover:bg-emerald-50/45 ${className}`}>
      {children}
    </tr>
  );
}

export function DataTableCell({
  children,
  className = "",
  colSpan,
}: {
  children: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={cn("whitespace-nowrap px-5 py-4 text-slate-600", className)}>
      {children}
    </td>
  );
}

export function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-500"
      }
    >
      {isActive ? "Aktif" : "Nonaktif"}
    </Badge>
  );
}

export function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "G";
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}
