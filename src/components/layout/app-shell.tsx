import { ReactNode } from "react";
import { SidebarNav } from "@/components/navigation/sidebar-nav";
import { Topbar } from "@/components/navigation/topbar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-[100svh] bg-transparent supports-[min-height:100dvh]:min-h-[100dvh]">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-7xl gap-6 px-4 py-4 supports-[min-height:100dvh]:min-h-[100dvh] lg:px-6">
        <SidebarNav />
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <Topbar />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
