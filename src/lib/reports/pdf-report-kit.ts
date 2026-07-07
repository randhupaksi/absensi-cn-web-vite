import type { jsPDF } from "jspdf";

export const REPORT_PDF_MARGIN_X = 14;

export const REPORT_TABLE_STYLE = {
  styles: {
    fontSize: 8,
    cellPadding: { horizontal: 4, vertical: 4 },
    lineColor: [226, 232, 240] as [number, number, number],
    lineWidth: 0.2,
    font: "helvetica",
    textColor: [51, 65, 85] as [number, number, number],
    overflow: "linebreak" as const,
  },
  headStyles: {
    fillColor: [6, 78, 59] as [number, number, number],
    textColor: [236, 253, 245] as [number, number, number],
    fontStyle: "bold" as const,
    fontSize: 7.5,
    halign: "center" as const,
  },
  alternateRowStyles: {
    fillColor: [248, 250, 252] as [number, number, number],
  },
  columnStyles: {
    0: { cellWidth: 14, halign: "center" as const, fontStyle: "bold" as const },
  },
};

type HeaderOptions = {
  title: string;
  subtitle: string;
  bandHeight?: 20 | 22;
  marginX?: number;
};

export function drawReportPdfHeader(
  doc: jsPDF,
  { title, subtitle, bandHeight = 22, marginX = REPORT_PDF_MARGIN_X }: HeaderOptions,
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const now = new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  doc.setFillColor(6, 78, 59);
  doc.roundedRect(marginX, 10, pageWidth - marginX * 2, bandHeight, 2.5, 2.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(236, 253, 245);
  doc.text("ABSENSI CN", marginX + 5, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(167, 243, 208);
  doc.text(subtitle, marginX + 5, 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(title, pageWidth - marginX - 5, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(167, 243, 208);
  doc.text(`Dicetak: ${now}`, pageWidth - marginX - 5, 24, { align: "right" });

  return { metaY: bandHeight === 20 ? 35 : 37 };
}

export function drawReportPdfPills(
  doc: jsPDF,
  pills: string[],
  metaY: number,
  marginX = REPORT_PDF_MARGIN_X,
) {
  let pillX = marginX;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(6, 95, 70);
  pills.forEach((text) => {
    const pillWidth = doc.getTextWidth(text) + 8;
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(110, 231, 183);
    doc.setLineWidth(0.3);
    doc.roundedRect(pillX, metaY, pillWidth, 5, 1.2, 1.2, "FD");
    doc.text(text, pillX + 4, metaY + 3.6);
    pillX += pillWidth + 4;
  });
}

export function drawReportPdfFooter(
  doc: jsPDF,
  label: string,
  marginX = REPORT_PDF_MARGIN_X,
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(marginX, pageHeight - 8, pageWidth - marginX, pageHeight - 8);
    doc.text(label, marginX, pageHeight - 4);
    doc.text(`Halaman ${page} / ${totalPages}`, pageWidth - marginX, pageHeight - 4, {
      align: "right",
    });
  }
}
