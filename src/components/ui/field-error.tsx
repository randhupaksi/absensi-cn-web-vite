import { cn } from "@/lib/utils";

export function FieldError({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  if (!message) return null;

  return (
    <p className={cn("mt-2 text-xs font-semibold leading-5 text-red-500", className)}>
      {message}
    </p>
  );
}
