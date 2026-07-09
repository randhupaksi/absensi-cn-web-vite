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
import * as Select from "@radix-ui/react-select";
import type { LucideIcon } from "lucide-react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, PencilLine, Plus, Save, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

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
  pagination,
}: {
  children: ReactNode;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  isLoading: boolean;
  columnCount: number;
  isEmpty: boolean;
  pagination?: PaginationControls;
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
        <>
          <div className="overflow-x-auto">{children}</div>
          {pagination ? <DataTablePagination {...pagination} /> : null}
        </>
      )}
    </motion.div>
  );
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export type PaginationControls = {
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalItems: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
};

/**
 * Client-side pagination for the DataTable primitives. Slices `data` for the
 * caller to render; page auto-clamps to the last valid page whenever the
 * (filtered) data set shrinks, e.g. after a search/status filter changes.
 */
export function usePagination<T>(data: T[], initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, safePage, pageSize]);

  const rangeStart = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, totalItems);

  return {
    pageItems,
    pagination: {
      page: safePage,
      setPage,
      pageSize,
      setPageSize: (size: number) => {
        setPageSize(size);
        setPage(1);
      },
      totalItems,
      totalPages,
      rangeStart,
      rangeEnd,
    } satisfies PaginationControls,
  };
}

export function DataTablePagination({
  page,
  setPage,
  pageSize,
  setPageSize,
  totalItems,
  totalPages,
  rangeStart,
  rangeEnd,
}: PaginationControls) {
  return (
    <div className="flex flex-col gap-3 border-t border-emerald-100/70 bg-[linear-gradient(180deg,#f6fbf8_0%,#edf7f1_100%)] px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2.5 rounded-[18px] border border-emerald-100/80 bg-white px-3.5 py-2 shadow-[0_10px_22px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.9)]">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Baris</span>
          <RowsPerPageSelect value={pageSize} onChange={setPageSize} />
        </div>

        <div className="flex items-center gap-4 rounded-[18px] border border-emerald-100/80 bg-white px-4 py-2 shadow-[0_10px_22px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.9)]">
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Rentang</span>
            <span className="whitespace-nowrap text-sm font-bold text-slate-800">
              {totalItems === 0 ? "0" : `${rangeStart}–${rangeEnd}`}
            </span>
          </div>
          <span className="h-8 w-px bg-emerald-100" />
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Total</span>
            <span className="text-sm font-bold text-emerald-600">{totalItems}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden whitespace-nowrap text-xs font-medium text-slate-400 sm:inline">
          Halaman <b className="font-semibold text-slate-700">{page}</b> dari{" "}
          <b className="font-semibold text-slate-700">{totalPages}</b>
        </span>

        <div className="flex items-center gap-1 rounded-[16px] border border-emerald-100/80 bg-white p-1 shadow-[0_10px_22px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.9)]">
          <PaginationNavButton onClick={() => setPage(1)} disabled={page <= 1} ariaLabel="Halaman pertama">
            <ChevronsLeft className="size-4" />
          </PaginationNavButton>
          <PaginationNavButton onClick={() => setPage(page - 1)} disabled={page <= 1} ariaLabel="Halaman sebelumnya">
            <ChevronLeft className="size-4" />
          </PaginationNavButton>
          <span className="flex size-9 items-center justify-center rounded-[12px] bg-[linear-gradient(180deg,#10b981_0%,#0d9488_100%)] text-sm font-semibold text-white shadow-[0_10px_20px_rgba(16,185,129,0.32),inset_0_1px_0_rgba(255,255,255,0.35)]">
            {page}
          </span>
          <PaginationNavButton onClick={() => setPage(page + 1)} disabled={page >= totalPages} ariaLabel="Halaman berikutnya">
            <ChevronRight className="size-4" />
          </PaginationNavButton>
          <PaginationNavButton onClick={() => setPage(totalPages)} disabled={page >= totalPages} ariaLabel="Halaman terakhir">
            <ChevronsRight className="size-4" />
          </PaginationNavButton>
        </div>
      </div>
    </div>
  );
}

function PaginationNavButton({
  children,
  disabled,
  onClick,
  ariaLabel,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className="flex size-9 items-center justify-center rounded-[11px] text-emerald-700 transition-all duration-150 hover:bg-emerald-50 active:scale-90 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent disabled:active:scale-100"
    >
      {children}
    </button>
  );
}

function RowsPerPageSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (size: number) => void;
}) {
  return (
    <Select.Root value={String(value)} onValueChange={(next) => onChange(Number(next))}>
      <Select.Trigger className="group flex h-10 min-w-[4.5rem] items-center justify-between gap-2 rounded-[14px] border border-emerald-200/80 bg-white px-3.5 text-sm font-bold text-slate-800 shadow-[0_10px_22px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition hover:border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200/70 data-[state=open]:border-emerald-400 data-[state=open]:ring-4 data-[state=open]:ring-emerald-200/70">
        <Select.Value />
        <Select.Icon className="text-emerald-600 transition-transform duration-200 group-data-[state=open]:rotate-180">
          <ChevronDown className="size-3.5" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={8}
          className="z-[80] w-fit overflow-hidden rounded-[1.15rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(243,252,247,0.99)_100%)] p-1.5 shadow-[0_28px_64px_rgba(15,23,42,0.18)] backdrop-blur-xl"
        >
          <Select.Viewport className="space-y-0.5">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <Select.Item
                key={size}
                value={String(size)}
                className="group/row-option relative flex cursor-pointer select-none items-center gap-3 rounded-[0.85rem] px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none transition data-[highlighted]:bg-emerald-50 data-[state=checked]:bg-emerald-100/70 data-[state=checked]:text-emerald-800"
              >
                <Select.ItemText>{size}</Select.ItemText>
                <Check className="size-4 shrink-0 text-emerald-600 opacity-0 group-data-[state=checked]/row-option:opacity-100" />
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
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
