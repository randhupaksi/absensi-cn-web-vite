"use client";

import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { MeasuredChart } from "@/components/dashboard/admin/charts/measured-chart";

type AttendanceSegment = {
  name: string;
  value: number;
  color: string;
  dotClassName: string;
};

type AttendanceDonutChartProps = {
  present: number;
  late: number;
  permission: number;
  sick: number;
  alpha: number;
  percentage: number;
  title?: string;
  subtitle?: string;
  badgeText?: string;
};

export function AttendanceDonutChart({
  present,
  late,
  permission,
  sick,
  alpha,
  percentage,
  title = "Persentase Kehadiran",
  subtitle = "Snapshot kehadiran sekolah hari ini",
  badgeText = "Hari ini",
}: AttendanceDonutChartProps) {
  const data: AttendanceSegment[] = [
    {
      name: "Hadir",
      value: present || 0,
      color: "var(--color-emerald-500)",
      dotClassName: "bg-emerald-500",
    },
    {
      name: "Telat",
      value: late || 0,
      color: "var(--color-amber-400)",
      dotClassName: "bg-amber-400",
    },
    {
      name: "Izin",
      value: permission || 0,
      color: "var(--color-sky-400)",
      dotClassName: "bg-sky-400",
    },
    {
      name: "Sakit",
      value: sick || 0,
      color: "var(--color-violet-400)",
      dotClassName: "bg-violet-400",
    },
    {
      name: "Alfa",
      value: alpha || 0,
      color: "var(--color-rose-500)",
      dotClassName: "bg-rose-500",
    },
  ];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData =
    total > 0
      ? data.filter((item) => item.value > 0)
      : [{ name: "Belum ada data", value: 1, color: "var(--color-slate-200)" }];

  return (
    <article className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
          {badgeText}
        </span>
      </div>

      <div className="mt-4 flex justify-center">
        <div className="relative w-full max-w-[300px] min-w-0">
          <MeasuredChart className="h-[230px] min-w-0">
            {({ width, height }) => {
              const chartSize = Math.min(width, height);
              const outerRadius = Math.max(Math.floor(chartSize / 2) - 18, 72);
              const innerRadius = Math.max(outerRadius - 24, 48);

              return (
                <PieChart width={width} height={height}>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    stroke="none"
                    paddingAngle={2}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => {
                      const count = Number(value ?? 0);
                      const share = total > 0 ? Math.round((count / total) * 100) : 0;
                      return [`${count} siswa (${share}%)`, name ?? "Data"];
                    }}
                    position={{
                      x: Math.max(width - 128, 16),
                      y: 18,
                    }}
                    wrapperStyle={{
                      zIndex: 20,
                      pointerEvents: "none",
                    }}
                    contentStyle={{
                      borderRadius: 18,
                      border: "1px solid rgba(226,232,240,0.9)",
                      boxShadow: "0 16px 36px rgba(148,163,184,0.16)",
                    }}
                  />
                </PieChart>
              );
            }}
          </MeasuredChart>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-white/95 px-6 py-5 text-center shadow-[0_8px_24px_rgba(148,163,184,0.14)]">
              <p className="text-3xl font-semibold text-slate-950">{percentage}%</p>
              <p className="mt-1 text-sm text-slate-500">Kehadiran</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-5">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 rounded-[14px] bg-slate-50/80 px-2.5 py-2">
            <span className={`size-2.5 rounded-full ${item.dotClassName}`} />
            <span className="min-w-0 truncate">{item.name}</span>
            <span className="ml-auto font-semibold text-slate-700">{item.value}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
