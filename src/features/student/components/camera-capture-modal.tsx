"use client";

import {
  PremiumModal,
  premiumModalActionsClassName,
} from "@/components/modals/premium-modal";
import { Button } from "@/components/ui/button";
import { AsyncButton } from "@/components/ui/async-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CameraCaptureModalProps = {
  onCapture: (file: File) => void;
  onClose: () => void;
};

export function CameraCaptureModal({ onCapture, onClose }: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {
        setCameraError(
          "Kamera tidak dapat diakses. Pastikan izin kamera sudah diaktifkan di browser.",
        );
      });

    return stopStream;
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "absensi.jpg", {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        stopStream();
        onCapture(file);
      },
      "image/jpeg",
      0.72,
    );
  }

  function handleClose() {
    stopStream();
    onClose();
  }

  return (
    <PremiumModal
      open
      onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}
      title="Ambil Foto Absensi"
      description="Arahkan kamera ke wajah kamu, lalu klik Ambil Foto."
      icon={Camera}
    >
      <div className="space-y-4">
        {cameraError ? (
          <div className="flex flex-col items-center gap-3 rounded-[1.3rem] border border-rose-200 bg-rose-50/60 p-6 text-center">
            <ShieldAlert className="size-8 text-rose-500" />
            <p className="text-[0.88rem] font-medium text-rose-700">{cameraError}</p>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-[1.3rem] border border-emerald-200/70 bg-slate-950">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onCanPlay={() => setVideoReady(true)}
              className="h-[300px] w-full object-cover"
            />
            {!videoReady ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/92 p-6 text-center">
                <Skeleton className="absolute inset-0 rounded-none bg-slate-800/80" />
                <span className="relative flex size-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                  <Camera className="size-5" />
                </span>
                <div className="relative">
                  <p className="text-sm font-semibold text-white">Menyiapkan kamera</p>
                  <p className="mt-1 text-xs text-slate-400">Browser sedang memeriksa izin dan perangkat kamera.</p>
                </div>
              </div>
            ) : null}
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />

        <div className={premiumModalActionsClassName}>
          <Button
            type="button"
            variant="outline"
            className="h-13 rounded-full border-slate-200 px-6 text-slate-600"
            onClick={handleClose}
          >
            Batal
          </Button>
          {!cameraError && (
            <AsyncButton
              type="button"
              isPending={!videoReady}
              pendingLabel="Menyiapkan kamera..."
              icon={Camera}
              onClick={handleCapture}
              className="h-13 rounded-full bg-emerald-700 px-7 text-white shadow-[0_14px_28px_rgba(16,185,129,0.22)] hover:bg-emerald-800 disabled:bg-slate-300"
            >
              Ambil Foto
            </AsyncButton>
          )}
        </div>
      </div>
    </PremiumModal>
  );
}
