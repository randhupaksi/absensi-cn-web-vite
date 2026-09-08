import { PremiumModal } from "@/components/modals/premium-modal";
import { RadixSelectField } from "@/components/ui/radix-select";
import { Textarea } from "@/components/ui/textarea";
import { ModalActions } from "@/features/admin/management/shared/section-ui";
import { formatSupportRequesterName } from "@/features/support/components/ticket-display";
import type { SupportTicket } from "@/types/support";
import {
  CircleAlert,
  Fingerprint,
  ShieldCheck,
  Ticket,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

type AdminPasswordResetModalProps = {
  open: boolean;
  ticket?: SupportTicket;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
};

type ResetDecision = "APPROVE" | "REJECT";

export function AdminPasswordResetModal({
  open,
  ticket,
  isSubmitting,
  onOpenChange,
  onApprove,
  onReject,
}: AdminPasswordResetModalProps) {
  const [decision, setDecision] = useState<ResetDecision>("APPROVE");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionHovered, setRejectionHovered] = useState(false);
  const [rejectionFocused, setRejectionFocused] = useState(false);
  const rejectionReasonLength = rejectionReason.trim().length;
  const rejectionReasonInvalid =
    decision === "REJECT" &&
    rejectionReasonLength > 0 &&
    rejectionReasonLength < 10;
  const submitDisabled = decision === "REJECT" && rejectionReasonLength < 10;

  useEffect(() => {
    if (!open) return;
    setDecision("APPROVE");
    setRejectionReason("");
  }, [open]);

  const resetAndClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setDecision("APPROVE");
      setRejectionReason("");
    }
  };

  const rejectionSurfaceStyle = rejectionReasonInvalid
    ? rejectionFocused
      ? {
          borderColor: "rgba(244,63,94,0.82)",
          boxShadow: "0 0 0 3px rgba(244,63,94,0.22)",
        }
      : rejectionHovered
        ? {
            borderColor: "rgba(251,113,133,0.78)",
            boxShadow: "0 0 0 1px rgba(244,63,94,0.12)",
          }
        : undefined
    : rejectionFocused
      ? {
          borderColor: "rgba(16,185,129,0.82)",
          boxShadow: "0 0 0 3px rgba(16,185,129,0.22)",
        }
      : rejectionHovered
        ? {
            borderColor: "rgba(52,211,153,0.72)",
            boxShadow: "0 0 0 1px rgba(16,185,129,0.12)",
          }
        : { boxShadow: "0 14px 30px rgba(15,23,42,0.05)" };

  return (
    <PremiumModal
      open={open}
      onOpenChange={resetAndClose}
      title="Proses pengajuan reset password"
      description="Tentukan keputusan setelah memeriksa kecocokan data pemohon."
      icon={decision === "REJECT" ? CircleAlert : ShieldCheck}
      className="sm:!max-w-[620px]"
      footerClassName="!border-t-0 !bg-transparent dark:!bg-transparent"
      footer={
        <ModalActions
          className="!mt-0 !pt-4"
          isPending={isSubmitting}
          onCancel={() => resetAndClose(false)}
          onSubmit={() =>
            decision === "APPROVE"
              ? onApprove()
              : onReject(rejectionReason.trim())
          }
          submitLabel="Konfirmasi"
          submitIcon={decision === "APPROVE" ? ShieldCheck : CircleAlert}
          submitDisabled={submitDisabled}
          submitVariant={decision === "REJECT" ? "destructive" : "success"}
        />
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">
            Keputusan pengajuan
          </label>
          <RadixSelectField
            value={decision}
            onValueChange={(value) => setDecision(value as ResetDecision)}
            placeholder="Pilih keputusan"
            options={[
              { value: "APPROVE", label: "Setujui pengajuan" },
              { value: "REJECT", label: "Tolak pengajuan" },
            ]}
            triggerClassName="h-12"
          />
        </div>

        {decision === "APPROVE" ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-100">
            <strong>
              Jika disetujui, pengguna akan menerima pemberitahuan.
            </strong>{" "}
            Mereka dapat membuat password baru dari tiket ini. Tiket akan
            selesai otomatis setelah password baru berhasil dibuat.
          </div>
        ) : (
          <div>
            <label
              htmlFor="support-rejection-reason"
              className={`mb-2 block text-sm font-semibold ${rejectionReasonInvalid ? "text-rose-600 dark:text-rose-300" : "text-slate-800 dark:text-slate-100"}`}
            >
              Alasan penolakan <span className="text-rose-500">*</span>
            </label>
            <div
              className={`relative min-h-28 rounded-[1.25rem] border border-slate-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-4 text-sm shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] transition-[border-color,box-shadow,background-color] hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.12),0_14px_30px_rgba(15,23,42,0.05)] focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-200/80 active:border-emerald-500 active:ring-4 active:ring-emerald-200/60 dark:border-slate-600 dark:bg-slate-900 dark:shadow-none dark:hover:border-emerald-400 dark:hover:bg-slate-800 dark:hover:shadow-[0_0_0_3px_rgba(52,211,153,0.2)] dark:focus-within:border-emerald-400 dark:focus-within:ring-4 dark:focus-within:ring-emerald-400/45 dark:active:border-emerald-400 dark:active:ring-4 dark:active:ring-emerald-400/35 ${rejectionReasonInvalid ? "!border-rose-500/80 !bg-rose-50/30 hover:!border-rose-500 focus-within:!border-rose-500 focus-within:!ring-rose-200/80 dark:!border-rose-500/70 dark:!bg-rose-950/20 dark:hover:!border-rose-400 dark:focus-within:!border-rose-400 dark:focus-within:!ring-rose-400/25" : ""}`}
              onMouseEnter={() => setRejectionHovered(true)}
              onMouseLeave={() => setRejectionHovered(false)}
              onPointerMove={() => setRejectionHovered(true)}
              onPointerLeave={() => setRejectionHovered(false)}
              onFocus={() => setRejectionFocused(true)}
              onBlur={() => setRejectionFocused(false)}
              style={rejectionSurfaceStyle}
            >
              <Textarea
                id="support-rejection-reason"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                maxLength={1000}
                placeholder="Jelaskan data atau syarat yang belum sesuai..."
                className="min-h-24 resize-none rounded-none border-0 bg-transparent px-0 py-3 hover:border-transparent hover:bg-transparent focus-visible:border-transparent focus-visible:ring-0 dark:!bg-transparent dark:hover:!bg-transparent dark:focus-visible:!bg-transparent"
                aria-invalid={rejectionReasonInvalid}
              />
            </div>
            <p
              className={`mt-2 text-xs ${rejectionReasonInvalid ? "text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}
            >
              {rejectionReasonLength < 10
                ? "Alasan wajib diisi minimal 10 karakter."
                : "Alasan ini akan terlihat oleh pengguna pada tiketnya."}{" "}
              {rejectionReason.length}/1000
            </p>
          </div>
        )}

        {ticket ? <TicketApprovalDetails ticket={ticket} /> : null}
      </div>
    </PremiumModal>
  );
}

function TicketApprovalDetails({ ticket }: { ticket: SupportTicket }) {
  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-900">
      <ApprovalDetailRow
        icon={Ticket}
        label="Tiket"
        value={ticket.reference_code}
      />
      <ApprovalDetailRow
        icon={UserRound}
        label="Pemohon"
        value={formatSupportRequesterName(ticket.requester_name, ticket.portal)}
      />
      <ApprovalDetailRow
        icon={UserRound}
        label="Akun"
        value={ticket.account_name || "Belum terdeteksi"}
      />
      <ApprovalDetailRow
        icon={Fingerprint}
        label="Identitas"
        value={ticket.account_identifier || "-"}
      />
    </div>
  );
}

function ApprovalDetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Ticket;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[1rem_5.5rem_0.5rem_minmax(0,1fr)] items-start gap-x-2">
      <Icon className="mt-0.5 size-4 text-slate-400" />
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-400">:</span>
      <strong className="min-w-0 break-words text-slate-800 dark:text-slate-100">
        {value}
      </strong>
    </div>
  );
}
