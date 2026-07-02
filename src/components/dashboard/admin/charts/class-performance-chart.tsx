"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/dashboard/admin/widgets/empty-state";
import { MeasuredChart } from "@/components/dashboard/admin/charts/measured-chart";

type ClassPerformanceChartProps = {
  data: Array<{
    class_name: string;
    percentage: number;
    present_text: string;
  }>;
};

const fallbackData = [
  { class_name: "X PPLG 1", percentage: 0, present_text: "0/0 hadir" },
  { class_name: "X PPLG 2", percentage: 0, present_text: "0/0 hadir" },
  { class_name: "XI PPLG 1", percentage: 0, present_text: "0/0 hadir" },
  { class_name: "XI PPLG 2", percentage: 0, present_text: "0/0 hadir" },
];

export function ClassPerformanceChart({ data }: ClassPerformanceChartProps) {
  const chartData = data.length ? data : fallbackData;
  const isEmpty = chartData.every((item) => item.percentage === 0);

  return (
    <article className="rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_52px_rgba(150,163,184,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xl font-semibold text-slate-950">Kehadiran Terbaik</p>
          <p className="mt-1 text-sm text-slate-500">
            Kelas dengan performa kehadiran paling stabil
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
          Bulanan
        </span>
      </div>

      <div className="mt-6 rounded-[28px] bg-[linear-gradient(180deg,#fcfffd_0%,#f4faf6_100%)] p-4">
        <MeasuredChart className="h-[300px] min-w-0">
          {({ width, height }) => (
            <BarChart width={width} height={height} data={chartData} barCategoryGap={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7ece9" vertical={false} />
            <XAxis
              dataKey="class_name"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#7b8699", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#7b8699", fontSize: 12 }}
              domain={[0, 100]}
            />
            <Tooltip
              formatter={(value) => [`${Number(value ?? 0)}%`, "Kehadiran"]}
              labelFormatter={(label) => `Kelas ${label}`}
              contentStyle={{
                borderRadius: 18,
                border: "1px solid rgba(226,232,240,0.9)",
                boxShadow: "0 18px 36px rgba(148,163,184,0.15)",
              }}
            />
            <Bar
              dataKey="percentage"
              fill="#63c98f"
              radius={[10, 10, 4, 4]}
              maxBarSize={42}
            />
            </BarChart>
          )}
        </MeasuredChart>
      </div>

      {isEmpty ? (
        <div className="mt-4">
          <EmptyState
            icon={BarChart3}
            compact
            title="Belum ada performa kelas"
            description="Belum ada data kehadiran kelas yang bisa ditampilkan. Setelah absensi mulai tercatat, performa tiap kelas akan muncul di sini."
          />
        </div>
      ) : null}
    </article>
  );
}
