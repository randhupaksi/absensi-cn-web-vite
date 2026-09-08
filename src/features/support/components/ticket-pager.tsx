import { Button } from "@/components/ui/button";
import { RadixSelectField } from "@/components/ui/radix-select";
import { ChevronLeft, ChevronRight } from "lucide-react";

type TicketPagerProps = {
  total: number;
  offset: number;
  pageSize: number;
  onPageSizeChange?: (pageSize: number) => void;
  onPrevious: () => void;
  onNext: () => void;
};

const pageSizeOptions = [5, 10, 25];

export function TicketPager({
  total,
  offset,
  pageSize,
  onPageSizeChange,
  onPrevious,
  onNext,
}: TicketPagerProps) {
  if (total === 0) return null;

  const currentPage = Math.floor(offset / pageSize) + 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mt-3 flex w-full flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:gap-3">
      {onPageSizeChange ? (
        <div className="flex h-12 items-center gap-2 rounded-[14px] border border-slate-200/80 bg-slate-50/70 px-2 dark:border-slate-700 dark:bg-slate-800/60">
          <span className="whitespace-nowrap text-[10px] font-semibold tracking-wide text-slate-400">
            Tampil
          </span>
          <RadixSelectField
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
            aria-label="Jumlah tiket per halaman"
            placeholder="Jumlah"
            options={pageSizeOptions.map((size) => ({
              value: String(size),
              label: String(size),
            }))}
            triggerClassName="h-8 w-[4.25rem] min-w-[4.25rem] rounded-[11px] border-emerald-200/80 px-2 text-xs font-semibold shadow-none hover:!shadow-none active:!border-emerald-200/80 active:!bg-transparent active:!shadow-none focus-visible:!shadow-none data-[state=open]:!border-emerald-200/80 data-[state=open]:!bg-transparent data-[state=open]:!ring-0 data-[state=open]:!shadow-none dark:border-emerald-600/70 dark:active:!border-emerald-600/70 dark:active:!bg-input/30 dark:data-[state=open]:!border-emerald-600/70 dark:data-[state=open]:!bg-input/30"
            contentClassName="rounded-[1.15rem] p-1.5"
            itemClassName="justify-center text-center font-semibold hover:!border-emerald-400 hover:!bg-emerald-200 hover:!text-emerald-950 data-[highlighted]:!border-emerald-300 data-[highlighted]:!bg-emerald-100 data-[highlighted]:!text-emerald-950 data-[state=checked]:!border-emerald-400 data-[state=checked]:!bg-emerald-200 data-[state=checked]:!text-emerald-950 dark:hover:!border-emerald-600 dark:hover:!bg-emerald-950/70 dark:hover:!text-emerald-100 dark:data-[highlighted]:!border-emerald-600 dark:data-[highlighted]:!bg-emerald-950/60 dark:data-[highlighted]:!text-emerald-100 dark:data-[state=checked]:!border-emerald-600 dark:data-[state=checked]:!bg-emerald-950/75 dark:data-[state=checked]:!text-emerald-100"
            hideIndicator
          />
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
          Halaman {currentPage} / {totalPages}
        </span>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            aria-label="Halaman sebelumnya"
            disabled={offset === 0}
            onClick={onPrevious}
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            aria-label="Halaman berikutnya"
            disabled={offset + pageSize >= total}
            onClick={onNext}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
