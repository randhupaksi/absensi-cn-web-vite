import { Button } from "@/components/ui/button";
import { LoaderCircle, type LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

type AsyncButtonProps = ComponentProps<typeof Button> & {
  isPending?: boolean;
  pendingLabel?: string;
  icon?: LucideIcon;
  children: ReactNode;
};

export function AsyncButton({
  isPending = false,
  pendingLabel = "Memproses...",
  icon: Icon,
  disabled,
  children,
  ...props
}: AsyncButtonProps) {
  return (
    <Button {...props} disabled={disabled || isPending} aria-busy={isPending}>
      {isPending ? (
        <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
      ) : Icon ? (
        <Icon className="size-4" />
      ) : null}
      <span>{isPending ? pendingLabel : children}</span>
    </Button>
  );
}
