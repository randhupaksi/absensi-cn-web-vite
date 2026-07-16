"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AttendanceLocationEvidence } from "@/types/location";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Crosshair,
  ExternalLink,
  LoaderCircle,
  MapPinned,
  RefreshCw,
} from "lucide-react";

type LocationEvidenceProps = {
  evidence: AttendanceLocationEvidence;
  className?: string;
  isLoading?: boolean;
  message?: string;
  onRetry?: () => void;
};

const locationStatusConfig = {
  inside_radius: {
    label: "Di area sekolah",
    description: "Titik lokasi berada di dalam radius absensi sekolah.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },
  outside_radius: {
    label: "Di luar radius",
    description: "Titik lokasi berada di luar radius absensi dan perlu ditinjau.",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    icon: AlertTriangle,
  },
  low_accuracy: {
    label: "Akurasi GPS rendah",
    description: "Lokasi terekam, tetapi akurasinya belum cukup untuk keputusan otomatis.",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: AlertTriangle,
  },
  stale: {
    label: "Lokasi tidak terbaru",
    description: "Waktu pengambilan lokasi terlalu jauh dari waktu pengiriman absensi.",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: Clock3,
  },
  captured_unverified: {
    label: "Lokasi terekam",
    description: "Koordinat tersimpan, tetapi radius sekolah belum dikonfigurasi di server.",
    className: "border-sky-200 bg-sky-50 text-sky-700",
    icon: MapPinned,
  },
  permission_denied: {
    label: "Izin lokasi ditolak",
    description: "Siswa tidak memberikan izin lokasi; bukti perlu diperiksa manual.",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    icon: AlertTriangle,
  },
  unavailable: {
    label: "Lokasi tidak tersedia",
    description: "Perangkat tidak berhasil mengirim metadata lokasi untuk absensi ini.",
    className: "border-slate-200 bg-slate-100 text-slate-600",
    icon: AlertTriangle,
  },
} as const;

export function AttendanceLocationEvidence({
  evidence,
  className,
  isLoading = false,
  message,
  onRetry,
}: LocationEvidenceProps) {
  const status = evidence.location_status;
  const config = status ? locationStatusConfig[status] : undefined;
  const StatusIcon = config?.icon ?? MapPinned;
  const hasCoordinates =
    evidence.location_latitude !== undefined &&
    evidence.location_longitude !== undefined;
  const mapUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${evidence.location_latitude},${evidence.location_longitude}`
    : undefined;

  return (
    <section className={cn("border-t border-slate-200/75 pt-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            {isLoading ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <MapPinned className="size-5" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Lokasi Pengambilan</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {message ??
                (isLoading
                  ? "Sedang membaca lokasi perangkat dengan akurasi terbaik."
                  : config?.description ??
                    "Record lama ini belum memiliki metadata lokasi.")}
            </p>
          </div>
        </div>

        {!isLoading && config ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
              config.className,
            )}
          >
            <StatusIcon className="size-3.5" />
            {config.label}
          </span>
        ) : null}
      </div>

      {!isLoading && (hasCoordinates || evidence.location_accuracy_meters !== undefined) ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <LocationMetric
            icon={Crosshair}
            label="Jarak"
            value={formatDistance(evidence.location_distance_meters)}
          />
          <LocationMetric
            icon={MapPinned}
            label="Akurasi"
            value={formatAccuracy(evidence.location_accuracy_meters)}
          />
          <LocationMetric
            icon={Clock3}
            label="Diambil"
            value={formatCapturedAt(evidence.location_captured_at)}
          />
        </div>
      ) : null}

      {!isLoading && (mapUrl || onRetry) ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {mapUrl ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-[var(--radius-md)] border-emerald-200 bg-white px-4 text-xs text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={() => window.open(mapUrl, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="size-4" />
              Buka di Peta
            </Button>
          ) : null}
          {onRetry ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-[var(--radius-md)] px-4 text-xs"
              onClick={onRetry}
            >
              <RefreshCw className="size-4" />
              Ambil Ulang Lokasi
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function LocationMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPinned;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 bg-slate-50/80 px-3 py-2.5">
      <Icon className="size-4 shrink-0 text-emerald-600" />
      <div className="min-w-0">
        <p className="text-[0.65rem] font-semibold uppercase tracking-normal text-slate-400">
          {label}
        </p>
        <p className="truncate text-xs font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function formatDistance(value?: number) {
  if (value === undefined) return "Belum dihitung";
  if (value < 1000) return `${Math.round(value)} m`;
  return `${(value / 1000).toFixed(2)} km`;
}

function formatAccuracy(value?: number) {
  return value === undefined ? "Tidak tersedia" : `+/- ${Math.round(value)} m`;
}

function formatCapturedAt(value?: string) {
  if (!value) return "Tidak tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
