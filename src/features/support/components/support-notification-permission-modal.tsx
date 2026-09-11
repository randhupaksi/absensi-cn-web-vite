import {
  PremiumModal,
} from "@/components/modals/premium-modal";
import { ModalActions } from "@/features/admin/management/shared/section-ui";
import { BellRing, ShieldCheck, Smartphone } from "lucide-react";
import { useState } from "react";
import type { SupportNotificationPermission } from "@/lib/support-notifications";

type NotificationPermissionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnable: () => Promise<SupportNotificationPermission>;
};

export function SupportNotificationPermissionModal({
  open,
  onOpenChange,
  onEnable,
}: NotificationPermissionModalProps) {
  const [isEnabling, setIsEnabling] = useState(false);
  const [notice, setNotice] = useState("");

  const enable = async () => {
    setIsEnabling(true);
    setNotice("");
    try {
      const permission = await onEnable();
      if (permission === "granted") {
        onOpenChange(false);
        return;
      }
      setNotice(
        permission === "unsupported"
          ? "Browser ini belum mendukung notifikasi."
          : permission === "unavailable"
            ? "Layanan notifikasi sedang belum aktif. Coba lagi setelah server selesai diperbarui."
          : "Izin belum diberikan. Kamu bisa mengaktifkannya lagi dari pengaturan browser.",
      );
    } catch {
      setNotice("Notifikasi belum dapat diaktifkan. Coba lagi sesaat lagi.");
    } finally {
      setIsEnabling(false);
    }
  };

  return (
    <PremiumModal
      open={open}
      onOpenChange={onOpenChange}
      title="Dapatkan kabar tiket"
      description="Aktifkan notifikasi agar pembaruan tiket tetap kamu terima di HP atau desktop, termasuk saat halaman tidak sedang dibuka."
      icon={BellRing}
      className="[&_[data-modal-scroll-area]]:!py-5 sm:!max-w-[640px] sm:[&_[data-modal-scroll-area]]:!py-6"
      footerClassName="!border-t-0 !bg-transparent dark:!bg-transparent"
      footer={
        <ModalActions
          isPending={isEnabling}
          onCancel={() => onOpenChange(false)}
          cancelLabel="Nanti saja"
          onSubmit={() => void enable()}
          submitLabel="Izinkan notifikasi"
          submitIcon={BellRing}
          className="!mt-0"
        />
      }
    >
      <div className="space-y-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
        <div className="flex gap-3 rounded-xl border border-emerald-300 bg-emerald-100/90 p-3 text-emerald-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:border-emerald-800/70 dark:bg-emerald-950/35 dark:text-slate-300 dark:shadow-none">
          <Smartphone className="mt-0.5 size-5 shrink-0 text-emerald-700 dark:text-emerald-300" />
          <p>Setelah kamu menekan tombol izin, browser akan menampilkan konfirmasi terakhir. Notifikasi dapat menampilkan potongan pesan; jangan pernah kirim password atau data sensitif melalui chat.</p>
        </div>
        <div className="flex gap-3 px-1 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
          <p>Kamu dapat menonaktifkannya kapan saja melalui pengaturan browser.</p>
        </div>
        {notice ? <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-950/45 dark:text-amber-200">{notice}</p> : null}
      </div>
    </PremiumModal>
  );
}
