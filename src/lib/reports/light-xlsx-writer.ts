import { strToU8, zipSync } from "fflate";

import type {
  ExcelReportDefinition,
  ExcelReportMetric,
  ExcelReportValue,
} from "@/lib/reports/excel-report-kit";

const COLORS = {
  emerald950: "064E3B", emerald900: "065F46", emerald800: "066A50", emerald700: "047857",
  emerald600: "059669", emerald500: "10B981", emerald200: "A7F3D0", emerald100: "D1FAE5",
  emerald50: "ECFDF5", slate900: "0F172A", slate700: "334155", slate600: "475569",
  slate500: "64748B", slate200: "E2E8F0", slate100: "F1F5F9", slate50: "F8FAFC",
  white: "FFFFFF", sky100: "E0F2FE", sky700: "0369A1", violet100: "EDE9FE",
  violet700: "6D28D9", amber100: "FEF3C7", amber700: "B45309", rose100: "FFE4E6",
  rose700: "BE123C",
};

type Tone = { fill: string; text: string; border: string };
type Font = { name?: string; size?: number; bold?: boolean; italic?: boolean; color?: string };
type Side = { style: string; color: string };
type Borders = { top?: Side; bottom?: Side; left?: Side; right?: Side };
type Alignment = { horizontal?: string; vertical?: string; wrapText?: boolean };
type Style = { font?: Font; fill?: string; border?: Borders; alignment?: Alignment; numberFormat?: string };
type Cell = { value: ExcelReportValue; style: Style };
type Sheet = {
  name: string;
  tabColor: string;
  footerLabel?: string;
  cells: Map<string, Cell>;
  merges: string[];
  widths: Map<number, number>;
  heights: Map<number, number>;
  freezeRow?: number;
  filter?: string;
  orientation: "portrait" | "landscape";
  fitToHeight: number;
};

const fontDefault: Font = { name: "Aptos", size: 10, color: COLORS.slate700 };
const styleDefault: Style = {};

class Styles {
  private readonly list: Style[] = [];
  private readonly keys = new Map<string, number>();

  constructor() {
    // Cell style 0 is Excel's implicit style for every cell without an `s` attribute.
    // Register it before colored styles so unused worksheet cells stay unfilled.
    this.id(styleDefault);
  }

  id(style: Style) {
    const normalized = {
      font: { ...fontDefault, ...style.font },
      fill: style.fill ?? "",
      border: style.border ?? {},
      alignment: style.alignment ?? {},
      numberFormat: style.numberFormat ?? "",
    };
    const key = JSON.stringify(normalized);
    const existing = this.keys.get(key);
    if (existing !== undefined) return existing;
    const id = this.list.length;
    this.list.push(normalized);
    this.keys.set(key, id);
    return id;
  }

  xml() {
    const fonts: Font[] = [];
    const fills = ["", "__gray125__"];
    const borders: Borders[] = [{}];
    const customFormats = new Map<string, number>();
    const xfs: string[] = [];

    this.list.forEach((style) => {
      const font = { ...fontDefault, ...style.font };
      let fontId = fonts.findIndex((item) => JSON.stringify(item) === JSON.stringify(font));
      if (fontId < 0) { fontId = fonts.length; fonts.push(font); }

      let fillId = style.fill ? fills.indexOf(style.fill) : 0;
      if (fillId < 0) { fillId = fills.length; fills.push(style.fill as string); }

      let borderId = borders.findIndex((item) => JSON.stringify(item) === JSON.stringify(style.border ?? {}) );
      if (borderId < 0) { borderId = borders.length; borders.push(style.border ?? {}); }

      const builtIn = builtInFormat(style.numberFormat ?? "");
      const numberFormatId = builtIn ?? (style.numberFormat ? customFormatId(customFormats, style.numberFormat) : 0);
      xfs.push(renderXf(fontId, fillId, borderId, numberFormatId, style.alignment ?? {}));
    });

    const fontXml = fonts.map((font) =>
      "<font><sz val=\"" + (font.size ?? 10) + "\"/><name val=\"" + xmlEscape(font.name ?? "Aptos") + "\"/>" +
      (font.bold ? "<b/>" : "") + (font.italic ? "<i/>" : "") +
      "<color rgb=\"FF" + normalizeColor(font.color ?? COLORS.slate700) + "\"/></font>",
    ).join("");
    const fillXml = fills.map((fill) => {
      if (!fill) return "<fill><patternFill patternType=\"none\"/></fill>";
      if (fill === "__gray125__") return "<fill><patternFill patternType=\"gray125\"/></fill>";
      return "<fill><patternFill patternType=\"solid\"><fgColor rgb=\"FF" + normalizeColor(fill) + "\"/><bgColor indexed=\"64\"/></patternFill></fill>";
    }).join("");
    const borderXml = borders.map(renderBorder).join("");
    const formats = [...customFormats.entries()].map(([format, id]) =>
      "<numFmt numFmtId=\"" + id + "\" formatCode=\"" + xmlEscape(format) + "\"/>",
    ).join("");

    return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">" +
      (formats ? "<numFmts count=\"" + customFormats.size + "\">" + formats + "</numFmts>" : "") +
      "<fonts count=\"" + fonts.length + "\">" + fontXml + "</fonts><fills count=\"" + fills.length + "\">" + fillXml +
      "</fills><borders count=\"" + borders.length + "\">" + borderXml +
      "</borders><cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>" +
      "<cellXfs count=\"" + xfs.length + "\">" + xfs.join("") +
      "</cellXfs><cellStyles count=\"1\"><cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/></cellStyles>" +
      "<dxfs count=\"0\"/><tableStyles count=\"0\" defaultTableStyle=\"TableStyleMedium2\" defaultPivotStyle=\"PivotStyleMedium9\"/></styleSheet>";
  }
}

class SharedStrings {
  private readonly values: string[] = [];
  private readonly ids = new Map<string, number>();

  id(value: string) {
    const existing = this.ids.get(value);
    if (existing !== undefined) return existing;
    const id = this.values.length;
    this.values.push(value);
    this.ids.set(value, id);
    return id;
  }

  xml() {
    return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><sst xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" count=\"" +
      this.values.length + "\" uniqueCount=\"" + this.values.length + "\">" +
      this.values.map((value) => "<si><t" + (/^[\s]|[\s]$/.test(value) ? " xml:space=\"preserve\"" : "") + ">" + xmlEscape(value) + "</t></si>").join("") +
      "</sst>";
  }
}

export function createStyledXlsx<Row>(definition: ExcelReportDefinition<Row>) {
  const styles = new Styles();
  const sharedStrings = new SharedStrings();
  const sheets = [
    createSummarySheet(definition),
    createDataSheet(definition),
    createStatisticsSheet(definition),
  ].filter((sheet): sheet is Sheet => Boolean(sheet));

  const worksheetXml = sheets.map((sheet) => renderSheet(sheet, styles, sharedStrings));
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(contentTypesXml(sheets.length)),
    "_rels/.rels": strToU8(rootRelationshipsXml()),
    "xl/workbook.xml": strToU8(workbookXml(sheets)),
    "xl/_rels/workbook.xml.rels": strToU8(workbookRelationshipsXml(sheets)),
    "xl/styles.xml": strToU8(styles.xml()),
    "xl/sharedStrings.xml": strToU8(sharedStrings.xml()),
    "xl/theme/theme1.xml": strToU8(themeXml()),
    "docProps/core.xml": strToU8(corePropertiesXml(definition)),
    "docProps/app.xml": strToU8(appPropertiesXml(sheets)),
  };

  worksheetXml.forEach((xml, index) => {
    files["xl/worksheets/sheet" + (index + 1) + ".xml"] = strToU8(xml);
  });
  return zipSync(files, { level: 6 });
}

function createSheet(name: string, tabColor: string, footerLabel?: string): Sheet {
  return { name, tabColor, footerLabel, cells: new Map(), merges: [], widths: new Map(), heights: new Map(), orientation: "portrait", fitToHeight: 1 };
}

function setCell(sheet: Sheet, row: number, column: number, value: ExcelReportValue, style: Style = styleDefault) {
  sheet.cells.set(row + ":" + column, { value, style });
}

function getCell(sheet: Sheet, row: number, column: number) {
  return sheet.cells.get(row + ":" + column);
}

function merge(sheet: Sheet, fromRow: number, fromColumn: number, toRow: number, toColumn: number) {
  sheet.merges.push(cellAddress(fromRow, fromColumn) + ":" + cellAddress(toRow, toColumn));
}

function setRangeStyle(sheet: Sheet, fromRow: number, toRow: number, fromColumn: number, toColumn: number, add: Style) {
  for (let row = fromRow; row <= toRow; row += 1) {
    for (let column = fromColumn; column <= toColumn; column += 1) {
      const current = getCell(sheet, row, column);
      setCell(sheet, row, column, current?.value ?? null, mergeStyle(current?.style ?? styleDefault, add));
    }
  }
}

function mergeStyle(base: Style, add: Style): Style {
  return {
    ...base,
    ...add,
    font: { ...base.font, ...add.font },
    border: { ...base.border, ...add.border },
    alignment: { ...base.alignment, ...add.alignment },
  };
}

function createSummarySheet<Row>(definition: ExcelReportDefinition<Row>) {
  const sheet = createSheet("Ringkasan", COLORS.emerald600, definition.footerLabel);
  [3, 20, 22, 3, 20, 22, 3].forEach((width, index) => sheet.widths.set(index + 1, width));
  merge(sheet, 2, 2, 2, 6); merge(sheet, 3, 2, 4, 6); merge(sheet, 5, 2, 5, 6);
  setCell(sheet, 2, 2, "ABSENSI CN  /  LAPORAN RESMI", { font: { size: 8, bold: true, color: COLORS.emerald200 }, fill: COLORS.emerald950, alignment: { vertical: "center" } });
  setCell(sheet, 3, 2, definition.title, { font: { name: "Aptos Display", size: 24, bold: true, color: COLORS.white }, fill: COLORS.emerald950, alignment: { vertical: "center", horizontal: "left" } });
  setCell(sheet, 5, 2, definition.subtitle, { font: { size: 10, color: COLORS.emerald100 }, fill: COLORS.emerald900, alignment: { vertical: "center", horizontal: "left" } });
  setRangeStyle(sheet, 2, 5, 2, 6, { fill: COLORS.emerald950 });
  setRangeStyle(sheet, 5, 5, 2, 6, { fill: COLORS.emerald900, border: { bottom: side("medium", COLORS.emerald500) } });
  [20, 28, 28, 24].forEach((height, index) => sheet.heights.set(index + 2, height));

  sectionTitle(sheet, 7, "INFORMASI LAPORAN", "Konteks dan cakupan data yang diekspor");
  const info = [...definition.metadata, { label: "Jumlah data", value: definition.rows.length }, { label: "Dibuat pada", value: new Date().toLocaleString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) }];
  info.forEach((item, index) => {
    const row = 8 + Math.floor(index / 2) * 3; const start = index % 2 === 0 ? 2 : 5;
    merge(sheet, row, start, row, start + 1); merge(sheet, row + 1, start, row + 1, start + 1);
    setCell(sheet, row, start, item.label.toUpperCase(), { font: { size: 8, bold: true, color: COLORS.emerald700 }, fill: COLORS.slate50, alignment: { vertical: "bottom", horizontal: "left" } });
    setCell(sheet, row + 1, start, item.value, { font: { size: 11, bold: true, color: COLORS.slate900 }, fill: COLORS.slate50, alignment: { vertical: "top", horizontal: "left", wrapText: true } });
    setRangeStyle(sheet, row, row + 1, start, start + 1, { fill: COLORS.slate50, border: cardBorder(row, row + 1, start, start + 1, COLORS.slate200, COLORS.emerald500) });
    sheet.heights.set(row, 18); sheet.heights.set(row + 1, 27); sheet.heights.set(row + 2, 6);
  });

  const metrics = definition.metrics ?? automaticMetrics(definition);
  const metricsStart = 9 + Math.ceil(info.length / 2) * 3;
  sectionTitle(sheet, metricsStart, "RINGKASAN DATA", "Angka utama untuk pembacaan cepat");
  metrics.forEach((metric, index) => {
    const row = metricsStart + 1 + Math.floor(index / 2) * 3; const start = index % 2 === 0 ? 2 : 5; const tone = metricTone(metric.tone ?? "emerald");
    merge(sheet, row, start, row, start + 1); merge(sheet, row + 1, start, row + 1, start + 1);
    setCell(sheet, row, start, metric.label.toUpperCase(), { font: { size: 8, bold: true, color: tone.text }, fill: tone.fill, alignment: { vertical: "bottom", horizontal: "left" } });
    setCell(sheet, row + 1, start, metric.value, { font: { name: "Aptos Display", size: 20, bold: true, color: tone.text }, fill: tone.fill, alignment: { vertical: "top", horizontal: "left" } });
    setRangeStyle(sheet, row, row + 1, start, start + 1, { fill: tone.fill, border: cardBorder(row, row + 1, start, start + 1, tone.border, tone.text) });
    sheet.heights.set(row, 19); sheet.heights.set(row + 1, 31); sheet.heights.set(row + 2, 7);
  });
  return sheet;
}

function createDataSheet<Row>(definition: ExcelReportDefinition<Row>) {
  const sheet = createSheet(safeSheetName(definition.dataSheetName ?? "Data Laporan"), COLORS.emerald700, definition.footerLabel);
  const columnCount = Math.max(definition.columns.length, 1); const headerRow = 8;
  sheet.freezeRow = headerRow; sheet.orientation = definition.columns.length > 6 ? "landscape" : "portrait"; sheet.fitToHeight = 0;
  definition.columns.forEach((column, index) => sheet.widths.set(index + 1, column.width ?? inferColumnWidth(column.header)));
  merge(sheet, 1, 1, 1, columnCount); merge(sheet, 2, 1, 3, columnCount); merge(sheet, 4, 1, 4, columnCount); merge(sheet, 5, 1, 5, columnCount); merge(sheet, 7, 1, 7, columnCount);
  setCell(sheet, 1, 1, "ABSENSI CN  /  DATA LAPORAN", { font: { size: 8, bold: true, color: COLORS.emerald200 }, fill: COLORS.emerald950 });
  setCell(sheet, 2, 1, definition.title, { font: { name: "Aptos Display", size: 21, bold: true, color: COLORS.white }, fill: COLORS.emerald950, alignment: { vertical: "center" } });
  setCell(sheet, 4, 1, definition.subtitle, { font: { size: 9.5, color: COLORS.emerald100 }, fill: COLORS.emerald900 });
  setCell(sheet, 5, 1, definition.metadata.map((item) => item.label + ": " + item.value).join("   |   "), { font: { size: 9, color: COLORS.slate600 }, fill: COLORS.emerald50, alignment: { vertical: "center", wrapText: true } });
  setCell(sheet, 7, 1, "DATA TERPERINCI  /  " + definition.rows.length.toLocaleString("id-ID") + " BARIS", { font: { size: 8, bold: true, color: COLORS.emerald700 }, alignment: { vertical: "center" } });
  setRangeStyle(sheet, 1, 4, 1, columnCount, { fill: COLORS.emerald950 }); setRangeStyle(sheet, 4, 4, 1, columnCount, { fill: COLORS.emerald900, border: { bottom: side("medium", COLORS.emerald500) } }); setRangeStyle(sheet, 5, 5, 1, columnCount, { fill: COLORS.emerald50, border: { bottom: side("thin", COLORS.emerald200) } });
  [19, 25, 25, 23, 29, 8, 21].forEach((height, index) => sheet.heights.set(index + 1, height));
  definition.columns.forEach((column, index) => setCell(sheet, headerRow, index + 1, column.header, { font: { size: 10, bold: true, color: COLORS.white }, fill: COLORS.emerald800, border: { bottom: side("medium", COLORS.emerald500), right: side("thin", "2A8069") }, alignment: { vertical: "center", horizontal: "center", wrapText: true } }));
  sheet.heights.set(headerRow, 32);
  definition.rows.forEach((row, rowIndex) => {
    const excelRow = headerRow + rowIndex + 1;
    definition.columns.forEach((column, columnIndex) => {
      const value = column.value(row, rowIndex); const tone = column.kind === "attendance" ? attendanceColor(column.header) : column.kind === "status" ? statusColor(String(value ?? "").trim().toLowerCase()) : undefined;
      setCell(sheet, excelRow, columnIndex + 1, normalize(value), { font: { size: 10, color: tone?.text ?? COLORS.slate700, bold: Boolean(tone) }, fill: tone?.fill ?? (rowIndex % 2 === 0 ? COLORS.white : COLORS.slate50), border: dataBorder(columnIndex === 0, columnIndex === columnCount - 1, rowIndex === definition.rows.length - 1), alignment: { vertical: "center", horizontal: tone || column.kind === "number" || column.kind === "attendance" ? "center" : "left", wrapText: true }, numberFormat: value instanceof Date ? column.numberFormat ?? "dd mmm yyyy" : typeof value === "number" ? column.numberFormat ?? "#,##0" : undefined });
    });
    sheet.heights.set(excelRow, 25);
  });
  const lastRow = Math.max(headerRow, headerRow + definition.rows.length);
  if (definition.showColumnFilters !== false) sheet.filter = cellAddress(headerRow, 1) + ":" + cellAddress(lastRow, columnCount);
  return sheet;
}

function createStatisticsSheet<Row>(definition: ExcelReportDefinition<Row>) {
  const stats = collectStatistics(definition); if (!stats.length) return undefined;
  const sheet = createSheet("Statistik", COLORS.amber700, definition.footerLabel); sheet.freezeRow = 10; sheet.orientation = "portrait";
  [7, 31, 18, 20].forEach((width, index) => sheet.widths.set(index + 1, width));
  merge(sheet, 1, 1, 1, 4); merge(sheet, 2, 1, 3, 4); merge(sheet, 4, 1, 4, 4);
  setCell(sheet, 1, 1, "ABSENSI CN  /  ANALISIS LAPORAN", { font: { size: 8, bold: true, color: COLORS.emerald200 }, fill: COLORS.emerald950 });
  setCell(sheet, 2, 1, "STATISTIK LAPORAN", { font: { name: "Aptos Display", size: 21, bold: true, color: COLORS.white }, fill: COLORS.emerald950 });
  setCell(sheet, 4, 1, definition.title + "  |  " + definition.rows.length.toLocaleString("id-ID") + " data", { font: { size: 9.5, color: COLORS.emerald100 }, fill: COLORS.emerald900 });
  setRangeStyle(sheet, 1, 4, 1, 4, { fill: COLORS.emerald950 }); setRangeStyle(sheet, 4, 4, 1, 4, { fill: COLORS.emerald900, border: { bottom: side("medium", COLORS.emerald500) } });
  addStatCard(sheet, 6, 1, 2, "TOTAL DATA", definition.rows.length, metricTone("emerald")); addStatCard(sheet, 6, 3, 4, "TOTAL KEJADIAN", stats.reduce((sum, item) => sum + item.value, 0), metricTone("slate"));
  sheet.heights.set(8, 8); merge(sheet, 9, 1, 9, 4); setCell(sheet, 9, 1, "DISTRIBUSI STATUS", { font: { size: 8, bold: true, color: COLORS.emerald700 } }); sheet.heights.set(9, 21);
  ["No", "Indikator", "Jumlah", "Persentase"].forEach((value, index) => setCell(sheet, 10, index + 1, value, { font: { size: 10, bold: true, color: COLORS.white }, fill: COLORS.emerald800, border: { bottom: side("medium", COLORS.emerald500), right: side("thin", "2A8069") }, alignment: { vertical: "center", horizontal: "center" } }));
  sheet.heights.set(10, 31);
  stats.forEach((stat, index) => {
    const row = 11 + index; const tone = statisticTone(stat.label); const fill = index % 2 === 0 ? COLORS.white : COLORS.slate50;
    setCell(sheet, row, 1, index + 1, { fill, border: dataBorder(true, false, index === stats.length - 1), alignment: { horizontal: "center", vertical: "center" } });
    setCell(sheet, row, 2, stat.label, { font: { size: 10, bold: true, color: tone.text }, fill: tone.fill, border: dataBorder(false, false, index === stats.length - 1), alignment: { horizontal: "left", vertical: "center" } });
    setCell(sheet, row, 3, stat.value, { font: { size: 10, bold: true, color: tone.text }, fill, border: dataBorder(false, false, index === stats.length - 1), alignment: { horizontal: "center", vertical: "center" } });
    setCell(sheet, row, 4, stat.percentage, { fill, border: dataBorder(false, true, index === stats.length - 1), alignment: { horizontal: "center", vertical: "center" }, numberFormat: "0.0%" }); sheet.heights.set(row, 25);
  });
  return sheet;
}

function addStatCard(sheet: Sheet, row: number, from: number, to: number, label: string, value: number, tone: Tone) {
  merge(sheet, row, from, row, to); merge(sheet, row + 1, from, row + 1, to);
  setCell(sheet, row, from, label, { font: { size: 8, bold: true, color: tone.text }, fill: tone.fill, alignment: { vertical: "bottom" } });
  setCell(sheet, row + 1, from, value, { font: { name: "Aptos Display", size: 18, bold: true, color: tone.text }, fill: tone.fill, alignment: { vertical: "top" }, numberFormat: "#,##0" });
  setRangeStyle(sheet, row, row + 1, from, to, { fill: tone.fill, border: cardBorder(row, row + 1, from, to, tone.border, tone.text) }); sheet.heights.set(row, 18); sheet.heights.set(row + 1, 29);
}

function sectionTitle(sheet: Sheet, row: number, title: string, description: string) {
  merge(sheet, row, 2, row, 3); setCell(sheet, row, 2, title, { font: { size: 9, bold: true, color: COLORS.emerald700 }, alignment: { vertical: "center", horizontal: "left" } });
  merge(sheet, row, 5, row, 6); setCell(sheet, row, 5, description, { font: { size: 8.5, color: COLORS.slate500 }, alignment: { vertical: "center", horizontal: "right", wrapText: true } }); sheet.heights.set(row, 28);
}

function collectStatistics<Row>(definition: ExcelReportDefinition<Row>) {
  const stats: Array<{ label: string; value: number; percentage: number }> = []; const denominator = Math.max(definition.rows.length, 1);
  const attendance = definition.columns.filter((column) => column.kind === "attendance").map((column) => ({ label: "Total " + column.header, value: definition.rows.reduce((sum, row, index) => { const value = column.value(row, index); return sum + (typeof value === "number" ? value : 0); }, 0) }));
  const grandTotal = Math.max(attendance.reduce((sum, item) => sum + item.value, 0), 1); attendance.forEach((item) => stats.push({ ...item, percentage: item.value / grandTotal }));
  definition.columns.filter((column) => column.kind === "status").forEach((column) => { const counts = new Map<string, number>(); definition.rows.forEach((row, index) => { const label = String(column.value(row, index) ?? "Tidak diketahui"); counts.set(label, (counts.get(label) ?? 0) + 1); }); counts.forEach((value, label) => stats.push({ label: column.header + ": " + label, value, percentage: value / denominator })); });
  return stats;
}

function automaticMetrics<Row>(definition: ExcelReportDefinition<Row>): ExcelReportMetric[] {
  const metrics: ExcelReportMetric[] = [{ label: "Total Data", value: definition.rows.length, tone: "emerald" }]; const tones: ExcelReportMetric["tone"][] = ["emerald", "sky", "violet", "rose", "amber"];
  definition.columns.filter((column) => column.kind === "attendance").slice(0, 5).forEach((column, index) => metrics.push({ label: "Total " + column.header, value: definition.rows.reduce((sum, row, rowIndex) => { const value = column.value(row, rowIndex); return sum + (typeof value === "number" ? value : 0); }, 0), tone: tones[index] })); return metrics;
}

function metricTone(tone: NonNullable<ExcelReportMetric["tone"]>): Tone {
  return { emerald: { fill: COLORS.emerald50, text: COLORS.emerald700, border: COLORS.emerald200 }, sky: { fill: COLORS.sky100, text: COLORS.sky700, border: "BAE6FD" }, violet: { fill: COLORS.violet100, text: COLORS.violet700, border: "DDD6FE" }, amber: { fill: COLORS.amber100, text: COLORS.amber700, border: "FDE68A" }, rose: { fill: COLORS.rose100, text: COLORS.rose700, border: "FECDD3" }, slate: { fill: COLORS.slate50, text: COLORS.slate700, border: COLORS.slate200 } }[tone];
}

function attendanceColor(header: string) {
  const value = header.toLowerCase(); if (value === "h" || value.includes("hadir")) return metricTone("emerald"); if (value === "i" || value.includes("izin")) return metricTone("sky"); if (value === "s" || value.includes("sakit")) return metricTone("violet"); if (value === "a" || value.includes("alfa")) return metricTone("rose"); if (value === "t" || value.includes("telat")) return metricTone("amber"); return metricTone("slate");
}
function statusColor(status: string) {
  if (["hadir", "aktif", "diterima", "selesai", "sudah divalidasi"].some((item) => status.includes(item))) return metricTone("emerald"); if (status.includes("izin")) return metricTone("sky"); if (["sakit", "diedit"].some((item) => status.includes(item))) return metricTone("violet"); if (["alfa", "ditolak", "non-aktif", "nonaktif"].some((item) => status.includes(item))) return metricTone("rose"); if (["telat", "menunggu", "belum"].some((item) => status.includes(item))) return metricTone("amber"); return metricTone("slate");
}
function statisticTone(label: string) {
  const value = label.toLowerCase(); if (/total\s+h\b|hadir/.test(value)) return metricTone("emerald"); if (/total\s+i\b|izin/.test(value)) return metricTone("sky"); if (/total\s+s\b|sakit/.test(value)) return metricTone("violet"); if (/total\s+a\b|alfa/.test(value)) return metricTone("rose"); if (/total\s+t\b|telat/.test(value)) return metricTone("amber"); return metricTone("slate");
}
function normalize(value: ExcelReportValue): ExcelReportValue { return value === null || value === undefined || value === "" ? "-" : value; }
function side(style: string, color: string): Side { return { style, color }; }
function cardBorder(row: number, lastRow: number, column: number, lastColumn: number, border: string, accent: string): Borders { return { top: side("thin", border), bottom: row === lastRow ? side("thin", border) : undefined, left: column === column ? side("medium", accent) : undefined, right: column === lastColumn ? side("thin", border) : undefined }; }
function dataBorder(first: boolean, last: boolean, lastRow: boolean): Borders { return { bottom: side(lastRow ? "medium" : "thin", lastRow ? COLORS.emerald200 : COLORS.slate200), left: first ? side("thin", COLORS.slate200) : undefined, right: last ? side("thin", COLORS.slate200) : undefined }; }
function inferColumnWidth(header: string) { const value = header.toLowerCase(); if (value === "no") return 7; if (["h", "i", "s", "a", "t", "d", "ak"].includes(value)) return 8; if (value.includes("nama")) return 27; if (value.includes("kelas")) return 24; if (value.includes("alasan") || value.includes("catatan") || value.includes("topik")) return 38; if (value.includes("tanggal") || value.includes("waktu")) return 22; return 18; }
function safeSheetName(value: string) { return value.replace(/[\\/*?:[\]]/g, " ").trim().slice(0, 31) || "Data Laporan"; }

function renderSheet(sheet: Sheet, styles: Styles, strings: SharedStrings) {
  const maxRow = Math.max(1, ...[...sheet.cells.keys()].map((key) => Number(key.split(":")[0])), ...sheet.heights.keys());
  const maxColumn = Math.max(1, ...[...sheet.cells.keys()].map((key) => Number(key.split(":")[1])), ...sheet.widths.keys());
  const rows: string[] = [];
  for (let row = 1; row <= maxRow; row += 1) {
    const cells: string[] = [];
    for (let column = 1; column <= maxColumn; column += 1) { const cell = sheet.cells.get(row + ":" + column); if (cell) cells.push(renderCell(row, column, cell, styles.id(cell.style), strings)); }
    if (cells.length || sheet.heights.has(row)) rows.push("<row r=\"" + row + "\"" + (sheet.heights.has(row) ? " ht=\"" + sheet.heights.get(row) + "\" customHeight=\"1\"" : "") + ">" + cells.join("") + "</row>");
  }
  const columns = [...sheet.widths.entries()].map(([column, width]) => "<col min=\"" + column + "\" max=\"" + column + "\" width=\"" + width + "\" customWidth=\"1\"/>").join("");
  const merges = sheet.merges.length ? "<mergeCells count=\"" + sheet.merges.length + "\">" + sheet.merges.map((ref) => "<mergeCell ref=\"" + ref + "\"/>").join("") + "</mergeCells>" : "";
  const pane = sheet.freezeRow ? "<pane ySplit=\"" + sheet.freezeRow + "\" topLeftCell=\"A" + (sheet.freezeRow + 1) + "\" activePane=\"bottomLeft\" state=\"frozen\"/>" : "";
  const footer = xmlEscape(sheet.footerLabel ?? "ABSENSI CN - Sekolah Citra Negara");
  return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetPr><tabColor rgb=\"FF" + sheet.tabColor + "\"/><pageSetUpPr fitToPage=\"1\"/></sheetPr><dimension ref=\"A1:" + cellAddress(maxRow, maxColumn) + "\"/><sheetViews><sheetView workbookViewId=\"0\" showGridLines=\"0\">" + pane + "</sheetView></sheetViews>" + (columns ? "<cols>" + columns + "</cols>" : "") + "<sheetData>" + rows.join("") + "</sheetData>" + merges + (sheet.filter ? "<autoFilter ref=\"" + sheet.filter + "\"/>" : "") + "<printOptions gridLines=\"0\"/><pageMargins left=\"0.35\" right=\"0.35\" top=\"0.45\" bottom=\"0.45\" header=\"0.15\" footer=\"0.2\"/><pageSetup paperSize=\"9\" orientation=\"" + sheet.orientation + "\" fitToWidth=\"1\" fitToHeight=\"" + sheet.fitToHeight + "\"/><headerFooter><oddFooter>&amp;L" + footer + "&amp;CHasil ekspor sistem&amp;RHalaman &amp;P / &amp;N</oddFooter></headerFooter></worksheet>";
}

function renderCell(row: number, column: number, cell: Cell, styleId: number, strings: SharedStrings) {
  const ref = cellAddress(row, column); const value = cell.value;
  if (typeof value === "number" && Number.isFinite(value)) return "<c r=\"" + ref + "\" s=\"" + styleId + "\"><v>" + value + "</v></c>";
  if (value instanceof Date) return "<c r=\"" + ref + "\" s=\"" + styleId + "\"><v>" + excelDateSerial(value) + "</v></c>";
  if (typeof value === "boolean") return "<c r=\"" + ref + "\" s=\"" + styleId + "\" t=\"b\"><v>" + (value ? 1 : 0) + "</v></c>";
  return "<c r=\"" + ref + "\" s=\"" + styleId + "\" t=\"s\"><v>" + strings.id(String(value ?? "")) + "</v></c>";
}

function renderXf(font: number, fill: number, border: number, numberFormat: number, alignment: Alignment) {
  const horizontal = alignment.horizontal === "middle" ? "center" : alignment.horizontal; const vertical = alignment.vertical === "middle" ? "center" : alignment.vertical;
  const alignmentXml = horizontal || vertical || alignment.wrapText ? "<alignment" + (horizontal ? " horizontal=\"" + horizontal + "\"" : "") + (vertical ? " vertical=\"" + vertical + "\"" : "") + (alignment.wrapText ? " wrapText=\"1\"" : "") + "/>" : "";
  return "<xf numFmtId=\"" + numberFormat + "\" fontId=\"" + font + "\" fillId=\"" + fill + "\" borderId=\"" + border + "\" applyFont=\"1\" applyFill=\"" + (fill ? 1 : 0) + "\" applyBorder=\"" + (border ? 1 : 0) + "\" applyAlignment=\"" + (alignmentXml ? 1 : 0) + "\">" + alignmentXml + "</xf>";
}
function renderBorder(border: Borders) { const render = (name: keyof Borders) => { const value = border[name]; return value ? "<" + name + " style=\"" + value.style + "\"><color rgb=\"FF" + normalizeColor(value.color) + "\"/></" + name + ">" : "<" + name + "/>"; }; return "<border>" + render("left") + render("right") + render("top") + render("bottom") + "<diagonal/></border>"; }
function customFormatId(formats: Map<string, number>, value: string) { const existing = formats.get(value); if (existing) return existing; const id = 164 + formats.size; formats.set(value, id); return id; }
function builtInFormat(value: string) { return ({ "0": 1, "#,##0": 3, "0%": 9 } as Record<string, number>)[value]; }
function normalizeColor(value: string) { return value.length === 8 ? value.slice(2) : value; }
function excelDateSerial(value: Date) { return Math.round((value.getTime() - Date.UTC(1899, 11, 30)) / 86400000 * 100000) / 100000; }
function cellAddress(row: number, column: number) { let value = column; let letters = ""; while (value > 0) { const remainder = (value - 1) % 26; letters = String.fromCharCode(65 + remainder) + letters; value = Math.floor((value - 1) / 26); } return letters + row; }
function xmlEscape(value: string) {
  const safeValue = Array.from(value).filter((character) => {
    const code = character.charCodeAt(0);
    return !(code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31));
  }).join("");
  return safeValue.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function workbookXml(sheets: Sheet[]) { return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><fileVersion appName=\"xl\"/><bookViews><workbookView/></bookViews><sheets>" + sheets.map((sheet, index) => "<sheet name=\"" + xmlEscape(sheet.name) + "\" sheetId=\"" + (index + 1) + "\" r:id=\"rId" + (index + 1) + "\"/>").join("") + "</sheets></workbook>"; }
function workbookRelationshipsXml(sheets: Sheet[]) { const sheetsXml = sheets.map((_, index) => "<Relationship Id=\"rId" + (index + 1) + "\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet" + (index + 1) + ".xml\"/>").join(""); const base = sheets.length + 1; return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" + sheetsXml + "<Relationship Id=\"rId" + base + "\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/><Relationship Id=\"rId" + (base + 1) + "\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings\" Target=\"sharedStrings.xml\"/><Relationship Id=\"rId" + (base + 2) + "\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme\" Target=\"theme/theme1.xml\"/></Relationships>"; }
function contentTypesXml(sheetCount: number) { const sheets = Array.from({ length: sheetCount }, (_, index) => "<Override PartName=\"/xl/worksheets/sheet" + (index + 1) + ".xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>").join(""); return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/><Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/><Override PartName=\"/xl/sharedStrings.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml\"/><Override PartName=\"/xl/theme/theme1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.theme+xml\"/>" + sheets + "<Override PartName=\"/docProps/core.xml\" ContentType=\"application/vnd.openxmlformats-package.core-properties+xml\"/><Override PartName=\"/docProps/app.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.extended-properties+xml\"/></Types>"; }
function rootRelationshipsXml() { return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/><Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties\" Target=\"docProps/core.xml\"/><Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties\" Target=\"docProps/app.xml\"/></Relationships>"; }
function corePropertiesXml<Row>(definition: ExcelReportDefinition<Row>) { const now = new Date().toISOString(); return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><cp:coreProperties xmlns:cp=\"http://schemas.openxmlformats.org/package/2006/metadata/core-properties\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:dcterms=\"http://purl.org/dc/terms/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><dc:title>" + xmlEscape(definition.title) + "</dc:title><dc:subject>" + xmlEscape(definition.subtitle) + "</dc:subject><dc:creator>Absensi CN</dc:creator><cp:lastModifiedBy>Absensi CN</cp:lastModifiedBy><dcterms:created xsi:type=\"dcterms:W3CDTF\">" + now + "</dcterms:created><dcterms:modified xsi:type=\"dcterms:W3CDTF\">" + now + "</dcterms:modified></cp:coreProperties>"; }
function appPropertiesXml(sheets: Sheet[]) { return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Properties xmlns=\"http://schemas.openxmlformats.org/officeDocument/2006/extended-properties\" xmlns:vt=\"http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes\"><Application>Absensi CN</Application><HeadingPairs><vt:vector size=\"2\" baseType=\"variant\"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>" + sheets.length + "</vt:i4></vt:variant></vt:vector></HeadingPairs><TitlesOfParts><vt:vector size=\"" + sheets.length + "\" baseType=\"lpstr\">" + sheets.map((sheet) => "<vt:lpstr>" + xmlEscape(sheet.name) + "</vt:lpstr>").join("") + "</vt:vector></TitlesOfParts></Properties>"; }
function themeXml() { return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><a:theme xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" name=\"Office Theme\"><a:themeElements><a:clrScheme name=\"Office\"><a:dk1><a:sysClr val=\"windowText\" lastClr=\"000000\"/></a:dk1><a:lt1><a:sysClr val=\"window\" lastClr=\"FFFFFF\"/></a:lt1><a:dk2><a:srgbClr val=\"44546A\"/></a:dk2><a:lt2><a:srgbClr val=\"E7E6E6\"/></a:lt2><a:accent1><a:srgbClr val=\"4472C4\"/></a:accent1><a:accent2><a:srgbClr val=\"ED7D31\"/></a:accent2><a:accent3><a:srgbClr val=\"A5A5A5\"/></a:accent3><a:accent4><a:srgbClr val=\"FFC000\"/></a:accent4><a:accent5><a:srgbClr val=\"5B9BD5\"/></a:accent5><a:accent6><a:srgbClr val=\"70AD47\"/></a:accent6><a:hlink><a:srgbClr val=\"0563C1\"/></a:hlink><a:folHlink><a:srgbClr val=\"954F72\"/></a:folHlink></a:clrScheme><a:fontScheme name=\"Office\"><a:majorFont><a:latin typeface=\"Aptos Display\"/></a:majorFont><a:minorFont><a:latin typeface=\"Aptos\"/></a:minorFont></a:fontScheme><a:fmtScheme name=\"Office\"><a:fillStyleLst/><a:lnStyleLst/><a:effectStyleLst/><a:bgFillStyleLst/></a:fmtScheme></a:themeElements></a:theme>"; }
