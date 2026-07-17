import { premiumModalActionsClassName } from "@/components/modals/premium-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Printer } from "lucide-react";
import { AsyncButton } from "@/components/ui/async-button";

type ReportModalFooterProps = {
  canDownload: boolean;
  generating: boolean;
  onCancel: () => void;
  onDownload: () => void;
  downloadLabel?: string;
  generatingLabel?: string;
  cancelVariant?: "button" | "native";
};

const cancelClassName = "h-10 rounded-[0.8rem] border-slate-200 px-5 text-[0.88rem] text-slate-600";

export function ReportModalFooter({
  canDownload,
  generating,
  onCancel,
  onDownload,
  downloadLabel = "Download PDF",
  generatingLabel = "Memuat data & membuat PDF...",
  cancelVariant = "button",
}: ReportModalFooterProps) {
  const cancel = cancelVariant === "native" ? (
    <button
      type="button"
      className="inline-flex h-10 items-center justify-center rounded-[0.8rem] border border-slate-200 px-5 text-[0.88rem] text-slate-600 transition hover:bg-slate-50"
      onClick={onCancel}
    >
      Batal
    </button>
  ) : (
    <Button type="button" variant="outline" className={cancelClassName} onClick={onCancel}>
      Batal
    </Button>
  );

  return (
    <div className={premiumModalActionsClassName}>
      {cancel}
      <AsyncButton
        type="button"
        disabled={!canDownload}
        isPending={generating}
        pendingLabel={generatingLabel}
        icon={Printer}
        onClick={onDownload}
        className={cn(
          "inline-flex h-10 items-center justify-center gap-2 rounded-[0.8rem] px-6 text-[0.88rem] font-semibold text-white transition-all duration-200",
          canDownload && !generating
            ? "bg-emerald-600 shadow-[0_4px_14px_rgba(5,150,105,0.3)] hover:-translate-y-px hover:bg-emerald-700 hover:shadow-[0_6px_20px_rgba(5,150,105,0.38)]"
            : "cursor-not-allowed bg-slate-300",
        )}
      >
        {downloadLabel}
      </AsyncButton>
    </div>
  );
}
