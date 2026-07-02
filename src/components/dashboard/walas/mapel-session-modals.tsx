"use client";

import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "hadir", label: "Hadir" },
  { value: "telat", label: "Telat" },
  { value: "alfa_kelas", label: "Alfa Kelas" },
  { value: "dispensasi", label: "Dispensasi" },
];

type KoreksiModalProps = {
  studentName: string;
  nis: string;
  currentStatus: string;
  alasan: string;
  newStatus: string;
  isPending: boolean;
  error?: string;
  onAlasanChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export function KoreksiModal({
  studentName,
  nis,
  currentStatus,
  alasan,
  newStatus,
  isPending,
  error,
  onAlasanChange,
  onStatusChange,
  onCancel,
  onSubmit,
}: KoreksiModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-[28px] border border-white/70 bg-white p-6 shadow-2xl"
      >
        <p className="text-lg font-semibold text-slate-950">Koreksi Status Kehadiran</p>
        <p className="mt-1 text-sm text-slate-500">
          {studentName} · {nis}
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Status Saat Ini
            </label>
            <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {currentStatus}
            </span>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Status Baru
            </label>
            <select
              value={newStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Alasan Koreksi <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={alasan}
              onChange={(e) => onAlasanChange(e.target.value)}
              rows={3}
              placeholder="Tuliskan alasan koreksi data kehadiran..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-slate-200 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!alasan.trim() || isPending}
            className="flex-1 rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Menyimpan...
              </span>
            ) : (
              "Simpan Koreksi"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
