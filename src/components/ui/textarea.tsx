import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full resize-none rounded-xl border border-slate-300/80 bg-transparent px-2.5 py-2 text-base transition-[border-color,box-shadow,background-color,transform] outline-none placeholder:text-muted-foreground hover:border-emerald-400 hover:bg-transparent active:border-emerald-500 active:bg-transparent focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-200/80 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/20 md:text-sm dark:border-slate-600 dark:bg-input/30 dark:hover:border-emerald-500 dark:hover:bg-input/30 dark:active:border-emerald-400 dark:active:bg-input/30 dark:focus-visible:ring-emerald-400/25 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
