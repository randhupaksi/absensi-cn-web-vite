"use client";

import * as Select from "@radix-ui/react-select";
import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";
import { useRef, type ReactNode } from "react";

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
  className?: string;
  contentClassName?: string;
  triggerClassName?: string;
};

export function RadixSelectField({
  value,
  onValueChange,
  placeholder,
  options,
  className,
  contentClassName,
  triggerClassName,
}: RadixSelectProps) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
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
          <Select.Viewport className="max-h-[280px] space-y-1">
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
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
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

function SelectItem({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
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
      className="group/item relative flex cursor-pointer select-none items-start gap-3 rounded-[1rem] border border-transparent px-3 py-3 text-sm outline-none transition-[background-color,border-color,box-shadow,color] hover:border-emerald-200 hover:bg-emerald-100 hover:text-emerald-950 hover:shadow-[0_8px_18px_rgba(16,185,129,0.16)] data-[highlighted]:border-emerald-200 data-[highlighted]:bg-emerald-100 data-[highlighted]:text-emerald-950 data-[highlighted]:shadow-[0_8px_18px_rgba(16,185,129,0.16)] data-[state=checked]:border-emerald-200 data-[state=checked]:bg-emerald-100 data-[state=checked]:text-emerald-950 data-[state=checked]:shadow-[inset_0_0_0_1px_rgba(16,185,129,0.08)]"
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-emerald-700 transition-colors group-hover/item:border-emerald-300 group-hover/item:bg-emerald-50 group-data-[highlighted]/item:border-emerald-300 group-data-[highlighted]/item:bg-emerald-50 group-data-[state=checked]/item:border-emerald-300 group-data-[state=checked]/item:bg-emerald-50">
        <Check className="size-3.5 opacity-0 transition-opacity group-hover/item:opacity-100 group-data-[highlighted]/item:opacity-100 group-data-[state=checked]/item:opacity-100" />
      </span>
      <Select.ItemText asChild>{children}</Select.ItemText>
    </Select.Item>
  );
}
