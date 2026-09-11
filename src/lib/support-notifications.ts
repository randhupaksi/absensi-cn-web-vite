import { apiClient } from "@/services/api/client";

type ApiEnvelope<T> = { data: T };
type PushKeyResponse = { public_key: string };
export type SupportNotificationPermission =
  | NotificationPermission
  | "unsupported"
  | "unavailable";

let registrationPromise: Promise<ServiceWorkerRegistration | null> | undefined;

function supported() {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
}

function decodeBase64Url(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function getRegistration() {
  if (!supported()) return null;
  registrationPromise ??= navigator.serviceWorker
    .register("/support-notifications-sw.js", { scope: "/" })
    .then(async (registration) => {
      await registration.update();
      return registration;
    });
  return registrationPromise;
}

export async function requestBrowserNotificationPermission(): Promise<SupportNotificationPermission> {
  if (!supported()) return "unsupported" as const;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;
  await getRegistration();
  return permission;
}

export async function requestSupportNotificationPermission(admin = false): Promise<SupportNotificationPermission> {
  const permission = await requestBrowserNotificationPermission();
  if (permission !== "granted") return permission;
  const registration = await getRegistration();
  if (!registration) return "unsupported" as const;
  const prefix = admin ? "/admin/support" : "/support";
  const keyResponse = await apiClient.get<ApiEnvelope<PushKeyResponse>>(`${prefix}/push/public-key`);
  const publicKey = keyResponse.data.data.public_key.trim();
  if (!publicKey) return "unavailable";
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeBase64Url(publicKey),
    }));
  await apiClient.post(`${prefix}/push/subscription`, subscription.toJSON());
  return permission;
}

export async function requestPublicSupportNotificationPermission(reference: string, accessCode: string): Promise<SupportNotificationPermission> {
  const permission = await requestBrowserNotificationPermission();
  if (permission !== "granted") return permission;
  const registration = await getRegistration();
  if (!registration) return "unsupported" as const;
  const keyResponse = await apiClient.get<ApiEnvelope<PushKeyResponse>>("/public/support/push/public-key");
  const publicKey = keyResponse.data.data.public_key.trim();
  if (!publicKey) return "unavailable";
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeBase64Url(publicKey),
    }));
  await apiClient.post(`/public/support/tickets/${encodeURIComponent(reference)}/push-subscription`, {
    access_code: accessCode,
    ...subscription.toJSON(),
  });
  return permission;
}

export function notifySupportUpdate(title: string, body: string, url?: string) {
  if (!supported() || Notification.permission !== "granted" || document.visibilityState === "visible") return;
  void getRegistration().then((registration) => registration?.showNotification(title, {
    body,
    icon: "/images/optimized/logo-sma-smk-yatkj.png",
    data: { url: url || window.location.pathname },
  }));
}
