import { AppImage as Image } from "@/components/media/app-image";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

type PageSkeletonVariant =
  | "dashboard"
  | "management"
  | "student-dashboard"
  | "profile"
  | "history"
  | "analytics"
  | "support-admin"
  | "support-user"
  | "subject-session"
  | "subject-recap";

export function RouteLoadingFallback() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/login")) {
    return (
      <LoginRouteSkeleton
        portal={pathname.startsWith("/login/staff") ? "staff" : "student"}
      />
    );
  }
  if (pathname === "/support") return <PublicSupportRouteSkeleton />;
  if (pathname === "/support/reset-password") {
    return <ResetPasswordRouteSkeleton />;
  }
  if (!pathname.startsWith("/dashboard")) return <BrandedAppLoader />;
  return <DashboardRouteSkeleton variant={getRouteVariant(pathname)} />;
}

export function BrandedAppLoader({
  label = "Menyiapkan Citra Negara Attendance System",
}: {
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-slot="loading-shell"
      className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(167,243,208,0.36),transparent_34%),linear-gradient(180deg,#f8fbf8_0%,#eef7f1_100%)] p-6 dark:bg-slate-950"
    >
      <div className="app-loader-enter flex flex-col items-center text-center">
        <div className="relative flex size-24 items-center justify-center rounded-[2rem] border border-emerald-200/80 bg-white/86 shadow-[0_24px_60px_rgba(15,118,110,0.16)] backdrop-blur-xl dark:border-emerald-900/70 dark:bg-slate-900 dark:shadow-none">
          <span
            aria-hidden="true"
            className="app-loader-pulse absolute inset-2 rounded-[1.55rem] bg-emerald-100/65"
          />
          <Image
            src="/images/optimized/logo-sma-smk-yatkj-ui.png"
            alt="Logo Sekolah Citra Negara"
            width={62}
            height={62}
            priority
            className="relative object-contain"
          />
        </div>
        <p className="mt-6 font-heading text-lg font-semibold text-slate-900 dark:text-slate-100">
          {label}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Menghubungkan portal dan data sekolah.
        </p>
        <div className="mt-5 h-1.5 w-40 overflow-hidden rounded-full bg-emerald-100">
          <div className="app-loader-progress h-full w-[42%] rounded-full bg-emerald-500" />
        </div>
      </div>
    </div>
  );
}

export function DashboardRouteSkeleton({
  variant = "dashboard",
}: {
  variant?: PageSkeletonVariant;
}) {
  return (
    <div
      role="status"
      aria-label="Memuat halaman dasbor"
      data-slot="loading-shell"
      className="min-h-screen min-w-0 overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(126,182,155,0.22),transparent_26%),radial-gradient(circle_at_top_right,rgba(111,166,208,0.12),transparent_18%),linear-gradient(180deg,#f7f5ee_0%,#f2f0e8_100%)] dark:bg-slate-950"
    >
      <aside className="fixed inset-y-0 left-0 hidden w-[272px] border-r border-white/70 bg-emerald-950/96 p-5 lg:block">
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <Skeleton className="size-12 rounded-2xl bg-white/16" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32 bg-white/18" />
            <Skeleton className="h-3 w-20 bg-white/10" />
          </div>
        </div>
        <div className="mt-7 space-y-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-3",
                index === 0 && "bg-white/10",
              )}
            >
              <Skeleton className="size-8 rounded-xl bg-white/12" />
              <Skeleton
                className={cn(
                  "h-3 bg-white/12",
                  index % 3 === 0 ? "w-28" : "w-36",
                )}
              />
            </div>
          ))}
        </div>
      </aside>
      <main className="min-w-0 space-y-5 overflow-x-hidden p-4 md:p-5 lg:pl-[292px]">
        <SkeletonTopbar />
        <PageSkeleton variant={variant} />
      </main>
    </div>
  );
}

export function PageSkeleton({ variant }: { variant: PageSkeletonVariant }) {
  if (variant === "management") return <ManagementPageSkeleton />;
  if (variant === "student-dashboard") return <StudentDashboardSkeleton />;
  if (variant === "profile") return <ProfilePageSkeleton />;
  if (variant === "history") return <HistoryPageSkeleton />;
  if (variant === "analytics") return <AnalyticsRouteSkeleton />;
  if (variant === "support-admin") return <SupportWorkspaceSkeleton />;
  if (variant === "support-user") return <UserSupportWorkspaceSkeleton />;
  if (variant === "subject-session") return <SubjectSessionPageSkeleton />;
  if (variant === "subject-recap") return <SubjectRecapPageSkeleton />;
  return <DashboardPageSkeleton />;
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid items-start gap-5 xl:grid-cols-[1.35fr_0.75fr]">
        <SkeletonPanel className="min-h-[270px]">
          <Skeleton className="h-7 w-40 rounded-full" />
          <Skeleton className="mt-7 h-10 w-[58%]" />
          <Skeleton className="mt-3 h-4 w-[76%]" />
          <Skeleton className="mt-2 h-4 w-[62%]" />
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-14 rounded-2xl" />
            ))}
          </div>
        </SkeletonPanel>
        <SkeletonPanel className="min-h-[270px]">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>
          <div className="mx-auto mt-7 size-32 rounded-full border-[18px] border-slate-200/70 dark:border-slate-700" />
          <Skeleton className="mx-auto mt-6 h-4 w-36" />
        </SkeletonPanel>
      </div>
      <KpiGridSkeleton />
      <div className="grid gap-5 xl:grid-cols-2">
        <ContentListSkeleton />
        <ContentListSkeleton />
      </div>
    </div>
  );
}

export function ManagementPageSkeleton() {
  return (
    <div className="space-y-5">
      <SkeletonPanel className="p-4 md:p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-14 rounded-[1.15rem]" />
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-3 lg:flex-row">
          <Skeleton className="h-14 flex-1 rounded-[1.4rem]" />
          <Skeleton className="h-14 w-full rounded-[1.4rem] lg:w-56" />
          <Skeleton className="h-14 w-full rounded-[1.4rem] lg:w-44" />
        </div>
      </SkeletonPanel>
      <TableSkeleton columns={7} rows={7} />
    </div>
  );
}

export function StudentDashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid items-start gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <SkeletonPanel className="min-h-[330px]">
          <div className="min-h-[260px] rounded-[1.6rem] bg-emerald-800/90 p-6 dark:bg-emerald-950/40 sm:min-h-[330px]">
            <Skeleton className="h-8 w-52 rounded-full bg-white/16" />
            <Skeleton className="mt-7 h-12 w-[82%] bg-white/18" />
            <Skeleton className="mt-3 h-12 w-[64%] bg-white/18" />
            <Skeleton className="mt-5 h-4 w-[72%] bg-white/12" />
            <Skeleton className="mt-10 h-14 w-52 rounded-full bg-white/24 sm:mt-16 sm:h-16" />
          </div>
        </SkeletonPanel>
        <SkeletonPanel>
          <div className="grid gap-4">
            <Skeleton className="h-32 rounded-[1.5rem] sm:h-40" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-20 rounded-[1.35rem] sm:h-24"
                />
              ))}
            </div>
          </div>
        </SkeletonPanel>
      </div>
      <KpiGridSkeleton />
      <div className="grid gap-5 lg:grid-cols-2">
        <ContentListSkeleton />
        <ContentListSkeleton />
      </div>
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <SkeletonPanel>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="min-h-[410px] rounded-[1.7rem] bg-emerald-800/90 p-7 dark:bg-emerald-950/40">
          <Skeleton className="h-5 w-40 bg-white/16" />
          <div className="mt-6 flex items-center gap-4">
            <Skeleton className="size-20 rounded-[1.5rem] bg-white/18" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-3/4 bg-white/18" />
              <Skeleton className="h-4 w-1/2 bg-white/12" />
            </div>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-24 rounded-[1.3rem] bg-white/14"
              />
            ))}
          </div>
        </div>
        <div className="rounded-[1.7rem] border border-slate-200/70 bg-white/70 p-6 dark:border-slate-700 dark:bg-slate-900">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="mt-3 h-4 w-72 max-w-full" />
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-20 rounded-[1.2rem]" />
            ))}
          </div>
        </div>
      </div>
    </SkeletonPanel>
  );
}

export function HistoryPageSkeleton() {
  return (
    <div className="space-y-5">
      <SkeletonPanel>
        <Skeleton className="h-8 w-52 rounded-full" />
        <Skeleton className="mt-7 h-11 w-72" />
        <Skeleton className="mt-3 h-4 w-[55%]" />
        <div className="mt-7">
          <KpiGridSkeleton />
        </div>
      </SkeletonPanel>
      <SkeletonPanel>
        <div className="flex flex-col gap-3 border-b border-slate-200/70 pb-5 dark:border-slate-700 sm:flex-row sm:justify-between">
          <Skeleton className="h-14 w-full rounded-[1.3rem] sm:w-56" />
          <Skeleton className="h-14 w-full rounded-[1.3rem] sm:w-96" />
        </div>
        <div className="mt-5">
          <TableSkeleton columns={5} rows={6} embedded />
        </div>
      </SkeletonPanel>
    </div>
  );
}

export function AnalyticsContentSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat analitik kehadiran"
      className="min-w-0 max-w-full space-y-5 overflow-x-hidden"
    >
      <KpiGridSkeleton />
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-[min(34rem,85%)]" />
      </div>
      <section className="grid gap-4 md:grid-cols-2">
        <RankedListSkeleton />
        <RankedListSkeleton />
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton type="donut" />
      </section>
    </div>
  );
}

function AnalyticsRouteSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat analitik kehadiran"
      className="min-w-0 max-w-full space-y-5 overflow-x-hidden"
    >
      <SkeletonPanel className="min-h-[230px]">
        <Skeleton className="h-8 w-36 rounded-full" />
        <Skeleton className="mt-6 h-10 w-[min(42rem,90%)]" />
        <Skeleton className="mt-3 h-4 w-[min(36rem,78%)]" />
        <div className="mt-7 flex flex-wrap gap-3">
          <Skeleton className="h-11 w-36 rounded-2xl" />
          <Skeleton className="h-11 w-44 rounded-2xl" />
        </div>
      </SkeletonPanel>
      <SkeletonPanel className="p-5">
        <Skeleton className="h-5 w-32" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 rounded-[1.15rem]" />
          ))}
        </div>
      </SkeletonPanel>
      <AnalyticsContentSkeleton />
    </div>
  );
}

export function SupportWorkspaceSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat pusat bantuan"
      className="min-w-0 max-w-full space-y-5 overflow-x-hidden"
    >
      <SkeletonPanel className="min-h-[150px] overflow-hidden">
        <div className="flex items-start gap-4">
          <Skeleton className="size-12 shrink-0 rounded-[18px]" />
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="h-4 w-[min(42rem,92%)]" />
          </div>
          <Skeleton className="hidden h-11 w-32 rounded-2xl sm:block" />
        </div>
      </SkeletonPanel>
      <div className="grid min-w-0 w-full max-w-full grid-cols-1 gap-3 overflow-hidden sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SupportStatSkeleton key={index} />
        ))}
      </div>
      <section className="grid min-w-0 w-full max-w-full min-h-[560px] grid-cols-1 gap-5 overflow-hidden xl:grid-cols-[minmax(22rem,430px)_minmax(0,1fr)]">
        <aside className="min-w-0 w-full max-w-full overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/90">
          <Skeleton className="h-16 w-full max-w-full rounded-[1.4rem]" />
          <div className="mt-3 flex min-w-0 max-w-full gap-2 overflow-hidden">
            {[72, 96, 110, 76].map((width, index) => (
              <Skeleton
                key={index}
                className="h-9 shrink-0 rounded-full"
                style={{ width }}
              />
            ))}
          </div>
          <div className="mt-4">
            <SupportTicketListSkeleton rows={4} />
          </div>
        </aside>
        <div className="min-w-0 w-full max-w-full overflow-hidden">
          <SupportTicketConversationSkeleton />
        </div>
      </section>
    </div>
  );
}

function UserSupportWorkspaceSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat pusat bantuan"
      className="min-w-0 max-w-full space-y-5 overflow-x-hidden"
    >
      <SkeletonPanel className="min-h-[150px] overflow-hidden">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <Skeleton className="size-12 shrink-0 rounded-[18px]" />
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-72 max-w-full" />
              <Skeleton className="h-4 w-[min(34rem,92%)]" />
            </div>
          </div>
          <div className="flex gap-2 self-end sm:self-auto">
            <Skeleton className="h-11 w-32 rounded-2xl" />
            <Skeleton className="h-11 w-28 rounded-2xl" />
          </div>
        </div>
      </SkeletonPanel>
      <section className="grid min-w-0 w-full max-w-full min-h-[560px] grid-cols-1 gap-5 overflow-hidden xl:grid-cols-[400px_minmax(0,1fr)]">
        <aside className="min-w-0 w-full max-w-full overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/90">
          <Skeleton className="h-16 w-full max-w-full rounded-[1.4rem]" />
          <div className="mt-4">
            <SupportTicketListSkeleton rows={4} />
          </div>
        </aside>
        <div className="min-w-0 w-full max-w-full overflow-hidden">
          <SupportTicketConversationSkeleton />
        </div>
      </section>
    </div>
  );
}

export function SupportTicketListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-label="Memuat daftar tiket"
      className="min-w-0 max-w-full space-y-2"
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="min-w-0 max-w-full overflow-hidden rounded-[20px] border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/45"
        >
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="size-6 rounded-lg" />
          </div>
          <Skeleton className="mt-4 h-4 w-[72%]" />
          <div className="mt-4 flex items-center justify-between gap-3">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SupportTicketConversationSkeleton() {
  return (
    <section
      role="status"
      aria-label="Memuat percakapan tiket"
      className="min-w-0 w-full max-w-full min-h-[560px] overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 dark:border-slate-700 dark:bg-slate-900/90"
    >
      <div className="border-b border-slate-200/80 p-5 dark:border-slate-700">
        <div className="flex min-w-0 items-start justify-between gap-4 overflow-hidden">
          <div className="flex min-w-0 items-start gap-3">
            <Skeleton className="size-12 shrink-0 rounded-[18px]" />
            <div className="min-w-0 space-y-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-7 w-56 max-w-full" />
              <Skeleton className="h-4 w-44" />
            </div>
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="mt-5 grid gap-3 rounded-[1.35rem] border border-slate-200/80 p-4 sm:grid-cols-3 dark:border-slate-700">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-[82%]" />
            </div>
          ))}
        </div>
      </div>
      <div className="min-w-0 space-y-4 overflow-hidden p-5">
        {["w-[62%]", "ml-auto w-[72%]", "w-[48%]"].map((width, index) => (
          <div
            key={index}
            className={cn("space-y-2", index === 1 && "ml-auto")}
          >
            <Skeleton className={cn("h-20 rounded-[1.25rem]", width)} />
            <Skeleton className={cn("h-3 w-20", index === 1 && "ml-auto")} />
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200/80 p-4 dark:border-slate-700">
        <Skeleton className="h-14 w-full rounded-[1.2rem]" />
      </div>
    </section>
  );
}

export function SubjectSessionPageSkeleton() {
  return (
    <div role="status" aria-label="Memuat sesi mapel" className="space-y-4">
      <SkeletonPanel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-5 w-64 max-w-full" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-10 w-36 rounded-full" />
          </div>
        </div>
      </SkeletonPanel>
      <SkeletonPanel className="p-5">
        <div className="grid items-end gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]">
          <SkeletonField />
          <SkeletonField />
          <Skeleton className="h-14 w-full rounded-[1.25rem] lg:w-36" />
        </div>
      </SkeletonPanel>
      <KpiGridSkeleton />
      <section className="rounded-[24px] border border-white/70 bg-white/88 p-4 dark:border-slate-700 dark:bg-slate-900 sm:rounded-[32px] sm:p-5">
        <Skeleton className="h-6 w-48" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[1.2rem] border border-slate-200/80 p-4 dark:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[72%]" />
                  <Skeleton className="h-3 w-[48%]" />
                </div>
              </div>
              <div className="mt-4 flex justify-between gap-3">
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function SubjectRecapPageSkeleton() {
  return (
    <div role="status" aria-label="Memuat rekap mapel" className="space-y-5">
      <SkeletonPanel className="p-5">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-[20px] border border-emerald-100 bg-emerald-50/55 px-4 py-3.5 dark:border-emerald-800/70 dark:bg-emerald-950/45">
          <Skeleton className="size-9 shrink-0 rounded-[13px]" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-[72%]" />
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_2fr]">
          <SkeletonField />
          <SkeletonField />
          <SkeletonField />
        </div>
      </SkeletonPanel>
      <SubjectRecapResultsSkeleton />
    </div>
  );
}

export function SubjectRecapResultsSkeleton() {
  return (
    <SkeletonPanel className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-6 w-64 max-w-full" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-14 w-full rounded-[1.25rem] sm:w-56" />
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <RecapClassSkeleton />
        <RecapClassSkeleton />
      </div>
    </SkeletonPanel>
  );
}

function SupportStatSkeleton() {
  return (
    <div className="min-w-0 w-full max-w-full overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/72 p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="size-11 rounded-2xl" />
      </div>
    </div>
  );
}

function RankedListSkeleton() {
  return (
    <SkeletonPanel>
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-3 h-6 w-48" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-[1.2rem] border border-slate-100 p-3 dark:border-slate-800"
          >
            <Skeleton className="size-9 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-[66%]" />
              <Skeleton className="h-3 w-[42%]" />
            </div>
            <Skeleton className="h-7 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </SkeletonPanel>
  );
}

function SkeletonField() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-14 w-full rounded-[1.25rem]" />
    </div>
  );
}

function RecapClassSkeleton() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-emerald-100/80 dark:border-slate-700">
      <div className="flex items-center justify-between border-b border-emerald-100/80 px-5 py-4 dark:border-slate-700">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      <div className="space-y-3 p-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-[1rem] border border-slate-100 p-3 dark:border-slate-800"
          >
            <Skeleton className="size-9 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-[68%]" />
              <Skeleton className="h-3 w-[46%]" />
            </div>
            <Skeleton className="h-8 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({
  columns = 6,
  rows = 6,
  embedded = false,
}: {
  columns?: number;
  rows?: number;
  embedded?: boolean;
}) {
  const content = (
    <div className="min-w-[680px]">
      <div
        className="grid gap-4 bg-emerald-50/80 px-5 py-4 dark:bg-emerald-950/45"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(92px, 1fr))` }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`head-${index}`} className="h-4 w-3/4" />
        ))}
      </div>
      <div className="divide-y divide-emerald-50 bg-white/80 dark:divide-slate-800 dark:bg-slate-900">
        {Array.from({ length: rows }).map((_, row) => (
          <div
            key={row}
            className="grid items-center gap-4 px-5 py-4"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(92px, 1fr))`,
            }}
          >
            {Array.from({ length: columns }).map((__, cell) => (
              <Skeleton
                key={`${row}-${cell}`}
                className={cn(
                  "h-4",
                  cell === 0
                    ? "w-[88%]"
                    : cell === columns - 1
                      ? "mx-auto h-9 w-16 rounded-xl"
                      : "w-[68%]",
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
  if (embedded)
    return (
      <div className="overflow-x-auto rounded-[1.35rem] border border-emerald-100 dark:border-emerald-900/70">
        {content}
      </div>
    );
  return (
    <div className="overflow-x-auto rounded-[1.5rem] border border-emerald-100/80 shadow-[0_18px_42px_rgba(15,23,42,0.05)] dark:border-emerald-900/70 dark:shadow-none">
      {content}
    </div>
  );
}

export function ModalContentSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div role="status" aria-label="Memuat detail" className="space-y-5">
      <div className="rounded-[1.35rem] border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-900/70 dark:bg-emerald-950/30">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="mt-3 h-4 w-[72%]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-12 rounded-[1.1rem]" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3 border-t border-slate-200/70 pt-5 dark:border-slate-700">
        <Skeleton className="h-12 w-24 rounded-[1.1rem]" />
        <Skeleton className="h-12 w-36 rounded-[1.1rem]" />
      </div>
    </div>
  );
}

export function ListRowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Memuat daftar" className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-[1.25rem] border border-slate-100 bg-slate-50/75 p-3.5 dark:border-slate-800 dark:bg-slate-900"
        >
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton
              className={cn("h-4", index % 2 === 0 ? "w-[62%]" : "w-[48%]")}
            />
            <Skeleton className="h-3 w-[38%]" />
          </div>
          <Skeleton className="h-7 w-16 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ type = "line" }: { type?: "line" | "donut" }) {
  return (
    <section
      role="status"
      aria-label="Memuat visualisasi"
      className="min-h-[280px] min-w-0 max-w-full overflow-hidden rounded-[2rem] border border-white/80 bg-white/78 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-3 w-64 max-w-full" />
        </div>
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      {type === "donut" ? (
        <div className="mx-auto mt-8 size-36 rounded-full border-[20px] border-slate-200/75 dark:border-slate-700" />
      ) : (
        <div className="mt-8 flex h-40 items-end gap-3 border-b border-l border-slate-200 px-3 pb-3 dark:border-slate-700">
          {[42, 68, 52, 86, 62, 78, 58].map((height, index) => (
            <Skeleton
              key={index}
              className="flex-1 rounded-t-lg"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SkeletonTopbar() {
  return (
    <div className="flex min-h-[104px] items-center justify-between gap-5 rounded-[2rem] border border-white/75 bg-white/72 px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-64 max-w-[60vw]" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="hidden h-12 w-36 rounded-full sm:block" />
        <Skeleton className="size-12 rounded-full" />
      </div>
    </div>
  );
}

function SkeletonPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[2rem] border border-white/82 bg-white/78 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none",
        className,
      )}
    >
      {children}
    </section>
  );
}

function KpiGridSkeleton() {
  return (
    <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[1.5rem] border border-white/80 bg-white/72 p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex justify-between gap-4">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-full" />
            </div>
            <Skeleton className="size-11 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ContentListSkeleton() {
  return (
    <SkeletonPanel>
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-3 w-64 max-w-full" />
        </div>
        <Skeleton className="size-9 rounded-full" />
      </div>
      <div className="mt-5 space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-[1.2rem] border border-slate-100 p-3 dark:border-slate-800"
          >
            <Skeleton className="size-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-[62%]" />
              <Skeleton className="h-3 w-[42%]" />
            </div>
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </SkeletonPanel>
  );
}

function LoginRouteSkeleton({ portal }: { portal: "student" | "staff" }) {
  if (portal === "staff") return <StaffLoginRouteSkeleton />;

  return (
    <div
      role="status"
      aria-label="Memuat portal login"
      data-slot="loading-shell"
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(167,243,208,0.3),transparent_32%),linear-gradient(135deg,#f8fbf8_0%,#edf8f1_100%)] p-5 dark:bg-slate-950"
    >
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-[1480px] items-center gap-10 lg:grid-cols-[1fr_0.95fr]">
        <div className="hidden space-y-6 lg:block">
          <Skeleton className="h-8 w-52 rounded-full" />
          <Skeleton className="h-16 w-[78%]" />
          <Skeleton className="h-16 w-[64%]" />
          <Skeleton className="h-5 w-[58%]" />
          <Skeleton className="h-5 w-[50%]" />
        </div>
        <div className="mx-auto w-full max-w-[680px] rounded-[2.2rem] border border-white/80 bg-white/72 p-6 shadow-[0_28px_90px_rgba(22,85,58,0.12)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:p-8">
          <div className="flex items-center gap-4">
            <Skeleton className="size-20 rounded-[1.5rem]" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-[72%]" />
            </div>
          </div>
          <div className="mt-7 space-y-3">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="mt-7 rounded-[1.7rem] border border-emerald-100 bg-white/72 p-5 dark:border-emerald-900/70 dark:bg-slate-950/60">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-14 rounded-[1.25rem]" />
            <Skeleton className="mt-5 h-4 w-24" />
            <Skeleton className="mt-3 h-14 rounded-[1.25rem]" />
            <Skeleton className="mt-6 h-14 rounded-[1.25rem] bg-emerald-200/70" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StaffLoginRouteSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat portal staff"
      data-slot="loading-shell"
      className="min-h-screen min-w-0 overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(167,243,208,0.3),transparent_32%),linear-gradient(135deg,#f8fbf8_0%,#edf8f1_100%)] p-4 dark:bg-slate-950 sm:p-5"
    >
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[640px] items-center">
        <div className="min-w-0 w-full max-w-full overflow-hidden rounded-[2.2rem] border border-white/80 bg-white/72 p-4 shadow-[0_28px_90px_rgba(22,85,58,0.12)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:p-8">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0 max-w-full space-y-4">
              <Skeleton className="h-7 w-28 rounded-full" />
              <div className="flex min-w-0 items-center gap-3 sm:gap-5">
                <Skeleton className="size-16 shrink-0 rounded-full sm:size-[5.5rem]" />
                <div className="min-w-0 space-y-3">
                  <Skeleton className="h-9 w-40 max-w-full sm:w-52" />
                  <Skeleton className="h-4 w-52 max-w-full sm:w-72" />
                  <Skeleton className="h-4 w-44 max-w-full sm:w-56" />
                </div>
              </div>
            </div>
            <Skeleton className="hidden size-12 rounded-[1.45rem] md:block" />
          </div>

          <div className="mt-8 space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>

          <div className="mt-8 min-w-0 max-w-full overflow-hidden rounded-[1.7rem] border border-emerald-100 bg-white/72 p-4 dark:border-emerald-900/70 dark:bg-slate-950/60 sm:p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-14 w-full max-w-full rounded-[1.25rem]" />
            <Skeleton className="mt-4 h-3 w-52" />
            <Skeleton className="mt-6 h-4 w-20" />
            <Skeleton className="mt-3 h-14 w-full max-w-full rounded-[1.25rem]" />
            <Skeleton className="mt-4 h-3 w-60" />
            <Skeleton className="mt-7 h-14 rounded-[1.25rem] bg-emerald-200/70" />
          </div>

          <Skeleton className="mx-auto mt-8 h-3 w-72 max-w-full" />
        </div>
      </div>
    </div>
  );
}

function PublicSupportRouteSkeleton() {
  return (
    <main
      role="status"
      aria-label="Memuat pusat bantuan akun"
      data-slot="loading-shell"
      className="min-h-screen bg-[linear-gradient(180deg,#f3fbf7_0%,#e3f3ec_52%,#edf7f3_100%)] px-3 py-4 dark:bg-slate-950 sm:px-6 sm:py-5"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-5 flex items-center justify-between">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <div className="hidden items-center gap-3 sm:flex">
            <Skeleton className="size-9 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        </div>
        <div className="space-y-5">
          <section className="rounded-[30px] border border-emerald-800/55 bg-emerald-950 p-5 sm:p-6 lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div className="space-y-4 lg:max-w-[52%]">
              <Skeleton className="size-10 rounded-2xl bg-white/12" />
              <Skeleton className="h-3 w-40 bg-white/16" />
              <Skeleton className="h-8 w-80 max-w-full bg-white/18" />
              <Skeleton className="h-4 w-full max-w-lg bg-white/12" />
            </div>
            <div className="mt-5 hidden space-y-2 lg:mt-0 lg:block lg:w-[44%]">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-12 w-full rounded-2xl bg-white/10"
                />
              ))}
            </div>
          </section>
          <SkeletonPanel className="p-5 sm:p-7">
            <div className="grid grid-cols-2 gap-2 rounded-[22px] border border-slate-200 p-2 dark:border-slate-700">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
            <div className="mt-7 space-y-5">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-8 w-72 max-w-full" />
              <Skeleton className="h-4 w-[min(34rem,90%)]" />
              <div className="grid gap-4 sm:grid-cols-2">
                <SkeletonField />
                <SkeletonField />
              </div>
              <SkeletonField />
              <Skeleton className="h-28 w-full rounded-[1.25rem]" />
              <Skeleton className="h-12 w-full rounded-2xl bg-emerald-200/70 sm:w-44" />
            </div>
          </SkeletonPanel>
        </div>
      </div>
    </main>
  );
}

function ResetPasswordRouteSkeleton() {
  return (
    <main
      role="status"
      aria-label="Memuat formulir password baru"
      data-slot="loading-shell"
      className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f3fbf7_0%,#e3f3ec_52%,#edf7f3_100%)] px-4 py-16 dark:bg-slate-950"
    >
      <section className="w-full max-w-xl overflow-hidden rounded-[32px] border border-emerald-200/80 bg-white/95 dark:border-slate-700 dark:bg-slate-900/95">
        <header className="flex items-center gap-4 border-b border-emerald-100 bg-emerald-50/60 p-6 dark:border-emerald-900 dark:bg-emerald-950/20">
          <Skeleton className="size-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-7 w-52" />
          </div>
        </header>
        <div className="space-y-6 p-6 sm:p-8">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <SkeletonField />
          <SkeletonField />
          <Skeleton className="h-12 w-full rounded-2xl bg-emerald-200/70" />
        </div>
      </section>
    </main>
  );
}

function getRouteVariant(pathname: string): PageSkeletonVariant {
  if (pathname === "/dashboard/student") return "student-dashboard";
  if (pathname.endsWith("/profile")) return "profile";
  if (pathname.endsWith("/history")) return "history";
  if (pathname === "/dashboard/admin/analytics") return "analytics";
  if (pathname.startsWith("/dashboard/teacher/subject/session")) {
    return "subject-session";
  }
  if (pathname.startsWith("/dashboard/teacher/subject/recap")) {
    return "subject-recap";
  }
  if (pathname === "/dashboard/admin/support") return "support-admin";
  if (pathname.endsWith("/support")) return "support-user";
  if (pathname === "/dashboard/admin" || pathname === "/dashboard/teacher")
    return "dashboard";
  return "management";
}
