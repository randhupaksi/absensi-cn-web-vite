"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  PremiumModal,
  premiumModalActionsClassName,
} from "@/components/modals/premium-modal";
import { applyPdfCreditMetadata } from "@/lib/reports/pdf-metadata";
import { cn } from "@/lib/utils";
import {
  QuestionBlock,
  ReportCheckbox,
  ReportRadio,
} from "@/components/reports/admin/guru-report-modal";
import { getBKCounselingOverview } from "@/services/staff.service";
import type { StaffBKClassSummary, StaffCounselingNote, StaffStudentSummary } from "@/types/staff";
import {
  ArrowUpDown,
  GraduationCap,
  ListChecks,
  Printer,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type ClassFilter = "all" | "specific";
type StudentFilter = "all" | "specific";
type SortBy = "name" | "date_desc" | "date_asc" | "class";

type Columns = {
  kelas: boolean;
  nis: boolean;
  judul: boolean;
  isiCatatan: boolean;
  dibuatOleh: boolean;
  waktu: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

// ─── PDF generator ────────────────────────────────────────────────────────────

async function generateBKKonselingPdf(
  records: StaffCounselingNote[],
  meta: { kelas: string; siswa: string; urutan: string },
  columns: Columns,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  applyPdfCreditMetadata(doc, "Laporan Konseling BK");
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
  doc.roundedRect(mx, 10, W - mx * 2, 22, 2.5, 2.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(236, 253, 245);
  doc.text("ABSENSI CN", mx + 5, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(167, 243, 208);
  doc.text("Laporan Guru Bimbingan Konseling", mx + 5, 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("LAPORAN CATATAN KONSELING BK", W - mx - 5, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(167, 243, 208);
  doc.text(`Dicetak: ${now}`, W - mx - 5, 24, { align: "right" });

  // Meta pills
  const metaY = 37;
  const pills = [
    `Kelas: ${meta.kelas}`,
    `Siswa: ${meta.siswa}`,
    `Total: ${records.length} catatan`,
    `Urutan: ${meta.urutan}`,
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

  // Build table
  const head: string[][] = [["No", "Nama Siswa"]];
  if (columns.nis) head[0].push("NIS");
  if (columns.kelas) head[0].push("Kelas");
  if (columns.judul) head[0].push("Judul Catatan");
  if (columns.isiCatatan) head[0].push("Isi Catatan");
  if (columns.dibuatOleh) head[0].push("Dibuat Oleh");
  if (columns.waktu) head[0].push("Waktu");

  const body = records.map((r, i) => {
    const row: string[] = [String(i + 1), r.student_name];
    if (columns.nis) row.push(r.nis);
    if (columns.kelas) row.push(r.class_name || "—");
    if (columns.judul) row.push(r.title);
    if (columns.isiCatatan) row.push(truncate(r.note, 120));
    if (columns.dibuatOleh) row.push(r.created_by_name || "—");
    if (columns.waktu) row.push(formatDateTime(r.created_at));
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
      overflow: "linebreak",
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

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(mx, H - 8, W - mx, H - 8);
    doc.text("Laporan Catatan Konseling BK — ABSENSI CN", mx, H - 4);
    doc.text(`Halaman ${i} / ${totalPages}`, W - mx, H - 4, { align: "right" });
  }

  doc.save(`Laporan-Konseling-BK-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: StaffBKClassSummary[];
  students: StaffStudentSummary[];
};

export function BKKonselingReportModal({ open, onOpenChange, classes, students }: Props) {
  const [classFilter, setClassFilter] = useState<ClassFilter | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [studentFilter, setStudentFilter] = useState<StudentFilter | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [columns, setColumns] = useState<Columns>({
    kelas: true,
    nis: false,
    judul: true,
    isiCatatan: true,
    dibuatOleh: true,
    waktu: true,
  });
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [generating, setGenerating] = useState(false);

  const q1FullyAnswered =
    classFilter === "all" || (classFilter === "specific" && selectedClassId !== null);
  const q2FullyAnswered =
    q1FullyAnswered && (studentFilter === "all" || (studentFilter === "specific" && selectedStudentId !== null));
  const showQ2 = q1FullyAnswered;
  const showQ3 = q2FullyAnswered;
  const canDownload = showQ3 && sortBy !== null;

  const selectedClass = useMemo(
    () => classes.find((c) => c.class_id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );

  // Filter students by selected class if applicable
  const filteredStudents = useMemo(() => {
    if (classFilter === "specific" && selectedClassId) {
      return students.filter((s) => s.class_id === selectedClassId);
    }
    return students;
  }, [students, classFilter, selectedClassId]);

  function reset() {
    setClassFilter(null);
    setSelectedClassId(null);
    setStudentFilter(null);
    setSelectedStudentId(null);
    setColumns({ kelas: true, nis: false, judul: true, isiCatatan: true, dibuatOleh: true, waktu: true });
    setSortBy(null);
  }

  function handleClose(isOpen: boolean) {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  }

  async function handleDownload() {
    if (!canDownload) return;
    setGenerating(true);
    try {
      const overview = await getBKCounselingOverview({
        class_id: classFilter === "specific" && selectedClassId ? selectedClassId : "",
        student_id: studentFilter === "specific" && selectedStudentId ? selectedStudentId : "",
      });

      const records = overview.records ?? [];
      if (records.length === 0) {
        toast.warning("Tidak ada catatan konseling yang sesuai filter.");
        return;
      }

      const sorted = [...records].sort((a, b) => {
        if (sortBy === "name") return a.student_name.localeCompare(b.student_name, "id");
        if (sortBy === "date_desc") return (b.created_at ?? "").localeCompare(a.created_at ?? "");
        if (sortBy === "date_asc") return (a.created_at ?? "").localeCompare(b.created_at ?? "");
        if (sortBy === "class") return (a.class_name || "").localeCompare(b.class_name || "", "id");
        return 0;
      });

      const meta = {
        kelas: classFilter === "specific" && selectedClass
          ? selectedClass.class_name
          : "Semua Kelas",
        siswa: studentFilter === "specific" && selectedStudent
          ? selectedStudent.name
          : "Semua Siswa",
        urutan:
          sortBy === "name" ? "Nama Siswa (A–Z)" :
          sortBy === "date_desc" ? "Waktu (Terbaru)" :
          sortBy === "date_asc" ? "Waktu (Terlama)" : "Kelas",
      };

      await generateBKKonselingPdf(sorted, meta, columns);
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
      title="Cetak Laporan Konseling BK"
      description="Filter kelas dan siswa, lalu unduh PDF rekap catatan konseling siap cetak."
      icon={Printer}
      className="sm:!max-w-[640px]"
    >
      <div className="space-y-4">
        {/* Q1 — Kelas */}
        <QuestionBlock icon={GraduationCap} label="Filter per kelas" answered={q1FullyAnswered}>
          <div className="grid gap-2 sm:grid-cols-2">
            <ReportRadio
              selected={classFilter === "all"}
              label="Semua Kelas"
              badge={`${classes.length} kelas`}
              onClick={() => { setClassFilter("all"); setSelectedClassId(null); setStudentFilter(null); setSelectedStudentId(null); setSortBy(null); }}
            />
            <ReportRadio
              selected={classFilter === "specific"}
              label="Per Kelas Tertentu"
              onClick={() => { setClassFilter("specific"); setSelectedClassId(null); setStudentFilter(null); setSelectedStudentId(null); setSortBy(null); }}
            />
          </div>
          <AnimatePresence>
            {classFilter === "specific" && (
              <motion.div
                key="class-chips"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <p className="mb-2 mt-3 text-[0.78rem] font-semibold uppercase tracking-wide text-slate-500">
                  Pilih kelas:
                </p>
                <div className="flex flex-wrap gap-2">
                  {classes.map((cls) => (
                    <button
                      key={cls.class_id}
                      type="button"
                      onClick={() => { setSelectedClassId(cls.class_id); setStudentFilter(null); setSelectedStudentId(null); setSortBy(null); }}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500/30",
                        selectedClassId === cls.class_id
                          ? "border-emerald-400 bg-emerald-600 text-white shadow-[0_4px_10px_rgba(5,150,105,0.28)]"
                          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50",
                      )}
                    >
                      {cls.class_name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </QuestionBlock>

        {/* Q2 — Siswa */}
        <AnimatePresence>
          {showQ2 && (
            <motion.div
              key="q2"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
            >
              <QuestionBlock icon={UserRound} label="Filter per siswa" answered={q2FullyAnswered}>
                <div className="grid gap-2 sm:grid-cols-2">
                  <ReportRadio
                    selected={studentFilter === "all"}
                    label="Semua Siswa"
                    badge={`${filteredStudents.length} siswa`}
                    onClick={() => { setStudentFilter("all"); setSelectedStudentId(null); setSortBy(null); }}
                  />
                  <ReportRadio
                    selected={studentFilter === "specific"}
                    label="Siswa Tertentu"
                    onClick={() => { setStudentFilter("specific"); setSelectedStudentId(null); setSortBy(null); }}
                  />
                </div>
                <AnimatePresence>
                  {studentFilter === "specific" && (
                    <motion.div
                      key="student-chips"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p className="mb-2 mt-3 text-[0.78rem] font-semibold uppercase tracking-wide text-slate-500">
                        Pilih siswa:
                      </p>
                      {filteredStudents.length === 0 ? (
                        <p className="text-sm text-slate-400">Tidak ada siswa yang tersedia.</p>
                      ) : (
                        <div className="flex max-h-[160px] flex-wrap gap-2 overflow-y-auto">
                          {filteredStudents.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => { setSelectedStudentId(s.id); setSortBy(null); }}
                              className={cn(
                                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                                selectedStudentId === s.id
                                  ? "border-emerald-400 bg-emerald-600 text-white shadow-[0_4px_10px_rgba(5,150,105,0.28)]"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50",
                              )}
                            >
                              {s.name}
                              <span className={cn("ml-1 opacity-60")}>{s.nis}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Q3 — Kolom */}
        <AnimatePresence>
          {showQ3 && (
            <motion.div
              key="q3"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
            >
              <QuestionBlock icon={ListChecks} label="Kolom yang ingin ditampilkan" answered>
                <div className="grid gap-2 sm:grid-cols-3">
                  <ReportCheckbox checked disabled label="Nama Siswa" badge="wajib" />
                  <ReportCheckbox checked={columns.kelas} onChange={(v) => setColumns((c) => ({ ...c, kelas: v }))} label="Kelas" />
                  <ReportCheckbox checked={columns.nis} onChange={(v) => setColumns((c) => ({ ...c, nis: v }))} label="NIS" />
                  <ReportCheckbox checked={columns.judul} onChange={(v) => setColumns((c) => ({ ...c, judul: v }))} label="Judul Catatan" />
                  <ReportCheckbox checked={columns.isiCatatan} onChange={(v) => setColumns((c) => ({ ...c, isiCatatan: v }))} label="Isi Catatan" />
                  <ReportCheckbox checked={columns.dibuatOleh} onChange={(v) => setColumns((c) => ({ ...c, dibuatOleh: v }))} label="Dibuat Oleh" />
                  <ReportCheckbox checked={columns.waktu} onChange={(v) => setColumns((c) => ({ ...c, waktu: v }))} label="Waktu" />
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Q4 — Urutan */}
        <AnimatePresence>
          {showQ3 && (
            <motion.div
              key="q4"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: "easeOut", delay: 0.09 }}
            >
              <QuestionBlock icon={ArrowUpDown} label="Urutkan data berdasarkan" answered={sortBy !== null}>
                <div className="grid gap-2 sm:grid-cols-2">
                  <ReportRadio selected={sortBy === "name"} label="Nama Siswa (A–Z)" onClick={() => setSortBy("name")} />
                  <ReportRadio selected={sortBy === "class"} label="Kelas" onClick={() => setSortBy("class")} />
                  <ReportRadio selected={sortBy === "date_desc"} label="Waktu (Terbaru)" onClick={() => setSortBy("date_desc")} />
                  <ReportRadio selected={sortBy === "date_asc"} label="Waktu (Terlama)" onClick={() => setSortBy("date_asc")} />
                </div>
              </QuestionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className={premiumModalActionsClassName}>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-[0.8rem] border border-slate-200 px-5 text-[0.88rem] text-slate-600 transition hover:bg-slate-50"
            onClick={() => handleClose(false)}
          >
            Batal
          </button>
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
                Memuat data & membuat PDF...
              </>
            ) : (
              <>
                <Printer className="size-4" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </PremiumModal>
  );
}
