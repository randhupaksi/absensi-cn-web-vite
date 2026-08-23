export function getAccentTone(accentClass: string) {
  if (accentClass.includes("amber") || accentClass.includes("orange")) {
    return "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-400/60 dark:bg-amber-500/15 dark:text-amber-300";
  }
  if (accentClass.includes("rose") || accentClass.includes("red")) {
    return "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-400/60 dark:bg-transparent dark:text-rose-300";
  }
  if (accentClass.includes("violet") || accentClass.includes("purple")) {
    return "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-400/60 dark:bg-transparent dark:text-violet-300";
  }
  if (accentClass.includes("sky") || accentClass.includes("cyan")) {
    return "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-400/60 dark:bg-transparent dark:text-sky-300";
  }
  if (accentClass.includes("teal") || accentClass.includes("emerald") || accentClass.includes("green")) {
    return "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-400/60 dark:bg-transparent dark:text-emerald-300";
  }
  return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-transparent dark:text-slate-300";
}
