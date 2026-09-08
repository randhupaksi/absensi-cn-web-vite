import { Button } from "@/components/ui/button";
import { RadixSelectField } from "@/components/ui/radix-select";
import { ChevronLeft, ChevronRight } from "lucide-react";

type TicketPagerProps = {
  total: number;
  offset: number;
  pageSize: number;
  loaded: number;
  onPageSizeChange?: (pageSize: number) => void;
  onPrevious: () => void;
  onNext: () => void;
};

const pageSizeOptions = [5, 10, 25];

export function TicketPager({
  total,
  offset,
  pageSize,
  loaded,
  onPageSizeChange,
  onPrevious,
  onNext,
}: TicketPagerProps) {
  if (total === 0) return null;

  const start = loaded === 0 ? 0 : offset + 1;
  const end = Math.min(offset + loaded, total);
  const currentPage = Math.floor(offset / pageSize) + 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-start">
        <span className="whitespace-nowrap">
          {start}–{end} dari {total} tiket
        </span>
        {onPageSizeChange ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="hidden whitespace-nowrap text-[10px] uppercase tracking-wide sm:inline">
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
              triggerClassName="h-8 w-[4.25rem] min-w-[4.25rem] rounded-[10px] px-2 text-xs font-semibold shadow-none hover:!shadow-none active:!shadow-none focus-visible:!shadow-none data-[state=open]:!shadow-none"
              contentClassName="rounded-[14px] p-1.5"
              itemClassName="justify-center rounded-[8px] text-center font-semibold"
              hideIndicator
            />
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <span className="whitespace-nowrap">
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
