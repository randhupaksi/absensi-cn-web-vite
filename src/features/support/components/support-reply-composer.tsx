import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderCircle, SendHorizontal } from "lucide-react";

type SupportReplyComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  placeholder: string;
};

export function SupportReplyComposer({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  placeholder,
}: SupportReplyComposerProps) {
  return (
    <div className="space-y-2" data-support-reply-composer>
      <div className="relative">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={1500}
          aria-label="Pesan balasan"
          placeholder={placeholder}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              if (!isSubmitting && value.trim().length >= 2) onSubmit();
            }
          }}
          className="h-14 rounded-[1.25rem] border-white/60 bg-white px-4 pr-16 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-12px_30px_rgba(255,255,255,0.2)] transition duration-300 hover:border-emerald-300/85 hover:bg-white active:border-emerald-400 active:bg-white focus-visible:border-emerald-400 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-emerald-200/55 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none dark:hover:!border-emerald-400/55 dark:hover:!bg-slate-900 dark:hover:!ring-1 dark:hover:!ring-emerald-400/18 dark:active:!border-emerald-300 dark:active:!bg-slate-900 dark:active:!ring-1 dark:active:!ring-emerald-400/28 dark:focus-visible:!border-emerald-300 dark:focus-visible:!bg-slate-900 dark:focus-visible:!ring-2 dark:focus-visible:!ring-emerald-400/24"
        />
        <Button
          type="button"
          variant="success"
          size="icon"
          aria-label="Kirim balasan"
          title="Kirim balasan"
          className="absolute inset-y-0 right-3 my-auto size-10 rounded-full p-0 shadow-none hover:shadow-none focus-visible:shadow-none active:shadow-none disabled:shadow-none"
          disabled={isSubmitting || value.trim().length < 2}
          onClick={onSubmit}
        >
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <SendHorizontal />
          )}
        </Button>
      </div>
    </div>
  );
}
