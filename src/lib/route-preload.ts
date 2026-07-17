type RoutePreloader = () => Promise<unknown>;

const routePreloaders: Record<string, RoutePreloader> = {
  "/": () => import("@/pages/home/home-page"),
  "/login/student": () => import("@/pages/auth/login-page"),
  "/login/staff": () => import("@/pages/auth/login-page"),
  "/dashboard/admin": () => import("@/pages/admin/dashboard-page"),
  "/dashboard/admin/admins": () => import("@/pages/admin/admins-page"),
  "/dashboard/admin/classes": () => import("@/pages/admin/classes-page"),
  "/dashboard/admin/students": () => import("@/pages/admin/students-page"),
  "/dashboard/admin/subjects": () => import("@/pages/admin/subjects-page"),
  "/dashboard/admin/teachers": () => import("@/pages/admin/teachers-page"),
  "/dashboard/admin/users": () => import("@/pages/admin/users-page"),
  "/dashboard/admin/reports": () => import("@/pages/admin/placeholder-page"),
  "/dashboard/teacher": () => import("@/pages/teacher/dashboard-page"),
  "/dashboard/teacher/bk/attendance": () => import("@/pages/bk/attendance-page"),
  "/dashboard/teacher/bk/counseling": () => import("@/pages/bk/counseling-page"),
  "/dashboard/teacher/bk/students": () => import("@/pages/bk/students-page"),
  "/dashboard/teacher/bk/submissions": () => import("@/pages/bk/submissions-page"),
  "/dashboard/teacher/homeroom/attendance": () => import("@/pages/teacher/homeroom/attendance-page"),
  "/dashboard/teacher/homeroom/students": () => import("@/pages/teacher/homeroom/students-page"),
  "/dashboard/teacher/homeroom/submissions": () => import("@/pages/teacher/homeroom/submissions-page"),
  "/dashboard/teacher/subject/history": () => import("@/pages/teacher/subject/history-page"),
  "/dashboard/teacher/subject/recap": () => import("@/pages/teacher/subject/recap-page"),
  "/dashboard/teacher/subject/session": () => import("@/pages/teacher/subject/session-page"),
  "/dashboard/siswa": () => import("@/pages/student/dashboard-page"),
  "/dashboard/siswa/history": () => import("@/pages/student/history-page"),
  "/dashboard/siswa/profile": () => import("@/pages/student/profile-page"),
};

const pendingPreloads = new Map<string, Promise<unknown>>();

export function preloadRoute(href: string) {
  const pathname = href.split(/[?#]/, 1)[0];
  const preloader = routePreloaders[pathname];
  if (!preloader) return;

  const existing = pendingPreloads.get(pathname);
  if (existing) return existing;

  const pending = preloader().catch(() => {
    pendingPreloads.delete(pathname);
  });
  pendingPreloads.set(pathname, pending);
  return pending;
}
