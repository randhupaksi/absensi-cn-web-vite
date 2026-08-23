"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { X, type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";
import { useModalScrollLock } from "@/components/modals/modal-scroll-lock";

type PremiumModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  disablePointerDismissal?: boolean;
};

export const premiumModalFieldClassName = "grid gap-2";

export const premiumModalLabelClassName =
  "text-[0.92rem] font-semibold text-slate-800 dark:text-slate-100";

export const premiumModalHelperClassName =
  "text-[0.76rem] leading-[1.55] text-slate-500 dark:text-slate-400";

export const premiumModalSurfaceClassName =
  "rounded-[1.45rem] border border-emerald-200/55 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(240,253,244,0.88)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] dark:border-emerald-700/55 dark:bg-slate-900 dark:shadow-none";

export const premiumModalActionsClassName =
  "relative mt-6 flex flex-row items-center justify-between gap-2 pt-5 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[linear-gradient(90deg,rgba(16,185,129,0.06)_0%,rgba(16,185,129,0.22)_22%,rgba(148,163,184,0.2)_52%,rgba(16,185,129,0.22)_78%,rgba(16,185,129,0.06)_100%)] [&>*]:min-w-0 [&>*]:flex-1 sm:justify-end sm:gap-3 sm:[&>*]:flex-none";

export const premiumModalSubmitButtonClassName =
  "h-12 rounded-[1.1rem] !bg-emerald-700 px-5 text-white !shadow-none transition-all duration-200 hover:!bg-emerald-800 hover:!shadow-none active:scale-[0.96] active:!bg-emerald-900 active:!shadow-none focus-visible:!shadow-none";

export function PremiumModal({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  children,
  footer,
  className,
  disablePointerDismissal = false,
}: PremiumModalProps) {
  useModalScrollLock(open);

  return (
    <Dialog
      open={open}
      // Radix Select's searchable content is portalled outside the dialog
      // popup. Keeping the dialog modal would immediately steal focus back
      // from the search input on touch devices and close the select.
      modal={false}
      onOpenChange={onOpenChange}
      disablePointerDismissal={disablePointerDismissal}
    >
      <DialogContent
        showCloseButton={false}
        className={cn(
          "!fixed !left-1/2 !top-1/2 !flex !flex-col !items-stretch !w-[min(100%,980px)] !max-h-[calc(100dvh-0.75rem)] !max-w-[calc(100vw-0.75rem)] !-translate-x-1/2 !-translate-y-1/2 !gap-0 !overflow-hidden !overscroll-none !rounded-[1.35rem] border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,251,247,0.98)_100%)] p-0 text-slate-900 shadow-[0_28px_80px_rgba(15,23,42,0.18),0_6px_24px_rgba(16,185,129,0.08)] ring-0 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.2),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(187,247,208,0.18),transparent_28%)] dark:!border-slate-700 dark:!bg-slate-950 dark:!text-slate-100 dark:!shadow-[0_28px_80px_rgba(0,0,0,0.58)] dark:before:bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.13),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.09),transparent_28%)] sm:!max-h-[calc(100dvh-3rem)] sm:!max-w-[880px] sm:!rounded-[2rem]",
          className,
        )}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.nativeEvent.isComposing) return;

          const target = event.target as HTMLElement;
          if (
            target.closest(
              "textarea,button,a,[role='combobox'],[data-slot='select-trigger']",
            )
          ) {
            return;
          }

          const submitButton = event.currentTarget.querySelector<HTMLElement>(
            "[data-modal-submit]:not(:disabled):not([aria-disabled='true'])",
          );
          if (!submitButton) return;

          event.preventDefault();
          submitButton.click();
        }}
      >
        <div className="relative flex shrink-0 items-start gap-3 border-b border-slate-300/22 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(244,250,246,0.82)_100%)] px-4 pb-4 pt-4 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-[linear-gradient(90deg,rgba(16,185,129,0.08)_0%,rgba(16,185,129,0.18)_22%,rgba(148,163,184,0.16)_52%,rgba(16,185,129,0.18)_78%,rgba(16,185,129,0.06)_100%)] dark:border-slate-700 dark:bg-slate-900/85 dark:after:bg-emerald-400/20 sm:gap-4 sm:px-[1.3rem] sm:pb-[1.1rem] sm:pt-[1.25rem] sm:after:inset-x-0">
          <span className="inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[0.9rem] bg-[linear-gradient(135deg,#8df0c1_0%,#34d399_38%,#0f766e_100%)] text-white shadow-[0_14px_24px_rgba(16,185,129,0.2)] dark:bg-emerald-950/70 dark:bg-none dark:text-emerald-300 dark:shadow-none sm:size-12 sm:rounded-2xl">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="font-sans text-[1.08rem] font-semibold leading-[1.15] tracking-[-0.02em] text-slate-900 [text-rendering:geometricPrecision] dark:text-slate-100 sm:text-[1.16rem]">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-[0.9rem] leading-[1.55] text-slate-500 dark:text-slate-400">
              {description}
            </DialogDescription>
          </div>

          <button
            type="button"
            aria-label="Tutup modal"
            data-modal-close
            onClick={() => onOpenChange(false)}
            className="mt-0.5 inline-flex h-[2.35rem] w-[2.35rem] shrink-0 items-center justify-center rounded-[0.85rem] border border-rose-300/22 bg-white/78 text-rose-500 [--press-scale:0.9] transition-[transform,box-shadow,border-color,background-color] duration-180 hover:-translate-y-px hover:border-rose-300/42 hover:bg-rose-50/96 hover:shadow-[0_12px_24px_rgba(239,68,68,0.12)] active:border-rose-300/60 active:bg-rose-100 active:shadow-[inset_0_1px_4px_rgba(239,68,68,0.16)] dark:border-rose-400/30 dark:bg-rose-950/35 dark:text-rose-300 dark:hover:border-rose-300/55 dark:hover:bg-rose-950/65 dark:hover:shadow-none dark:active:bg-rose-950/80"
          >
            <X className="size-4.5" />
          </button>
        </div>

        <div
          data-modal-scroll-area
          className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-5 pt-4 [touch-action:pan-y] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-[2px] [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-[linear-gradient(180deg,rgba(52,211,153,0.52),rgba(22,163,74,0.42))] [&::-webkit-scrollbar-thumb]:bg-clip-padding sm:px-[1.45rem] sm:pb-[1.55rem] sm:pt-[1.4rem]"
        >
          {children}
        </div>

        {footer ? (
          <div className="relative shrink-0 bg-transparent px-[1.3rem] py-[1.1rem]">
            {footer}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
