import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 appearance-none rounded-lg border border-slate-300/80 bg-transparent px-2.5 py-1 text-base caret-current transition-[border-color,box-shadow,background-color] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground hover:border-emerald-400 hover:bg-emerald-50/25 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16)] focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-200/80 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/20 md:text-sm dark:border-slate-600 dark:bg-input/30 dark:hover:border-emerald-400 dark:hover:bg-emerald-950/35 dark:hover:shadow-[0_0_0_3px_rgba(52,211,153,0.14)] dark:focus-visible:ring-emerald-400/25 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
