"use client";

import dynamic from "@/lib/dynamic";
import {
  AttendanceHero,
  AttendanceTableSection,
  type AttendanceKpi,
} from "@/features/teacher/homeroom/components/attendance-sections";
import { WalasShell } from "@/features/staff/components/homeroom-shell";
import {
  AttendanceProofModal,
  AttendanceReviewModal,
} from "@/features/teacher/homeroom/components/attendance-modals";
import {
  getTeacherHomeroomAttendanceOverview,
  reviewTeacherHomeroomAttendance,
} from "@/services/staff.service";
import type {
  StaffAttendanceRecord,
  StaffAttendanceReviewPayload,
  StaffHomeroomAttendanceOverview,
} from "@/types/staff";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { BadgeCheck, CheckCheck, NotebookText, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const WalasAbsensiReportModal = dynamic(
  () => import("@/features/reports/homeroom/attendance-report-modal").then((module) => module.WalasAbsensiReportModal),
  { ssr: false },
);

const fallbackOverview: StaffHomeroomAttendanceOverview = {
  homeroom: {
    assignment_id: "",
    teacher_id: "",
    class_id: "",
    class_name: "Belum ada kelas walas",
    school_year_id: "",
    school_year_name: "Tahun ajaran belum tersedia",
    is_active: false,
  },
  date: "",
  status_filter: "",
  query: "",
  summary: {
    present: 0,
    permission: 0,
    sick: 0,
    alpha: 0,
    repeated_alpha: [],
  },
  records: [],
};

export function WalasAttendancePage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [reviewTarget, setReviewTarget] = useState<StaffAttendanceRecord | null>(null);
  const [proofTarget, setProofTarget] = useState<StaffAttendanceRecord | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const dateValue = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const overviewQuery = useQuery({
    queryKey: ["teacher-homeroom-attendance-overview", dateValue, statusFilter, debouncedQuery],
    queryFn: () =>
      getTeacherHomeroomAttendanceOverview({
        date: dateValue,
        status: statusFilter === "Semua" ? "" : statusFilter,
        query: debouncedQuery.trim(),
      }),
    refetchInterval: 30_000,
    staleTime: 0,
    placeholderData: (previousData) => previousData,
  });

  const reviewMutation = useMutation({
    mutationFn: async (payload: StaffAttendanceReviewPayload) => {
      if (!reviewTarget) throw new Error("Record absensi tidak ditemukan.");
      return reviewTeacherHomeroomAttendance(reviewTarget.id, payload);
    },
    onSuccess: () => {
      toast.success("Status absensi berhasil diperbarui.");
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["teacher-homeroom-attendance-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["teacher-homeroom-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["teacher-homeroom-students"] }),
      ]);
      setReviewTarget(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const overview = normalizeOverview(overviewQuery.data ?? fallbackOverview);
  const { summary, records } = overview;
  const totalAttendance = summary.present + summary.permission + summary.sick + summary.alpha;
  const reviewedCount = records.filter((record) => Boolean(record.verified_at)).length;
  const pendingReviewCount = records.filter(
    (record) => record.status.toLowerCase() === "alfa" && !record.verified_at,
  ).length;

  const kpiCards: AttendanceKpi[] = [
    { label: "Total Record", value: String(records.length), subtitle: "Absensi tanggal ini", icon: NotebookText, accentClass: "bg-emerald-100 text-emerald-700" },
    { label: "Hadir Tepat Waktu", value: String(summary.present), subtitle: "Masuk tepat waktu", icon: BadgeCheck, accentClass: "bg-teal-100 text-teal-700" },
    { label: "Alfa Belum Dikonfirmasi", value: String(pendingReviewCount), subtitle: "Perlu dicek saat absensi kelas", icon: ShieldAlert, accentClass: "bg-amber-100 text-amber-700" },
    { label: "Sudah Dikoreksi", value: String(reviewedCount), subtitle: "Status pernah diperbarui walas", icon: CheckCheck, accentClass: "bg-sky-100 text-sky-700" },
  ];

  const sortedRecords = useMemo(() => {
    if (statusFilter !== "Semua") return records;
    return [...records].sort((first, second) => {
      const firstReviewed = Boolean(first.verified_at);
      const secondReviewed = Boolean(second.verified_at);
      if (firstReviewed !== secondReviewed) return firstReviewed ? 1 : -1;
      return first.student_name.localeCompare(second.student_name, "id");
    });
  }, [records, statusFilter]);

  return (
    <WalasShell>
      {() => (
        <>
          <AttendanceHero
            overview={overview}
            kpiCards={kpiCards}
            totalAttendance={totalAttendance}
            pendingReviewCount={pendingReviewCount}
          />
          <AttendanceTableSection
            overview={overview}
            records={sortedRecords}
            isLoading={overviewQuery.isLoading}
            error={overviewQuery.error}
            query={query}
            statusFilter={statusFilter}
            selectedDate={selectedDate}
            onQueryChange={setQuery}
            onStatusChange={setStatusFilter}
            onDateChange={setSelectedDate}
            onOpenReport={() => setReportModalOpen(true)}
            onOpenProof={setProofTarget}
            onOpenReview={setReviewTarget}
          />

          {reviewTarget && (
            <AttendanceReviewModal
              key={reviewTarget.id}
              record={reviewTarget}
              onOpenChange={(open) => { if (!open) setReviewTarget(null); }}
              onSubmit={(payload) => reviewMutation.mutate(payload)}
              isPending={reviewMutation.isPending}
            />
          )}
          {proofTarget && (
            <AttendanceProofModal
              record={proofTarget}
              onOpenChange={(open) => { if (!open) setProofTarget(null); }}
            />
          )}
          {reportModalOpen && (
            <WalasAbsensiReportModal
              open={reportModalOpen}
              onOpenChange={setReportModalOpen}
              homeroom={overview.homeroom}
            />
          )}
        </>
      )}
    </WalasShell>
  );
}

function normalizeOverview(overview: StaffHomeroomAttendanceOverview): StaffHomeroomAttendanceOverview {
  return {
    ...overview,
    summary: {
      ...overview.summary,
      repeated_alpha: overview.summary?.repeated_alpha ?? [],
    },
    records: overview.records ?? [],
  };
}
