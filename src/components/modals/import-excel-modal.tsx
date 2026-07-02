"use client";

import {
  downloadAdminImportTemplate,
  importAdminStudents,
  importAdminTeachers,
} from "@/services/admin.service";
import type { ImportError, ImportResult } from "@/types/admin";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileX,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { PremiumModal, premiumModalActionsClassName } from "@/components/modals/premium-modal";
import { cn } from "@/lib/utils";

type ImportExcelModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "guru" | "siswa";
  onSuccess?: () => void;
};

type ModalState = "idle" | "loading" | "done";

export function ImportExcelModal({
  open,
  onOpenChange,
  type,
  onSuccess,
}: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<ModalState>("idle");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const label = type === "guru" ? "Guru" : "Siswa";

  function handleClose(open: boolean) {
    if (!open) {
      setFile(null);
      setState("idle");
      setResult(null);
      setImportError(null);
    }
    onOpenChange(open);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) pickFile(selected);
    e.target.value = "";
  }

  function pickFile(f: File) {
    if (!f.name.endsWith(".xlsx")) {
      setImportError("Hanya file .xlsx yang didukung.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setImportError("Ukuran file maksimal 5MB.");
      return;
    }
    setImportError(null);
    setFile(f);
    setResult(null);
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) pickFile(dropped);
  }, []);

  async function handleImport() {
    if (!file) return;
    setState("loading");
    setImportError(null);
    try {
      const res =
        type === "guru"
          ? await importAdminTeachers(file)
          : await importAdminStudents(file);
      setResult(res);
      setState("done");
      if (res.imported > 0) onSuccess?.();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setState("idle");
    }
  }

  return (
    <PremiumModal
      open={open}
      onOpenChange={handleClose}
      title={`Import Data ${label} via Excel`}
      description={`Upload file Excel sesuai template untuk menambahkan data ${label.toLowerCase()} secara massal.`}
      icon={FileSpreadsheet}
      className="sm:!max-w-[660px]"
    >
      {state === "done" && result ? (
        <ImportResultView
          result={result}
          label={label}
          onImportAgain={() => {
            setFile(null);
            setResult(null);
            setState("idle");
          }}
          onClose={() => handleClose(false)}
        />
      ) : (
        <div className="grid gap-5">
          {/* Download template card */}
          <div className="flex items-center justify-between gap-4 rounded-[1.3rem] border border-emerald-200/60 bg-[linear-gradient(135deg,rgba(236,253,245,0.9)_0%,rgba(209,250,229,0.6)_100%)] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <div className="min-w-0">
              <p className="text-[0.9rem] font-semibold text-emerald-900">
                Download Template Excel
              </p>
              <p className="mt-0.5 text-[0.78rem] leading-[1.5] text-emerald-700/80">
                Gunakan template resmi agar format data sesuai. Lihat sheet{" "}
                <strong>Petunjuk</strong> untuk panduan.
                {type === "siswa" && (
                  <> Tambah kelas baru di sheet <strong>Data Kelas</strong> (kolom A–E).</>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadAdminImportTemplate(type)}
              className="inline-flex shrink-0 items-center gap-2 rounded-[0.85rem] bg-emerald-600 px-4 py-2.5 text-[0.82rem] font-semibold text-white shadow-[0_4px_14px_rgba(5,150,105,0.3)] transition-all duration-200 hover:bg-emerald-700 hover:shadow-[0_6px_20px_rgba(5,150,105,0.38)] hover:-translate-y-px active:translate-y-0"
            >
              <Download className="size-3.5" />
              Download
            </button>
          </div>

          {/* Upload zone */}
          <div>
            <p className="mb-2 text-[0.88rem] font-semibold text-slate-700">
              Upload File Excel
            </p>
            <div
              role="button"
              tabIndex={0}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
              className={cn(
                "relative flex min-h-[10.75rem] cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.4rem] border-2 border-solid transition-all duration-200",
                dragging
                  ? "border-emerald-400 bg-emerald-50/80 shadow-[0_0_0_4px_rgba(5,150,105,0.08)]"
                  : file
                  ? "border-emerald-300 bg-emerald-50/50"
                  : "border-slate-200 bg-slate-50/60 hover:border-emerald-300 hover:bg-emerald-50/40",
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="sr-only"
                onChange={handleFileChange}
              />

              {file ? (
                <div className="flex flex-col items-center gap-2 px-4 text-center">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <FileSpreadsheet className="size-6" />
                  </span>
                  <div>
                    <p className="text-[0.9rem] font-semibold text-slate-800">
                      {file.name}
                    </p>
                    <p className="text-[0.78rem] text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB &middot; Klik untuk ganti file
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                    className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[0.75rem] font-medium text-rose-600 transition hover:bg-rose-100"
                  >
                    <X className="size-3" />
                    Hapus
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 px-4 text-center">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <Upload className="size-6" />
                  </span>
                  <div>
                    <p className="text-[0.88rem] font-medium text-slate-600">
                      Drag & drop file di sini, atau{" "}
                      <span className="font-semibold text-emerald-600 underline underline-offset-2">
                        klik untuk memilih
                      </span>
                    </p>
                    <p className="mt-0.5 text-[0.76rem] text-slate-400">
                      Format: .xlsx &middot; Maks. 5MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {importError && (
              <p className="mt-2.5 flex items-center gap-1.5 text-[0.8rem] font-medium text-rose-600">
                <FileX className="size-3.5 shrink-0" />
                {importError}
              </p>
            )}
          </div>

          <div className={premiumModalActionsClassName}>
            <button
              type="button"
              onClick={() => handleClose(false)}
              className="inline-flex h-10 items-center justify-center rounded-[0.8rem] border border-slate-200 bg-white px-5 text-[0.88rem] font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!file || state === "loading"}
              onClick={handleImport}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-[0.8rem] px-6 text-[0.88rem] font-semibold text-white transition-all duration-200",
                file && state !== "loading"
                  ? "bg-emerald-600 shadow-[0_4px_14px_rgba(5,150,105,0.3)] hover:bg-emerald-700 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(5,150,105,0.38)]"
                  : "cursor-not-allowed bg-slate-300",
              )}
            >
              {state === "loading" ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Memproses...
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  Import {label}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </PremiumModal>
  );
}

// ─── Result view ──────────────────────────────────────────────────────────────

function ImportResultView({
  result,
  label,
  onImportAgain,
  onClose,
}: {
  result: ImportResult;
  label: string;
  onImportAgain: () => void;
  onClose: () => void;
}) {
  const hasErrors = result.errors.length > 0;

  return (
    <div className="grid gap-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <SummaryCard
          icon={<CheckCircle2 className="size-5" />}
          value={result.imported}
          label={`${label} berhasil diimport`}
          color="emerald"
        />
        <SummaryCard
          icon={<AlertTriangle className="size-5" />}
          value={result.skipped}
          label="Baris dilewati"
          color={result.skipped > 0 ? "amber" : "slate"}
        />
      </div>

      {/* Error table */}
      {hasErrors && (
        <div>
          <p className="mb-2.5 text-[0.87rem] font-semibold text-slate-700">
            Detail Error ({result.errors.length} baris)
          </p>
          <div className="max-h-[260px] overflow-y-auto rounded-[1.15rem] border border-rose-100 bg-rose-50/50 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-rose-200/70">
            <table className="w-full text-[0.8rem]">
              <thead className="sticky top-0 bg-rose-100/80 backdrop-blur-sm">
                <tr>
                  <th className="px-3 py-2.5 text-left font-semibold text-rose-700">
                    Baris
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-rose-700">
                    Kolom
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold text-rose-700">
                    Pesan
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.errors.map((err: ImportError, i) => (
                  <tr
                    key={i}
                    className="border-t border-rose-100 transition hover:bg-rose-100/40"
                  >
                    <td className="px-3 py-2.5 font-mono font-medium text-rose-600">
                      {err.row}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{err.field}</td>
                    <td className="px-3 py-2.5 text-slate-700">{err.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!hasErrors && result.imported > 0 && (
        <div className="flex items-center gap-3 rounded-[1.2rem] border border-emerald-200/60 bg-emerald-50/60 px-5 py-4">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
          <p className="text-[0.87rem] text-emerald-800">
            Semua data berhasil diimport tanpa error.
          </p>
        </div>
      )}

      <div className={premiumModalActionsClassName}>
        {hasErrors && (
          <button
            type="button"
            onClick={onImportAgain}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[0.8rem] border border-slate-200 bg-white px-5 text-[0.88rem] font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Upload className="size-4" />
            Import Lagi
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 items-center justify-center rounded-[0.8rem] bg-emerald-600 px-6 text-[0.88rem] font-semibold text-white shadow-[0_4px_14px_rgba(5,150,105,0.3)] transition-all duration-200 hover:bg-emerald-700 hover:-translate-y-px"
        >
          Selesai
        </button>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: "emerald" | "amber" | "slate";
}) {
  const colors = {
    emerald: {
      bg: "bg-[linear-gradient(135deg,rgba(236,253,245,0.9)_0%,rgba(209,250,229,0.6)_100%)] border-emerald-200/60",
      icon: "bg-emerald-100 text-emerald-600",
      value: "text-emerald-700",
      label: "text-emerald-700/80",
    },
    amber: {
      bg: "bg-[linear-gradient(135deg,rgba(255,251,235,0.9)_0%,rgba(254,243,199,0.6)_100%)] border-amber-200/60",
      icon: "bg-amber-100 text-amber-600",
      value: "text-amber-700",
      label: "text-amber-700/80",
    },
    slate: {
      bg: "bg-[linear-gradient(135deg,rgba(248,250,252,0.9)_0%,rgba(241,245,249,0.6)_100%)] border-slate-200/60",
      icon: "bg-slate-100 text-slate-500",
      value: "text-slate-600",
      label: "text-slate-500",
    },
  };

  const c = colors[color];

  return (
    <div className={cn("flex items-center gap-3 rounded-[1.2rem] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]", c.bg)}>
      <span className={cn("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", c.icon)}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className={cn("text-2xl font-bold leading-none", c.value)}>{value}</p>
        <p className={cn("mt-1 text-[0.75rem] leading-[1.4]", c.label)}>{label}</p>
      </div>
    </div>
  );
}
