"use client";

import { EmptyState } from "@/features/admin/dashboard/widgets/empty-state";
import { MeasuredChart } from "@/features/admin/dashboard/charts/measured-chart";
import type {
  AdminAnalyticsPerformance,
  AdminAttendanceAnalytics,
} from "@/types/admin";
import { Activity, BarChart3, ChartPie } from "lucide-react";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = {
  present: "var(--color-emerald-500)",
  permission: "var(--color-sky-500)",
  sick: "var(--color-violet-400)",
  alpha: "var(--color-rose-500)",
  notAttended: "var(--color-slate-300)",
  usage: "var(--color-teal-500)",
  grid: "var(--color-slate-200)",
  tick: "var(--color-slate-500)",
};

type AnalyticsChartCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

function AnalyticsChartCard({
  eyebrow,
  title,
  description,
  children,
}: AnalyticsChartCardProps) {
  return (
    <article className="rounded-[var(--radius-2xl)] border border-white/75 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)] sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">
        {title}
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-6">{children}</div>
    </article>
  );
}

function AnalyticsTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
  }>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-40 rounded-[var(--radius-md)] border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur">
      <p className="text-xs font-semibold text-slate-800">{label}</p>
      <div className="mt-2 space-y-1.5">
        {payload.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <span className="flex items-center gap-2 text-slate-500">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="font-semibold text-slate-800">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsTrendChart({
  data,
}: {
  data: AdminAttendanceAnalytics["trend"];
}) {
  return (
    <AnalyticsChartCard
      eyebrow="Tren periode"
      title="Kehadiran dan penggunaan sistem"
      description="Bandingkan siswa yang hadir dengan siswa yang berhasil tercatat melalui web."
    >
      {data.length === 0 ? (
        <EmptyState
          icon={Activity}
          compact
          title="Belum ada tren kehadiran"
          description="Tidak ada hari sekolah pada periode dan filter yang dipilih."
        />
      ) : (
        <MeasuredChart className="h-[310px] min-w-0 sm:h-[340px]">
          {({ width, height }) => (
            <LineChart width={width} height={height} data={data}>
              <CartesianGrid
                stroke={COLORS.grid}
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={22}
                tick={{ fill: COLORS.tick, fontSize: 11 }}
              />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: COLORS.tick, fontSize: 11 }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<AnalyticsTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="attendance_percentage"
                name="Kehadiran"
                stroke={COLORS.present}
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="system_usage_percentage"
                name="Penggunaan sistem"
                stroke={COLORS.usage}
                strokeWidth={3}
                strokeDasharray="7 5"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          )}
        </MeasuredChart>
      )}
    </AnalyticsChartCard>
  );
}

export function AnalyticsStatusChart({
  data,
}: {
  data: AdminAttendanceAnalytics["status_breakdown"];
}) {
  const chartData = [
    { name: "Hadir", value: data.present, color: COLORS.present },
    { name: "Izin", value: data.permission, color: COLORS.permission },
    { name: "Sakit", value: data.sick, color: COLORS.sick },
    { name: "Alfa", value: data.alpha, color: COLORS.alpha },
    {
      name: "Belum Absen",
      value: data.not_attended,
      color: COLORS.notAttended,
    },
  ];
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  return (
    <AnalyticsChartCard
      eyebrow="Komposisi status"
      title="Distribusi kehadiran"
      description="Belum Absen dihitung virtual dan tidak membuat record Alfa baru."
    >
      {total === 0 ? (
        <EmptyState
          icon={ChartPie}
          compact
          title="Belum ada komposisi status"
          description="Data akan muncul setelah periode memiliki kewajiban absensi."
        />
      ) : (
        <>
          <MeasuredChart className="h-[250px] min-w-0">
            {({ width, height }) => (
              <PieChart width={width} height={height}>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="55%"
                  outerRadius="82%"
                  paddingAngle={2}
                  stroke="transparent"
                >
                  {chartData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip content={<AnalyticsTooltip />} />
              </PieChart>
            )}
          </MeasuredChart>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {chartData.map((item) => (
              <div
                key={item.name}
                className="rounded-[var(--radius-md)] border border-slate-100 bg-slate-50/75 px-3 py-2.5"
              >
                <span className="flex items-center gap-2 text-xs text-slate-500">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </span>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {item.value.toLocaleString("id-ID")}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </AnalyticsChartCard>
  );
}

export function AnalyticsComparisonChart({
  data,
  title,
  description,
  eyebrow,
}: {
  data: AdminAnalyticsPerformance[];
  title: string;
  description: string;
  eyebrow: string;
}) {
  return (
    <AnalyticsChartCard
      eyebrow={eyebrow}
      title={title}
      description={description}
    >
      {data.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          compact
          title="Belum ada data perbandingan"
          description="Coba ubah periode atau filter analitik."
        />
      ) : (
        <MeasuredChart className="h-[300px] min-w-0">
          {({ width, height }) => (
            <BarChart width={width} height={height} data={data}>
              <CartesianGrid
                stroke={COLORS.grid}
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={{ fill: COLORS.tick, fontSize: 10 }}
              />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: COLORS.tick, fontSize: 11 }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<AnalyticsTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="attendance_percentage"
                name="Kehadiran"
                fill={COLORS.present}
                radius={[8, 8, 3, 3]}
                maxBarSize={34}
              />
              <Bar
                dataKey="system_usage_percentage"
                name="Penggunaan sistem"
                fill={COLORS.usage}
                radius={[8, 8, 3, 3]}
                maxBarSize={34}
              />
            </BarChart>
          )}
        </MeasuredChart>
      )}
    </AnalyticsChartCard>
  );
}
