"use client";

import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import { WalasShell } from "@/features/staff/components/homeroom-shell";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadixSelectField } from "@/components/ui/radix-select";
import { getTeacherSubjectAssignments, getTeacherSubjectSessions } from "@/services/staff.service";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { motion } from "motion/react";
import { BookOpenCheck, CalendarDays, History, Loader2 } from "lucide-react";
import { AppLink as Link } from "@/components/router/app-link";
import { useSearchParams } from "@/lib/router";
import { useState } from "react";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  belum_divalidasi: { label: "Belum Divalidasi", cls: "bg-amber-100 text-amber-700" },
  sudah_divalidasi: { label: "Sudah Divalidasi", cls: "bg-emerald-100 text-emerald-700" },
  diedit: { label: "Diedit", cls: "bg-violet-100 text-violet-700" },
};

const HARI_LABEL: Record<string, string> = {
  senin: "Senin", selasa: "Selasa", rabu: "Rabu", kamis: "Kamis",
  jumat: "Jumat", sabtu: "Sabtu", minggu: "Minggu",
};

const STATUS_OPTIONS = [
  { value: "all", label: "Semua status" },
  { value: "belum_divalidasi", label: "Belum Divalidasi" },
  { value: "sudah_divalidasi", label: "Sudah Divalidasi" },
  { value: "diedit", label: "Diedit" },
];

export function MapelHistoryPage() {
  const searchParams = useSearchParams();
  const defaultAssignment = searchParams.get("assignment_id") ?? "";

  const [selectedAssignmentId, setSelectedAssignmentId] = useState(defaultAssignment);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const dateFromStr = dateFrom ? format(dateFrom, "yyyy-MM-dd") : "";
  const dateToStr = dateTo ? format(dateTo, "yyyy-MM-dd") : "";

  const assignmentsQuery = useQuery({
    queryKey: ["teacher-subject-assignments"],
    queryFn: getTeacherSubjectAssignments,
    staleTime: 60_000,
  });

  const sessionsQuery = useQuery({
    queryKey: ["subject-sessions", selectedAssignmentId, statusFilter, dateFromStr, dateToStr],
    queryFn: () =>
      getTeacherSubjectSessions({
        assignment_id: selectedAssignmentId,
        status: statusFilter !== "all" ? statusFilter : undefined,
        date_from: dateFromStr || undefined,
        date_to: dateToStr || undefined,
      }),
    enabled: !!selectedAssignmentId,
    staleTime: 30_000,
  });

  const assignments = assignmentsQuery.data ?? [];
  const sessions = sessionsQuery.data?.sessions ?? [];

  const assignmentOptions = assignments.map((a) => ({
    value: a.id,
    label: `${a.subject_name} — ${a.class_name}`,
  }));

  return (
    <WalasShell>
      {() => (
        <>
          {/* Filter */}
          <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
            <p className="mb-4 text-lg font-semibold text-slate-950">Filter Riwayat Sesi</p>
            <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Mata Pelajaran</label>
                <RadixSelectField
                  value={selectedAssignmentId}
                  onValueChange={setSelectedAssignmentId}
                  placeholder="Pilih mata pelajaran"
                  options={assignmentOptions}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Status</label>
                <RadixSelectField
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  placeholder="Semua status"
                  options={STATUS_OPTIONS}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Dari</label>
                  <DatePickerButton
                    value={dateFrom}
                    onChange={setDateFrom}
                    placeholder="Dari"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Sampai</label>
                  <DatePickerButton
                    value={dateTo}
                    onChange={setDateTo}
                    placeholder="Sampai"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Sessions list */}
          {!selectedAssignmentId ? (
            <section>
              <EmptyState
                icon={History}
                title="Pilih mata pelajaran"
                description="Pilih mata pelajaran di atas untuk melihat riwayat sesi."
              />
            </section>
          ) : sessionsQuery.isLoading ? (
            <section>
              <EmptyState icon={Loader2} title="Memuat riwayat..." description="Mengambil data sesi dari server." />
            </section>
          ) : sessions.length === 0 ? (
            <section>
              <EmptyState
                icon={BookOpenCheck}
                title="Belum ada sesi tercatat"
                description="Belum ada sesi yang tersimpan untuk mata pelajaran ini."
              />
            </section>
          ) : (
            <section className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
              <p className="mb-4 text-lg font-semibold text-slate-950">
                Riwayat Sesi
                <span className="ml-2 text-sm font-normal text-slate-500">
                  ({sessions.length} sesi)
                </span>
              </p>

              <div className="divide-y divide-slate-50">
                {sessions.map((sess, i) => {
                  const statusInfo = STATUS_MAP[sess.status] ?? {
                    label: sess.status,
                    cls: "bg-slate-100 text-slate-600",
                  };
                  return (
                    <motion.div
                      key={sess.session_id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: i * 0.03 }}
                      className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {sess.tanggal}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {HARI_LABEL[sess.hari] ?? sess.hari} · {sess.jam_mulai}–{sess.jam_selesai}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusInfo.cls}`}>
                          {statusInfo.label}
                        </span>
                        <Link
                          href={`/dashboard/teacher/subject/session?session_id=${sess.session_id}`}
                          className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                        >
                          Lihat
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </WalasShell>
  );
}

function DatePickerButton({
  value,
  onChange,
  placeholder,
}: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button type="button" variant="outline" />}
        className="h-14 w-full justify-start rounded-[1.25rem] border-slate-300/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fbf7_100%)] px-3 text-left shadow-[0_14px_30px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] transition-[border-color,box-shadow,background-color] hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.16),0_14px_30px_rgba(15,23,42,0.05)]"
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays className="size-4 shrink-0 text-emerald-600" />
          <span className={`truncate text-sm font-medium ${value ? "text-slate-700" : "text-slate-400"}`}>
            {value ? format(value, "d MMM yy", { locale: localeID }) : placeholder}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent
        sideOffset={8}
        className="w-auto rounded-[24px] border border-emerald-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] p-4 shadow-[0_24px_54px_rgba(15,23,42,0.12)]"
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => { onChange(date); setOpen(false); }}
          locale={localeID}
          buttonVariant="ghost"
        />
      </PopoverContent>
    </Popover>
  );
}
