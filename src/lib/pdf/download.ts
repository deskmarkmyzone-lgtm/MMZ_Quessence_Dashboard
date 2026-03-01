import { pdf } from "@react-pdf/renderer";
import type { ReactElement } from "react";

/**
 * Generate a PDF from a React PDF document element and trigger download.
 */
export async function downloadPDF(
  document: ReactElement,
  filename: string
): Promise<void> {
  const blob = await pdf(document).toBlob();
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = `${filename}.pdf`;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
