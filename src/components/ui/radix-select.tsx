"use client";

import * as Select from "@radix-ui/react-select";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

const MAX_RENDERED_OPTIONS = 100;

type RadixSelectOption = {
  value: string;
  label: string;
  description?: string;
};

type RadixSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: RadixSelectOption[];
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  contentClassName?: string;
  triggerClassName?: string;
  hideIndicator?: boolean;
  itemClassName?: string;
};

export function RadixSelectField({
  value,
  onValueChange,
  placeholder,
  options,
  searchable = false,
  searchPlaceholder = "Cari data...",
  emptyText = "Tidak ditemukan.",
  className,
  contentClassName,
  triggerClassName,
  hideIndicator = false,
  itemClassName,
}: RadixSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleOptionCount, setVisibleOptionCount] = useState(MAX_RENDERED_OPTIONS);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const indexedOptions = useMemo(
    () => options.map((option) => ({ option, searchText: `${option.label} ${option.description ?? ""}`.toLowerCase() })),
    [options],
  );
  const filteredOptions = useMemo(
    () => (!searchable || normalizedQuery.length === 0
      ? indexedOptions
      : indexedOptions.filter((item) => item.searchText.includes(normalizedQuery))),
    [indexedOptions, normalizedQuery, searchable],
  );
  useEffect(() => {
    setVisibleOptionCount(MAX_RENDERED_OPTIONS);
  }, [normalizedQuery, options.length, open]);
  const renderedOptions = useMemo(
    () => filteredOptions.slice(0, visibleOptionCount),
    [filteredOptions, visibleOptionCount],
  );

  return (
    <Select.Root
      value={value}
      onValueChange={(nextValue) => {
        onValueChange(nextValue);
        setSearchQuery("");
      }}
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearchQuery("");
      }}
    >
      <Select.Trigger
        className={cn(
          "group flex h-14 w-full items-center justify-between rounded-[1.25rem] border border-slate-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-left text-sm font-medium text-slate-700 shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] outline-none transition-[border-color,box-shadow,background-color] hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_14px_30px_rgba(15,23,42,0.05)] focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-200/80 data-[state=open]:border-emerald-500 data-[state=open]:ring-4 data-[state=open]:ring-emerald-200/80 data-[placeholder]:text-slate-400",
          triggerClassName,
          className,
        )}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="text-slate-400 transition group-data-[state=open]:rotate-180">
          <ChevronDown className="size-4" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={8}
          className={cn(
            "z-[80] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[1.4rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(243,252,247,0.98)_100%)] p-2 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl",
            contentClassName,
          )}
        >
          {searchable ? (
            <div className="relative mb-1.5 shrink-0 px-1.5 pb-1 pt-1.5">
              <Search className="pointer-events-none absolute left-4.5 top-[calc(50%+1px)] size-4 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => event.stopPropagation()}
                placeholder={searchPlaceholder}
                className="h-11 w-full rounded-[1rem] border border-transparent bg-slate-50/90 pl-10 pr-3 text-sm text-slate-700 outline-none transition-[border-color,box-shadow,background-color] placeholder:text-slate-400 hover:border-emerald-300 hover:bg-emerald-50/60 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-200/70"
              />
            </div>
          ) : null}

          <Select.Viewport
            className="max-h-[280px] space-y-1 overscroll-contain"
            onScroll={(event) => {
              const viewport = event.currentTarget;
              if (viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 80) {
                setVisibleOptionCount((count) => Math.min(count + MAX_RENDERED_OPTIONS, filteredOptions.length));
              }
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-slate-400">
                {emptyText}
              </div>
            ) : null}
            {renderedOptions.map(({ option }) => (
              <SelectItem key={option.value} value={option.value} hideIndicator={hideIndicator} className={itemClassName}>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-700">{option.label}</p>
                  {option.description ? (
                    <p className="truncate text-xs text-slate-400">
                      {option.description}
                    </p>
                  ) : null}
                </div>
              </SelectItem>
            ))}
            {filteredOptions.length > renderedOptions.length ? (
              <p className="px-3 py-2 text-center text-xs text-slate-400">
                Menampilkan {renderedOptions.length} dari {filteredOptions.length}. Gulir untuk memuat lebih banyak.
              </p>
            ) : null}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

function SelectItem({
  value,
  children,
  hideIndicator,
  className,
}: {
  value: string;
  children: ReactNode;
  hideIndicator?: boolean;
  className?: string;
}) {
  const pointerStartedOnItem = useRef(false);

  return (
    <Select.Item
      value={value}
      onPointerDown={() => {
        pointerStartedOnItem.current = true;
      }}
      onPointerUpCapture={(event) => {
        if (!pointerStartedOnItem.current) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        window.setTimeout(() => {
          pointerStartedOnItem.current = false;
        }, 0);
      }}
      onPointerCancel={() => {
        pointerStartedOnItem.current = false;
      }}
      className={cn(
        "group/item relative flex cursor-pointer select-none items-start gap-3 rounded-[1rem] border border-transparent px-3 py-3 text-sm outline-none transition-[background-color,border-color,box-shadow,color] hover:!border-emerald-200 hover:!bg-emerald-100 hover:!text-emerald-950 hover:shadow-[0_8px_18px_rgba(16,185,129,0.16)] data-[highlighted]:border-transparent data-[highlighted]:bg-transparent data-[highlighted]:text-slate-700 data-[state=checked]:border-emerald-200 data-[state=checked]:bg-emerald-100 data-[state=checked]:text-emerald-950 data-[state=checked]:shadow-[inset_0_0_0_1px_rgba(16,185,129,0.08)]",
        className,
      )}
    >
      {hideIndicator ? null : (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-emerald-700 transition-colors group-hover/item:!border-emerald-300 group-hover/item:!bg-emerald-50 group-data-[state=checked]/item:border-emerald-300 group-data-[state=checked]/item:bg-emerald-50">
          <Check className="size-3.5 opacity-0 transition-opacity group-hover/item:opacity-100 group-data-[state=checked]/item:opacity-100" />
        </span>
      )}
      <Select.ItemText asChild>{children}</Select.ItemText>
    </Select.Item>
  );
}
