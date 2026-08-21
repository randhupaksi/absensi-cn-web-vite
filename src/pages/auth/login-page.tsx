import { AnimatedBackground } from "@/features/auth/components/animated-background";
import { LoginCard } from "@/features/auth/components/login-card";
import { LoginShowcase } from "@/features/auth/components/login-showcase";
import { BackButton } from "@/components/ui/back-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { PortalType } from "@/lib/validations/login-schema";

type LoginPageProps = {
  portal: PortalType;
};

export default function LoginPage({ portal }: LoginPageProps) {
  const isStaffPortal = portal === "staff";

  return (
    <main
      className={
        isStaffPortal
          ? "relative min-h-[100svh] overflow-hidden bg-[linear-gradient(180deg,#f3fbf8_0%,#e7f6f1_28%,#d8efe9_64%,#edf7f3_100%)] dark:bg-none dark:bg-slate-950 supports-[min-height:100dvh]:min-h-[100dvh]"
          : "relative min-h-[100svh] overflow-hidden bg-[linear-gradient(180deg,#f4fbf7_0%,#e6f6ee_30%,#d7efe3_65%,#edf7f3_100%)] dark:bg-none dark:bg-slate-950 supports-[min-height:100dvh]:min-h-[100dvh]"
      }
    >
      <AnimatedBackground />
      <ThemeToggle placement="fixed" />
      {isStaffPortal ? null : (
        <BackButton
          href="/"
          label="Kembali ke beranda"
          className="absolute left-5 top-4 z-20 lg:hidden sm:left-6 sm:top-5"
        />
      )}
      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-7xl items-center px-3 pb-4 pt-16 supports-[min-height:100dvh]:min-h-[100dvh] min-[380px]:px-4 sm:px-6 sm:py-6 lg:px-10">
        <div
          className={
            isStaffPortal
              ? "mx-auto grid w-full max-w-[640px] items-center"
              : "grid w-full items-center gap-10 lg:grid-cols-[1fr_0.95fr] xl:gap-16"
          }
        >
          {isStaffPortal ? null : <LoginShowcase />}
          <LoginCard portal={portal} />
        </div>
      </div>
    </main>
  );
}
