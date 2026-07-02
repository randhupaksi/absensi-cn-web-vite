"use client";

import { AppLink as Link } from "@/components/router/app-link";
import { siteConfig } from "@/lib/config/site";
import { getAuthSession, mapApiRoleToDashboardRole } from "@/lib/auth";
import { getDashboardNavigation } from "@/lib/constants/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePathname } from "@/lib/router";

export function SidebarNav() {
  const pathname = usePathname();
  const session = getAuthSession();
  const navigation = getDashboardNavigation(
    session ? mapApiRoleToDashboardRole(session.user.role) : "siswa",
  );

  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 lg:block">
      <Card className="flex h-full flex-col justify-between border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="space-y-8">
          <div>
            <Badge className="rounded-full bg-sky-100 px-3 py-1 text-sky-800 hover:bg-sky-100">
              School Dashboard
            </Badge>
            <h2 className="mt-4 font-heading text-2xl font-semibold text-slate-950">
              {siteConfig.name}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Struktur navigasi dipisah agar role-based dashboard lebih mudah
              dibangun bertahap.
            </p>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={`${item.href}-${item.label}`}
                  nativeButton={false}
                  render={<Link href={item.href} />}
                  variant={pathname === item.href ? "default" : "ghost"}
                  className="h-12 w-full justify-start rounded-2xl px-4"
                >
                  <Icon className="size-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </div>

        <Card className="rounded-3xl border-sky-100 bg-sky-50 p-4 shadow-none">
          <p className="text-sm font-semibold text-slate-900">Role dashboard active</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sidebar sekarang menyesuaikan konteks role dari hasil login.
          </p>
        </Card>
      </Card>
    </aside>
  );
}
