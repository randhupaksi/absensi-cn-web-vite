"use client";

import { AnimatePresence, motion } from "motion/react";
import { PremiumModal } from "@/components/modals/premium-modal";
import { ReportModalFooter } from "@/components/reports/shared/report-modal-footer";
import { applyPdfCreditMetadata } from "@/lib/reports/pdf-metadata";
import {
  drawReportPdfFooter,
  drawReportPdfHeader,
  drawReportPdfPills,
  REPORT_PDF_MARGIN_X,
  REPORT_TABLE_STYLE,
} from "@/lib/reports/pdf-report-kit";
import { cn } from "@/lib/utils";
import {
  QuestionBlock,
  ReportCheckbox,
  ReportRadio,
} from "@/components/reports/shared/report-question-ui";
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
  const mx = REPORT_PDF_MARGIN_X;
  const { metaY } = drawReportPdfHeader(doc, {
    title: "LAPORAN CATATAN KONSELING BK",
    subtitle: "Laporan Guru Bimbingan Konseling",
  });
  const pills = [
    `Kelas: ${meta.kelas}`,
    `Siswa: ${meta.siswa}`,
    `Total: ${records.length} catatan`,
    `Urutan: ${meta.urutan}`,
  ];
  drawReportPdfPills(doc, pills, metaY);

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
    ...REPORT_TABLE_STYLE,
  });

  drawReportPdfFooter(doc, "Laporan Catatan Konseling BK — ABSENSI CN");

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

        <ReportModalFooter
          canDownload={canDownload}
          generating={generating}
          onCancel={() => handleClose(false)}
          onDownload={handleDownload}
          cancelVariant="native"
        />
      </div>
    </PremiumModal>
  );
}
