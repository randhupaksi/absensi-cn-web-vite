"use client";

import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import { AttendanceLocationEvidence } from "@/features/attendance/components/location-evidence";
import { PremiumModal } from "@/components/modals/premium-modal";
import { ProtectedApiImage } from "@/components/security/protected-api-asset";
import { StudentSubmissionPill } from "@/features/student/components/common";
import type { StudentSubmission } from "@/types/student";
import { FileImage } from "lucide-react";

export function StudentSubmissionEvidenceModal({
  submission,
  onOpenChange,
}: {
  submission: StudentSubmission | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <PremiumModal
      open={Boolean(submission)}
      onOpenChange={onOpenChange}
      title={submission ? `Bukti ${submission.type}` : "Bukti Pengajuan"}
      description="Lampiran pengajuan dan lokasi pengambilan ditampilkan dalam satu bukti."
      icon={FileImage}
      className="sm:!max-w-[720px]"
    >
      {submission ? (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4 rounded-[var(--radius-xl)] border border-emerald-100/70 bg-white p-4">
            <div>
              <p className="font-semibold text-slate-900">{submission.student_name}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">{submission.reason}</p>
            </div>
            <div className="flex gap-2">
              <StudentSubmissionPill value={submission.type} />
              <StudentSubmissionPill value={submission.status} />
            </div>
          </div>

          <div className="overflow-hidden rounded-[var(--radius-xl)] border border-emerald-100/80 bg-emerald-50/40 p-3">
            {submission.attachment ? (
              <ProtectedApiImage
                src={submission.attachment}
                alt={`Lampiran ${submission.type} ${submission.student_name}`}
                className="max-h-[55vh] w-full rounded-[var(--radius)] object-contain"
              />
            ) : (
              <EmptyState
                icon={FileImage}
                title="Lampiran belum tersedia"
                description="Pengajuan ini tidak memiliki foto atau berkas pendukung."
                compact
              />
            )}
            <AttendanceLocationEvidence evidence={submission} className="mt-4 px-1 pb-1" />
          </div>
        </div>
      ) : null}
    </PremiumModal>
  );
}
