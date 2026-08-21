"use client";

import {
  PremiumModal,
  premiumModalActionsClassName,
} from "@/components/modals/premium-modal";
import { Button } from "@/components/ui/button";
import { AsyncButton } from "@/components/ui/async-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, RefreshCw, ShieldAlert, SwitchCamera } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CameraCaptureModalProps = {
  onCapture: (file: File) => void;
  onClose: () => void;
};

export function CameraCaptureModal({
  onCapture,
  onClose,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "user",
  );
  const [isStartingCamera, setIsStartingCamera] = useState(true);
  const [cameraNotice, setCameraNotice] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Browser ini tidak menyediakan akses kamera. Absensi hadir harus menggunakan kamera langsung.",
      );
      return () => {
        cancelled = true;
        stopStream();
      };
    }

    void startCamera("user", () => cancelled);

    return () => {
      cancelled = true;
      stopStream();
    };
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function startCamera(
    nextFacingMode: "user" | "environment",
    isCancelled = () => false,
  ) {
    if (!navigator.mediaDevices?.getUserMedia) return;

    stopStream();
    setVideoReady(false);
    setIsStartingCamera(true);
    setCameraError(null);
    setCameraNotice(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          // `ideal` asks for the selected camera without rejecting older
          // Android WebViews that only expose a generic video source.
          facingMode: { ideal: nextFacingMode },
          // A modest preview avoids an unnecessarily large frame/canvas on
          // Android Go while remaining more than sufficient for face proof.
          width: { ideal: 960 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (isCancelled()) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const activeFacingMode = stream
        .getVideoTracks()[0]
        ?.getSettings().facingMode;
      if (activeFacingMode && activeFacingMode !== nextFacingMode) {
        setCameraNotice(
          "Kamera yang dipilih tidak tersedia. Browser menggunakan kamera yang tersedia.",
        );
      }
      streamRef.current = stream;
      setFacingMode(nextFacingMode);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      if (!isCancelled()) {
        setCameraError(
          "Kamera tidak dapat diakses. Pastikan izin kamera sudah diaktifkan di browser.",
        );
      }
    } finally {
      if (!isCancelled()) setIsStartingCamera(false);
    }
  }

  function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (!video.videoWidth || !video.videoHeight) {
      setCameraError("Kamera belum siap. Coba tunggu sebentar lalu ambil foto.");
      return;
    }

    const context = canvas.getContext("2d");
    if (!context || typeof canvas.toBlob !== "function") {
      setCameraError(
        "Browser tidak dapat menyiapkan foto kamera. Silakan buka ulang kamera atau gunakan browser terbaru.",
      );
      return;
    }

    const longestSide = Math.max(video.videoWidth, video.videoHeight);
    const captureScale = Math.min(1, 960 / longestSide);
    canvas.width = Math.max(1, Math.round(video.videoWidth * captureScale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * captureScale));

    // Front-camera frames can arrive horizontally mirrored on some Android
    // camera/browser combinations. Normalize the saved selfie once so the
    // submitted photo is readable in the same orientation as real life.
    if (facingMode === "user") {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setIsCapturing(true);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setIsCapturing(false);
          setCameraError(
            "Foto belum berhasil dibuat dari kamera. Silakan coba ambil foto lagi.",
          );
          return;
        }
        const file = new File([blob], "absensi.jpg", {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        setIsCapturing(false);
        stopStream();
        onCapture(file);
      },
      "image/jpeg",
      0.68,
    );
  }

  function handleClose() {
    stopStream();
    onClose();
  }

  return (
    <PremiumModal
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
      title="Ambil Foto Absensi"
      description="Arahkan kamera ke wajah kamu, lalu klik Ambil Foto."
      icon={Camera}
    >
      <div className="space-y-4">
        {cameraError ? (
          <div className="flex flex-col items-center gap-3 rounded-[1.3rem] border border-rose-200 bg-rose-50/60 p-6 text-center">
            <ShieldAlert className="size-8 text-rose-500" />
            <p className="text-[0.88rem] font-medium text-rose-700">
              {cameraError}
            </p>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-[1.3rem] border border-emerald-200/70 bg-slate-950">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onCanPlay={() => setVideoReady(true)}
              className={`h-[300px] w-full object-cover ${
                facingMode === "user" ? "scale-x-[-1]" : ""
              }`}
            />
            {!videoReady || isStartingCamera ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/92 p-6 text-center">
                <Skeleton className="absolute inset-0 rounded-none bg-slate-800/80" />
                <RefreshCw className="relative size-8 animate-spin text-emerald-300 motion-reduce:animate-none" />
              </div>
            ) : null}
          </div>
        )}
        {cameraNotice ? (
          <p className="rounded-[1rem] border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
            {cameraNotice}
          </p>
        ) : null}
        <canvas ref={canvasRef} className="hidden" />

        <div className={`${premiumModalActionsClassName} before:hidden`}>
          <Button
            type="button"
            variant="outline"
            className="h-12 min-w-0 flex-1 rounded-[1.1rem] border-slate-200 px-3 text-sm font-semibold text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-200 hover:text-slate-950 hover:shadow-[0_14px_28px_rgba(15,23,42,0.14)] active:translate-y-0 active:scale-[0.96] active:bg-slate-300 sm:flex-none sm:px-5"
            onClick={handleClose}
          >
            Batal
          </Button>
          {!cameraError && (
            <Button
              type="button"
              variant="outline"
              aria-label={
                facingMode === "user"
                  ? "Gunakan kamera belakang"
                  : "Gunakan kamera depan"
              }
              className="h-12 min-w-0 flex-1 rounded-[1.1rem] border-emerald-200 px-3 text-sm font-semibold text-emerald-700 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 active:scale-[0.96] sm:flex-none sm:px-4"
              onClick={() =>
                void startCamera(
                  facingMode === "user" ? "environment" : "user",
                )
              }
              disabled={isStartingCamera}
            >
              {isStartingCamera ? (
                <RefreshCw className="size-4 animate-spin motion-reduce:animate-none" />
              ) : (
                <SwitchCamera className="size-4" />
              )}
              <span className="sr-only sm:not-sr-only">Ganti Kamera</span>
            </Button>
          )}
          {!cameraError && (
            <AsyncButton
              type="button"
              data-modal-submit
              isPending={!videoReady || isStartingCamera || isCapturing}
              pendingLabel=""
              icon={Camera}
              onClick={handleCapture}
              className="h-12 min-w-0 flex-1 rounded-[1.1rem] bg-emerald-700 px-3 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(22,101,52,0.2)] transition-all duration-200 hover:bg-emerald-800 active:scale-[0.96] active:bg-emerald-900 disabled:bg-slate-300 sm:flex-none sm:px-5"
            >
              Ambil Foto
            </AsyncButton>
          )}
        </div>
      </div>
    </PremiumModal>
  );
}
