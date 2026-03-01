import { StyleSheet } from "@react-pdf/renderer";

export const colors = {
  primary: "#1A1A2E",
  secondary: "#6B7280",
  muted: "#9CA3AF",
  accent: "#6C63FF",
  success: "#22C55E",
  danger: "#EF4444",
  border: "#E5E7EB",
  headerBg: "#F3F4F6",
  white: "#FFFFFF",
};

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    color: colors.primary,
  },
  // Header
  header: {
    marginBottom: 20,
  },
  companyName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: colors.accent,
    marginBottom: 2,
  },
  documentTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerLabel: {
    fontSize: 9,
    color: colors.secondary,
  },
  headerValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  // Recipient
  recipient: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 4,
  },
  recipientLabel: {
    fontSize: 9,
    color: colors.secondary,
    marginBottom: 2,
  },
  recipientName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  recipientAddress: {
    fontSize: 9,
    color: colors.secondary,
  },
  // Subject line
  subject: {
    fontSize: 10,
    marginBottom: 16,
    lineHeight: 1.5,
  },
  // Table
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingVertical: 5,
    paddingHorizontal: 4,
    minHeight: 24,
  },
  tableRowAlt: {
    backgroundColor: "#FAFAFA",
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.secondary,
  },
  tableCell: {
    fontSize: 9,
    color: colors.primary,
  },
  tableCellRight: {
    fontSize: 9,
    color: colors.primary,
    textAlign: "right",
  },
  tableCellBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
  },
  // Totals
  totalsRow: {
    flexDirection: "row",
    borderTopWidth: 1.5,
    borderTopColor: colors.primary,
    paddingTop: 6,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  totalValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  // Bank details
  bankDetails: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  bankTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    color: colors.primary,
  },
  bankRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bankLabel: {
    fontSize: 9,
    color: colors.secondary,
    width: 80,
  },
  bankValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
  },
  // Footer
  footer: {
    marginTop: 24,
  },
  footerNote: {
    fontSize: 9,
    color: colors.secondary,
    fontStyle: "italic",
    marginBottom: 20,
  },
  signatory: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
    width: 150,
    alignSelf: "flex-end",
  },
  // Section
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 8,
    color: colors.primary,
  },
  // Page number
  pageNumber: {
    position: "absolute",
    bottom: 25,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 8,
    color: colors.muted,
  },
});

/**
 * Format a number as Indian currency string.
 */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
