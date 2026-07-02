export function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-[-8%] opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(circle at 0% 0%, rgba(123, 223, 177, 0.28), transparent 24%), radial-gradient(circle at 100% 0%, rgba(188, 243, 181, 0.22), transparent 22%), radial-gradient(circle at 50% 100%, rgba(120, 197, 173, 0.16), transparent 28%)",
        }}
      />
      <div className="absolute left-[-8%] top-[-10%] h-80 w-80 rounded-full bg-emerald-300/16 blur-3xl" />
      <div className="absolute right-[-6%] top-[10%] h-96 w-96 rounded-full bg-lime-200/12 blur-3xl" />
      <div className="absolute bottom-[-14%] left-[24%] h-80 w-80 rounded-full bg-teal-200/14 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.72),transparent_24%),radial-gradient(circle_at_84%_14%,rgba(255,255,255,0.34),transparent_18%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 opacity-[0.1] [background-image:radial-gradient(rgba(20,90,60,0.55)_0.7px,transparent_0.7px)] [background-size:18px_18px]" />
    </div>
  );
}
