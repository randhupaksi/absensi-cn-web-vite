"use client";

import { KpiCard } from "@/features/admin/dashboard/widgets/kpi-card";
import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import { AttendanceLocationEvidence } from "@/features/attendance/components/location-evidence";
import { AttendanceEvidenceModal } from "@/features/attendance/components/attendance-evidence-modal";
import { StudentShell } from "@/features/student/components/shell";
import { CameraCaptureModal } from "@/features/student/components/camera-capture-modal";
import { ModalActions } from "@/features/admin/management/shared/section-ui";
import {
  formatClock,
  formatStudentDate,
  formatStudentDateTime,
  formatStudentTime,
  StudentStatusPill,
  StudentSubmissionPill,
} from "@/features/student/components/common";
import { Button } from "@/components/ui/button";
import {
  PremiumModal,
  premiumModalFieldClassName,
  premiumModalHelperClassName,
  premiumModalLabelClassName,
  premiumModalSurfaceClassName,
} from "@/components/modals/premium-modal";
import { FieldError } from "@/components/ui/field-error";
import { RadixSelectField } from "@/components/ui/radix-select";
import { Textarea } from "@/components/ui/textarea";
import { type FieldErrors, hasFieldErrors, validateRequired } from "@/lib/form-validation";
import { compressUploadImage } from "@/lib/images/compress-upload-image";
import {
  calculateDistanceMeters,
  captureAttendanceLocation,
} from "@/lib/location/capture-attendance-location";
import {
  getStudentDashboard,
  submitStudentDailyReport,
} from "@/services/student.service";
import type { StudentDailyReportPayload } from "@/types/student";
import type { AttendanceLocationCaptureResult } from "@/types/location";
import type { StaffAttendanceRecord } from "@/types/staff";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Bell,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock,
  FileImage,
  FileText,
  History,
  ImageUp,
  LogIn,
  School,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TimerReset,
  UserRound,
} from "lucide-react";
import { motion } from "motion/react";
import { AppLink as Link } from "@/components/router/app-link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { StudentDashboardSkeleton } from "@/components/loading/loading-system";
import { ProcessStatus, type ProcessStep } from "@/components/loading/process-status";

const reportTypeOptions = [
  { value: "HADIR", label: "Hadir", description: "Absensi masuk sekolah" },
  { value: "SAKIT", label: "Sakit", description: "Lampirkan bukti atau surat sakit" },
  { value: "IZIN", label: "Izin", description: "Lampirkan bukti izin atau keterangan" },
];

export function StudentDashboardPage() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const photoPreviewRef = useRef("");
  const locationCaptureSequenceRef = useRef(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [reportType, setReportType] =
    useState<StudentDailyReportPayload["type"]>("HADIR");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<FieldErrors<"photo" | "type" | "reason">>({});
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [locationState, setLocationState] = useState<"idle" | "loading" | "complete">("idle");
  const [locationResult, setLocationResult] = useState<AttendanceLocationCaptureResult | null>(null);
  const [evidenceRecord, setEvidenceRecord] = useState<StaffAttendanceRecord | null>(null);

  const dashboardQuery = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: getStudentDashboard,
    staleTime: 2 * 60_000,
    refetchOnReconnect: false,
  });

  const submitMutation = useMutation({
    mutationFn: (payload: StudentDailyReportPayload) =>
      submitStudentDailyReport(payload, setUploadProgress),
    onMutate: () => setUploadProgress(6),
    onSuccess: async (data) => {
      if (data?.can_submit !== false) {
        toast.error("Absensi gagal tersimpan, silakan coba lagi.");
        return;
      }
      setUploadProgress(100);
      toast.success("Absensi berhasil dikirim.");
      setModalOpen(false);
      resetCaptureState();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["student-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["student-history"] }),
        queryClient.invalidateQueries({ queryKey: ["student-profile"] }),
      ]);
    },
    onError: (error: Error) => {
      setUploadProgress(0);
      toast.error(error.message);
    },
  });

  useEffect(
    () => () => {
      if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
    },
    [],
  );

  const dashboard = dashboardQuery.data;
  const today = dashboard?.today;
  const stats = dashboard?.stats;
  const canSubmit = Boolean(today?.can_submit);
  const alreadySubmitted = Boolean(today?.attendance && !today.can_submit);
  const isWindowClosed = !canSubmit && !alreadySubmitted && (() => {
    if (!today?.current_time || !today?.window.late_until) return false;
    const serverNow = new Date(today.current_time);
    const [h, m, s] = today.window.late_until.split(":").map(Number);
    const lateUntil = new Date(serverNow);
    lateUntil.setHours(h, m, s ?? 0, 0);
    return serverNow > lateUntil;
  })();

  function resetCaptureState() {
    locationCaptureSequenceRef.current += 1;
    setPhotoFile(null);
    if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
    photoPreviewRef.current = "";
    setPhotoPreview("");
    setReportType("HADIR");
    setReason("");
    setErrors({});
    setLocationState("idle");
    setLocationResult(null);
    setUploadProgress(0);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleStartAttendance() {
    if (!canSubmit) return;
    void refreshAttendanceLocation();
    if (isMobileDevice()) {
      inputRef.current?.click();
    } else {
      setCameraModalOpen(true);
    }
  }

  async function handlePhotoPicked(file?: File) {
    if (!file) return;
    if (locationState === "idle") void refreshAttendanceLocation();
    setIsPreparingPhoto(true);
    setErrors({});

    try {
      const uploadFile = await compressUploadImage(file);
      if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
      const previewUrl = URL.createObjectURL(uploadFile);
      photoPreviewRef.current = previewUrl;
      setPhotoFile(uploadFile);
      setPhotoPreview(previewUrl);
      setModalOpen(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Foto tidak dapat diproses. Silakan ambil ulang foto.";
      setErrors({ photo: message });
      toast.error(message);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
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
      validateRequired(nextErrors, "reason", reason, `Alasan ${reportType === "SAKIT" ? "sakit" : "izin"}`);
    }
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors) || !photoFile) return;

    submitMutation.mutate({
      type: reportType,
      reason: reason.trim(),
      photo: photoFile,
      location: locationResult?.capture ?? { client_status: "unavailable" },
    });
  }

  const attendanceProcessSteps: ProcessStep[] = [
    {
      id: "capture",
      label: "Foto",
      icon: Camera,
      state: photoFile ? "complete" : cameraModalOpen ? "active" : "pending",
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
          : locationState === "complete" && locationResult?.outcome === "captured"
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
      {() => dashboardQuery.isLoading && !dashboard ? (
        <StudentDashboardSkeleton />
      ) : (
        <div className="space-y-5">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => void handlePhotoPicked(event.target.files?.[0])}
          />

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, ease: "easeOut" }}
            className="overflow-hidden rounded-[2rem] border border-white/82 bg-[linear-gradient(135deg,#ffffff_0%,#f7fbf6_54%,#e6f7ef_100%)] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.09)]"
          >
            <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="flex min-h-[330px] flex-col justify-between rounded-[1.6rem] border border-emerald-200/60 bg-[linear-gradient(135deg,#0f6b58_0%,#0d8a6c_58%,#19b77e_100%)] p-6 text-white shadow-[0_22px_52px_rgba(15,118,85,0.25)]">
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-50">
                    <Sparkles className="size-4" />
                    Portal Absensi Siswa
                  </span>
                  <div className="max-w-2xl space-y-3">
                    <h1 className="text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[3.2rem]">
                      {alreadySubmitted
                        ? "Absensi hari ini sudah terkirim."
                        : isWindowClosed
                          ? "Kamu tidak hadir hari ini."
                          : "Ambil foto dan kirim absensi hari ini."}
                    </h1>
                    <p className="max-w-xl text-base leading-7 text-emerald-50/82">
                      {today?.message ??
                        "Buka kamera, ambil foto, lalu pilih keterangan hadir, sakit, atau izin."}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    onClick={handleStartAttendance}
                    disabled={!canSubmit || dashboardQuery.isLoading || isPreparingPhoto}
                    className="h-16 rounded-full border border-white/28 bg-white px-7 text-base font-semibold text-emerald-800 shadow-[0_16px_30px_rgba(2,44,34,0.18)] transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:bg-emerald-50 hover:shadow-[0_22px_42px_rgba(2,44,34,0.28)] active:translate-y-0 active:scale-[0.98] disabled:translate-y-0 disabled:scale-100 disabled:bg-white/35 disabled:text-white/70"
                  >
                    {isPreparingPhoto ? (
                      <TimerReset className="size-5" />
                    ) : canSubmit ? (
                      <Camera className="size-5" />
                    ) : isWindowClosed ? (
                      <ShieldAlert className="size-5" />
                    ) : (
                      <TimerReset className="size-5" />
                    )}
                    {isPreparingPhoto
                      ? "Menyiapkan Foto..."
                      : canSubmit
                        ? "Absen Hari Ini"
                        : isWindowClosed
                          ? "Waktu Absensi Sudah Habis"
                          : "Cooldown Sampai Besok"}
                  </Button>
                  <div className="rounded-2xl border border-white/18 bg-white/12 px-4 py-3 text-sm leading-6 text-emerald-50/86">
                    Batas hadir {formatClock(today?.window.on_time_until)} WIB, terlambat sampai{" "}
                    {formatClock(today?.window.late_until)} WIB.
                  </div>
                </div>
              </div>

              <div className="grid items-start gap-4">
                <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/86 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                        Status Hari Ini
                      </p>
                      <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                        {today?.attendance
                          ? "Sudah Terekam"
                          : isWindowClosed
                            ? "Tidak Hadir"
                            : "Belum Ada Record"}
                      </h2>
                    </div>
                    {today?.attendance ? (
                      <StudentStatusPill status={today.attendance.status} />
                    ) : isWindowClosed ? (
                      <StudentStatusPill status="alfa" />
                    ) : (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                        Menunggu
                      </span>
                    )}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <InfoTile
                      icon={UserRound}
                      label="Nama"
                      value={today?.profile.name ?? "-"}
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
                      value={formatStudentTime(today?.attendance?.check_in_at)}
                      tone="checkin"
                    />
                    <InfoTile
                      icon={BadgeCheck}
                      label="Validasi"
                      value={today?.attendance?.verified_at ? "Sudah direview" : "Menunggu"}
                      tone={today?.attendance?.verified_at ? "success" : "pending"}
                    />
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-emerald-200/70 bg-emerald-50/70 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-[0_12px_24px_rgba(16,185,129,0.24)]">
                      <ShieldCheck className="size-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-950">Terkoneksi Walas dan BK</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Absensi, izin, dan sakit langsung masuk ke antrian validasi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <section className="grid grid-cols-2 items-start gap-4 xl:grid-cols-4">
            <KpiCard
              label="Total Absen"
              value={String(stats?.total_attendance ?? 0)}
              icon={History}
              accentClass="bg-emerald-100 text-emerald-700"
            />
            <KpiCard
              label="Hadir"
              value={String(stats?.present ?? 0)}
              icon={CheckCircle2}
              accentClass="bg-sky-100 text-sky-700"
            />
            <KpiCard
              label="Terlambat"
              value={String(stats?.late ?? 0)}
              icon={Clock}
              accentClass="bg-amber-100 text-amber-700"
            />
            <KpiCard
              label="Pengajuan"
              value={String(stats?.pending_requests ?? 0)}
              icon={FileText}
              accentClass="bg-rose-100 text-rose-700"
            />
          </section>

          <section className="grid items-start gap-5 xl:grid-cols-[1.08fr_0.92fr]">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.34 }}
              className="rounded-[1.8rem] border border-white/80 bg-white/88 p-5 shadow-[0_18px_54px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Histori Terbaru</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Rekap absensi terakhir yang sudah masuk sistem.
                  </p>
                </div>
                <Link
                  href="/dashboard/siswa/history"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-[0_10px_22px_rgba(16,185,129,0.12)]"
                >
                  Lihat Semua
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {(dashboard?.recent_attendance ?? []).length > 0 ? (
                  dashboard?.recent_attendance.map((record) => (
                    <div
                      key={record.id}
                      className="flex flex-col gap-3 rounded-[1.2rem] border border-slate-200/75 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-950">
                          {formatStudentDate(record.attendance_date)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Absen Masuk {formatStudentTime(record.check_in_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StudentStatusPill status={record.status} />
                        {record.photo_url ? (
                          <button
                            type="button"
                            onClick={() => setEvidenceRecord(record)}
                            className="inline-flex size-9 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 transition hover:bg-emerald-50"
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
                  />
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.13, duration: 0.34 }}
              className="rounded-[1.8rem] border border-white/80 bg-white/88 p-5 shadow-[0_18px_54px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Notification Center</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Informasi validasi dan pengajuan terbaru.
                  </p>
                </div>
                <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Bell className="size-5" />
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {(dashboard?.notifications ?? []).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.2rem] border border-slate-200/75 bg-slate-50/70 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Bell className="size-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-slate-950">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {(dashboard?.recent_submissions ?? []).slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.2rem] border border-slate-200/75 bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <StudentSubmissionPill value={item.type} />
                      <StudentSubmissionPill value={item.status} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-500">{item.reason}</p>
                    <p className="mt-2 text-xs font-medium text-slate-400">
                      {formatStudentDateTime(item.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          <PremiumModal
            open={modalOpen}
            onOpenChange={(open) => {
              setModalOpen(open);
              if (!open) resetCaptureState();
            }}
            title="Foto Absensi Siswa"
            description="Periksa foto, pilih keterangan, lalu kirim agar walas dapat melakukan validasi."
            icon={ImageUp}
            className="sm:!max-w-[760px]"
            footer={
              <ModalActions
                isPending={submitMutation.isPending || locationState === "loading"}
                onCancel={() => {
                  setModalOpen(false);
                  resetCaptureState();
                }}
                onSubmit={handleSubmit}
                submitLabel={
                  locationState === "loading" ? "Membaca Lokasi..." : "Kirim Absensi"
                }
              />
            }
          >
            <div className="space-y-5">
              <ProcessStatus
                steps={attendanceProcessSteps}
                progress={submitMutation.isPending ? uploadProgress : undefined}
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
                      <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[0.68rem] font-semibold text-slate-500">
                        Pratinjau
                      </span>
                    </div>
                    <div className="overflow-hidden rounded-[1.35rem] border border-emerald-200/70 bg-slate-950 shadow-[0_18px_36px_rgba(15,23,42,0.12)]">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Preview foto absensi siswa"
                          className="h-[300px] w-full object-cover sm:h-[350px]"
                        />
                      ) : (
                        <div className="flex h-[300px] items-center justify-center text-slate-300 sm:h-[350px]">
                          Foto belum tersedia
                        </div>
                      )}
                    </div>
                    <FieldError message={errors.photo} />
                    <p className="text-xs leading-5 text-slate-500">
                      Foto otomatis dikompres sebelum dikirim agar upload tetap ringan.
                    </p>
                  </div>

                  <AttendanceLocationEvidence
                    className="border-t border-slate-200/75 pt-6"
                      evidence={
                        locationResult
                          ? {
                              location_latitude: locationResult.capture.latitude,
                              location_longitude: locationResult.capture.longitude,
                              location_accuracy_meters: locationResult.capture.accuracy_meters,
                              location_distance_meters:
                                locationResult.capture.latitude !== undefined &&
                                locationResult.capture.longitude !== undefined &&
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
                            location_captured_at: locationResult.capture.captured_at,
                            location_status:
                              locationResult.outcome === "captured"
                                ? "captured_unverified"
                                : locationResult.outcome,
                          }
                        : {}
                    }
                    isLoading={locationState === "loading"}
                    message={
                      locationResult?.outcome === "captured" && today?.location_policy?.configured
                        ? "Lokasi siap dihitung terhadap radius sekolah saat absensi dikirim."
                        : locationResult?.message
                    }
                    onRetry={() => void refreshAttendanceLocation()}
                  />

                  <div className="space-y-4 border-t border-slate-200/75 pt-5">
                    <div className={premiumModalFieldClassName}>
                      <div>
                        <label className={premiumModalLabelClassName}>Keterangan</label>
                        <p className={premiumModalHelperClassName}>
                          Pilih status kehadiran untuk pengajuan hari ini.
                        </p>
                      </div>
                      <RadixSelectField
                        value={reportType}
                        onValueChange={(value) =>
                          setReportType(value as StudentDailyReportPayload["type"])
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
                      <div className="rounded-[1.1rem] border border-emerald-200 bg-emerald-50/80 p-4 text-sm leading-6 text-emerald-800">
                        Untuk status hadir, foto akan langsung masuk sebagai record absensi
                        dan menunggu validasi walas.
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
              onCapture={(file) => {
                setCameraModalOpen(false);
                void handlePhotoPicked(file);
              }}
              onClose={() => setCameraModalOpen(false)}
            />
          ) : null}
        </div>
      )}
    </StudentShell>
  );
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
    profile: "bg-indigo-50 text-indigo-700",
    class: "bg-violet-50 text-violet-700",
    checkin: "bg-teal-50 text-teal-700",
    success: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[1.15rem] border border-slate-200/75 bg-white/72 px-3.5 py-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.035)]">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${toneClassName}`}>
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

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches)
  );
}
