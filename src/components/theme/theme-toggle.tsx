import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { getStoredTheme, setAppTheme, subscribeToTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  placement?: "fixed" | "inline";
};

export function ThemeToggle({ className, placement = "inline" }: ThemeToggleProps) {
  const theme = useSyncExternalStore(subscribeToTheme, getStoredTheme, () => "light");
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Gunakan tema terang" : "Gunakan tema gelap"}
      title={isDark ? "Gunakan tema terang" : "Gunakan tema gelap"}
      onClick={() => setAppTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative h-8 w-16 overflow-hidden rounded-full border-slate-300 bg-slate-100 p-0 text-emerald-800 shadow-none hover:translate-y-0 hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-950 hover:shadow-none active:scale-[0.94] active:duration-75 active:border-emerald-400 active:bg-emerald-200/80 sm:h-9 sm:w-[4.5rem] dark:border-emerald-500/60 dark:bg-slate-800 dark:text-amber-200 dark:hover:border-emerald-300 dark:hover:bg-emerald-950/70 dark:hover:text-emerald-100 dark:hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16)] dark:active:border-emerald-300 dark:active:bg-emerald-900/80",
        placement === "fixed" && "fixed right-4 top-4 z-[60] sm:right-6 sm:top-6",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_3px_9px_rgba(15,23,42,0.15)] transition-transform duration-200 ease-out sm:left-1 sm:size-7",
          isDark && "translate-x-8 sm:translate-x-10",
        )}
      >
        {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
      </span>
    </Button>
  );
}
