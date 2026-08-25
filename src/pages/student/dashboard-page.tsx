"use client";

import { KpiCard } from "@/features/admin/dashboard/widgets/kpi-card";
import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import { AttendanceLocationEvidence } from "@/features/attendance/components/location-evidence";
import { AttendanceEvidenceModal } from "@/features/attendance/components/attendance-evidence-modal";
import {
  AttendanceStatusChangeNotice,
  hasAttendanceStatusChange,
} from "@/features/attendance/components/attendance-status-change-notice";
import { StudentShell } from "@/features/student/components/shell";
import { CameraCaptureModal } from "@/features/student/components/camera-capture-modal";
import {
  formatClock,
  formatStudentDate,
  formatStudentDateTime,
  formatStudentTime,
  StudentStatusPill,
} from "@/features/student/components/common";
import { Button } from "@/components/ui/button";
import { formatPersonName } from "@/lib/format-person-name";
import { formatDisplayLabel } from "@/lib/utils";
import { observeElementResize } from "@/lib/observe-element-resize";
import {
  PremiumModal,
  premiumModalActionsClassName,
  premiumModalFieldClassName,
  premiumModalHelperClassName,
  premiumModalLabelClassName,
  premiumModalSubmitButtonClassName,
  premiumModalSurfaceClassName,
} from "@/components/modals/premium-modal";
import { FieldError } from "@/components/ui/field-error";
import { RadixSelectField } from "@/components/ui/radix-select";
import { Textarea } from "@/components/ui/textarea";
import {
  type FieldErrors,
  hasFieldErrors,
  validateRequired,
} from "@/lib/form-validation";
import { compressUploadImage } from "@/lib/images/compress-upload-image";
import {
  calculateDistanceMeters,
  captureAttendanceLocation,
} from "@/lib/location/capture-attendance-location";
import {
  getStudentToday,
  getStudentTodayWithTimeout,
  getStudentDashboard,
	markAllStudentNotificationsRead,
	markStudentNotificationRead,
  StudentAttendanceSubmissionUncertainError,
  StudentServerBusyError,
  submitStudentDailyReport,
} from "@/services/student.service";
import type {
  StudentDailyReportPayload,
  StudentNotification,
  StudentToday,
} from "@/types/student";
import type { AttendanceLocationCaptureResult } from "@/types/location";
import type { StaffAttendanceRecord } from "@/types/staff";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Bell,
  BadgeCheck,
  Camera,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileImage,
  FileText,
  History,
  ImageUp,
  KeyRound,
  LogIn,
  LoaderCircle,
  MessageSquareWarning,
  RotateCw,
  School,
  SendHorizontal,
  ShieldAlert,
  ShieldCheck,
  TimerReset,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { AppLink as Link } from "@/components/router/app-link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { StudentDashboardSkeleton } from "@/components/loading/loading-system";
import {
  ProcessStatus,
  type ProcessStep,
} from "@/components/loading/process-status";

const reportTypeOptions = [
  { value: "HADIR", label: "Hadir", description: "Absensi masuk sekolah" },
  {
    value: "SAKIT",
    label: "Sakit",
    description: "Lampirkan bukti atau surat sakit",
  },
  {
    value: "IZIN",
    label: "Izin",
    description: "Lampirkan bukti izin atau keterangan",
  },
];

type AttendanceSubmissionStage =
  | "idle"
  | "uploading"
  | "queueing"
  | "retrying"
  | "verifying"
  | "retryable-error";

export function StudentDashboardPage() {
  const queryClient = useQueryClient();
  const photoPreviewRef = useRef("");
  const locationCaptureSequenceRef = useRef(0);
  const dashboardRetryTimerRef = useRef<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoPreviewError, setPhotoPreviewError] = useState(false);
  const [reportType, setReportType] =
    useState<StudentDailyReportPayload["type"]>("HADIR");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<
    FieldErrors<"photo" | "type" | "reason">
  >({});
  const [cameraIssue, setCameraIssue] = useState<string | null>(null);
  const [dashboardRetrySeconds, setDashboardRetrySeconds] = useState(0);
  const [loadDashboardDetails, setLoadDashboardDetails] = useState(false);
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submissionStage, setSubmissionStage] =
    useState<AttendanceSubmissionStage>("idle");
  const [queueSeconds, setQueueSeconds] = useState(0);
  const [locationState, setLocationState] = useState<
    "idle" | "loading" | "complete"
  >("idle");
  const [locationResult, setLocationResult] =
    useState<AttendanceLocationCaptureResult | null>(null);
  const [evidenceRecord, setEvidenceRecord] =
    useState<StaffAttendanceRecord | null>(null);
  const [greetingNow, setGreetingNow] = useState(() => new Date());
  const greetingRowRef = useRef<HTMLDivElement | null>(null);
  const greetingTextRef = useRef<HTMLSpanElement | null>(null);
  const greetingDateRef = useRef<HTMLSpanElement | null>(null);
  const [greetingIsInline, setGreetingIsInline] = useState(true);

  const todayQuery = useQuery({
    queryKey: ["student-today"],
    queryFn: getStudentToday,
    // This small response controls the attendance CTA. It must not wait for
    // stats, history, and notification queries during the morning burst.
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const dashboardQuery = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: getStudentDashboard,
    // The details are useful but never block the attendance action. Delay and
    // spread them out so thousands of dashboard visits do not hit the database
    // at the exact same moment.
    enabled: loadDashboardDetails,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const markNotificationReadMutation = useMutation({
    mutationFn: markStudentNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
    },
  });

  const markAllNotificationsReadMutation = useMutation({
    mutationFn: markAllStudentNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Notifikasi belum dapat ditandai sebagai dibaca.",
      );
    },
  });

  useEffect(() => {
    if (!todayQuery.isSuccess) return;
    const delayMilliseconds = 1_500 + Math.floor(Math.random() * 3_500);
    const timer = window.setTimeout(
      () => setLoadDashboardDetails(true),
      delayMilliseconds,
    );
    return () => window.clearTimeout(timer);
  }, [todayQuery.isSuccess]);

  const submitMutation = useMutation({
    mutationFn: (payload: StudentDailyReportPayload) =>
      submitStudentDailyReport(payload, setUploadProgress, (event) => {
        setSubmissionStage("queueing");
        setQueueSeconds(Math.max(1, Math.ceil(event.delayMilliseconds / 1_000)));
      }),
    onMutate: () => {
      setUploadProgress(6);
      setQueueSeconds(0);
      setSubmissionStage("uploading");
    },
    onSuccess: async (data) => {
      await completeAttendanceSubmission(data);
    },
    onError: async (error) => {
      if (error instanceof StudentAttendanceSubmissionUncertainError) {
        await reconcileAttendanceSubmission();
        return;
      }
      setUploadProgress(0);
      setQueueSeconds(0);
      setSubmissionStage("retryable-error");
      toast.error(error instanceof Error ? error.message : "Absensi gagal dikirim.");
    },
  });

  useEffect(() => {
    if (submissionStage !== "queueing" || queueSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setQueueSeconds((seconds) => {
        if (seconds <= 1) {
          setSubmissionStage("retrying");
          return 0;
        }
        return seconds - 1;
      });
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [queueSeconds, submissionStage]);

  useEffect(
    () => () => {
      if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
      if (dashboardRetryTimerRef.current) {
        window.clearTimeout(dashboardRetryTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setGreetingNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (dashboardRetrySeconds <= 0) return;
    const timer = window.setInterval(() => {
      setDashboardRetrySeconds((seconds) => Math.max(0, seconds - 1));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [dashboardRetrySeconds]);

  useEffect(() => {
    const row = greetingRowRef.current;
    const greetingText = greetingTextRef.current;
    const greetingDate = greetingDateRef.current;
    if (!row || !greetingText || !greetingDate) return;

    const updateInlineState = () => {
      const greetingTop = greetingText.getBoundingClientRect().top;
      const dateTop = greetingDate.getBoundingClientRect().top;
      const nextInline = Math.abs(greetingTop - dateTop) < 2;
      setGreetingIsInline((current) =>
        current === nextInline ? current : nextInline,
      );
    };

    updateInlineState();
    return observeElementResize(row, updateInlineState);
  }, []);

  useEffect(() => {
    if (
      !modalOpen ||
      typeof navigator === "undefined" ||
      !navigator.permissions
    )
      return;

    let cancelled = false;
    let permissionStatus: PermissionStatus | null = null;
    let permissionChangeHandler: (() => void) | null = null;

    void navigator.permissions
      .query({ name: "geolocation" })
      .then((status) => {
        if (cancelled) return;
        permissionStatus = status;
        permissionChangeHandler = () => {
          if (
            !cancelled &&
            status.state === "granted" &&
            locationState !== "loading"
          ) {
            void refreshAttendanceLocation();
          }
        };
        status.addEventListener("change", permissionChangeHandler);
      })
      .catch(() => {
        // Safari versions without a usable Permissions API still support the
        // explicit retry button and visibility fallback below.
      });

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        !cancelled &&
        locationResult?.outcome === "permission_denied" &&
        locationState !== "loading"
      ) {
        void refreshAttendanceLocation();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      if (permissionStatus && permissionChangeHandler) {
        permissionStatus.removeEventListener("change", permissionChangeHandler);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [modalOpen, locationResult?.outcome, locationState]);

  const dashboard = dashboardQuery.data;
  const today = todayQuery.data ?? dashboard?.today;
  const stats = dashboard?.stats;
  const canSubmit = Boolean(today?.can_submit);
  const dashboardServerBusyError =
    todayQuery.error instanceof StudentServerBusyError
      ? todayQuery.error
      : null;
  const dashboardServerBusy = Boolean(dashboardServerBusyError);
  const isHoliday = today?.is_school_day === false;
  const alreadySubmitted = Boolean(today?.attendance && !today.can_submit);
  const isWindowClosed =
    !isHoliday &&
    !canSubmit &&
    !alreadySubmitted &&
    (() => {
      if (!today?.current_time || !today?.window.late_until) return false;
      const serverNow = new Date(today.current_time);
      const [h, m, s] = today.window.late_until.split(":").map(Number);
      const lateUntil = new Date(serverNow);
      lateUntil.setHours(h, m, s ?? 0, 0);
      return serverNow > lateUntil;
    })();
  const greeting = getDashboardGreeting(greetingNow);
  const isSubmissionBusy =
    submitMutation.isPending ||
    isPreparingPhoto ||
    submissionStage === "verifying";
  const isSubmissionQueued =
    submissionStage === "queueing" ||
    submissionStage === "retrying" ||
    submissionStage === "verifying";
  const submissionButton = getSubmissionButtonState({
    isPreparingPhoto,
    submissionStage,
    queueSeconds,
    uploadProgress,
  });
  const SubmissionButtonIcon = submissionButton.icon;
  const isDashboardDetailsLoading =
    !dashboard && (!loadDashboardDetails || dashboardQuery.isLoading);

  function resetCaptureState() {
    locationCaptureSequenceRef.current += 1;
    setPhotoFile(null);
    if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
    photoPreviewRef.current = "";
    setPhotoPreview("");
    setPhotoPreviewError(false);
    setReportType("HADIR");
    setReason("");
    setErrors({});
    setLocationState("idle");
    setLocationResult(null);
    setUploadProgress(0);
    setQueueSeconds(0);
    setSubmissionStage("idle");
    setCameraIssue(null);
  }

  function scheduleDashboardRetry(waitSeconds: number) {
    if (dashboardRetryTimerRef.current) return;
    const safeWaitSeconds = Math.max(1, waitSeconds);
    setDashboardRetrySeconds(safeWaitSeconds);
    dashboardRetryTimerRef.current = window.setTimeout(() => {
      dashboardRetryTimerRef.current = null;
      setDashboardRetrySeconds(0);
      void todayQuery.refetch();
    }, safeWaitSeconds * 1_000);
  }

  function handleStartAttendance() {
    if (!canSubmit) {
      if (dashboardServerBusyError) {
        const waitSeconds = dashboardServerBusyError.retryAfterSeconds;
        toast.warning("Server sedang menerima banyak absensi", {
          description: `Mohon tunggu sekitar ${waitSeconds} detik, lalu coba lagi.`,
        });
        scheduleDashboardRetry(waitSeconds);
      }
      return;
    }
    setCameraIssue(null);
    setCameraModalOpen(true);
  }

  async function handlePhotoPicked(file?: File) {
    if (!file) return;
    setCameraIssue(null);
    // Start location capture immediately from the camera interaction.
    // Waiting for image compression first can lose the browser's user-action
    // context, especially on mobile, so the permission prompt may not appear
    // when the confirmation modal is shown.
    const locationPromise = refreshAttendanceLocation();
    setIsPreparingPhoto(true);
    setErrors({});

    try {
      const uploadFile = await compressUploadImage(file);
      if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
      const previewUrl = await createReliablePhotoPreview(uploadFile);
      photoPreviewRef.current = previewUrl;
      setPhotoFile(uploadFile);
      setPhotoPreview(previewUrl);
      setPhotoPreviewError(false);
      setModalOpen(true);
      void locationPromise;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Foto tidak dapat diproses. Silakan ambil ulang foto.";
      setErrors({ photo: message });
      toast.error(message);
      setCameraIssue(
        "Foto dari kamera belum dapat diproses. Silakan buka kamera lagi untuk mengambil foto baru.",
      );
    } finally {
      setIsPreparingPhoto(false);
    }
  }

  async function refreshAttendanceLocation() {
    const sequence = ++locationCaptureSequenceRef.current;
    setLocationState("loading");
    const result = await captureAttendanceLocation();
    if (sequence === locationCaptureSequenceRef.current) {
      setLocationResult(result);
      setLocationState("complete");
    }
    return result;
  }

  function handleSubmit() {
    const nextErrors: FieldErrors<"photo" | "type" | "reason"> = {};
    validateRequired(nextErrors, "photo", photoFile, "Foto absensi siswa");
    validateRequired(nextErrors, "type", reportType, "Keterangan");
    if (reportType === "IZIN" || reportType === "SAKIT") {
      validateRequired(
        nextErrors,
        "reason",
        reason,
        `Alasan ${reportType === "SAKIT" ? "sakit" : "izin"}`,
      );
    }
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors) || !photoFile || photoPreviewError) return;

    submitMutation.mutate({
      type: reportType,
      reason: reason.trim(),
      photo: photoFile,
      location: locationResult?.capture ?? { client_status: "unavailable" },
    });
  }

  async function completeAttendanceSubmission(data: StudentToday) {
    if (data.can_submit !== false || !data.attendance) {
      setUploadProgress(0);
      setQueueSeconds(0);
      setSubmissionStage("retryable-error");
      toast.error("Absensi belum tercatat. Silakan coba kirim lagi.");
      return;
    }

    setUploadProgress(100);
    setQueueSeconds(0);
    setSubmissionStage("idle");
    toast.success("Absensi berhasil dicatat.");
    setModalOpen(false);
    resetCaptureState();
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["student-today"] }),
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["student-history"] }),
      queryClient.invalidateQueries({ queryKey: ["student-profile"] }),
    ]);
  }

  async function reconcileAttendanceSubmission() {
    setSubmissionStage("verifying");
    setQueueSeconds(0);
    try {
      // This recovery check should resolve quickly after a mobile upload
      // becomes uncertain; it must not inherit the long general API timeout.
      const latestToday = await getStudentTodayWithTimeout(12_000);
      if (latestToday.can_submit === false && latestToday.attendance) {
        await completeAttendanceSubmission(latestToday);
        return;
      }
    } catch {
      // The upload result is uncertain and the status endpoint is temporarily
      // unavailable too. Keep the selected photo so the student can retry.
    }

    setUploadProgress(0);
    setSubmissionStage("retryable-error");
    toast.error(
      "Waktu tunggu server habis. Status absensi belum dapat dipastikan; foto tetap siap dikirim, silakan coba lagi.",
    );
  }

  const attendanceProcessSteps: ProcessStep[] = [
    {
      id: "capture",
      label: "Foto",
      icon: Camera,
      state: photoFile ? "complete" : "pending",
    },
    {
      id: "compress",
      label: "Optimasi",
      icon: ImageUp,
      state: isPreparingPhoto ? "active" : photoFile ? "complete" : "pending",
    },
    {
      id: "location",
      label: "Lokasi",
      icon: School,
      state:
        locationState === "loading"
          ? "active"
          : locationState === "complete" &&
              locationResult?.outcome === "captured"
            ? "complete"
            : locationState === "complete"
              ? "error"
              : "pending",
    },
    {
      id: "upload",
      label: "Kirim",
      icon: ImageUp,
      state: submitMutation.isPending
        ? "active"
        : uploadProgress >= 100
          ? "complete"
          : "pending",
    },
    {
      id: "review",
      label: "Validasi",
      icon: BadgeCheck,
      state: "pending",
    },
  ];

  return (
    <StudentShell>
      {(session) =>
        todayQuery.isLoading && !today ? (
          <StudentDashboardSkeleton />
        ) : (
          <div className="space-y-5">
            <section
              id="status-absensi-hari-ini"
              className="scroll-mt-5 overflow-hidden"
            >
              <div className="grid items-start gap-4 sm:gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="flex min-h-[300px] flex-col justify-between rounded-[1.8rem] border border-transparent bg-[linear-gradient(135deg,#0f6b58_0%,#0d8a6c_58%,#19b77e_100%)] p-5 text-white dark:border-slate-700 dark:bg-slate-900 dark:bg-none sm:min-h-[330px] sm:p-6">
                  <div className="space-y-4">
                    <div
                      ref={greetingRowRef}
                      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-emerald-50/85"
                    >
                      <span
                        ref={greetingTextRef}
                        className="font-semibold text-white"
                      >
                        {greeting.label},{" "}
                        {formatPersonName(
                          today?.profile.name ?? session.user.name,
                        ).split(" ")[0] || "Siswa"}
                        !
                      </span>
                      {greetingIsInline ? (
                        <span className="size-1 shrink-0 rounded-full bg-emerald-200" />
                      ) : null}
                      <span
                        ref={greetingDateRef}
                        className="inline-flex items-center gap-1.5 text-white/75"
                      >
                        <CalendarDays className="size-3.5" />
                        {formatDashboardGreetingDate(greetingNow)}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-emerald-50 dark:border-emerald-300/45 dark:bg-emerald-950/35 dark:text-emerald-200">
                      <ClipboardCheck className="size-3.5" />
                      Portal Absensi Siswa
                    </span>
                    <div className="max-w-2xl space-y-3">
                      <h1 className="text-[clamp(2rem,10vw,2.6rem)] font-semibold leading-[1.02] tracking-[-0.03em] [overflow-wrap:anywhere] sm:text-[3.2rem]">
                        {alreadySubmitted
                          ? "Absensi hari ini sudah terkirim."
                          : isHoliday
                            ? "Hari ini libur"
                            : isWindowClosed
                              ? "Kamu tidak hadir hari ini."
                              : "Ambil foto dan kirim absensi hari ini"}
                      </h1>
                      <p className="max-w-xl text-sm leading-6 text-emerald-50/82 min-[380px]:text-base min-[380px]:leading-7">
                        {today?.message ??
                          "Buka kamera, ambil foto, lalu pilih keterangan hadir, sakit, atau izin."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button
                      type="button"
                      onClick={handleStartAttendance}
                      disabled={
                        (!canSubmit && !dashboardServerBusy) ||
                        isPreparingPhoto ||
                        dashboardRetrySeconds > 0
                      }
                      className="h-16 rounded-full border border-white/28 bg-white px-7 text-base font-semibold text-emerald-800 shadow-[0_16px_30px_rgba(2,44,34,0.18)] transition-[transform,box-shadow,background-color] duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.005] hover:bg-emerald-50 hover:shadow-[0_20px_38px_rgba(2,44,34,0.24)] active:translate-y-0 active:scale-[0.98] active:!border-emerald-300 active:!bg-emerald-50 active:!text-emerald-800 active:!shadow-[0_0_0_3px_rgba(16,185,129,0.2),0_14px_28px_rgba(16,185,129,0.18)] disabled:translate-y-0 disabled:scale-100 disabled:bg-white/35 disabled:text-white/70 dark:!border-emerald-400/50 dark:!bg-emerald-500/20 dark:!text-emerald-100 dark:shadow-[0_12px_28px_rgba(16,185,129,0.18)] dark:hover:!bg-emerald-500/30 dark:active:!border-emerald-300 dark:active:!bg-emerald-500/35 dark:active:!text-white dark:disabled:!border-slate-700 dark:disabled:!bg-slate-800/70 dark:disabled:!text-slate-500"
                    >
                      {isPreparingPhoto ? (
                        <TimerReset className="size-5" />
                      ) : dashboardServerBusy ? (
                        <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" />
                      ) : canSubmit ? (
                        <Camera className="size-5 dark:text-emerald-300" />
                      ) : isHoliday ? (
                        <TimerReset className="size-5" />
                      ) : isWindowClosed ? (
                        <ShieldAlert className="size-5" />
                      ) : (
                        <TimerReset className="size-5" />
                      )}
                      {isPreparingPhoto
                        ? "Menyiapkan Foto..."
                        : cameraIssue
                          ? "Coba Buka Kamera Lagi"
                        : dashboardServerBusy
                          ? dashboardRetrySeconds > 0
                            ? `Coba Lagi Dalam ${formatQueueCountdown(dashboardRetrySeconds)}`
                            : "Server Sedang Sibuk"
                        : canSubmit
                          ? "Absen Hari Ini"
                          : isHoliday
                            ? "Hari Libur"
                            : isWindowClosed
                              ? "Waktu Absensi Sudah Habis"
                              : "Absensi Sudah Tercatat"}
                    </Button>
                    <div className="rounded-2xl border border-white/18 bg-white/12 px-4 py-3 text-sm leading-6 text-emerald-50/86">
                      {cameraIssue ? (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm leading-6 text-emerald-50/90">
                          <span>{cameraIssue}</span>
                          <button
                            type="button"
                            onClick={handleStartAttendance}
                            className="font-semibold text-white underline decoration-white/50 underline-offset-4 transition hover:decoration-white"
                          >
                            Buka Kamera Lagi
                          </button>
                        </div>
                      ) : dashboardServerBusy ? (
                        "Server sedang menerima banyak absensi. Tunggu sebentar, lalu tekan tombol untuk mencoba lagi."
                      ) : isHoliday ? (
                        today?.holiday_type === "WEEKEND" ? (
                          "Sabtu dan Minggu adalah hari libur. Tidak ada absensi untuk hari ini."
                        ) : (
                          `${today?.holiday_name ?? "Tanggal ini"} tercatat sebagai hari libur sekolah. Tidak ada absensi untuk hari ini.`
                        )
                      ) : (
                        <>
                          Batas hadir {formatClock(today?.window.on_time_until)}{" "}
                          WIB. Absensi ditutup pukul{" "}
                          {formatClock(today?.window.late_until)} WIB.
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid items-start gap-4">
                  <div className="rounded-[1.35rem] border border-slate-200/80 bg-white/86 p-4 shadow-[0_18px_42px_rgba(15,23,42,0.06)] sm:rounded-[1.5rem] sm:p-5">
                    <div className="relative">
                      <div className="min-w-0 w-full">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                          Status Hari Ini
                        </p>
                        <h2 className="mt-3 text-xl font-semibold leading-tight text-slate-950 sm:text-2xl">
                          {today?.attendance
                            ? "Sudah Terekam"
                            : isHoliday
                              ? "Hari Libur"
                              : isWindowClosed
                                ? "Tidak Hadir"
                                : "Belum Ada Data"}
                        </h2>
                      </div>
                      {today?.attendance ? (
                        <span className="absolute right-0 top-0">
                          <StudentStatusPill status={today.attendance.status} />
                        </span>
                      ) : isHoliday ? (
                        <span className="absolute right-0 top-0 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          Libur
                        </span>
                      ) : isWindowClosed ? (
                        <span className="absolute right-0 top-0">
                          <StudentStatusPill status="alfa" />
                        </span>
                      ) : (
                        <span className="absolute right-0 top-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          Menunggu
                        </span>
                      )}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <InfoTile
                        icon={UserRound}
                        label="Nama"
                        value={formatPersonName(today?.profile.name) || "-"}
                        tone="profile"
                      />
                      <InfoTile
                        icon={School}
                        label="Kelas"
                        value={today?.profile.class_name ?? "-"}
                        tone="class"
                      />
                      <InfoTile
                        icon={LogIn}
                        label="Absen Masuk"
                        value={formatDashboardAttendanceValue(today?.attendance)}
                        tone="checkin"
                      />
                      <InfoTile
                        icon={BadgeCheck}
                        label="Validasi"
                        value={
                          isHoliday
                            ? "Tidak diperlukan"
                            : today?.attendance?.verified_at
                              ? isTeacherReviewer(today.attendance)
                                ? "Sudah direview walas"
                                : "Sudah direview"
                              : "Menunggu"
                        }
                        tone={
                          isHoliday
                            ? "pending"
                            : today?.attendance?.verified_at
                              ? "success"
                              : "pending"
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-[1.35rem] border border-emerald-200/70 bg-emerald-50/70 p-4 dark:border-0 sm:rounded-[1.5rem] sm:p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-[0_12px_24px_rgba(16,185,129,0.24)]">
                        <ShieldCheck className="size-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-slate-950">
                          Terkoneksi Walas, Guru Mapel, dan BK
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Absensi, izin, dan sakit langsung masuk ke antrian
                          validasi.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 items-start gap-3 sm:gap-4 xl:grid-cols-4">
              <KpiCard
                label="Total Absen"
                value={
                  isDashboardDetailsLoading
                    ? "…"
                    : String(stats?.total_attendance ?? 0)
                }
                icon={History}
                accentClass="bg-emerald-100 text-emerald-700"
              />
              <KpiCard
                label="Hadir"
                value={
                  isDashboardDetailsLoading ? "…" : String(stats?.present ?? 0)
                }
                icon={CheckCircle2}
                accentClass="bg-sky-100 text-sky-700"
              />
              <KpiCard
                label="Alfa"
                value={isDashboardDetailsLoading ? "…" : String(stats?.alpha ?? 0)}
                icon={ShieldAlert}
                accentClass="bg-rose-100 text-rose-700"
              />
              <KpiCard
                label="Pengajuan"
                value={
                  isDashboardDetailsLoading
                    ? "…"
                    : String(stats?.pending_requests ?? 0)
                }
                icon={FileText}
                accentClass="bg-amber-100 text-amber-700"
              />
            </section>

            <section className="grid items-start gap-5 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-[1.8rem] border border-white/80 bg-white/88 p-5 shadow-[0_18px_54px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">
                      Histori Terbaru
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Rekap absensi terakhir yang sudah masuk sistem.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/siswa/history"
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-[0_10px_22px_rgba(16,185,129,0.12)]"
                  >
                    Lihat
                    <ArrowUpRight className="size-4" />
                  </Link>
                </div>

                <div className="mt-5 space-y-3">
                  {isDashboardDetailsLoading ? (
                    <DashboardDetailsLoading label="Memuat histori terbaru" />
                  ) : (dashboard?.recent_attendance ?? []).length > 0 ? (
                    (dashboard?.recent_attendance ?? [])
                      .slice(0, 5)
                      .map((record) => (
                        <div
                          key={record.id}
                          className="flex flex-row items-start justify-between gap-3 rounded-[1.2rem] border border-slate-200/75 bg-slate-50/70 p-4"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-950">
                              {formatStudentDate(record.attendance_date)}
                            </p>
                          {record.check_in_at ? (
                            <p className="mt-1 text-sm text-slate-500">
                              Absen Masuk {formatDashboardCheckIn(record)}
                            </p>
                          ) : (
                            <p className="mt-1 text-sm text-slate-500">
                              {formatDashboardCheckIn(record)}
                            </p>
                          )}
                        </div>
                          <div className="flex shrink-0 flex-col items-end gap-3 sm:flex-row sm:items-center">
                            <div className="flex flex-col items-end gap-2">
                              <StudentStatusPill status={record.status} />
                              <AttendanceStatusChangeNotice record={record} compact />
                            </div>
                            {record.photo_url ? (
                              <button
                                type="button"
                                onClick={() => setEvidenceRecord(record)}
                                className="inline-flex size-9 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-500/60 dark:bg-slate-900 dark:!text-emerald-300 dark:hover:bg-emerald-950/60"
                                aria-label="Buka foto absensi"
                              >
                                <FileImage className="size-4" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))
                  ) : (
                    <EmptyState
                      icon={History}
                      title="Belum ada histori"
                      description="Data absensi akan tampil setelah kamu mengirim absensi."
                      tone="notice"
                    />
                  )}
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-white/80 bg-white/88 p-5 shadow-[0_18px_54px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">
                      Notification Center
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Aktivitas absensi, pengajuan, dan keamanan akun kamu.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {dashboard?.unread_notifications ? (
                      <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-xs font-bold text-white">
                        {dashboard.unread_notifications > 99
                          ? "99+"
                          : dashboard.unread_notifications}
                      </span>
                    ) : null}
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <Bell className="size-5" />
                    </span>
                  </div>
                </div>

                {!isDashboardDetailsLoading && dashboard?.unread_notifications ? (
                  <button
                    type="button"
                    onClick={() => markAllNotificationsReadMutation.mutate()}
                    disabled={markAllNotificationsReadMutation.isPending}
                    className="mt-4 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {markAllNotificationsReadMutation.isPending
                      ? "Memperbarui..."
                      : "Tandai semua sudah dibaca"}
                  </button>
                ) : null}

                <div className="mt-5 space-y-3">
                  {isDashboardDetailsLoading ? (
                    <DashboardDetailsLoading label="Memuat informasi terbaru" />
                  ) : (dashboard?.notifications ?? []).length === 0 ? (
                    <EmptyState
                      icon={Bell}
                      title="Belum ada notifikasi baru"
                      description="Aktivitas penting tentang absensi, pengajuan, dan akun kamu akan muncul di sini."
                      compact
                    />
                  ) : (
                    (dashboard?.notifications ?? []).map((item) => (
                      <StudentNotificationCard
                        key={item.id}
                        item={item}
                        onRead={() => {
                          if (!item.read_at) {
                            markNotificationReadMutation.mutate(item.id);
                          }
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </section>

            <PremiumModal
              open={modalOpen}
              onOpenChange={(open) => {
                // Do not let a delayed tap on slow mobile browsers close the
                // confirmation while the photo is still being sent.
                if (!open && isSubmissionBusy) return;
                setModalOpen(open);
                if (!open) resetCaptureState();
              }}
              disablePointerDismissal
              title="Foto Absensi Siswa"
              description="Periksa foto, pilih keterangan, lalu kirim agar walas dapat melakukan validasi."
              icon={ImageUp}
              className="sm:!max-w-[760px]"
              footer={
                <div
                  className={cn(
                    premiumModalActionsClassName,
                    "!mt-0 !pt-0 before:hidden",
                  )}
                >
                  <Button
                    variant="outline"
                    className="h-12 min-w-0 flex-1 rounded-[1.1rem] border-slate-200 px-3 text-sm font-semibold text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-200 hover:text-slate-950 hover:shadow-[0_14px_28px_rgba(15,23,42,0.14)] active:translate-y-0 active:scale-[0.96] active:bg-slate-300 sm:flex-none sm:px-5"
                    onClick={() => {
                      setModalOpen(false);
                      resetCaptureState();
                    }}
                    disabled={isSubmissionBusy}
                  >
                    Batal
                  </Button>
                  <Button
                    data-modal-submit
                    className={cn(
                      premiumModalSubmitButtonClassName,
                      "min-w-0 flex-1 sm:flex-none",
                    )}
                    onClick={handleSubmit}
                    disabled={isSubmissionBusy}
                    aria-busy={isSubmissionBusy}
                  >
                    <SubmissionButtonIcon
                      className={cn(
                        "size-4",
                        submissionButton.isAnimated &&
                          "animate-spin motion-reduce:animate-none",
                      )}
                    />
                    <span>{submissionButton.label}</span>
                  </Button>
                </div>
              }
            >
              <div className="space-y-5">
                {isSubmissionQueued ||
                submissionStage === "retryable-error" ? (
                  <AttendanceSubmissionFeedback
                    stage={submissionStage}
                    queueSeconds={queueSeconds}
                  />
                ) : null}
                <ProcessStatus
                  steps={attendanceProcessSteps}
                  progress={
                    submitMutation.isPending ? uploadProgress : undefined
                  }
                />
                <div className={premiumModalSurfaceClassName}>
                  <div className="space-y-5 p-4 sm:p-5">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-emerald-700/75">
                            Bukti kehadiran
                          </p>
                          <p className="mt-1 text-[0.92rem] font-semibold text-slate-800">
                            Foto absensi siswa
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.68rem] font-semibold text-emerald-700 dark:!border-emerald-500/60 dark:!bg-emerald-950/70 dark:!text-emerald-300">
                          <BadgeCheck className="size-3.5" />
                          Privasi foto terjaga
                        </span>
                      </div>
                      <div className="overflow-hidden rounded-[1.35rem] border border-emerald-200/70 bg-slate-950 shadow-[0_18px_36px_rgba(15,23,42,0.12)]">
                        {photoPreview && !photoPreviewError ? (
                          <img
                            src={photoPreview}
                            alt="Preview foto absensi siswa"
                            className="h-[300px] w-full object-cover sm:h-[350px]"
                            onError={() => {
                              setPhotoPreviewError(true);
                              setErrors((current) => ({
                                ...current,
                                photo:
                                  "Foto belum dapat ditampilkan di browser ini. Silakan ambil ulang foto.",
                              }));
                            }}
                          />
                        ) : (
                          <div className="flex h-[300px] flex-col items-center justify-center gap-2 px-5 text-center text-sm text-slate-300 sm:h-[350px]">
                            <ShieldAlert className="size-6 text-amber-300" />
                            <span>
                              Foto belum dapat ditampilkan. Silakan ambil ulang
                              foto.
                            </span>
                          </div>
                        )}
                      </div>
                      <FieldError message={errors.photo} />
                      <p className="text-xs leading-5 text-slate-500">
                        Foto otomatis dikompres sebelum dikirim agar upload
                        tetap ringan.
                      </p>
                    </div>

                    <AttendanceLocationEvidence
                      className="border-t border-slate-200/75 pt-6"
                      evidence={
                        locationResult
                          ? {
                              location_latitude:
                                locationResult.capture.latitude,
                              location_longitude:
                                locationResult.capture.longitude,
                              location_accuracy_meters:
                                locationResult.capture.accuracy_meters,
                              location_distance_meters:
                                locationResult.capture.latitude !== undefined &&
                                locationResult.capture.longitude !==
                                  undefined &&
                                today?.location_policy?.configured &&
                                today.location_policy.latitude !== undefined &&
                                today.location_policy.longitude !== undefined
                                  ? calculateDistanceMeters(
                                      locationResult.capture.latitude,
                                      locationResult.capture.longitude,
                                      today.location_policy.latitude,
                                      today.location_policy.longitude,
                                    )
                                  : undefined,
                              location_captured_at:
                                locationResult.capture.captured_at,
                              location_status:
                                locationResult.outcome === "captured"
                                  ? "captured_unverified"
                                  : locationResult.outcome,
                            }
                          : {}
                      }
                      isLoading={locationState === "loading"}
                      message={
                        locationResult?.outcome === "captured" &&
                        today?.location_policy?.configured
                          ? "Lokasi siap dihitung terhadap radius sekolah saat absensi dikirim."
                          : locationResult?.message
                      }
                      onRetry={() => void refreshAttendanceLocation()}
                    />

                    <div className="space-y-4 border-t border-slate-200/75 pt-5">
                      <div className={premiumModalFieldClassName}>
                        <div>
                          <label className={premiumModalLabelClassName}>
                            Keterangan
                          </label>
                          <p className={premiumModalHelperClassName}>
                            Pilih status kehadiran untuk pengajuan hari ini.
                          </p>
                        </div>
                        <RadixSelectField
                          value={reportType}
                          onValueChange={(value) =>
                            setReportType(
                              value as StudentDailyReportPayload["type"],
                            )
                          }
                          placeholder="Pilih keterangan"
                          options={reportTypeOptions}
                        />
                        <FieldError message={errors.type} />
                      </div>

                      {reportType === "IZIN" || reportType === "SAKIT" ? (
                        <div className={premiumModalFieldClassName}>
                          <label className={premiumModalLabelClassName}>
                            Alasan {reportType === "SAKIT" ? "Sakit" : "Izin"}
                          </label>
                          <p className={premiumModalHelperClassName}>
                            Keterangan ini akan dibaca oleh walas dan BK.
                          </p>
                          <Textarea
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            placeholder="Tuliskan keterangan singkat dan jelas"
                            className="min-h-[130px] resize-none"
                          />
                          <FieldError message={errors.reason} />
                        </div>
                      ) : (
                        <div className="rounded-[1.1rem] border border-emerald-200 bg-emerald-50/80 p-4 text-sm leading-6 text-emerald-800 dark:!border-emerald-500/60 dark:!bg-emerald-950/70 dark:!text-emerald-300">
                          Untuk status hadir, foto akan langsung masuk sebagai
                          data absensi dan menunggu validasi walas.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </PremiumModal>

            <AttendanceEvidenceModal
              record={evidenceRecord}
              onOpenChange={(open) => !open && setEvidenceRecord(null)}
            />

            {cameraModalOpen ? (
              <CameraCaptureModal
                onClose={() => setCameraModalOpen(false)}
                onCapture={(file) => {
                  setCameraModalOpen(false);
                  void handlePhotoPicked(file);
                }}
              />
            ) : null}
          </div>
        )
      }
    </StudentShell>
  );
}

function getSubmissionButtonState({
  isPreparingPhoto,
  submissionStage,
  queueSeconds,
  uploadProgress,
}: {
  isPreparingPhoto: boolean;
  submissionStage: AttendanceSubmissionStage;
  queueSeconds: number;
  uploadProgress: number;
}): { label: string; icon: LucideIcon; isAnimated: boolean } {
  if (isPreparingPhoto) {
    return { label: "Menyiapkan Foto...", icon: LoaderCircle, isAnimated: true };
  }
  if (submissionStage === "queueing") {
    return {
      label: `Menunggu Giliran ${formatQueueCountdown(queueSeconds)}`,
      icon: TimerReset,
      isAnimated: false,
    };
  }
  if (submissionStage === "retrying") {
    return {
      label: "Mencoba Mengirim Ulang...",
      icon: RotateCw,
      isAnimated: true,
    };
  }
  if (submissionStage === "verifying") {
    return {
      label: "Memeriksa Status...",
      icon: LoaderCircle,
      isAnimated: true,
    };
  }
  if (submissionStage === "retryable-error") {
    return { label: "Coba Kirim Lagi", icon: RotateCw, isAnimated: false };
  }
  if (uploadProgress >= 95) {
    return { label: "Menyimpan Absensi...", icon: LoaderCircle, isAnimated: true };
  }
  if (uploadProgress > 6) {
    return {
      label: `Mengunggah Foto... ${Math.round(uploadProgress)}%`,
      icon: LoaderCircle,
      isAnimated: true,
    };
  }
  if (submissionStage === "uploading") {
    return {
      label: "Menyiapkan Pengiriman...",
      icon: LoaderCircle,
      isAnimated: true,
    };
  }
  return { label: "Kirim Absensi", icon: SendHorizontal, isAnimated: false };
}

function StudentNotificationCard({
  item,
  onRead,
}: {
  item: StudentNotification;
  onRead: () => void;
}) {
  const presentation = getNotificationPresentation(item);
  const Icon = presentation.icon;
  const isUnread = !item.read_at;
  const actor = [item.actor_name, item.actor_role && formatDisplayLabel(item.actor_role)]
    .filter(Boolean)
    .join(" · ");
  const content = (
    <>
      <span
        className={cn(
          "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[0.9rem]",
          presentation.iconClassName,
        )}
      >
        <Icon className="size-[1.05rem]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-950">{item.title}</span>
          {isUnread ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.62rem] font-bold text-emerald-700">
              Baru
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-sm leading-6 text-slate-500">
          {item.description}
        </span>
        <span className="mt-3 flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-right text-xs font-medium text-slate-400">
          {actor ? <span>{actor}</span> : null}
          <span className="ml-auto">{formatStudentDateTime(item.created_at)}</span>
        </span>
      </span>
      {item.action_url ? (
        <ArrowUpRight className="mt-1 size-4 shrink-0 text-slate-400" />
      ) : null}
    </>
  );
  const className = cn(
    "flex w-full items-start gap-3 rounded-[1.2rem] border p-4 text-left transition",
    isUnread
      ? cn("border", presentation.borderClassName, presentation.surfaceClassName)
      : "border-slate-200/75 bg-slate-50/50 opacity-80",
    item.action_url && "hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]",
  );

  if (item.action_url) {
    return (
      <Link href={item.action_url} onClick={onRead} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onRead} className={className}>
      {content}
    </button>
  );
}

function getNotificationPresentation(item: StudentNotification): {
  icon: LucideIcon;
  iconClassName: string;
  borderClassName: string;
  surfaceClassName: string;
} {
  if (item.category === "security") {
    return {
      icon: KeyRound,
      iconClassName: "bg-rose-100 text-rose-700",
      borderClassName: "border-rose-200",
      surfaceClassName: "bg-rose-50/70",
    };
  }
  if (item.type === "attendance_corrected") {
    return {
      icon: MessageSquareWarning,
      iconClassName: "bg-amber-100 text-amber-700",
      borderClassName: "border-amber-200",
      surfaceClassName: "bg-amber-50/70",
    };
  }
  if (item.type === "attendance_reviewed") {
    return {
      icon: FileCheck2,
      iconClassName: "bg-sky-100 text-sky-700",
      borderClassName: "border-sky-200",
      surfaceClassName: "bg-sky-50/70",
    };
  }
  if (item.category === "submission") {
    return {
      icon: FileText,
      iconClassName: "bg-violet-100 text-violet-700",
      borderClassName: "border-violet-200",
      surfaceClassName: "bg-violet-50/70",
    };
  }
  if (item.priority === "success") {
    return {
      icon: CheckCircle2,
      iconClassName: "bg-emerald-100 text-emerald-700",
      borderClassName: "border-emerald-200",
      surfaceClassName: "bg-emerald-50/70",
    };
  }
  return {
    icon: Bell,
    iconClassName: "bg-slate-100 text-slate-600",
    borderClassName: "border-slate-200",
    surfaceClassName: "bg-slate-50/70",
  };
}

function AttendanceSubmissionFeedback({
  stage,
  queueSeconds,
}: {
  stage: AttendanceSubmissionStage;
  queueSeconds: number;
}) {
  const isRetryableError = stage === "retryable-error";
  const isVerifying = stage === "verifying";
  const Icon = isRetryableError ? ShieldAlert : isVerifying ? LoaderCircle : TimerReset;
  const title = isRetryableError
    ? "Absensi belum tercatat"
    : isVerifying
      ? "Memeriksa status absensi"
      : "Server sedang menerima banyak absensi";
  const description = isRetryableError
    ? "Waktu tunggu server habis atau koneksi terputus. Status absensi belum dapat dipastikan. Foto tetap siap dikirim; gunakan tombol Coba Kirim Lagi tanpa mengambil foto ulang."
    : isVerifying
      ? "Kami mengecek apakah pengiriman sebelumnya sudah berhasil dicatat."
      : `Foto dan data kamu masih kami coba kirim. Mohon tunggu ${formatQueueCountdown(queueSeconds)}.`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-[1.2rem] border p-4",
        isRetryableError
          ? "border-amber-200 bg-amber-50/85 text-amber-900"
          : "border-sky-200 bg-sky-50/85 text-sky-900",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-[0.95rem] bg-white shadow-[0_8px_18px_rgba(15,23,42,0.07)]",
          isRetryableError ? "text-amber-600" : "text-sky-600",
        )}
      >
        <Icon
          className={cn(
            "size-5",
            isVerifying && "animate-spin motion-reduce:animate-none",
          )}
        />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-6 opacity-80">{description}</p>
      </div>
    </div>
  );
}

function formatQueueCountdown(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, "0")}:${String(
    safeSeconds % 60,
  ).padStart(2, "0")}`;
}

function InfoTile({
  icon: Icon,
  label,
  value,
  tone = "profile",
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  tone?: "profile" | "class" | "checkin" | "success" | "pending";
}) {
  const toneClassName = {
    profile: "bg-indigo-50 text-indigo-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    class: "bg-violet-50 text-violet-700",
    checkin: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
    success: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[1.15rem] border border-slate-200/75 bg-white/72 px-3.5 py-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.035)]">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${toneClassName}`}
      >
        <Icon className="size-[1.1rem]" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>
        <p className="mt-1 truncate font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function getDashboardGreeting(now: Date) {
  const hour = now.getHours();
  if (hour < 11) return { label: "Selamat Pagi" };
  if (hour < 15) return { label: "Selamat Siang" };
  if (hour < 18) return { label: "Selamat Sore" };
  return { label: "Selamat Malam" };
}

function formatDashboardGreetingDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

async function createReliablePhotoPreview(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    await waitForPhotoPreview(objectUrl);
    return objectUrl;
  } catch {
    // Some older Android/Vivo browser builds fail to render a Blob URL even
    // though the same JPEG is valid. Use a data URL as a compatibility
    // fallback, then validate that source too before opening the confirmation.
    URL.revokeObjectURL(objectUrl);
    const dataUrl = await readPhotoAsDataUrl(file);
    await waitForPhotoPreview(dataUrl);
    return dataUrl;
  }
}

function waitForPhotoPreview(source: string) {
  return new Promise<void>((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => {
      image.src = "";
      reject(new Error("preview timeout"));
    }, 8_000);
    image.onload = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("preview decode failed"));
    };
    image.src = source;
  });
}

function readPhotoAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    const timeout = window.setTimeout(() => {
      reader.abort();
      reject(new Error("preview fallback timeout"));
    }, 8_000);
    reader.onload = () => {
      window.clearTimeout(timeout);
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("preview fallback failed"));
      }
    };
    reader.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("preview fallback failed"));
    };
    reader.readAsDataURL(file);
  });
}

function DashboardDetailsLoading({ label }: { label: string }) {
  return (
    <div
      className="flex min-h-28 items-center justify-center gap-2 rounded-[1.2rem] border border-dashed border-slate-200 bg-slate-50/70 px-4 text-sm font-medium text-slate-500"
      role="status"
    >
      <LoaderCircle className="size-4 animate-spin text-emerald-600 motion-reduce:animate-none" />
      {label}
    </div>
  );
}

function formatDashboardCheckIn(record?: StaffAttendanceRecord) {
  if (record && !record.check_in_at) {
    if (hasAttendanceStatusChange(record)) {
      return formatDashboardStaffActionTime(record, "Dikoreksi walas");
    }
    if (record.verified_at) {
      return formatDashboardStaffActionTime(
        record,
        isTeacherReviewer(record) ? "Direview walas" : "Direview",
      );
    }
  }
  return formatStudentTime(record?.check_in_at);
}

function formatDashboardAttendanceValue(record?: StaffAttendanceRecord) {
  if (record && !record.check_in_at) {
    const actionTime = hasAttendanceStatusChange(record)
      ? record.status_changed_at
      : record.verified_at;
    if (actionTime) return formatStudentTime(actionTime);
  }
  return formatStudentTime(record?.check_in_at);
}

function formatDashboardStaffActionTime(
  record: StaffAttendanceRecord,
  label: "Dikoreksi walas" | "Direview walas" | "Direview",
) {
  const actionTime = hasAttendanceStatusChange(record)
    ? record.status_changed_at
    : record.verified_at;
  const formattedTime = formatStudentTime(actionTime, "-");
  return `${label} pada ${formattedTime}`;
}

function isTeacherReviewer(record: StaffAttendanceRecord) {
  return record.verified_by_role?.trim().toUpperCase() === "TEACHER";
}
