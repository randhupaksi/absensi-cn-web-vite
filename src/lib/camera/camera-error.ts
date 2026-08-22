export type CameraIssueCode =
  | "CAMERA_ABORTED"
  | "CAMERA_CONSTRAINT_UNAVAILABLE"
  | "CAMERA_IN_USE"
  | "CAMERA_NOT_FOUND"
  | "CAMERA_PERMISSION_DENIED"
  | "CAMERA_SESSION_INACTIVE"
  | "CAMERA_UNSUPPORTED"
  | "CAMERA_UNKNOWN";

export type CameraIssue = {
  code: CameraIssueCode;
  title: string;
  message: string;
  canRetry: boolean;
  canRetryWithBasicConstraints: boolean;
  technicalName?: string;
  constraint?: string;
};

export function classifyCameraError(error: unknown): CameraIssue {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return {
      code: "CAMERA_PERMISSION_DENIED",
      title: "Kamera membutuhkan koneksi aman",
      message: "Buka portal melalui alamat HTTPS sekolah lalu coba lagi.",
      canRetry: false,
      canRetryWithBasicConstraints: false,
      technicalName: readErrorName(error),
    };
  }

  const technicalName = readErrorName(error);
  switch (technicalName) {
    case "NotAllowedError":
    case "SecurityError":
      return {
        code: "CAMERA_PERMISSION_DENIED",
        title: "Akses kamera belum tersedia",
        message:
          "Izinkan kamera untuk website ini di pengaturan Safari, lalu buka ulang kamera.",
        canRetry: true,
        canRetryWithBasicConstraints: false,
        technicalName,
      };
    case "NotReadableError":
    case "TrackStartError":
      return {
        code: "CAMERA_IN_USE",
        title: "Kamera belum dapat digunakan",
        message:
          "Tutup aplikasi atau tab lain yang memakai kamera, lalu tekan Coba lagi.",
        canRetry: true,
        canRetryWithBasicConstraints: false,
        technicalName,
      };
    case "OverconstrainedError":
    case "ConstraintNotSatisfiedError":
      return {
        code: "CAMERA_CONSTRAINT_UNAVAILABLE",
        title: "Mode kamera tidak cocok",
        message: "Portal akan mencoba konfigurasi kamera yang lebih sederhana.",
        canRetry: true,
        canRetryWithBasicConstraints: true,
        technicalName,
        constraint: readConstraint(error),
      };
    case "NotFoundError":
    case "DevicesNotFoundError":
      return {
        code: "CAMERA_NOT_FOUND",
        title: "Kamera tidak ditemukan",
        message:
          "Pastikan kamera perangkat aktif dan portal dibuka langsung melalui Safari.",
        canRetry: true,
        canRetryWithBasicConstraints: true,
        technicalName,
      };
    case "InvalidStateError":
      return {
        code: "CAMERA_SESSION_INACTIVE",
        title: "Sesi kamera sudah berubah",
        message: "Pastikan tab ini aktif lalu tekan Coba lagi.",
        canRetry: true,
        canRetryWithBasicConstraints: false,
        technicalName,
      };
    case "AbortError":
      return {
        code: "CAMERA_ABORTED",
        title: "Kamera berhenti saat disiapkan",
        message: "Tekan Coba lagi untuk membuka sesi kamera baru.",
        canRetry: true,
        canRetryWithBasicConstraints: true,
        technicalName,
      };
    case "TypeError":
      return unsupportedCameraIssue(technicalName);
    default:
      return {
        code: "CAMERA_UNKNOWN",
        title: "Kamera belum berhasil dibuka",
        message:
          "Buka portal langsung melalui Safari atau muat ulang halaman, lalu coba lagi.",
        canRetry: true,
        canRetryWithBasicConstraints: true,
        technicalName,
      };
  }
}

export function unsupportedCameraIssue(technicalName?: string): CameraIssue {
  return {
    code: "CAMERA_UNSUPPORTED",
    title: "Browser tidak mendukung kamera langsung",
    message: "Buka portal menggunakan Safari atau browser terbaru.",
    canRetry: false,
    canRetryWithBasicConstraints: false,
    technicalName,
  };
}

export function getCameraDiagnostic(issue: CameraIssue) {
  return {
    code: issue.code,
    browser_error: issue.technicalName,
    constraint: issue.constraint,
    secure_context:
      typeof window !== "undefined" ? window.isSecureContext : undefined,
    document_visibility:
      typeof document !== "undefined" ? document.visibilityState : undefined,
  };
}

function readErrorName(error: unknown) {
  if (error instanceof DOMException || error instanceof Error)
    return error.name;
  if (typeof error === "object" && error !== null && "name" in error) {
    const name = (error as { name?: unknown }).name;
    return typeof name === "string" ? name : undefined;
  }
  return undefined;
}

function readConstraint(error: unknown) {
  if (typeof error !== "object" || error === null || !("constraint" in error)) {
    return undefined;
  }
  const constraint = (error as { constraint?: unknown }).constraint;
  return typeof constraint === "string" ? constraint : undefined;
}
