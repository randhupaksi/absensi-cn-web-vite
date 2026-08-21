import { AnimatedBackground } from "@/features/auth/components/animated-background";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { BackButton } from "@/components/ui/back-button";
import { clearAuthSession, getAuthSession } from "@/lib/auth";
import { KeyRound, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const commonFirstNames = new Set([
  "ahmad",
  "mohammad",
  "muh",
  "muhamad",
  "muhammad",
]);

function formatAccountName(name?: string) {
  const nameParts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const preferredName = commonFirstNames.has(
    nameParts[0]?.toLocaleLowerCase("id-ID"),
  )
    ? (nameParts[1] ?? nameParts[0])
    : nameParts[0];
  if (!preferredName) return "Pengguna";

  const normalized = preferredName.toLocaleLowerCase("id-ID");
  return `${normalized.charAt(0).toLocaleUpperCase("id-ID")}${normalized.slice(1)}`;
}

export function ChangePasswordPage() {
  const account = getAuthSession()?.user;
  const accountName = formatAccountName(account?.name);
  const accountLabel = account?.role === "TEACHER" ? "guru" : "siswa";
  const loginPath =
    account?.role === "TEACHER" ? "/login/staff" : "/login/student";

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[linear-gradient(180deg,#f3fbf8_0%,#e5f6ed_34%,#d7eee2_70%,#edf8f3_100%)] dark:bg-[linear-gradient(180deg,#0d1f1b_0%,#0e2822_46%,#101b2a_100%)] supports-[min-height:100dvh]:min-h-[100dvh]">
      <AnimatedBackground />
      <ThemeToggle placement="fixed" />
      <BackButton
        href={loginPath}
        label="Kembali ke login"
        onClick={() => clearAuthSession()}
        className="absolute left-5 top-4 z-20 sm:left-6 sm:top-5"
      />
      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-xl items-center px-5 py-6 supports-[min-height:100dvh]:min-h-[100dvh] sm:px-6">
        <section className="w-full overflow-hidden rounded-[2rem] border border-white/90 bg-white/96 shadow-[0_28px_72px_rgba(15,23,42,0.13),inset_0_1px_0_rgba(255,255,255,0.96)] dark:border-slate-700/80 md:bg-white/88 md:backdrop-blur-sm">
          <div className="relative overflow-hidden border-b border-emerald-100/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.96)_0%,rgba(255,255,255,0.96)_68%)] px-5 pb-5 pt-6 dark:border-slate-700/80 sm:px-7 sm:pb-6 sm:pt-7">
            <div className="relative flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#65d69d_0%,#149a73_48%,#087f5b_100%)] text-white shadow-[0_14px_28px_rgba(16,137,99,0.24)]">
                <KeyRound className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Keamanan akun {accountLabel}
                </p>
                <h1 className="mt-1.5 text-[1.38rem] font-semibold tracking-[-0.03em] text-slate-950 sm:text-[1.55rem]">
                  Buat Password Pribadimu
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Hai, {accountName}. Password awal dari sekolah hanya digunakan
                  sekali untuk mengaktifkan akunmu.
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-7 sm:py-6">
            <div className="mb-5 flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-800">
              <Sparkles className="size-3.5 shrink-0" />
              <span>
                Langkah ini wajib diselesaikan sebelum lanjut lebih dalam.
              </span>
            </div>
            <ChangePasswordForm />
          </div>
        </section>
      </div>
    </main>
  );
}
