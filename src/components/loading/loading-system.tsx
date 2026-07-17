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
  | "history";

export function RouteLoadingFallback() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/login")) return <LoginRouteSkeleton />;
  if (!pathname.startsWith("/dashboard")) return <BrandedAppLoader />;
  return <DashboardRouteSkeleton variant={getRouteVariant(pathname)} />;
}

export function BrandedAppLoader({ label = "Menyiapkan Absensi CN" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(167,243,208,0.36),transparent_34%),linear-gradient(180deg,#f8fbf8_0%,#eef7f1_100%)] p-6">
      <div className="app-loader-enter flex flex-col items-center text-center">
        <div className="relative flex size-24 items-center justify-center rounded-[2rem] border border-emerald-200/80 bg-white/86 shadow-[0_24px_60px_rgba(15,118,110,0.16)] backdrop-blur-xl">
          <span aria-hidden="true" className="app-loader-pulse absolute inset-2 rounded-[1.55rem] bg-emerald-100/65" />
          <Image src="/images/optimized/logo-sma-smk-yatkj-ui.png" alt="Logo Sekolah Citra Negara" width={62} height={62} priority className="relative object-contain" />
        </div>
        <p className="mt-6 font-heading text-lg font-semibold text-slate-900">{label}</p>
        <p className="mt-1 text-sm text-slate-500">Menghubungkan portal dan data sekolah.</p>
        <div className="mt-5 h-1.5 w-40 overflow-hidden rounded-full bg-emerald-100">
          <div className="app-loader-progress h-full w-[42%] rounded-full bg-emerald-500" />
        </div>
      </div>
    </div>
  );
}

export function DashboardRouteSkeleton({ variant = "dashboard" }: { variant?: PageSkeletonVariant }) {
  return (
    <div role="status" aria-label="Memuat halaman dashboard" className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(126,182,155,0.22),transparent_26%),radial-gradient(circle_at_top_right,rgba(111,166,208,0.12),transparent_18%),linear-gradient(180deg,#f7f5ee_0%,#f2f0e8_100%)]">
      <aside className="fixed inset-y-0 left-0 hidden w-[272px] border-r border-white/70 bg-emerald-950/96 p-5 lg:block">
        <div className="flex items-center gap-3 border-b border-white/10 pb-5"><Skeleton className="size-12 rounded-2xl bg-white/16" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-32 bg-white/18" /><Skeleton className="h-3 w-20 bg-white/10" /></div></div>
        <div className="mt-7 space-y-3">{Array.from({ length: 7 }).map((_, index) => <div key={index} className={cn("flex items-center gap-3 rounded-2xl px-3 py-3", index === 0 && "bg-white/10")}><Skeleton className="size-8 rounded-xl bg-white/12" /><Skeleton className={cn("h-3 bg-white/12", index % 3 === 0 ? "w-28" : "w-36")} /></div>)}</div>
      </aside>
      <main className="space-y-5 p-4 md:p-5 lg:pl-[292px]"><SkeletonTopbar /><PageSkeleton variant={variant} /></main>
    </div>
  );
}

export function PageSkeleton({ variant }: { variant: PageSkeletonVariant }) {
  if (variant === "management") return <ManagementPageSkeleton />;
  if (variant === "student-dashboard") return <StudentDashboardSkeleton />;
  if (variant === "profile") return <ProfilePageSkeleton />;
  if (variant === "history") return <HistoryPageSkeleton />;
  return <DashboardPageSkeleton />;
}

export function DashboardPageSkeleton() {
  return <div className="space-y-5"><div className="grid items-start gap-5 xl:grid-cols-[1.35fr_0.75fr]"><SkeletonPanel className="min-h-[270px]"><Skeleton className="h-7 w-40 rounded-full" /><Skeleton className="mt-7 h-10 w-[58%]" /><Skeleton className="mt-3 h-4 w-[76%]" /><Skeleton className="mt-2 h-4 w-[62%]" /><div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-14 rounded-2xl" />)}</div></SkeletonPanel><SkeletonPanel className="min-h-[270px]"><div className="flex items-center justify-between"><Skeleton className="h-6 w-36" /><Skeleton className="h-7 w-16 rounded-full" /></div><div className="mx-auto mt-7 size-32 rounded-full border-[18px] border-slate-200/70" /><Skeleton className="mx-auto mt-6 h-4 w-36" /></SkeletonPanel></div><KpiGridSkeleton /><div className="grid gap-5 xl:grid-cols-2"><ContentListSkeleton /><ContentListSkeleton /></div></div>;
}

export function ManagementPageSkeleton() {
  return <div className="space-y-5"><SkeletonPanel className="p-4 md:p-5"><div className="grid gap-3 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-14 rounded-[1.15rem]" />)}</div><div className="mt-5 flex flex-col gap-3 lg:flex-row"><Skeleton className="h-14 flex-1 rounded-[1.4rem]" /><Skeleton className="h-14 w-full rounded-[1.4rem] lg:w-56" /><Skeleton className="h-14 w-full rounded-[1.4rem] lg:w-44" /></div></SkeletonPanel><TableSkeleton columns={7} rows={7} /></div>;
}

export function StudentDashboardSkeleton() {
  return <div className="space-y-5"><SkeletonPanel><div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"><div className="min-h-[330px] rounded-[1.6rem] bg-emerald-800/90 p-6"><Skeleton className="h-8 w-52 rounded-full bg-white/16" /><Skeleton className="mt-7 h-12 w-[82%] bg-white/18" /><Skeleton className="mt-3 h-12 w-[64%] bg-white/18" /><Skeleton className="mt-5 h-4 w-[72%] bg-white/12" /><Skeleton className="mt-16 h-16 w-52 rounded-full bg-white/24" /></div><div className="grid gap-4"><Skeleton className="h-40 rounded-[1.5rem]" /><div className="grid grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-[1.35rem]" />)}</div></div></div></SkeletonPanel><KpiGridSkeleton /><div className="grid gap-5 lg:grid-cols-2"><ContentListSkeleton /><ContentListSkeleton /></div></div>;
}

export function ProfilePageSkeleton() {
  return <SkeletonPanel><div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"><div className="min-h-[410px] rounded-[1.7rem] bg-emerald-800/90 p-7"><Skeleton className="h-5 w-40 bg-white/16" /><div className="mt-6 flex items-center gap-4"><Skeleton className="size-20 rounded-[1.5rem] bg-white/18" /><div className="flex-1 space-y-3"><Skeleton className="h-8 w-3/4 bg-white/18" /><Skeleton className="h-4 w-1/2 bg-white/12" /></div></div><div className="mt-10 grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-[1.3rem] bg-white/14" />)}</div></div><div className="rounded-[1.7rem] border border-slate-200/70 bg-white/70 p-6"><Skeleton className="h-8 w-52" /><Skeleton className="mt-3 h-4 w-72 max-w-full" /><div className="mt-7 grid gap-3 sm:grid-cols-2">{Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-20 rounded-[1.2rem]" />)}</div></div></div></SkeletonPanel>;
}

export function HistoryPageSkeleton() {
  return <div className="space-y-5"><SkeletonPanel><Skeleton className="h-8 w-52 rounded-full" /><Skeleton className="mt-7 h-11 w-72" /><Skeleton className="mt-3 h-4 w-[55%]" /><div className="mt-7"><KpiGridSkeleton /></div></SkeletonPanel><SkeletonPanel><div className="flex flex-col gap-3 border-b border-slate-200/70 pb-5 sm:flex-row sm:justify-between"><Skeleton className="h-14 w-full rounded-[1.3rem] sm:w-56" /><Skeleton className="h-14 w-full rounded-[1.3rem] sm:w-96" /></div><div className="mt-5"><TableSkeleton columns={5} rows={6} embedded /></div></SkeletonPanel></div>;
}

export function TableSkeleton({ columns = 6, rows = 6, embedded = false }: { columns?: number; rows?: number; embedded?: boolean }) {
  const content = <div className="min-w-[680px]"><div className="grid gap-4 bg-emerald-50/80 px-5 py-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(92px, 1fr))` }}>{Array.from({ length: columns }).map((_, index) => <Skeleton key={`head-${index}`} className="h-4 w-3/4" />)}</div><div className="divide-y divide-emerald-50 bg-white/80">{Array.from({ length: rows }).map((_, row) => <div key={row} className="grid items-center gap-4 px-5 py-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(92px, 1fr))` }}>{Array.from({ length: columns }).map((__, cell) => <Skeleton key={`${row}-${cell}`} className={cn("h-4", cell === 0 ? "w-[88%]" : cell === columns - 1 ? "mx-auto h-9 w-16 rounded-xl" : "w-[68%]")} />)}</div>)}</div></div>;
  if (embedded) return <div className="overflow-x-auto rounded-[1.35rem] border border-emerald-100">{content}</div>;
  return <div className="overflow-x-auto rounded-[1.5rem] border border-emerald-100/80 shadow-[0_18px_42px_rgba(15,23,42,0.05)]">{content}</div>;
}

export function ModalContentSkeleton({ fields = 5 }: { fields?: number }) {
  return <div role="status" aria-label="Memuat detail" className="space-y-5"><div className="rounded-[1.35rem] border border-emerald-100 bg-emerald-50/40 p-4"><Skeleton className="h-5 w-44" /><Skeleton className="mt-3 h-4 w-[72%]" /></div><div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: fields }).map((_, index) => <div key={index} className="space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-12 rounded-[1.1rem]" /></div>)}</div><div className="flex justify-end gap-3 border-t border-slate-200/70 pt-5"><Skeleton className="h-12 w-24 rounded-[1.1rem]" /><Skeleton className="h-12 w-36 rounded-[1.1rem]" /></div></div>;
}

export function ListRowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Memuat daftar" className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-[1.25rem] border border-slate-100 bg-slate-50/75 p-3.5">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className={cn("h-4", index % 2 === 0 ? "w-[62%]" : "w-[48%]")} />
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
    <section role="status" aria-label="Memuat visualisasi" className="min-h-[280px] rounded-[2rem] border border-white/80 bg-white/78 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2"><Skeleton className="h-6 w-44" /><Skeleton className="h-3 w-64 max-w-full" /></div>
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      {type === "donut" ? (
        <div className="mx-auto mt-8 size-36 rounded-full border-[20px] border-slate-200/75" />
      ) : (
        <div className="mt-8 flex h-40 items-end gap-3 border-b border-l border-slate-200 px-3 pb-3">
          {[42, 68, 52, 86, 62, 78, 58].map((height, index) => <Skeleton key={index} className="flex-1 rounded-t-lg" style={{ height: `${height}%` }} />)}
        </div>
      )}
    </section>
  );
}

function SkeletonTopbar() {
  return <div className="flex min-h-[104px] items-center justify-between gap-5 rounded-[2rem] border border-white/75 bg-white/72 px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"><div className="space-y-3"><Skeleton className="h-3 w-32" /><Skeleton className="h-8 w-64 max-w-[60vw]" /></div><div className="flex items-center gap-3"><Skeleton className="hidden h-12 w-36 rounded-full sm:block" /><Skeleton className="size-12 rounded-full" /></div></div>;
}

function SkeletonPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-[2rem] border border-white/82 bg-white/78 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)]", className)}>{children}</section>;
}

function KpiGridSkeleton() {
  return <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="rounded-[1.5rem] border border-white/80 bg-white/72 p-4"><div className="flex justify-between gap-4"><div className="flex-1 space-y-3"><Skeleton className="h-3 w-24" /><Skeleton className="h-8 w-20" /><Skeleton className="h-3 w-full" /></div><Skeleton className="size-11 rounded-2xl" /></div></div>)}</div>;
}

function ContentListSkeleton() {
  return <SkeletonPanel><div className="flex justify-between"><div className="space-y-2"><Skeleton className="h-6 w-44" /><Skeleton className="h-3 w-64 max-w-full" /></div><Skeleton className="size-9 rounded-full" /></div><div className="mt-5 space-y-3">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="flex items-center gap-3 rounded-[1.2rem] border border-slate-100 p-3"><Skeleton className="size-10 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-[62%]" /><Skeleton className="h-3 w-[42%]" /></div><Skeleton className="h-7 w-16 rounded-full" /></div>)}</div></SkeletonPanel>;
}

function LoginRouteSkeleton() {
  return <div role="status" aria-label="Memuat portal login" className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(167,243,208,0.3),transparent_32%),linear-gradient(135deg,#f8fbf8_0%,#edf8f1_100%)] p-5"><div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-[1480px] items-center gap-10 lg:grid-cols-[1fr_0.95fr]"><div className="hidden space-y-6 lg:block"><Skeleton className="h-8 w-52 rounded-full" /><Skeleton className="h-16 w-[78%]" /><Skeleton className="h-16 w-[64%]" /><Skeleton className="h-5 w-[58%]" /><Skeleton className="h-5 w-[50%]" /></div><div className="mx-auto w-full max-w-[680px] rounded-[2.2rem] border border-white/80 bg-white/72 p-6 shadow-[0_28px_90px_rgba(22,85,58,0.12)] sm:p-8"><div className="flex items-center gap-4"><Skeleton className="size-20 rounded-[1.5rem]" /><div className="flex-1 space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-[72%]" /></div></div><div className="mt-7 space-y-3"><Skeleton className="h-4 w-44" /><Skeleton className="h-4 w-64" /></div><div className="mt-7 rounded-[1.7rem] border border-emerald-100 bg-white/72 p-5"><Skeleton className="h-4 w-20" /><Skeleton className="mt-3 h-14 rounded-[1.25rem]" /><Skeleton className="mt-5 h-4 w-24" /><Skeleton className="mt-3 h-14 rounded-[1.25rem]" /><Skeleton className="mt-6 h-14 rounded-[1.25rem] bg-emerald-200/70" /></div></div></div></div>;
}

function getRouteVariant(pathname: string): PageSkeletonVariant {
  if (pathname === "/dashboard/siswa") return "student-dashboard";
  if (pathname.endsWith("/profile")) return "profile";
  if (pathname.endsWith("/history")) return "history";
  if (pathname === "/dashboard/admin" || pathname === "/dashboard/teacher") return "dashboard";
  return "management";
}
