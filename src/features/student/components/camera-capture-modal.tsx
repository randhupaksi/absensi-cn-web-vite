"use client";

import {
  PremiumModal,
  premiumModalActionsClassName,
} from "@/components/modals/premium-modal";
import { Button } from "@/components/ui/button";
import { AsyncButton } from "@/components/ui/async-button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  classifyCameraError,
  getCameraDiagnostic,
  type CameraIssue,
  unsupportedCameraIssue,
} from "@/lib/camera/camera-error";
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
  const cameraRequestRef = useRef(0);
  const [cameraError, setCameraError] = useState<CameraIssue | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isStartingCamera, setIsStartingCamera] = useState(true);
  const [cameraNotice, setCameraNotice] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setIsStartingCamera(false);
      setCameraError(unsupportedCameraIssue());
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
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function startCamera(
    nextFacingMode: "user" | "environment",
    isCancelled = () => false,
  ) {
    if (!navigator.mediaDevices?.getUserMedia) return;

    stopStream();
    const requestID = ++cameraRequestRef.current;
    setVideoReady(false);
    setIsStartingCamera(true);
    setCameraError(null);
    setCameraNotice(null);

    try {
      const stream = await openCamera(nextFacingMode);

      if (isCancelled() || requestID !== cameraRequestRef.current) {
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
      setFacingMode(
        activeFacingMode === "environment" || activeFacingMode === "user"
          ? activeFacingMode
          : nextFacingMode,
      );
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (error) {
      if (!isCancelled() && requestID === cameraRequestRef.current) {
        const issue = classifyCameraError(error);
        console.warn("Camera session failed", getCameraDiagnostic(issue));
        setCameraError(issue);
      }
    } finally {
      if (!isCancelled() && requestID === cameraRequestRef.current) {
        setIsStartingCamera(false);
      }
    }
  }

  async function openCamera(nextFacingMode: "user" | "environment") {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: nextFacingMode },
          width: { ideal: 960 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (error) {
      const issue = classifyCameraError(error);
      if (!issue.canRetryWithBasicConstraints) throw error;

      setCameraNotice(
        "Mode kamera utama belum tersedia. Portal mencoba mode kompatibilitas.",
      );
      return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }
  }

  function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (!video.videoWidth || !video.videoHeight) {
      setCameraError({
        code: "CAMERA_SESSION_INACTIVE",
        title: "Kamera belum siap",
        message: "Tunggu sebentar lalu coba ambil foto lagi.",
        canRetry: true,
        canRetryWithBasicConstraints: false,
      });
      return;
    }

    const context = canvas.getContext("2d");
    if (!context || typeof canvas.toBlob !== "function") {
      setCameraError({
        code: "CAMERA_UNSUPPORTED",
        title: "Foto belum dapat disiapkan",
        message: "Buka ulang kamera atau gunakan browser terbaru.",
        canRetry: true,
        canRetryWithBasicConstraints: false,
      });
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
          setCameraError({
            code: "CAMERA_ABORTED",
            title: "Foto belum berhasil dibuat",
            message: "Coba buka kamera dan ambil foto lagi.",
            canRetry: true,
            canRetryWithBasicConstraints: false,
          });
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
    cameraRequestRef.current += 1;
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
          <div className="flex flex-col items-center gap-3 rounded-[1.3rem] border border-rose-200 bg-rose-50/60 p-6 text-center dark:border-rose-400/20 dark:bg-rose-950/20">
            <ShieldAlert className="size-8 text-rose-500 dark:text-rose-300" />
            <div>
              <p className="text-sm font-semibold text-rose-800 dark:text-rose-100">
                {cameraError.title}
              </p>
              <p className="mt-1 text-[0.78rem] leading-5 text-rose-700/80 dark:text-rose-100/65">
                {cameraError.message}
              </p>
            </div>
            {cameraError.canRetry ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void startCamera(facingMode)}
                disabled={isStartingCamera}
                className="mt-1 min-h-10 rounded-[var(--radius-md)] border-rose-300 bg-white/70 text-rose-700 hover:bg-rose-100 dark:border-rose-400/25 dark:bg-rose-950/30 dark:text-rose-100 dark:hover:bg-rose-950/55"
              >
                <RefreshCw
                  className={`size-4 ${isStartingCamera ? "animate-spin motion-reduce:animate-none" : ""}`}
                />
                Coba lagi
              </Button>
            ) : null}
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
                void startCamera(facingMode === "user" ? "environment" : "user")
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
