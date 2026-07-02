"use client";

import { AppShell } from "@/components/layouts/app-shell";
import { AttendanceStatusBadge } from "@/components/attendance/attendance-status-badge";
import { AppDataTable } from "@/components/data-table/app-data-table";
import { attendanceColumns } from "@/components/data-table/columns/attendance-columns";
import { DashboardHero } from "@/components/dashboard/shared/dashboard-hero";
import { StatCard } from "@/components/dashboard/shared/stat-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthSession, getDashboardPathForRole, mapApiRoleToDashboardRole } from "@/lib/auth";
import { roleDashboardConfig } from "@/lib/constants/dashboard";
import { attendanceHistory } from "@/lib/constants/mock-data";
import type { DashboardRole } from "@/types/auth";
import { useRouter } from "@/lib/router";
import { useEffect } from "react";

type RoleDashboardPageProps = {
  expectedRole: DashboardRole;
};

export function RoleDashboardPage({ expectedRole }: RoleDashboardPageProps) {
  const router = useRouter();
  const session = getAuthSession();
  const displayName = session?.user.name ?? "";
  const loggedInRole = session ? mapApiRoleToDashboardRole(session.user.role) : null;

  useEffect(() => {
    if (!session) {
      router.replace("/login");
      return;
    }

    if (loggedInRole !== expectedRole) {
      router.replace(getDashboardPathForRole(session.user.role));
    }
  }, [expectedRole, loggedInRole, router, session]);

  if (!session || loggedInRole !== expectedRole) {
    return null;
  }

  const config = roleDashboardConfig[expectedRole];

  return (
    <AppShell>
      <div className="space-y-8">
        <DashboardHero
          badge={config.badge}
          title={config.title}
          description={config.subtitle}
          primaryAction={config.primaryAction}
          secondaryAction={config.secondaryAction}
        />

        <section className="grid gap-4 grid-cols-2 xl:grid-cols-4">
          {config.stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-white/70 bg-white/80 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>{config.badge} - Ringkasan Absensi</CardTitle>
            </CardHeader>
            <CardContent>
              <AppDataTable columns={attendanceColumns} data={attendanceHistory} />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/70 bg-white/80 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle>Konteks Login</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 rounded-3xl bg-slate-50 p-4">
                  <Avatar className="size-14">
                    <AvatarFallback className="bg-emerald-100 text-emerald-800">
                      {displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-slate-500">Login aktif</p>
                    <p className="text-lg font-semibold text-slate-950">{displayName}</p>
                    <p className="text-sm text-slate-600">{config.badge}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {config.highlights.map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
                    >
                      <p className="text-sm font-medium text-slate-800">{item}</p>
                      <AttendanceStatusBadge status="hadir" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/80 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle>Aksi Cepat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="h-12 w-full justify-start rounded-2xl">
                  {config.primaryAction}
                </Button>
                <Button
                  variant="outline"
                  className="h-12 w-full justify-start rounded-2xl bg-white"
                >
                  {config.secondaryAction}
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
