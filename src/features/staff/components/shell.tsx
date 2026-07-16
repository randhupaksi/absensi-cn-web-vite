"use client";

import {
  clearAuthSession,
  canAccessDashboardRole,
  getAuthSession,
  getDashboardPathForUser,
  getLoginPathForCurrentContext,
  subscribeAuthSession,
} from "@/lib/auth";
import type { AuthSession, DashboardRole } from "@/types/auth";
import { usePathname, useRouter } from "@/lib/router";
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { getTeacherMe } from "@/services/staff.service";
import {
  buildTeacherWorkspaceSidebarItems,
  StaffSidebar,
  type StaffSidebarItem,
} from "./sidebar";
import { StaffTopbar } from "./topbar";

type StaffShellProps = {
  expectedRole: DashboardRole;
  sidebarItems: StaffSidebarItem[];
  userLabel: string;
  resolveTitle: (pathname: string) => string;
  eyebrow?: string;
  children: (session: AuthSession) => ReactNode;
};

export function StaffShell({
  expectedRole,
  sidebarItems,
  userLabel,
  resolveTitle,
  eyebrow,
  children,
}: StaffShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);

  const teacherMeQuery = useQuery({
    queryKey: ["teacher-me"],
    queryFn: getTeacherMe,
    staleTime: 60_000,
    enabled: Boolean(session?.user.role === "TEACHER"),
  });

  const isExpectedRole = session && canAccessDashboardRole(session.user, expectedRole);
  const visibleSidebarItems = useMemo(() => {
    if (!session || session.user.role !== "TEACHER") {
      return sidebarItems;
    }

    return buildTeacherWorkspaceSidebarItems({
      isHomeroomTeacher: teacherMeQuery.data?.is_homeroom_teacher ?? false,
      hasSubjectAssignments: teacherMeQuery.data?.has_subject_assignments ?? false,
      hasBKScope: session.user.has_bk_scope,
    });
  }, [session, sidebarItems, teacherMeQuery.data]);

  useEffect(() => {
    if (!session) {
      router.replace(getLoginPathForCurrentContext(pathname));
      return;
    }

    if (!isExpectedRole) {
      router.replace(getDashboardPathForUser(session.user));
    }
  }, [isExpectedRole, pathname, router, session]);

  if (!session || !isExpectedRole) {
    return <StaffShellFallback />;
  }

  const handleLogout = () => {
    const loginPath = getLoginPathForCurrentContext(pathname);
    clearAuthSession();
    // Logout stays client-side (no hard reload), so the QueryClient created in
    // AppProviders would otherwise survive into the next login on this tab and
    // serve the previous account's cached data until staleTime expires.
    queryClient.clear();
    router.replace(loginPath);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(126,182,155,0.22),transparent_26%),radial-gradient(circle_at_top_right,rgba(111,166,208,0.12),transparent_18%),linear-gradient(180deg,#f7f5ee_0%,#f2f0e8_100%)] text-slate-800">
      <div className="min-h-screen lg:pl-[272px]">
        <StaffSidebar
          items={visibleSidebarItems}
          activePath={pathname}
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          onLogout={handleLogout}
        />

        <main className="min-w-0 space-y-5 p-4 md:p-5">
          <StaffTopbar
            userName={session.user.name}
            userLabel={userLabel}
            title={resolveTitle(pathname)}
            eyebrow={eyebrow ?? getDashboardEyebrow(expectedRole)}
            onToggleSidebar={() => setMobileSidebarOpen(true)}
          />

          {children(session)}
        </main>
      </div>
    </div>
  );
}

function StaffShellFallback() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(126,182,155,0.22),transparent_26%),radial-gradient(circle_at_top_right,rgba(111,166,208,0.12),transparent_18%),linear-gradient(180deg,#f7f5ee_0%,#f2f0e8_100%)]" />
  );
}

function getDashboardEyebrow(role: DashboardRole) {
  switch (role) {
    case "admin":
      return "Admin Dashboard";
    case "walas":
      return "Walas Dashboard";
    case "bk":
      return "BK Dashboard";
    case "siswa":
      return "Siswa Dashboard";
    default:
      return "Dashboard";
  }
}
