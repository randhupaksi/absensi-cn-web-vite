"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { ChevronDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type ComboboxOption = {
  value: string;
  label: string;
  description?: string;
};

type ComboboxFieldProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  options: ComboboxOption[];
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  triggerClassName?: string;
};

const MAX_RENDERED_OPTIONS = 100;
const NO_COMBOBOX_HIGHLIGHT = "__no_combobox_highlight__";

export function ComboboxField({
  value,
  onValueChange,
  placeholder,
  searchPlaceholder = "Cari data...",
  emptyText = "Tidak ditemukan.",
  options,
  disabled = false,
  className,
  contentClassName,
  triggerClassName,
}: ComboboxFieldProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [highlightedValue, setHighlightedValue] = React.useState("");
  const [visibleOptionCount, setVisibleOptionCount] =
    React.useState(MAX_RENDERED_OPTIONS);
  const selected = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );
  const indexedOptions = React.useMemo(
    () =>
      options.map((option) => ({
        option,
        searchText: `${option.label} ${option.description ?? ""}`.toLowerCase(),
      })),
    [options],
  );
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredOptions = React.useMemo(
    () =>
      normalizedQuery.length === 0
        ? indexedOptions
        : indexedOptions.filter((item) =>
            item.searchText.includes(normalizedQuery),
          ),
    [indexedOptions, normalizedQuery],
  );
  React.useEffect(() => {
    setVisibleOptionCount(MAX_RENDERED_OPTIONS);
  }, [normalizedQuery, options.length, open]);
  const renderedOptions = React.useMemo(
    () => filteredOptions.slice(0, visibleOptionCount),
    [filteredOptions, visibleOptionCount],
  );

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        setSearchQuery("");
        // Do not let cmdk preselect the first result when the menu opens.
        // The user should deliberately choose an option or navigate with the
        // keyboard before anything receives an active highlight.
        setHighlightedValue("");
      }}
    >
      <PopoverTrigger
        className={cn(
          "group flex h-14 w-full items-center justify-between rounded-[1.25rem] border border-slate-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-left text-sm font-medium text-slate-700 shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] outline-none transition-[border-color,box-shadow,background-color] hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_14px_30px_rgba(15,23,42,0.05)] focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-200/80 data-[popup-open]:border-emerald-500 data-[popup-open]:ring-4 data-[popup-open]:ring-emerald-200/80 dark:border-slate-600 dark:bg-none dark:bg-slate-800 dark:text-slate-100 dark:shadow-none dark:focus-visible:ring-emerald-500/25 dark:data-[popup-open]:ring-emerald-500/25",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
          triggerClassName,
          className,
        )}
        disabled={disabled}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            !selected && "text-slate-400",
          )}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 text-slate-400 transition group-data-[popup-open]:rotate-180" />
      </PopoverTrigger>

      <PopoverContent
        data-combobox-content
        align="start"
        sideOffset={8}
        className={cn(
          "w-[var(--anchor-width)] max-w-none overflow-hidden rounded-[1.4rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(243,252,247,0.98)_100%)] p-2 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-slate-600 dark:bg-none dark:bg-slate-900 dark:shadow-[0_24px_80px_rgba(0,0,0,0.42)]",
          contentClassName,
        )}
      >
        <Command
          shouldFilter={false}
          // cmdk treats an empty controlled value as uncontrolled and then
          // highlights the first item. Use a value that cannot match any
          // option so the menu opens with no active item at all.
          value={highlightedValue || NO_COMBOBOX_HIGHLIGHT}
          onValueChange={setHighlightedValue}
          className="gap-0 overflow-visible bg-transparent p-0"
        >
          <div className="relative mb-1.5 shrink-0 px-1.5 pb-1 pt-1.5">
            <Search className="pointer-events-none absolute left-4.5 top-[calc(50%+1px)] size-4 -translate-y-1/2 text-slate-400" />
            <CommandPrimitive.Input
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder={searchPlaceholder}
              className="h-11 w-full rounded-[1rem] border border-transparent bg-slate-50/90 pl-10 pr-3 text-sm text-slate-700 outline-none transition-[border-color,box-shadow,background-color] placeholder:text-slate-400 hover:border-emerald-300 hover:bg-emerald-50/60 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-200/70 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:bg-emerald-950/60 dark:focus:bg-slate-800 dark:focus:ring-emerald-500/25"
            />
          </div>
          <CommandList
            className="max-h-[280px] space-y-1 overscroll-contain p-1 pt-0"
            onScroll={(event) => {
              const list = event.currentTarget;
              if (
                list.scrollTop + list.clientHeight >=
                list.scrollHeight - 80
              ) {
                setVisibleOptionCount((count) =>
                  Math.min(
                    count + MAX_RENDERED_OPTIONS,
                    filteredOptions.length,
                  ),
                );
              }
            }}
          >
            <CommandEmpty className="py-6 text-center text-sm text-slate-400">
              {emptyText}
            </CommandEmpty>
            <CommandGroup>
              {renderedOptions.map(({ option }) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.description ?? ""}`}
                  data-checked={option.value === value}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                    setSearchQuery("");
                    setHighlightedValue("");
                  }}
                className="rounded-[1rem] border border-transparent py-2.5 transition-[background-color,border-color,box-shadow,color] hover:border-emerald-200 hover:bg-emerald-100 hover:text-emerald-950 hover:shadow-[0_8px_18px_rgba(16,185,129,0.16)] data-selected:border-emerald-200 data-selected:bg-emerald-100 data-selected:text-emerald-950 data-selected:shadow-[0_8px_18px_rgba(16,185,129,0.16)] data-[checked=true]:border-emerald-200 data-[checked=true]:bg-emerald-100 data-[checked=true]:text-emerald-950 data-[checked=true]:shadow-[inset_0_0_0_1px_rgba(16,185,129,0.08)] dark:hover:border-emerald-700 dark:hover:bg-emerald-950/70 dark:hover:text-emerald-100 dark:hover:shadow-none dark:data-selected:border-emerald-700 dark:data-selected:bg-emerald-950/70 dark:data-selected:text-emerald-100 dark:data-selected:shadow-none dark:data-[checked=true]:border-emerald-700 dark:data-[checked=true]:bg-emerald-950/70 dark:data-[checked=true]:text-emerald-100 dark:data-[checked=true]:shadow-none"
                >
                  <div className="w-0 min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-700 dark:text-slate-100 group-hover/command-item:text-emerald-950 group-data-selected/command-item:text-emerald-950 group-data-[checked=true]/command-item:text-emerald-950 dark:group-hover/command-item:text-emerald-100 dark:group-data-selected/command-item:text-emerald-100 dark:group-data-[checked=true]/command-item:text-emerald-100">
                      {option.label}
                    </p>
                    {option.description ? (
                      <p className="truncate text-xs text-slate-400">
                        {option.description}
                      </p>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {filteredOptions.length > renderedOptions.length ? (
              <p className="px-3 py-2 text-center text-xs text-slate-400">
                Menampilkan {renderedOptions.length} dari{" "}
                {filteredOptions.length}. Gulir untuk memuat lebih banyak.
              </p>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
