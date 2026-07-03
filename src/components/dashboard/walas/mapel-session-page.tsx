"use client";

import { EmptyState } from "@/components/dashboard/admin/widgets/empty-state";
import { WalasShell } from "@/components/dashboard/staff/walas-shell";
import { KoreksiModal } from "@/components/dashboard/walas/mapel-session-modals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getTeacherSubjectAttendance,
  getTeacherSubjectCurrentSession,
  overrideTeacherSubjectAttendance,
  submitTeacherSubjectValidation,
  updateTeacherSubjectSessionDetails,
} from "@/services/staff.service";
import type { StaffSubjectAttendanceRecord } from "@/types/staff";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  AlertCircle,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  FilePenLine,
  Loader2,
  Send,
  Save,
  Users,
} from "lucide-react";
import { useSearchParams } from "@/lib/router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function getDayIndonesian(date: Date): string {
  return ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"][date.getDay()];
}

function getTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

const STATUS_LABELS: Record<string, string> = {
  hadir: "Hadir", telat: "Telat", alfa_kelas: "Alfa Kelas",
  dispensasi: "Dispensasi", alfa: "Alfa", sakit: "Sakit", izin: "Izin",
};

const STATUS_PAGI_CLS: Record<string, string> = {
  hadir: "bg-emerald-100 text-emerald-700",
  telat: "bg-amber-100 text-amber-700",
  alfa: "bg-rose-100 text-rose-700",
  sakit: "bg-sky-100 text-sky-700",
  izin: "bg-slate-100 text-slate-600",
};

const STATUS_MAPEL_CLS: Record<string, string> = {
  hadir: "bg-emerald-100 text-emerald-700",
  telat: "bg-amber-100 text-amber-700",
  alfa_kelas: "bg-orange-100 text-orange-700",
  dispensasi: "bg-violet-100 text-violet-700",
  alfa: "bg-rose-100 text-rose-700",
  sakit: "bg-sky-100 text-sky-700",
  izin: "bg-slate-100 text-slate-600",
};

export function MapelSessionPage() {
  const searchParams = useSearchParams();
  const explicitSessionId = searchParams.get("session_id");

  const now = new Date();
  const hari = getDayIndonesian(now);
  const jam = getTimeString(now);

  const autoSessionQuery = useQuery({
    queryKey: ["subject-current-session", hari, jam.slice(0, 5)],
    queryFn: () => getTeacherSubjectCurrentSession(hari, jam),
    enabled: !explicitSessionId,
    refetchInterval: 30_000,
    staleTime: 0,
  });

  const sessionId = explicitSessionId ?? autoSessionQuery.data?.session_id ?? null;

  const overviewQuery = useQuery({
    queryKey: ["subject-attendance-overview", sessionId],
    queryFn: () => getTeacherSubjectAttendance(sessionId!),
    enabled: !!sessionId,
    refetchInterval: 30_000,
    staleTime: 0,
  });

  const queryClient = useQueryClient();
  const [pendingOverrides, setPendingOverrides] = useState<Record<string, string>>({});
  const [koreksiTarget, setKoreksiTarget] = useState<StaffSubjectAttendanceRecord | null>(null);
  const [koreksiStatus, setKoreksiStatus] = useState("");
  const [koreksiAlasan, setKoreksiAlasan] = useState("");
  const [topic, setTopic] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["subject-current-session"] });
    queryClient.invalidateQueries({ queryKey: ["subject-attendance-overview"] });
  };

  const validateMutation = useMutation({
    mutationFn: () =>
      submitTeacherSubjectValidation({
        session_id: sessionId!,
        overrides: Object.entries(pendingOverrides).map(([student_id, status]) => ({
          student_id,
          status,
          keterangan: "",
          foto_url: "",
        })),
      }),
    onSuccess: () => { setPendingOverrides({}); invalidate(); },
  });

  const koreksiMutation = useMutation({
    mutationFn: () =>
      overrideTeacherSubjectAttendance({
        session_id: sessionId!,
        student_id: koreksiTarget!.student_id,
        status: koreksiStatus,
        keterangan: "",
        foto_url: "",
        alasan_koreksi: koreksiAlasan,
      }),
    onSuccess: () => {
      setKoreksiTarget(null);
      setKoreksiAlasan("");
      setKoreksiStatus("");
      invalidate();
    },
  });

  const session = overviewQuery.data?.session ?? autoSessionQuery.data ?? null;
  const records = useMemo(() => overviewQuery.data?.records ?? [], [overviewQuery.data?.records]);
  const isValidated = session?.status === "sudah_divalidasi" || session?.status === "diedit";

  useEffect(() => {
    setTopic(session?.topic ?? "");
    setSessionNotes(session?.notes ?? "");
  }, [session?.session_id, session?.notes, session?.topic]);

  const detailsMutation = useMutation({
    mutationFn: () => updateTeacherSubjectSessionDetails(sessionId!, { topic, notes: sessionNotes }),
    onSuccess: () => { toast.success("Detail pertemuan berhasil disimpan."); invalidate(); },
    onError: (error: Error) => toast.error(error.message),
  });

  const stats = useMemo(() => {
    const statuses = records.map((r) => pendingOverrides[r.student_id] ?? r.status_mapel);
    return {
      hadir: statuses.filter((s) => s === "hadir").length,
      telat: statuses.filter((s) => s === "telat").length,
      alfaKelas: statuses.filter((s) => s === "alfa_kelas").length,
      dispensasi: statuses.filter((s) => s === "dispensasi").length,
    };
  }, [records, pendingOverrides]);

  const isAutoLoading = !explicitSessionId && autoSessionQuery.isLoading;

  return (
    <WalasShell>
      {() => (
        <>
          {/* Session header */}
          {isAutoLoading ? (
            <section className="flex items-center gap-3 rounded-[28px] border border-white/70 bg-white/88 p-5">
              <Loader2 className="size-5 animate-spin text-emerald-600" />
              <p className="text-sm text-slate-500">Mendeteksi sesi mapel aktif...</p>
            </section>
          ) : !session ? (
            <section className="rounded-[28px] border border-white/70 bg-white/88 p-5">
              <EmptyState
                icon={BookOpenCheck}
                title="Tidak ada sesi aktif"
                description="Sistem otomatis mendeteksi kelas berdasarkan jadwal. Saat ini tidak ada kelas yang sedang berlangsung."
              />
            </section>
          ) : (
            <motion.section
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[28px] border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-teal-50 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {session.assignment.subject_name} — {session.assignment.class_name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {session.hari.charAt(0).toUpperCase() + session.hari.slice(1)} ·{" "}
                    {session.jam_mulai}–{session.jam_selesai} · {session.tanggal}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <SessionStatusBadge status={session.status} />
                  {!isValidated && (
                    <button
                      type="button"
                      onClick={() => validateMutation.mutate()}
                      disabled={validateMutation.isPending}
                      className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {validateMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                      Validasi
                    </button>
                  )}
                </div>
              </div>
            </motion.section>
          )}

          {session && (
            <>
			  <section className="grid gap-4 rounded-[28px] border border-white/70 bg-white/88 p-5 shadow-sm lg:grid-cols-[1fr_1.4fr_auto] lg:items-end">
				<div><label htmlFor="session-topic" className="mb-2 block text-sm font-semibold text-slate-700">Topik Pertemuan</label><Input id="session-topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Contoh: Persamaan kuadrat" disabled={isValidated} className="h-12 rounded-[18px]" /></div>
				<div><label htmlFor="session-notes" className="mb-2 block text-sm font-semibold text-slate-700">Catatan Pengajaran</label><Textarea id="session-notes" value={sessionNotes} onChange={(event) => setSessionNotes(event.target.value)} placeholder="Catatan materi, tugas, atau kendala kelas" disabled={isValidated} className="min-h-12 rounded-[18px]" /></div>
				<Button type="button" className="h-12 rounded-[18px] bg-emerald-700 px-5 text-white" disabled={isValidated || detailsMutation.isPending} onClick={() => detailsMutation.mutate()}><Save className="size-4" />{detailsMutation.isPending ? "Menyimpan..." : "Simpan Detail"}</Button>
			  </section>
              {/* KPI row */}
              <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {[
                  { label: "Hadir", value: stats.hadir, icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700" },
                  { label: "Telat", value: stats.telat, icon: Clock3, cls: "bg-amber-50 text-amber-700" },
                  { label: "Alfa Kelas", value: stats.alfaKelas, icon: AlertCircle, cls: "bg-orange-50 text-orange-700" },
                  { label: "Dispensasi", value: stats.dispensasi, icon: FilePenLine, cls: "bg-violet-50 text-violet-700" },
                ].map((item, i) => (
                  <motion.article
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-[24px] border border-white/70 bg-white/88 p-4 shadow-sm"
                  >
                    <span className={`inline-flex size-9 items-center justify-center rounded-xl ${item.cls}`}>
                      <item.icon className="size-4.5" />
                    </span>
                    <p className="mt-3 text-2xl font-bold text-slate-950">{item.value}</p>
                    <p className="text-xs font-medium text-slate-500">{item.label}</p>
                  </motion.article>
                ))}
              </section>

              {/* Attendance table */}
              <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
                <p className="mb-4 text-lg font-semibold text-slate-950">Daftar Hadir Siswa</p>

                {overviewQuery.isLoading ? (
                  <EmptyState icon={Loader2} title="Memuat daftar siswa..." description="" />
                ) : records.length === 0 ? (
                  <EmptyState icon={Users} title="Belum ada data siswa" description="Pastikan siswa terdaftar di kelas ini." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                          <th className="pb-3 pr-4">Siswa</th>
                          <th className="pb-3 pr-4">NIS</th>
                          <th className="pb-3 pr-4">Status Pagi</th>
                          <th className="pb-3 pr-4">Status Mapel</th>
                          <th className="pb-3">{isValidated ? "Koreksi" : "Override"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {records.map((r) => {
                          const effective = pendingOverrides[r.student_id] ?? r.status_mapel;
                          return (
                            <tr key={r.student_id}>
                              <td className="py-3 pr-4 font-medium text-slate-900">
                                {r.student_name}
                                {r.is_edited && (
                                  <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                                    EDIT
                                  </span>
                                )}
                              </td>
                              <td className="py-3 pr-4 text-slate-500">{r.nis}</td>
                              <td className="py-3 pr-4">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_PAGI_CLS[r.status_pagi] ?? "bg-slate-100 text-slate-600"}`}>
                                  {STATUS_LABELS[r.status_pagi] ?? r.status_pagi}
                                </span>
                              </td>
                              <td className="py-3 pr-4">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_MAPEL_CLS[effective] ?? "bg-slate-100 text-slate-600"}`}>
                                  {STATUS_LABELS[effective] ?? effective}
                                </span>
                              </td>
                              <td className="py-3">
                                {isValidated ? (
                                  r.is_editable ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setKoreksiTarget(r);
                                        setKoreksiStatus(r.status_mapel);
                                        setKoreksiAlasan("");
                                      }}
                                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                                    >
                                      Koreksi
                                    </button>
                                  ) : (
                                    <span className="text-xs text-slate-400">Terkunci</span>
                                  )
                                ) : r.is_editable ? (
                                  <select
                                    value={pendingOverrides[r.student_id] ?? r.status_mapel}
                                    onChange={(e) =>
                                      setPendingOverrides((prev) => ({
                                        ...prev,
                                        [r.student_id]: e.target.value,
                                      }))
                                    }
                                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-400 focus:outline-none"
                                  >
                                    <option value="hadir">Hadir</option>
                                    <option value="telat">Telat</option>
                                    <option value="alfa_kelas">Alfa Kelas</option>
                                    <option value="dispensasi">Dispensasi</option>
                                  </select>
                                ) : (
                                  <span className="text-xs text-slate-400">Terkunci</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {validateMutation.isError && (
                  <p className="mt-3 text-sm text-rose-600">{validateMutation.error.message}</p>
                )}
              </section>
            </>
          )}

          {koreksiTarget && (
            <KoreksiModal
              studentName={koreksiTarget.student_name}
              nis={koreksiTarget.nis}
              currentStatus={STATUS_LABELS[koreksiTarget.status_mapel] ?? koreksiTarget.status_mapel}
              alasan={koreksiAlasan}
              newStatus={koreksiStatus}
              isPending={koreksiMutation.isPending}
              error={koreksiMutation.isError ? koreksiMutation.error.message : undefined}
              onAlasanChange={setKoreksiAlasan}
              onStatusChange={setKoreksiStatus}
              onCancel={() => setKoreksiTarget(null)}
              onSubmit={() => koreksiMutation.mutate()}
            />
          )}
        </>
      )}
    </WalasShell>
  );
}

function SessionStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    belum_divalidasi: { label: "Belum Divalidasi", cls: "bg-amber-100 text-amber-700" },
    sudah_divalidasi: { label: "Sudah Divalidasi", cls: "bg-emerald-100 text-emerald-700" },
    diedit: { label: "Diedit", cls: "bg-violet-100 text-violet-700" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-slate-100 text-slate-600" };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}
