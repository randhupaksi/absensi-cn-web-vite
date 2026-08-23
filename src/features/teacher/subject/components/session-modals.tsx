"use client";

import {
  PremiumModal,
  premiumModalActionsClassName,
  premiumModalFieldClassName,
  premiumModalLabelClassName,
  premiumModalSubmitButtonClassName,
} from "@/components/modals/premium-modal";
import { Button } from "@/components/ui/button";
import { RadixSelectField } from "@/components/ui/radix-select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2, Save } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "hadir", label: "Hadir" },
  { value: "izin", label: "Izin" },
  { value: "sakit", label: "Sakit" },
  { value: "alfa", label: "Alfa" },
];

type KoreksiModalProps = {
  studentName: string;
  nis: string;
  currentStatus: string;
  alasan: string;
  newStatus: string;
  isPending: boolean;
  error?: string;
  onAlasanChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export function KoreksiModal({
  studentName,
  nis,
  currentStatus,
  alasan,
  newStatus,
  isPending,
  error,
  onAlasanChange,
  onStatusChange,
  onCancel,
  onSubmit,
}: KoreksiModalProps) {
  return (
    <PremiumModal
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      icon={AlertCircle}
      title="Koreksi Status Kehadiran"
      description={`${studentName} - NIS ${nis}`}
      className="correction-attendance-modal sm:!max-w-xl"
      footer={
        <div className={premiumModalActionsClassName}>
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-[1.1rem] px-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-200 hover:text-slate-950 hover:shadow-[0_14px_28px_rgba(15,23,42,0.14)] active:translate-y-0 active:scale-[0.96] active:bg-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700 dark:hover:text-white dark:active:bg-slate-600"
            onClick={onCancel}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            className={premiumModalSubmitButtonClassName}
            onClick={onSubmit}
            disabled={!alasan.trim() || isPending}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isPending ? "Menyiapkan..." : "Terapkan Koreksi"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className={premiumModalFieldClassName}>
          <label className={premiumModalLabelClassName}>Status Saat Ini</label>
          <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
            {currentStatus}
          </span>
        </div>

        <div className={premiumModalFieldClassName}>
          <label className={premiumModalLabelClassName}>Status Baru</label>
          <RadixSelectField
            value={newStatus}
            onValueChange={onStatusChange}
            placeholder="Pilih status baru"
            options={STATUS_OPTIONS}
          />
        </div>

        <div className={premiumModalFieldClassName}>
          <label className={premiumModalLabelClassName}>
            Alasan Koreksi <span className="text-rose-500">*</span>
          </label>
          <Textarea
            value={alasan}
            onChange={(event) => onAlasanChange(event.target.value)}
            rows={4}
            placeholder="Tuliskan alasan koreksi data kehadiran..."
            className="min-h-28 rounded-[1.25rem] border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-800 shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:shadow-none dark:placeholder:text-slate-400"
          />
        </div>

        {error ? (
          <p className="text-sm font-medium text-rose-600">{error}</p>
        ) : null}
      </div>
    </PremiumModal>
  );
}
