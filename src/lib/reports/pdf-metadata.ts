import { appCreditLongStatement, appCredits } from "@/lib/config/credits";

type PdfWithProperties = {
  setProperties?: (properties: {
    title?: string;
    subject?: string;
    author?: string;
    keywords?: string;
    creator?: string;
  }) => void;
};

export function applyPdfCreditMetadata(doc: PdfWithProperties, title: string) {
  doc.setProperties?.({
    title,
    subject: appCreditLongStatement,
    author: appCredits.leadCreator,
    keywords: `${appCredits.project}, ${appCredits.team}, SMK Citra Negara, ${appCredits.leadCreator}`,
    creator: `${appCredits.project} by ${appCredits.team}`,
  });
}
