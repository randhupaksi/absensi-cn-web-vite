import { AnimatedBackground } from "@/features/auth/components/animated-background";
import { LoginCard } from "@/features/auth/components/login-card";
import { LoginShowcase } from "@/features/auth/components/login-showcase";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f4fbf7_0%,#e6f6ee_30%,#d7efe3_65%,#edf7f3_100%)]">
      <AnimatedBackground />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-5 py-6 sm:px-6 lg:px-10">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1fr_0.95fr] xl:gap-16">
          <LoginShowcase />
          <LoginCard />
        </div>
      </div>
    </main>
  );
}
