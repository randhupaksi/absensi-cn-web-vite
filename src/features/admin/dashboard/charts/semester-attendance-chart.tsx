"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartNoAxesCombined } from "lucide-react";
import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import { MeasuredChart } from "@/features/admin/dashboard/charts/measured-chart";

type SemesterPoint = {
  label: string;
  present: number;
  permission: number;
  sick: number;
  alpha: number;
};

type SemesterAttendanceChartProps = {
  data: SemesterPoint[];
};

export function SemesterAttendanceChart({
  data,
}: SemesterAttendanceChartProps) {
  const chartData = data;
  const isEmpty = chartData.every(
    (item) =>
      item.present === 0 &&
      item.permission === 0 &&
      item.sick === 0 &&
      item.alpha === 0,
  );

  return (
    <article className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)] dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xl font-semibold text-slate-950 dark:text-slate-100">
            Grafik Kehadiran Siswa
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tren absensi selama satu semester
          </p>
        </div>
        <span className="inline-flex shrink-0 whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
          Semester aktif
        </span>
      </div>

      <div className="mt-6 rounded-[28px] bg-[linear-gradient(180deg,#fffefb_0%,#fbfaf4_100%)] p-4 dark:bg-none dark:bg-slate-950/70">
        <MeasuredChart className="h-[300px] min-w-0">
          {({ width, height }) => (
            <AreaChart width={width} height={height} data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 18,
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--popover)",
                  color: "var(--popover-foreground)",
                  boxShadow: "0 18px 36px rgba(2,6,23,0.28)",
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: "12px", paddingBottom: "12px" }}
              />
              <Area
                type="monotone"
                dataKey="present"
                name="Hadir"
                stroke="#63c98f"
                fill="none"
                strokeWidth={3}
              />
              <Area
                type="monotone"
                dataKey="permission"
                name="Izin"
                stroke="#38bdf8"
                fill="none"
                strokeWidth={2.5}
              />
              <Area
                type="monotone"
                dataKey="sick"
                name="Sakit"
                stroke="#a78bfa"
                fill="none"
                strokeWidth={2.5}
              />
              <Area
                type="monotone"
                dataKey="alpha"
                name="Alfa"
                stroke="#f28b82"
                fill="none"
                strokeWidth={2.5}
              />
            </AreaChart>
          )}
        </MeasuredChart>
      </div>

      {isEmpty ? (
        <div className="mt-4">
          <EmptyState
            icon={ChartNoAxesCombined}
            compact
            title="Belum ada data absensi"
            description="Belum ada riwayat absensi yang tercatat untuk periode ini. Grafik akan terisi otomatis saat data kehadiran mulai masuk."
          />
        </div>
      ) : null}
    </article>
  );
}
