import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles as s, formatINR } from "./shared-styles";

export interface RentalCreditLineItem {
  aorStartDate?: string;
  rentReceivedDate: string;
  rent: number;
  maintenance: number;
  incMaintRent: number;
  remarks: string;
  aorLastDate?: string;
}

interface RentalCreditReportProps {
  flatNo: string;
  ownerName: string;
  tenantName: string;
  bhk: string;
  aorStart: string;
  aorEnd: string;
  lineItems: RentalCreditLineItem[];
  totalRent: number;
  totalMaintenance: number;
  totalInclusive: number;
}

export function RentalCreditReportPDF({
  flatNo,
  ownerName,
  tenantName,
  bhk,
  aorStart,
  aorEnd,
  lineItems,
  totalRent,
  totalMaintenance,
  totalInclusive,
}: RentalCreditReportProps) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.companyName}>MARK MY ZONE</Text>
          <Text style={s.documentTitle}>RENTAL CREDIT REPORT</Text>
        </View>

        {/* Flat Info */}
        <View style={{ marginBottom: 16, padding: 10, backgroundColor: "#F9FAFB", borderRadius: 4 }}>
          <View style={{ flexDirection: "row", marginBottom: 4 }}>
            <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", marginRight: 8 }}>FLAT NO - {flatNo}</Text>
            <Text style={{ fontSize: 10, color: "#6B7280" }}>({bhk} BHK)</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 20 }}>
            <View>
              <Text style={s.headerLabel}>Owner</Text>
              <Text style={{ fontSize: 10 }}>{ownerName}</Text>
            </View>
            <View>
              <Text style={s.headerLabel}>Tenant</Text>
              <Text style={{ fontSize: 10 }}>{tenantName}</Text>
            </View>
            <View>
              <Text style={s.headerLabel}>AOR Period</Text>
              <Text style={{ fontSize: 10 }}>{aorStart} to {aorEnd}</Text>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: 70 }]}>AOR Start</Text>
            <Text style={[s.tableHeaderCell, { width: 70 }]}>Received Date</Text>
            <Text style={[s.tableHeaderCell, { width: 65, textAlign: "right" }]}>Rent</Text>
            <Text style={[s.tableHeaderCell, { width: 65, textAlign: "right" }]}>Maintenance</Text>
            <Text style={[s.tableHeaderCell, { width: 75, textAlign: "right" }]}>Inc Maint Rent</Text>
            <Text style={[s.tableHeaderCell, { width: 90 }]}>Remarks</Text>
            <Text style={[s.tableHeaderCell, { width: 70 }]}>AOR Last</Text>
          </View>

          {lineItems.map((item, idx) => (
            <View key={idx} style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}>
              <Text style={[s.tableCell, { width: 70 }]}>{item.aorStartDate ?? ""}</Text>
              <Text style={[s.tableCell, { width: 70 }]}>{item.rentReceivedDate}</Text>
              <Text style={[s.tableCellRight, { width: 65 }]}>{item.rent ? formatINR(item.rent) : ""}</Text>
              <Text style={[s.tableCellRight, { width: 65 }]}>{item.maintenance ? formatINR(item.maintenance) : ""}</Text>
              <Text style={[s.tableCellRight, { width: 75 }]}>{item.incMaintRent ? formatINR(item.incMaintRent) : ""}</Text>
              <Text style={[s.tableCell, { width: 90 }]}>{item.remarks}</Text>
              <Text style={[s.tableCell, { width: 70 }]}>{item.aorLastDate ?? ""}</Text>
            </View>
          ))}

          {/* Totals */}
          <View style={s.totalsRow}>
            <Text style={[s.totalLabel, { width: 140 }]}>TOTAL</Text>
            <Text style={[s.totalValue, { width: 65 }]}>{formatINR(totalRent)}</Text>
            <Text style={[s.totalValue, { width: 65 }]}>{formatINR(totalMaintenance)}</Text>
            <Text style={[s.totalValue, { width: 75 }]}>{formatINR(totalInclusive)}</Text>
            <Text style={{ width: 160 }} />
          </View>
        </View>

        <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
