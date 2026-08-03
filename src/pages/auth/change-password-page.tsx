import { AnimatedBackground } from "@/features/auth/components/animated-background";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { getAuthSession } from "@/lib/auth";
import { KeyRound, Sparkles } from "lucide-react";

export function ChangePasswordPage() {
  const studentName = getAuthSession()?.user.name?.split(" ")[0] || "Siswa";

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[linear-gradient(180deg,#f3fbf8_0%,#e5f6ed_34%,#d7eee2_70%,#edf8f3_100%)] supports-[min-height:100dvh]:min-h-[100dvh]">
      <AnimatedBackground />
      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-xl items-center px-5 py-6 supports-[min-height:100dvh]:min-h-[100dvh] sm:px-6">
        <section className="w-full overflow-hidden rounded-[2rem] border border-white/90 bg-white/88 shadow-[0_28px_72px_rgba(15,23,42,0.13),inset_0_1px_0_rgba(255,255,255,0.96)] backdrop-blur-sm">
          <div className="relative overflow-hidden border-b border-emerald-100/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.96)_0%,rgba(255,255,255,0.96)_68%)] px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7">
            <div className="absolute -right-8 -top-10 size-32 rounded-full bg-emerald-200/35 blur-2xl" />
            <div className="relative flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#65d69d_0%,#149a73_48%,#087f5b_100%)] text-white shadow-[0_14px_28px_rgba(16,137,99,0.24)]">
                <KeyRound className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-emerald-700">Keamanan akun siswa</p>
                <h1 className="mt-1.5 text-[1.38rem] font-semibold tracking-[-0.03em] text-slate-950 sm:text-[1.55rem]">Buat password pribadimu</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Hai, {studentName}. Password awal dari sekolah hanya digunakan sekali untuk mengaktifkan akunmu.
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-7 sm:py-6">
            <div className="mb-5 flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-800">
              <Sparkles className="size-3.5 shrink-0" />
              <span>Langkah ini wajib diselesaikan sebelum melanjutkan ke absensi.</span>
            </div>
            <ChangePasswordForm />
          </div>
        </section>
      </div>
    </main>
  );
}
