import { createStyledXlsx } from "@/lib/reports/light-xlsx-writer";
import { downloadBlob } from "@/lib/download-file";

export type ExcelReportValue = string | number | boolean | Date | null | undefined;

export type ExcelReportColumn<Row> = {
  header: string;
  value: (row: Row, index: number) => ExcelReportValue;
  width?: number;
  kind?: "text" | "number" | "date" | "status" | "attendance";
  numberFormat?: string;
};

export type ExcelReportMetric = {
  label: string;
  value: string | number;
  tone?: "emerald" | "sky" | "violet" | "amber" | "rose" | "slate";
};

export type ExcelReportDefinition<Row> = {
  filename: string;
  title: string;
  subtitle: string;
  metadata: Array<{ label: string; value: string | number }>;
  columns: Array<ExcelReportColumn<Row>>;
  rows: Row[];
  metrics?: ExcelReportMetric[];
  dataSheetName?: string;
  showColumnFilters?: boolean;
  footerLabel?: string;
};

const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function exportStyledExcelReport<Row>(definition: ExcelReportDefinition<Row>) {
  const buffer = createStyledXlsx(definition);
  const blob = new Blob([buffer], { type: MIME_XLSX });
  downloadBlob(blob, ensureExtension(definition.filename, ".xlsx"));
}

function ensureExtension(filename: string, extension: string) {
  return filename.toLowerCase().endsWith(extension) ? filename : filename + extension;
}
