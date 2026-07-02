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
import { EmptyState } from "@/components/dashboard/admin/widgets/empty-state";
import { MeasuredChart } from "@/components/dashboard/admin/charts/measured-chart";

type SemesterPoint = {
  label: string;
  present: number;
  late: number;
  alpha: number;
};

type SemesterAttendanceChartProps = {
  data: SemesterPoint[];
};

const fallbackData: SemesterPoint[] = [
  { label: "Jul", present: 0, late: 0, alpha: 0 },
  { label: "Agu", present: 0, late: 0, alpha: 0 },
  { label: "Sep", present: 0, late: 0, alpha: 0 },
  { label: "Okt", present: 0, late: 0, alpha: 0 },
  { label: "Nov", present: 0, late: 0, alpha: 0 },
  { label: "Des", present: 0, late: 0, alpha: 0 },
];

export function SemesterAttendanceChart({
  data,
}: SemesterAttendanceChartProps) {
  const chartData = data.length ? data : fallbackData;
  const isEmpty = chartData.every(
    (item) => item.present === 0 && item.late === 0 && item.alpha === 0,
  );

  return (
    <article className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xl font-semibold text-slate-950">
            Grafik Kehadiran Siswa
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Tren absensi selama satu semester
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          Semester aktif
        </span>
      </div>

      <div className="mt-6 rounded-[28px] bg-[linear-gradient(180deg,#fffefb_0%,#fbfaf4_100%)] p-4">
        <MeasuredChart className="h-[300px] min-w-0">
          {({ width, height }) => (
            <AreaChart width={width} height={height} data={chartData}>
            <defs>
              <linearGradient id="hadirFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#63c98f" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#63c98f" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="telatFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#f3c560" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f3c560" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="alfaFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#f28b82" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#f28b82" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7ece9" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#7b8699", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#7b8699", fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 18,
                border: "1px solid rgba(226,232,240,0.9)",
                boxShadow: "0 18px 36px rgba(148,163,184,0.15)",
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
              fill="url(#hadirFill)"
              strokeWidth={3}
            />
            <Area
              type="monotone"
              dataKey="late"
              name="Terlambat"
              stroke="#f3c560"
              fill="url(#telatFill)"
              strokeWidth={2.5}
            />
            <Area
              type="monotone"
              dataKey="alpha"
              name="Alfa"
              stroke="#f28b82"
              fill="url(#alfaFill)"
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
