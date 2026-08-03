const fixLog = {
  route: "/deveran",
  source: "frontend-and-api",
  api_required: true,
  build_marker: "auth-password-change-student-teacher-2026-08-03-linux-amd64",
  fixes: [
    "fix(auth): stabilize hidden password input rendering",
    "fix(auth): stabilize password inputs on WebKit browsers",
    "fix(mobile): reopen attendance photo picker after repeated attempts",
    "fix(location): retry geolocation after Safari permission changes",
    "fix(location): refresh location when permission state or tab visibility changes",
    "fix(layout): use dynamic mobile viewport height",
    "fix(ui): standardize responsive modal action layout",
    "fix(navigation): scroll sections to top on route changes",
    "fix(api): normalize attendance dates and enrollment-based alpha records",
    "fix(ui): standardize import and destructive modal button states",
    "feat(students): add structured Excel export by grade and major",
    "fix(import): prevent large Excel imports from timing out",
    "build(api): prepare Linux amd64 binary and aaPanel timeout configuration",
    "feat(auth): require students and teachers to replace administrator-issued passwords",
  ],
  checked_at: "2026-08-03T10:05:00+07:00",
} as const;

export function DevFixLogPage() {
  return (
    <main className="min-h-[100svh] bg-slate-950 p-4 text-emerald-300 supports-[min-height:100dvh]:min-h-[100dvh] sm:p-8">
      <pre className="mx-auto max-w-4xl whitespace-pre-wrap break-words rounded-2xl border border-emerald-400/25 bg-slate-900 p-5 font-mono text-xs leading-6 shadow-2xl sm:p-7 sm:text-sm">
        {JSON.stringify(fixLog, null, 2)}
      </pre>
    </main>
  );
}
