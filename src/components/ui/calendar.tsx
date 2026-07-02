"use client"

import * as React from "react"
import * as Select from "@radix-ui/react-select"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type DropdownProps,
  type Locale,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar bg-transparent p-2 [--cell-radius:0.95rem] [--cell-size:2.35rem] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit text-slate-700", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "pointer-events-none absolute inset-x-0 top-0 z-30 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "pointer-events-auto size-(--cell-size) rounded-xl border border-emerald-100 bg-white p-0 text-emerald-800 shadow-sm select-none transition-[border-color,box-shadow,background-color] hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900 aria-disabled:opacity-50",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "pointer-events-auto size-(--cell-size) rounded-xl border border-emerald-100 bg-white p-0 text-emerald-800 shadow-sm select-none transition-[border-color,box-shadow,background-color] hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900 aria-disabled:opacity-50",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "pointer-events-none relative z-20 flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "pointer-events-auto flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative rounded-(--cell-radius)",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute inset-0 bg-popover opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "pointer-events-auto font-semibold tracking-[-0.01em] text-slate-900 select-none",
          captionLayout === "label"
            ? "text-sm"
            : "flex items-center gap-1 rounded-(--cell-radius) text-sm [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
          defaultClassNames.caption_label
        ),
        month_grid: "w-full border-separate border-spacing-y-1",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 rounded-(--cell-radius) pb-1 text-[0.78rem] font-semibold text-slate-500 select-none",
          defaultClassNames.weekday
        ),
        weeks: cn("flex flex-col", defaultClassNames.weeks),
        week: cn("flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "w-(--cell-size) select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.8rem] text-muted-foreground select-none",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)"
            : "[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)",
          defaultClassNames.day
        ),
        range_start: cn(
          "relative isolate z-0 rounded-l-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-muted",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn(
          "relative isolate z-0 rounded-r-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-muted",
          defaultClassNames.range_end
        ),
        today: cn(
          "rounded-(--cell-radius) bg-emerald-50/70 text-emerald-800 data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-slate-400 aria-selected:text-slate-400",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-slate-300 opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon className={cn("size-4", className)} {...props} />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={locale} {...props} />
        ),
        Dropdown: CalendarDropdown,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDropdown({
  options,
  value,
  onChange,
  disabled,
}: DropdownProps) {
  const selectedValue = value === undefined || value === null ? "" : String(value)
  const selectedOption = options?.find((option) => String(option.value) === selectedValue)

  return (
    <Select.Root
      value={selectedValue}
      onValueChange={(nextValue) => {
        onChange?.({
          target: { value: nextValue },
          currentTarget: { value: nextValue },
        } as React.ChangeEvent<HTMLSelectElement>)
      }}
      disabled={disabled}
    >
      <Select.Trigger
        className="group inline-flex h-9 min-w-[4.25rem] items-center justify-center gap-1.5 rounded-xl border border-emerald-100 bg-white/90 px-2.5 text-sm font-semibold tracking-[-0.01em] text-slate-900 shadow-[0_8px_18px_rgba(15,23,42,0.06)] outline-none transition-[border-color,box-shadow,background-color] hover:border-emerald-300 hover:bg-emerald-50 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/70 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={selectedOption?.label}
      >
        <Select.Value placeholder={selectedOption?.label} />
        <Select.Icon className="text-slate-500 transition-transform group-data-[state=open]:rotate-180">
          <ChevronDownIcon className="size-3.5" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={8}
          className="z-[9999] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(242,252,247,0.99)_100%)] p-1.5 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl"
        >
          <Select.Viewport className="max-h-[260px] space-y-1">
            {options?.map((option) => (
              <Select.Item
                key={option.value}
                value={String(option.value)}
                disabled={option.disabled}
                className="group/item relative flex cursor-pointer select-none items-center gap-2 rounded-xl border border-transparent px-2.5 py-2 text-sm font-medium text-slate-700 outline-none transition hover:border-emerald-100 hover:bg-emerald-50/80 data-[highlighted]:border-emerald-100 data-[highlighted]:bg-emerald-50/90 data-[state=checked]:border-emerald-100 data-[state=checked]:bg-emerald-100/80 data-[disabled]:pointer-events-none data-[disabled]:opacity-40"
              >
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-emerald-600 transition-colors group-hover/item:border-emerald-200 group-data-[highlighted]/item:border-emerald-200 group-data-[state=checked]/item:border-emerald-200">
                  <Select.ItemIndicator>
                    <CheckIcon className="size-3" />
                  </Select.ItemIndicator>
                </span>
                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 rounded-(--cell-radius) border border-transparent bg-transparent leading-none font-medium text-slate-700 transition-[border-color,box-shadow,background-color,color] group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-emerald-400 group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-emerald-200/70 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:rounded-r-(--cell-radius) data-[range-end=true]:bg-emerald-600 data-[range-end=true]:text-white data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-emerald-50 data-[range-middle=true]:text-emerald-900 data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-l-(--cell-radius) data-[range-start=true]:bg-emerald-600 data-[range-start=true]:text-white data-[selected-single=true]:bg-emerald-600 data-[selected-single=true]:text-white data-[selected-single=true]:shadow-[0_10px_22px_rgba(16,185,129,0.24)] dark:hover:text-foreground [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
