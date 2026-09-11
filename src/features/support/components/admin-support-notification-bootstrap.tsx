import { SupportNotificationPermissionModal } from "@/features/support/components/support-notification-permission-modal";
import { requestSupportNotificationPermission } from "@/lib/support-notifications";
import { useEffect, useRef, useState } from "react";

export function AdminSupportNotificationBootstrap() {
  const [open, setOpen] = useState(false);
  const synchronized = useRef(false);

  useEffect(() => {
    if (typeof Notification === "undefined") return;

    if (Notification.permission === "granted") {
      if (synchronized.current) return;
      synchronized.current = true;
      void requestSupportNotificationPermission(true).catch(() => {
        // The explicit activation action remains available on the Support page.
      });
      return;
    }

    if (Notification.permission === "default") {
      setOpen(true);
    }
  }, []);

  return (
    <SupportNotificationPermissionModal
      open={open}
      onOpenChange={setOpen}
      onEnable={() => requestSupportNotificationPermission(true)}
    />
  );
}
