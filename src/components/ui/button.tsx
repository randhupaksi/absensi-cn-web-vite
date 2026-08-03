import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 touch-manipulation items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-150 ease-out outline-none select-none focus-visible:border-emerald-500/50 focus-visible:ring-3 focus-visible:ring-emerald-200/80 active:not-aria-[haspopup]:translate-y-px active:not-aria-[haspopup]:scale-[0.96] active:not-aria-[haspopup]:duration-75 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:focus-visible:border-emerald-300/60 dark:focus-visible:ring-emerald-400/25 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_10px_22px_color-mix(in_oklab,var(--primary)_28%,transparent)] hover:-translate-y-px hover:bg-primary/90 hover:shadow-[0_14px_28px_color-mix(in_oklab,var(--primary)_34%,transparent)] active:bg-primary",
        outline:
          "border-2 border-slate-300 bg-slate-100 text-slate-800 shadow-[0_6px_16px_rgba(15,23,42,0.08)] hover:-translate-y-px hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-950 hover:shadow-[0_10px_22px_rgba(16,185,129,0.16)] active:bg-emerald-100/80 aria-expanded:border-emerald-400 aria-expanded:bg-emerald-50 aria-expanded:text-emerald-950 dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "border border-slate-200/80 bg-slate-100/90 text-slate-700 shadow-[0_5px_14px_rgba(15,23,42,0.04)] hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-950 hover:shadow-[0_8px_18px_rgba(16,185,129,0.14)] active:bg-emerald-100/80 aria-expanded:border-emerald-300 aria-expanded:bg-emerald-50 aria-expanded:text-emerald-950",
        ghost:
          "hover:bg-muted hover:text-foreground active:bg-muted/85 aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:-translate-y-px hover:bg-destructive/20 hover:shadow-sm active:bg-destructive/25 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "active:translate-y-0 active:scale-100 text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
