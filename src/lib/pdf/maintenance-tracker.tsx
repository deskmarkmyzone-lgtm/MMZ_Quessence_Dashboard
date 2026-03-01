import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles as s, formatINR } from "./shared-styles";

export interface MaintenanceLineItem {
  slNo: number;
  flatNo: string;
  bhk: string;
  sft: number;
  maintenance: number;
  q2: number;
  q3: number;
  previousPending: number;
  totalAmount: number;
}

interface MaintenanceTrackerProps {
  date: string;
  ownerName: string;
  lineItems: MaintenanceLineItem[];
  grandTotal: number;
}

export function MaintenanceTrackerPDF({
  date,
  ownerName,
  lineItems,
  grandTotal,
}: MaintenanceTrackerProps) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.companyName}>MARK MY ZONE</Text>
          <Text style={s.documentTitle}>
            {ownerName} RENTAL FLATS MAINTENANCE
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
            <Text style={[s.tableHeaderCell, { width: 25 }]}>S.No</Text>
            <Text style={[s.tableHeaderCell, { width: 45 }]}>Flat No</Text>
            <Text style={[s.tableHeaderCell, { width: 35 }]}>BHK</Text>
            <Text style={[s.tableHeaderCell, { width: 40 }]}>SFT</Text>
            <Text style={[s.tableHeaderCell, { width: 70, textAlign: "right" }]}>Maintenance</Text>
            <Text style={[s.tableHeaderCell, { width: 65, textAlign: "right" }]}>Q2</Text>
            <Text style={[s.tableHeaderCell, { width: 65, textAlign: "right" }]}>Q3</Text>
            <Text style={[s.tableHeaderCell, { width: 70, textAlign: "right" }]}>Prev Pending</Text>
            <Text style={[s.tableHeaderCell, { width: 75, textAlign: "right" }]}>Total Amt</Text>
          </View>

          {lineItems.map((item, idx) => (
            <View key={idx} style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}>
              <Text style={[s.tableCell, { width: 25 }]}>{item.slNo}</Text>
              <Text style={[s.tableCellBold, { width: 45 }]}>{item.flatNo}</Text>
              <Text style={[s.tableCell, { width: 35 }]}>{item.bhk}</Text>
              <Text style={[s.tableCell, { width: 40 }]}>{item.sft}</Text>
              <Text style={[s.tableCellRight, { width: 70 }]}>{formatINR(item.maintenance)}</Text>
              <Text style={[s.tableCellRight, { width: 65 }]}>{formatINR(item.q2)}</Text>
              <Text style={[s.tableCellRight, { width: 65 }]}>{formatINR(item.q3)}</Text>
              <Text style={[s.tableCellRight, { width: 70 }]}>{item.previousPending ? formatINR(item.previousPending) : "-"}</Text>
              <Text style={[s.tableCellRight, { width: 75 }]}>{formatINR(item.totalAmount)}</Text>
            </View>
          ))}

          <View style={s.totalsRow}>
            <Text style={[s.totalLabel, { flex: 1 }]}>GRAND TOTAL</Text>
            <Text style={[s.totalValue, { width: 75 }]}>{formatINR(grandTotal)}</Text>
          </View>
        </View>

        <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
