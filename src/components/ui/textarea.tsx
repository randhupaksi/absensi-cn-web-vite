import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full resize-none rounded-lg border border-slate-300/80 bg-transparent px-2.5 py-2 text-base transition-[border-color,box-shadow,background-color] outline-none placeholder:text-muted-foreground hover:border-emerald-400 hover:bg-emerald-50/25 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16)] focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-200/80 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
