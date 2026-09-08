"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModalScrollLock } from "@/components/modals/modal-scroll-lock";
import { ModalActions } from "@/features/admin/management/shared/section-ui";
import { cn } from "@/lib/utils";
import { Trash2, X } from "lucide-react";

type DeleteConfirmationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  warning?: string;
  confirmLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  className?: string;
};

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  warning = "Tindakan ini tidak dapat dibatalkan.",
  confirmLabel = "Ya, Hapus",
  isPending = false,
  onConfirm,
  className,
}: DeleteConfirmationModalProps) {
  useModalScrollLock(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "!fixed !left-1/2 !top-1/2 !w-[min(calc(100vw-1.25rem),560px)] !max-w-[560px] !-translate-x-1/2 !-translate-y-1/2 !gap-0 !overflow-hidden !rounded-[1.45rem] border border-white/90 bg-white p-0 text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.22),0_8px_22px_rgba(239,68,68,0.07)] ring-0 dark:!border-slate-700 dark:!bg-slate-950 dark:!text-slate-100 dark:!shadow-[0_24px_70px_rgba(0,0,0,0.58)]",
          className,
        )}
      >
        <div className="flex items-start gap-4 px-5 py-5 sm:px-6">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[0.95rem] bg-rose-50 text-rose-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:bg-rose-950/55 dark:text-rose-300 dark:shadow-none">
            <Trash2 className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <DialogTitle className="font-sans text-[1.08rem] font-semibold tracking-[-0.025em] text-slate-950 dark:text-slate-100 sm:text-[1.18rem]">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-2 text-[0.88rem] leading-6 text-slate-600 dark:text-slate-400">
              {description}
            </DialogDescription>
            <p className="mt-1 text-[0.88rem] leading-6 text-red-500">
              {warning}
            </p>
          </div>

          <button
            type="button"
            aria-label="Tutup modal"
            className="shrink-0 inline-flex size-8 items-center justify-center rounded-lg text-slate-500 [--press-scale:0.9] transition-[color,background-color,box-shadow,transform] duration-150 hover:bg-slate-100 hover:text-slate-700 active:bg-slate-200 active:shadow-inner dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:active:bg-slate-700"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            <X className="size-4.5" />
          </button>
        </div>

        <ModalActions
          isPending={isPending}
          onCancel={() => onOpenChange(false)}
          onSubmit={onConfirm}
          submitLabel={confirmLabel}
          submitIcon={Trash2}
          submitVariant="destructive"
          className="!mt-0 !px-5 !pb-5 !pt-4 sm:!px-6 sm:!pb-6"
        />
      </DialogContent>
    </Dialog>
  );
}
