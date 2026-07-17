import type { AttendanceLocationCaptureResult } from "@/types/location";

const locationOptions: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 12_000,
  maximumAge: 30_000,
};

export function captureAttendanceLocation(): Promise<AttendanceLocationCaptureResult> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return Promise.resolve({
      capture: { client_status: "unavailable" },
      outcome: "unavailable",
      message: "Perangkat atau browser ini tidak menyediakan akses lokasi.",
    });
  }

  if (!window.isSecureContext && window.location.hostname !== "localhost") {
    return Promise.resolve({
      capture: { client_status: "unavailable" },
      outcome: "unavailable",
      message: "Lokasi hanya dapat dibaca melalui koneksi HTTPS yang aman.",
    });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          capture: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy_meters: position.coords.accuracy,
            captured_at: new Date(position.timestamp).toISOString(),
            client_status: "captured",
          },
          outcome: "captured",
          message: "Lokasi perangkat berhasil dibaca dan siap diverifikasi.",
        });
      },
      (error) => {
        const permissionDenied = error.code === error.PERMISSION_DENIED;
        resolve({
          capture: {
            client_status: permissionDenied ? "permission_denied" : "unavailable",
          },
          outcome: permissionDenied ? "permission_denied" : "unavailable",
          message: permissionDenied
            ? "Izin lokasi ditolak. Absensi tetap dapat dikirim untuk direview."
            : error.code === error.TIMEOUT
              ? "Pembacaan lokasi melewati batas waktu. Kamu dapat mencoba lagi."
              : "Lokasi belum dapat dibaca. Absensi tetap dapat dikirim untuk direview.",
        });
      },
      locationOptions,
    );
  });
}

export function calculateDistanceMeters(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
): number {
  const earthRadiusMeters = 6_371_000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);
  const latitudeARadians = toRadians(latitudeA);
  const latitudeBRadians = toRadians(latitudeB);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitudeARadians) *
      Math.cos(latitudeBRadians) *
      Math.sin(deltaLongitude / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
