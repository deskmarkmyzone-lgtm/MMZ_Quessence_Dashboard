import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles as s, formatINR } from "./shared-styles";

export interface ExpenseLineItem {
  slNo: number;
  flatNo: string;
  bhk: string;
  sft: number;
  deepCleaning: number;
  paintTouchUp: number;
  acs: number;
  geysers: number;
  anyOther: number;
  remarks: string;
}

interface ExpensesBillProps {
  date: string;
  ownerName: string;
  periodLabel: string;
  lineItems: ExpenseLineItem[];
  totals: {
    deepCleaning: number;
    paintTouchUp: number;
    acs: number;
    geysers: number;
    anyOther: number;
  };
  grandTotal: number;
  bankDetails: {
    name: string;
    bank: string;
    accountNo: string;
    ifsc: string;
    branch: string;
    pan: string;
  };
}

export function ExpensesBillPDF({
  date,
  ownerName,
  periodLabel,
  lineItems,
  totals,
  grandTotal,
  bankDetails,
}: ExpensesBillProps) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.companyName}>MARK MY ZONE</Text>
          <Text style={s.documentTitle}>
            {ownerName} - FLAT EXPENSES {periodLabel}
          </Text>
          <View style={s.headerRow}>
            <View />
            <View>
              <Text style={s.headerLabel}>Date</Text>
              <Text style={s.headerValue}>{date}</Text>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: 25 }]}>Sl</Text>
            <Text style={[s.tableHeaderCell, { width: 40 }]}>Flat</Text>
            <Text style={[s.tableHeaderCell, { width: 30 }]}>BHK</Text>
            <Text style={[s.tableHeaderCell, { width: 40 }]}>SFT</Text>
            <Text style={[s.tableHeaderCell, { width: 62, textAlign: "right" }]}>Cleaning</Text>
            <Text style={[s.tableHeaderCell, { width: 62, textAlign: "right" }]}>Paint</Text>
            <Text style={[s.tableHeaderCell, { width: 55, textAlign: "right" }]}>AC&apos;s</Text>
            <Text style={[s.tableHeaderCell, { width: 55, textAlign: "right" }]}>Geyser</Text>
            <Text style={[s.tableHeaderCell, { width: 55, textAlign: "right" }]}>Other</Text>
            <Text style={[s.tableHeaderCell, { width: 90 }]}>Remarks</Text>
          </View>

          {lineItems.map((item, idx) => (
            <View key={idx} style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}>
              <Text style={[s.tableCell, { width: 25 }]}>{item.slNo}</Text>
              <Text style={[s.tableCellBold, { width: 40 }]}>{item.flatNo}</Text>
              <Text style={[s.tableCell, { width: 30 }]}>{item.bhk}</Text>
              <Text style={[s.tableCell, { width: 40 }]}>{item.sft}</Text>
              <Text style={[s.tableCellRight, { width: 62 }]}>{item.deepCleaning ? formatINR(item.deepCleaning) : "-"}</Text>
              <Text style={[s.tableCellRight, { width: 62 }]}>{item.paintTouchUp ? formatINR(item.paintTouchUp) : "-"}</Text>
              <Text style={[s.tableCellRight, { width: 55 }]}>{item.acs ? formatINR(item.acs) : "-"}</Text>
              <Text style={[s.tableCellRight, { width: 55 }]}>{item.geysers ? formatINR(item.geysers) : "-"}</Text>
              <Text style={[s.tableCellRight, { width: 55 }]}>{item.anyOther ? formatINR(item.anyOther) : "-"}</Text>
              <Text style={[s.tableCell, { width: 90 }]}>{item.remarks}</Text>
            </View>
          ))}

          {/* Category totals */}
          <View style={s.totalsRow}>
            <Text style={[s.totalLabel, { width: 135 }]}>TOTAL</Text>
            <Text style={[s.totalValue, { width: 62 }]}>{formatINR(totals.deepCleaning)}</Text>
            <Text style={[s.totalValue, { width: 62 }]}>{formatINR(totals.paintTouchUp)}</Text>
            <Text style={[s.totalValue, { width: 55 }]}>{formatINR(totals.acs)}</Text>
            <Text style={[s.totalValue, { width: 55 }]}>{formatINR(totals.geysers)}</Text>
            <Text style={[s.totalValue, { width: 55 }]}>{formatINR(totals.anyOther)}</Text>
            <Text style={{ width: 90 }} />
          </View>
        </View>

        {/* Grand Total */}
        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 20 }}>
          <View style={{ padding: 10, backgroundColor: "#F3F4F6", borderRadius: 4, minWidth: 200 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold" }}>GRAND TOTAL:</Text>
              <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold" }}>{formatINR(grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Bank Details */}
        <View style={s.bankDetails}>
          <Text style={s.bankTitle}>BANK DETAILS</Text>
          <View style={s.bankRow}><Text style={s.bankLabel}>Name:</Text><Text style={s.bankValue}>{bankDetails.name}</Text></View>
          <View style={s.bankRow}><Text style={s.bankLabel}>Bank:</Text><Text style={s.bankValue}>{bankDetails.bank}</Text></View>
          <View style={s.bankRow}><Text style={s.bankLabel}>Acc No:</Text><Text style={s.bankValue}>{bankDetails.accountNo}</Text></View>
          <View style={s.bankRow}><Text style={s.bankLabel}>IFSC:</Text><Text style={s.bankValue}>{bankDetails.ifsc}</Text></View>
          <View style={s.bankRow}><Text style={s.bankLabel}>Branch:</Text><Text style={s.bankValue}>{bankDetails.branch}</Text></View>
          <View style={s.bankRow}><Text style={s.bankLabel}>PAN:</Text><Text style={s.bankValue}>{bankDetails.pan}</Text></View>
        </View>

        <View style={s.footer}>
          <Text style={s.footerNote}>Kindly release the payment at the earliest.</Text>
          <Text style={s.signatory}>AUTHORISED SIGNATORY</Text>
        </View>

        <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
