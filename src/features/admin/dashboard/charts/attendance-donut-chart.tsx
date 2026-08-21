"use client";

import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { MeasuredChart } from "@/features/admin/dashboard/charts/measured-chart";

type AttendanceSegment = {
  name: string;
  value: number;
  color: string;
  dotClassName: string;
};

type AttendanceDonutChartProps = {
  present: number;
  permission: number;
  sick: number;
  alpha: number;
  percentage: number;
  totalStudents?: number;
  title?: string;
  subtitle?: string;
  badgeText?: string;
};

export function AttendanceDonutChart({
  present,
  permission,
  sick,
  alpha,
  percentage,
  totalStudents,
  title = "Persentase Kehadiran",
  subtitle = "Snapshot kehadiran sekolah hari ini",
  badgeText = "Hari ini",
}: AttendanceDonutChartProps) {
  const recordedTotal = present + permission + sick + alpha;
  const pending =
    typeof totalStudents === "number"
      ? Math.max(totalStudents - recordedTotal, 0)
      : 0;
  const data: AttendanceSegment[] = [
    {
      name: "Hadir",
      value: present || 0,
      color: "var(--color-emerald-500)",
      dotClassName: "bg-emerald-500",
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
    ...(typeof totalStudents === "number"
      ? [
          {
            name: "Belum Absen",
            value: pending,
            color: "var(--color-slate-300)",
            dotClassName: "bg-slate-300",
          },
        ]
      : []),
  ];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData =
    total > 0
      ? data.filter((item) => item.value > 0)
      : [{ name: "Belum ada data", value: 1, color: "var(--chart-empty)" }];

  return (
    <article className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)] dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <span className="inline-flex shrink-0 whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
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
                <PieChart
                  width={width}
                  height={height}
                  accessibilityLayer={false}
                >
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
                    cursor={false}
                    formatter={(value, name) => {
                      const count = Number(value ?? 0);
                      const share =
                        total > 0 ? Math.round((count / total) * 100) : 0;
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
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--popover)",
                      color: "var(--popover-foreground)",
                      boxShadow: "0 16px 36px rgba(2,6,23,0.28)",
                    }}
                  />
                </PieChart>
              );
            }}
          </MeasuredChart>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-white/95 px-6 py-5 text-center shadow-[0_8px_24px_rgba(148,163,184,0.14)] dark:bg-slate-800/95 dark:shadow-none">
              <p className="text-3xl font-semibold text-slate-950 dark:text-slate-100">
                {percentage}%
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Kehadiran</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        {data.map((item) => (
          <div
            key={item.name}
            className="flex min-w-[92px] items-center gap-2 rounded-[14px] bg-slate-50/80 px-3 py-2 dark:bg-slate-800"
          >
            <span
              className={`size-2.5 shrink-0 rounded-full ${item.dotClassName}`}
            />
            <span className="whitespace-nowrap">{item.name}</span>
            <span className="ml-auto shrink-0 tabular-nums font-semibold text-slate-700 dark:text-slate-200">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}
