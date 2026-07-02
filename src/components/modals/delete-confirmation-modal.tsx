"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Trash2, X } from "lucide-react";

type DeleteConfirmationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  warning?: string;
  confirmLabel?: string;
  cancelLabel?: string;
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
  cancelLabel = "Batal",
  isPending = false,
  onConfirm,
  className,
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "!fixed !left-1/2 !top-1/2 !w-[min(calc(100vw-1.25rem),560px)] !max-w-[560px] !-translate-x-1/2 !-translate-y-1/2 !gap-0 !overflow-hidden !rounded-[1.45rem] border border-white/90 bg-white p-0 text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.22),0_8px_22px_rgba(239,68,68,0.07)] ring-0",
          className,
        )}
      >
        <div className="flex items-start gap-4 px-5 py-5 sm:px-6">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[0.95rem] bg-rose-50 text-rose-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <Trash2 className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <DialogTitle className="font-sans text-[1.08rem] font-semibold tracking-[-0.025em] text-slate-950 sm:text-[1.18rem]">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-2 text-[0.88rem] leading-6 text-slate-600">
              {description}
            </DialogDescription>
            <p className="mt-1 text-[0.88rem] leading-6 text-red-500">
              {warning}
            </p>
          </div>

          <button
            type="button"
            aria-label="Tutup modal"
            className="shrink-0 inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            <X className="size-4.5" />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-2.5 border-t border-slate-200 bg-slate-50/65 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-[0.95rem] border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-[0_6px_14px_rgba(15,23,42,0.07)] transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-[0.95rem] bg-red-500 px-5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(239,68,68,0.24)] transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Menghapus..." : confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
