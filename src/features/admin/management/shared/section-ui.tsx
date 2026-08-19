"use client";

import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import { ScrollableTabsWrapper } from "@/features/admin/dashboard/widgets/scrollable-tabs";
import { RadixSelectField } from "@/components/ui/radix-select";
import {
  premiumModalActionsClassName,
  premiumModalFieldClassName,
  premiumModalHelperClassName,
  premiumModalLabelClassName,
} from "@/components/modals/premium-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AsyncButton } from "@/components/ui/async-button";
import { TableSkeleton as DetailedTableSkeleton } from "@/components/loading/loading-system";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  PencilLine,
  Plus,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type ActionIconTone = "emerald" | "sky" | "rose" | "slate";

export function actionIconButtonClass(tone: ActionIconTone) {
  const toneClass = {
    emerald:
      "border-emerald-100 text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:!border-emerald-500/60 dark:!text-emerald-300 dark:hover:!border-emerald-400 dark:hover:!bg-emerald-950/60 dark:hover:!text-emerald-200",
    sky:
      "border-sky-100 text-sky-700 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 dark:!border-sky-500/60 dark:!text-sky-300 dark:hover:!border-sky-400 dark:hover:!bg-sky-950/60 dark:hover:!text-sky-200",
    rose:
      "border-rose-100 text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:!border-rose-500/60 dark:!text-rose-300 dark:hover:!border-rose-400 dark:hover:!bg-rose-950/60 dark:hover:!text-rose-200",
    slate:
      "border-slate-200 text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 dark:!border-slate-600 dark:!text-slate-300 dark:hover:!border-sky-500/60 dark:hover:!bg-sky-950/50 dark:hover:!text-sky-200",
  }[tone];

  return `size-10 rounded-full border bg-white transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-px hover:shadow-[0_10px_20px_rgba(15,23,42,0.08)] active:translate-y-0 active:scale-[0.94] active:duration-75 dark:bg-slate-800 dark:shadow-none ${toneClass}`;
}

export function ActionIconButton({
  tone,
  onClick,
  disabled,
  ariaLabel,
  children,
  className,
}: {
  tone: ActionIconTone;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(actionIconButtonClass(tone), className)}
      data-action-tone={tone}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </Button>
  );
}

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
      className={`flex h-14 cursor-text items-center gap-3 rounded-[24px] border border-slate-300/80 bg-white/84 px-4 shadow-[0_14px_28px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.92)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-emerald-400 focus-within:border-emerald-500 focus-within:shadow-[0_0_0_3px_rgba(16,185,129,0.2),0_16px_32px_rgba(15,23,42,0.08)] active:border-emerald-500 active:shadow-[0_0_0_3px_rgba(16,185,129,0.2),0_16px_32px_rgba(15,23,42,0.08)] dark:border-slate-600 dark:bg-slate-900/90 dark:shadow-none dark:hover:border-emerald-400 dark:hover:bg-slate-800 dark:focus-within:border-emerald-400 dark:focus-within:bg-slate-800 dark:focus-within:shadow-[0_0_0_3px_rgba(52,211,153,0.18)] dark:active:border-emerald-400 dark:active:bg-slate-800 ${className}`}
    >
      <span className="flex size-9 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#ffffff_0%,#f4faf7_100%)] text-slate-400 shadow-[0_8px_18px_rgba(15,23,42,0.06)] dark:bg-none dark:bg-slate-800 dark:text-slate-300 dark:shadow-none">
        <SlidersHorizontal className="size-4" />
      </span>
      <Search className="size-4 shrink-0 text-slate-400" />
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
      />
      <button
        type="button"
        aria-label="Hapus pencarian"
        title="Hapus pencarian"
        tabIndex={value ? 0 : -1}
        onClick={(event) => {
          event.stopPropagation();
          onChange("");
          inputRef.current?.focus();
        }}
        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-all duration-200 hover:bg-emerald-100 hover:text-emerald-700 focus-visible:bg-emerald-100 focus-visible:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 active:scale-90 dark:text-slate-400 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-200 dark:focus-visible:bg-emerald-950/60 dark:focus-visible:text-emerald-200 dark:focus-visible:ring-emerald-400/30 ${value ? "opacity-100" : "pointer-events-none opacity-0"}`}
        aria-hidden={!value}
      >
        <X className="size-4" />
      </button>
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
      className="h-14 rounded-[22px] border-emerald-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(238,252,245,0.98)_100%)] px-5 text-sm font-semibold text-emerald-900 shadow-[0_16px_30px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.96)] transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-px hover:border-emerald-300 hover:bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(228,250,239,1)_100%)] hover:text-emerald-950 hover:shadow-[0_20px_34px_rgba(16,185,129,0.12)] active:translate-y-0 active:scale-[0.96] active:bg-emerald-100 dark:border-emerald-700 dark:bg-slate-800 dark:text-emerald-200 dark:shadow-none dark:hover:border-emerald-500 dark:hover:bg-slate-700 dark:hover:text-emerald-100"
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
  className,
}: {
  isPending: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  className?: string;
}) {
  return (
    <div className={cn(premiumModalActionsClassName, className)}>
      <Button
        variant="outline"
        className="h-12 min-w-0 flex-1 rounded-[1.1rem] border-slate-200 px-3 text-sm font-semibold text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-200 hover:text-slate-950 hover:shadow-[0_14px_28px_rgba(15,23,42,0.14)] active:translate-y-0 active:scale-[0.96] active:bg-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:shadow-none dark:hover:border-slate-500 dark:hover:bg-slate-700 dark:hover:text-white dark:hover:shadow-none dark:active:bg-slate-700 sm:flex-none sm:px-5"
        onClick={onCancel}
        disabled={isPending}
      >
        Batal
      </Button>
      <AsyncButton
        data-modal-submit
        className="h-12 min-w-0 flex-1 rounded-[1.1rem] bg-emerald-700 px-3 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(22,101,52,0.2)] transition-all duration-200 hover:bg-emerald-800 active:scale-[0.96] active:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:active:bg-emerald-700 dark:shadow-none sm:flex-none sm:px-5"
        onClick={onSubmit}
        isPending={isPending}
        pendingLabel="Menyimpan..."
        icon={Save}
      >
        {submitLabel}
      </AsyncButton>
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
  mobileView,
  icon,
  emptyTitle,
  emptyDescription,
  isLoading,
  columnCount,
  isEmpty,
  pagination,
}: {
  children: ReactNode;
  mobileView?: ReactNode;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  isLoading: boolean;
  columnCount: number;
  isEmpty: boolean;
  pagination?: PaginationControls;
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-emerald-100/80 dark:border-slate-700">
      {isLoading ? (
        <div className="overflow-x-auto">
          <LoadingTable columnCount={columnCount} />
        </div>
      ) : isEmpty ? (
        <div className="p-5">
          <EmptyState
            icon={icon}
            title={emptyTitle}
            description={emptyDescription}
            compact
          />
        </div>
      ) : (
        <>
          <div
            className={
              mobileView ? "hidden overflow-x-auto md:block" : "overflow-x-auto"
            }
          >
            {children}
          </div>
          {mobileView ? <div className="md:hidden">{mobileView}</div> : null}
          {pagination ? <DataTablePagination {...pagination} /> : null}
        </>
      )}
    </div>
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
export function usePagination<T>(data: T[], initialPageSize = 25) {
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
    <div className="mx-2 mb-2 flex min-w-0 flex-col gap-3 rounded-[22px] border border-emerald-100/70 bg-[linear-gradient(180deg,#f6fbf8_0%,#edf7f1_100%)] px-3 py-3.5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:mx-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4 dark:border-slate-700 dark:bg-slate-900 dark:bg-none dark:shadow-none">
      <div className="flex items-center justify-center gap-2 sm:justify-start sm:gap-4">
        <div className="flex items-center gap-2.5 rounded-[18px] border border-emerald-100/80 bg-white px-3.5 py-2 shadow-[0_10px_22px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-slate-700 dark:bg-slate-800 dark:shadow-none">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Baris
          </span>
          <RowsPerPageSelect value={pageSize} onChange={setPageSize} />
        </div>

        <div className="flex items-center gap-4 rounded-[18px] border border-emerald-100/80 bg-white px-4 py-2 shadow-[0_10px_22px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-slate-700 dark:bg-slate-800 dark:shadow-none">
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Rentang
            </span>
            <span className="whitespace-nowrap text-sm font-bold text-slate-800 dark:text-slate-100">
              {totalItems === 0 ? "0" : `${rangeStart}–${rangeEnd}`}
            </span>
          </div>
          <span className="h-8 w-px bg-emerald-100" />
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Total
            </span>
            <span className="text-sm font-bold text-emerald-600">
              {totalItems}
            </span>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center gap-3 sm:w-auto">
        <span className="hidden whitespace-nowrap text-xs font-medium text-slate-400 sm:inline">
          Halaman <b className="font-semibold text-slate-700">{page}</b> dari{" "}
          <b className="font-semibold text-slate-700">{totalPages}</b>
        </span>

        <div className="flex w-full items-center justify-between gap-1 rounded-[16px] border border-emerald-100/80 bg-white p-1 shadow-[0_10px_22px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-slate-700 dark:bg-slate-800 dark:shadow-none sm:w-auto sm:justify-start">
          <PaginationNavButton
            onClick={() => setPage(1)}
            disabled={page <= 1}
            ariaLabel="Halaman pertama"
          >
            <ChevronsLeft className="size-4" />
          </PaginationNavButton>
          <PaginationNavButton
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            ariaLabel="Halaman sebelumnya"
          >
            <ChevronLeft className="size-4" />
          </PaginationNavButton>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-[linear-gradient(180deg,#10b981_0%,#0d9488_100%)] text-sm font-semibold text-white shadow-[0_10px_20px_rgba(16,185,129,0.32),inset_0_1px_0_rgba(255,255,255,0.35)]">
            {page}
          </span>
          <PaginationNavButton
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            ariaLabel="Halaman berikutnya"
          >
            <ChevronRight className="size-4" />
          </PaginationNavButton>
          <PaginationNavButton
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
            ariaLabel="Halaman terakhir"
          >
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
      className="flex size-9 flex-1 items-center justify-center rounded-[11px] text-emerald-700 transition-all duration-150 hover:bg-emerald-50 active:scale-90 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent disabled:active:scale-100 dark:text-emerald-300 dark:hover:bg-emerald-950/60 dark:disabled:text-slate-600 dark:disabled:hover:bg-transparent sm:flex-none"
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
    <RadixSelectField
      value={String(value)}
      onValueChange={(next) => onChange(Number(next))}
      placeholder="Baris"
      options={PAGE_SIZE_OPTIONS.map((size) => ({
        value: String(size),
        label: String(size),
      }))}
      triggerClassName="h-10 w-[5.25rem] min-w-[5.25rem] rounded-[14px] border-emerald-200/80 px-3.5 text-sm font-bold text-slate-800 dark:border-emerald-600/70 dark:text-slate-100"
      contentClassName="rounded-[1.15rem] p-1.5"
      hideIndicator
      itemClassName="justify-center text-center font-semibold hover:!border-emerald-400 hover:!bg-emerald-200 hover:!text-emerald-950 data-[highlighted]:!border-emerald-300 data-[highlighted]:!bg-emerald-100 data-[highlighted]:!text-emerald-950 data-[state=checked]:!border-emerald-400 data-[state=checked]:!bg-emerald-200 data-[state=checked]:!text-emerald-950 dark:hover:!border-emerald-600 dark:hover:!bg-emerald-950/70 dark:hover:!text-emerald-100 dark:data-[highlighted]:!border-emerald-600 dark:data-[highlighted]:!bg-emerald-950/60 dark:data-[highlighted]:!text-emerald-100 dark:data-[state=checked]:!border-emerald-600 dark:data-[state=checked]:!bg-emerald-950/75 dark:data-[state=checked]:!text-emerald-100"
    />
  );
}

export function LoadingTable({ columnCount }: { columnCount: number }) {
  return <DetailedTableSkeleton columns={columnCount} rows={6} embedded />;
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
    <tr className="bg-white dark:bg-slate-900">
      <td colSpan={colSpan} className="p-5">
        <EmptyState
          icon={icon}
          title={title}
          description={description}
          compact
        />
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
      <ActionIconButton tone="sky" onClick={onEdit} ariaLabel="Ubah data">
        <PencilLine className="size-4" />
      </ActionIconButton>
      <ActionIconButton
        tone="rose"
        onClick={onDelete}
        disabled={isDeletePending}
        ariaLabel="Hapus data"
      >
        <Trash2 className="size-4" />
      </ActionIconButton>
    </div>
  );
}

export function MobileDataList({ children }: { children: ReactNode }) {
  return <div className="space-y-3 bg-white/90 p-3 dark:bg-slate-900 md:hidden">{children}</div>;
}

export function MobileDataCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "rounded-[22px] border border-emerald-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,253,250,0.96)_100%)] p-4 shadow-[0_14px_32px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-800 dark:shadow-none",
        className,
      )}
    >
      {children}
    </article>
  );
}

export function MobileDataHeader({
  leading,
  title,
  subtitle,
  badge,
}: {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {leading ? <div className="shrink-0">{leading}</div> : null}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </div>
          {subtitle ? (
            <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
      {badge ? <div className="shrink-0">{badge}</div> : null}
    </div>
  );
}

export function MobileDataField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {Icon ? <Icon className="size-3" /> : null}
        {label}
      </div>
      <div className="min-w-0 text-right text-xs font-medium text-slate-700 dark:text-slate-200">
        {value}
      </div>
    </div>
  );
}

export function MobileDataSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-4 space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <div className="text-xs leading-5 text-slate-600">{children}</div>
    </div>
  );
}

export function MobileDataFooter({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 flex items-center justify-end gap-2 border-t border-emerald-50 pt-3">
      {children}
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
    <div className="group relative min-w-0 overflow-hidden rounded-[26px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,252,248,0.96)_100%)] p-3.5 shadow-[0_18px_34px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_54px_rgba(15,23,42,0.1)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-none dark:hover:shadow-none sm:p-4">
      <div className="absolute right-[-10px] top-[-26px] h-24 w-24 rounded-full bg-emerald-100/40 blur-2xl transition duration-300 group-hover:scale-110" />
      <div className="relative flex items-start justify-between gap-2.5 sm:gap-4">
        <div className="min-w-0 space-y-2">
          <p className="break-words text-[10px] font-semibold uppercase leading-[1.35] tracking-[0.14em] text-slate-400 sm:text-[12px] sm:tracking-[0.18em]">
            {label}
          </p>
          <p className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-100 sm:text-[2.15rem]">
            {value}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center text-right">
          <span
            className={`inline-flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br ${accentClass} text-white shadow-[0_14px_28px_rgba(15,23,42,0.16)] sm:size-12`}
          >
            <Icon className="size-4 sm:size-5" />
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
  "shrink-0 rounded-[18px] border border-slate-200/40 bg-white/50 px-5 py-3 text-slate-500 transition-transform duration-100 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 active:scale-[0.97] active:border-emerald-300 active:bg-emerald-50/70 active:shadow-[inset_0_0_0_1px_rgba(16,185,129,0.12)] active:duration-75 data-active:border-emerald-200 data-active:bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(236,253,245,0.98)_100%)] data-active:!text-emerald-950 data-active:shadow-none dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-emerald-600 dark:hover:bg-slate-800 dark:hover:text-emerald-200 dark:data-active:!border-emerald-600 dark:data-active:!bg-none dark:data-active:!bg-slate-800 dark:data-active:!text-emerald-100 xl:w-full";

export function SectionTabSwitch({
  tabs,
  hugContent = false,
}: {
  tabs: SectionTabItem[];
  hugContent?: boolean;
}) {
  const gridColsClass = TAB_GRID_COLS_CLASS[tabs.length] ?? "";
  return (
    <ScrollableTabsWrapper>
      <TabsList
        className={
          hugContent
            ? "h-full w-fit min-w-max gap-2 rounded-none bg-transparent p-0"
            : `h-full w-fit min-w-max gap-2 rounded-none bg-transparent p-0 xl:min-w-0 xl:grid xl:w-full ${gridColsClass}`
        }
      >
        {tabs.map(({ value, label, icon: Icon }) => (
          <TabsTrigger
            key={value}
            value={value}
            className={SECTION_TAB_TRIGGER_CLASS}
          >
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

export function DataTableHeadRow({
  labels,
  centerLabels = [],
}: {
  labels: string[];
  centerLabels?: string[];
}) {
  return (
    <thead className="bg-[linear-gradient(180deg,#eef8f2_0%,#e5f4eb_100%)] text-left text-slate-700 dark:bg-none dark:bg-slate-800 dark:text-slate-200">
      <tr>
        {labels.map((label) => (
          <th
            key={label}
            className={cn(
              "whitespace-nowrap px-5 py-4 font-semibold",
              (label === "Aksi" || centerLabels.includes(label)) &&
                "text-center",
            )}
          >
            {label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function DataTableBody({ children }: { children: ReactNode }) {
  return (
    <tbody className="divide-y divide-emerald-50 bg-white/92 dark:divide-slate-700 dark:bg-slate-900">{children}</tbody>
  );
}

export function DataTableRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr className={`transition-colors hover:bg-emerald-50/45 dark:hover:bg-slate-800 ${className}`}>
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
    <td
      colSpan={colSpan}
      className={cn("whitespace-nowrap px-5 py-4 text-slate-600 dark:text-slate-300", className)}
    >
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
