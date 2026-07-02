"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  PremiumModal,
  premiumModalActionsClassName,
} from "@/components/modals/premium-modal";
import { Button } from "@/components/ui/button";
import { applyPdfCreditMetadata } from "@/lib/reports/pdf-metadata";
import { cn } from "@/lib/utils";
import type { AdminTeacherProfile } from "@/types/admin";
import { ArrowUpDown, Check, ListChecks, ListFilter, Printer } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterStatus = "all" | "active" | "inactive";
type SortBy = "name" | "username";
type Columns = {
  gender: boolean;
  status: boolean;
};

// ─── PDF generator ────────────────────────────────────────────────────────────

async function generateGuruPdf(
  data: AdminTeacherProfile[],
  filterLabel: string,
  sortLabel: string,
  columns: Columns,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan Guru");
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const mx = 14;

  const now = new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Header band
  doc.setFillColor(6, 78, 59);
  doc.roundedRect(mx, 10, W - mx * 2, 20, 2.5, 2.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(236, 253, 245);
  doc.text("ABSENSI CN", mx + 5, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(167, 243, 208);
  doc.text("Sistem Informasi Absensi Sekolah", mx + 5, 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("LAPORAN DATA GURU", W - mx - 5, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(167, 243, 208);
  doc.text(`Dicetak: ${now}`, W - mx - 5, 24, { align: "right" });

  // Meta pills
  const metaY = 35;
  const pills = [
    `Filter: ${filterLabel}`,
    `Total: ${data.length} guru`,
    `Urutan: ${sortLabel}`,
  ];
  let pillX = mx;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(6, 95, 70);
  pills.forEach((text) => {
    const tw = doc.getTextWidth(text);
    const pw = tw + 8;
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(110, 231, 183);
    doc.setLineWidth(0.3);
    doc.roundedRect(pillX, metaY, pw, 5, 1.2, 1.2, "FD");
    doc.text(text, pillX + 4, metaY + 3.6);
    pillX += pw + 4;
  });

  // Table columns
  const head: string[][] = [["No", "Nama Guru", "Username"]];
  if (columns.gender) head[0].push("Jenis Kelamin");
  if (columns.status) head[0].push("Status");

  const body = data.map((t, i) => {
    const row: string[] = [String(i + 1), t.name, t.username || "—"];
    if (columns.gender)
      row.push(
        t.gender === "MALE" ? "Laki-laki" : t.gender === "FEMALE" ? "Perempuan" : "—",
      );
    if (columns.status) row.push(t.is_active ? "Aktif" : "Non-aktif");
    return row;
  });

  autoTable(doc, {
    head,
    body,
    startY: metaY + 8,
    margin: { left: mx, right: mx },
    styles: {
      fontSize: 8,
      cellPadding: { horizontal: 4, vertical: 4 },
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: "helvetica",
      textColor: [51, 65, 85],
    },
    headStyles: {
      fillColor: [6, 78, 59],
      textColor: [236, 253, 245],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 14, halign: "center", fontStyle: "bold" },
    },
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(mx, H - 8, W - mx, H - 8);
    doc.text("Laporan Data Guru — ABSENSI CN", mx, H - 4);
    doc.text(`Halaman ${i} / ${totalPages}`, W - mx, H - 4, { align: "right" });
  }

  doc.save(`Laporan-Guru-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teachers: AdminTeacherProfile[];
};

export function GuruReportModal({ open, onOpenChange, teachers }: Props) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus | null>(null);
  const [columns, setColumns] = useState<Columns>({
    gender: false,
    status: true,
  });
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [generating, setGenerating] = useState(false);

  const counts = useMemo(
    () => ({
      all: teachers.length,
      active: teachers.filter((t) => t.is_active).length,
      inactive: teachers.filter((t) => !t.is_active).length,
    }),
    [teachers],
  );

  const filteredCount = filterStatus ? counts[filterStatus] : 0;
  const showQ2 = filterStatus !== null;
  const canDownload = filterStatus !== null && sortBy !== null;

  function resetState() {
    setFilterStatus(null);
    setColumns({ gender: false, status: true });
    setSortBy(null);
  }

  function handleClose(isOpen: boolean) {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  }

  async function handleDownload() {
    if (!canDownload) return;
    const filtered = teachers.filter((t) => {
      if (filterStatus === "active") return t.is_active;
      if (filterStatus === "inactive") return !t.is_active;
      return true;
    });
    if (filtered.length === 0) {
      toast.warning("Tidak ada data guru yang sesuai filter.");
      return;
    }
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name, "id");
      return (a.username ?? "").localeCompare(b.username ?? "", "id");
    });
    const filterLabel =
      filterStatus === "active" ? "Aktif Saja" :
      filterStatus === "inactive" ? "Non-aktif Saja" : "Semua Guru";
    const sortLabel = sortBy === "name" ? "Nama (A–Z)" : "Username";
    setGenerating(true);
    try {
      await generateGuruPdf(sorted, filterLabel, sortLabel, columns);
    } catch {
      toast.error("Gagal membuat PDF. Silakan coba lagi.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <PremiumModal
      open={open}
      onOpenChange={handleClose}
      title="Cetak Laporan Guru"
      description="Sesuaikan preferensi laporan, lalu unduh PDF siap cetak dalam hitungan detik."
      icon={Printer}
      className="sm:!max-w-[600px]"
    >
      <div className="space-y-4">
        {/* Q1 — Filter status */}
        <QuestionBlock
          icon={ListFilter}
          label="Saring berdasarkan status guru"
          answered={filterStatus !== null}
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <ReportRadio
              selected={filterStatus === "all"}
              label="Semua Guru"
              badge={`${counts.all}`}
              onClick={() => { setFilterStatus("all"); setSortBy(null); }}
            />
            <ReportRadio
              selected={filterStatus === "active"}
              label="Aktif Saja"
              badge={`${counts.active}`}
              onClick={() => { setFilterStatus("active"); setSortBy(null); }}
            />
            <ReportRadio
              selected={filterStatus === "inactive"}
              label="Non-aktif"
              badge={`${counts.inactive}`}
              onClick={() => { setFilterStatus("inactive"); setSortBy(null); }}
            />
          </div>
        </QuestionBlock>

        {/* Q2 — Columns */}
        <AnimatePresence>
          {showQ2 && (
            <motion.div
              key="q2"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
            >
              <QuestionBlock
                icon={ListChecks}
                label="Kolom yang ingin ditampilkan"
                answered
              >
                <div className="grid gap-2 sm:grid-cols-3">
                  <ReportCheckbox checked disabled label="Nama & Username" badge="wajib" />
                  <ReportCheckbox
                    checked={columns.gender}
                    onChange={(v) => setColumns((c) => ({ ...c, gender: v }))}
                    label="Jenis Kelamin"
                  />
                  <ReportCheckbox
                    checked={columns.status}
                    onChange={(v) => setColumns((c) => ({ ...c, status: v }))}
                    label="Status Aktif"
                  />
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Q3 — Sort */}
        <AnimatePresence>
          {showQ2 && (
            <motion.div
              key="q3"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: "easeOut", delay: 0.09 }}
            >
              <QuestionBlock
                icon={ArrowUpDown}
                label="Urutkan data berdasarkan"
                answered={sortBy !== null}
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <ReportRadio
                    selected={sortBy === "name"}
                    label="Nama (A–Z)"
                    onClick={() => setSortBy("name")}
                  />
                  <ReportRadio
                    selected={sortBy === "username"}
                    label="Username"
                    onClick={() => setSortBy("username")}
                  />
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className={premiumModalActionsClassName}>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-[0.8rem] border-slate-200 px-5 text-[0.88rem] text-slate-600"
            onClick={() => handleClose(false)}
          >
            Batal
          </Button>
          <button
            type="button"
            disabled={!canDownload || generating}
            onClick={handleDownload}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-[0.8rem] px-6 text-[0.88rem] font-semibold text-white transition-all duration-200",
              canDownload && !generating
                ? "bg-emerald-600 shadow-[0_4px_14px_rgba(5,150,105,0.3)] hover:bg-emerald-700 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(5,150,105,0.38)]"
                : "cursor-not-allowed bg-slate-300",
            )}
          >
            {generating ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Membuat PDF...
              </>
            ) : (
              <>
                <Printer className="size-4" />
                {canDownload
                  ? `Download PDF (${filteredCount} guru)`
                  : "Download PDF"}
              </>
            )}
          </button>
        </div>
      </div>
    </PremiumModal>
  );
}

// ─── Shared question UI ───────────────────────────────────────────────────────

export function QuestionBlock({
  icon: Icon,
  label,
  answered,
  children,
}: {
  icon: LucideIcon;
  label: string;
  answered?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.3rem] border p-4 transition-all duration-300",
        answered
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-slate-200 bg-slate-50/40",
      )}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full transition-all duration-300",
            answered
              ? "bg-emerald-600 text-white shadow-[0_4px_10px_rgba(5,150,105,0.28)]"
              : "bg-slate-100 text-slate-400",
          )}
        >
          <Icon className="size-3.5" />
        </span>
        <p className="text-[0.88rem] font-semibold text-slate-800">{label}</p>
      </div>
      {children}
    </div>
  );
}

export function ReportRadio({
  selected,
  label,
  badge,
  onClick,
}: {
  selected: boolean;
  label: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-[0.9rem] border px-4 py-3 text-left text-sm outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500/30",
        selected
          ? "border-emerald-300 bg-white text-emerald-900 shadow-[0_0_0_2px_rgba(5,150,105,0.12)]"
          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/40",
      )}
    >
      <span
        className={cn(
          "flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-all",
          selected ? "border-emerald-600 bg-emerald-600" : "border-slate-300 bg-white",
        )}
      >
        {selected && <span className="size-2 rounded-full bg-white" />}
      </span>
      <span className="flex-1 font-medium">{label}</span>
      {badge !== undefined && (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold",
            selected
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-500",
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export function ReportCheckbox({
  checked,
  onChange,
  label,
  badge,
  disabled,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  label: string;
  badge?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "flex items-center gap-3 rounded-[0.9rem] border px-4 py-3 text-left text-sm outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500/30",
        disabled
          ? "cursor-default border-emerald-200 bg-emerald-50/60 text-emerald-800"
          : checked
          ? "border-emerald-300 bg-white text-emerald-900 shadow-[0_0_0_2px_rgba(5,150,105,0.10)]"
          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/30",
      )}
    >
      <span
        className={cn(
          "flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border-2 transition-all",
          checked ? "border-emerald-600 bg-emerald-600" : "border-slate-300 bg-white",
        )}
      >
        {checked && <Check className="size-3 text-white" />}
      </span>
      <span className="flex-1 font-medium">{label}</span>
      {badge && (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-400">
          {badge}
        </span>
      )}
    </button>
  );
}
