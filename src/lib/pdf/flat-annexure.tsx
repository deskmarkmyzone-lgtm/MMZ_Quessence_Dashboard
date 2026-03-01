import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles as s, formatINR } from "./shared-styles";

export interface AnnexureRoom {
  name: string;
  items: {
    description: string;
    quantity: number;
    condition?: string;
  }[];
}

export interface AnnexureDeduction {
  description: string;
  amount: number;
}

interface FlatAnnexureProps {
  flatNo: string;
  ownerName: string;
  tenantName: string;
  moveOutDate: string;
  rooms: AnnexureRoom[];
  securityDeposit: number;
  deductions: AnnexureDeduction[];
  totalDeductions: number;
  refundAmount: number;
  tenantBankDetails?: {
    name: string;
    bank: string;
    accountNo: string;
    ifsc: string;
  };
}

export function FlatAnnexurePDF({
  flatNo,
  ownerName,
  tenantName,
  moveOutDate,
  rooms,
  securityDeposit,
  deductions,
  totalDeductions,
  refundAmount,
  tenantBankDetails,
}: FlatAnnexureProps) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.companyName}>MARK MY ZONE</Text>
          <Text style={s.documentTitle}>PRESTIGE HIGH FIELDS FLAT - ANNEXURE</Text>
        </View>

        {/* Flat Info */}
        <View style={{ marginBottom: 16, padding: 10, backgroundColor: "#F9FAFB", borderRadius: 4 }}>
          <View style={{ flexDirection: "row", gap: 30, marginBottom: 4 }}>
            <View>
              <Text style={s.headerLabel}>Flat Owner</Text>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>{ownerName}</Text>
            </View>
            <View>
              <Text style={s.headerLabel}>Flat Number</Text>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>{flatNo}</Text>
            </View>
            <View>
              <Text style={s.headerLabel}>Move-Out</Text>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>{moveOutDate}</Text>
            </View>
          </View>
          <View>
            <Text style={s.headerLabel}>Tenant</Text>
            <Text style={{ fontSize: 10 }}>{tenantName}</Text>
          </View>
        </View>

        {/* Rooms */}
        {rooms.map((room, roomIdx) => (
          <View key={roomIdx} style={{ marginBottom: 12 }}>
            <Text style={s.sectionTitle}>
              {toRoman(roomIdx + 1)}). {room.name}
            </Text>
            <View style={s.table}>
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderCell, { width: 25 }]}>S.No</Text>
                <Text style={[s.tableHeaderCell, { flex: 1 }]}>Description of Fixtures and Fittings</Text>
                <Text style={[s.tableHeaderCell, { width: 55, textAlign: "right" }]}>Quantity</Text>
                {rooms[0].items[0]?.condition !== undefined && (
                  <Text style={[s.tableHeaderCell, { width: 70 }]}>Condition</Text>
                )}
              </View>
              {room.items.map((item, itemIdx) => (
                <View key={itemIdx} style={[s.tableRow, itemIdx % 2 === 1 ? s.tableRowAlt : {}]}>
                  <Text style={[s.tableCell, { width: 25 }]}>{itemIdx + 1}</Text>
                  <Text style={[s.tableCell, { flex: 1 }]}>{item.description}</Text>
                  <Text style={[s.tableCellRight, { width: 55 }]}>{item.quantity}</Text>
                  {item.condition !== undefined && (
                    <Text style={[s.tableCell, { width: 70 }]}>{item.condition}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Deposit Calculation */}
        <View style={{ marginTop: 16 }}>
          <Text style={s.sectionTitle}>DEPOSIT CALCULATION</Text>
          <View style={{ backgroundColor: "#F9FAFB", padding: 12, borderRadius: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontSize: 10 }}>Security Deposit:</Text>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>{formatINR(securityDeposit)}</Text>
            </View>

            {deductions.map((d, idx) => (
              <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                <Text style={{ fontSize: 9, color: "#6B7280" }}>  - {d.description}:</Text>
                <Text style={{ fontSize: 9, color: "#EF4444" }}>-{formatINR(d.amount)}</Text>
              </View>
            ))}

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4, marginBottom: 4 }}>
              <Text style={{ fontSize: 9, color: "#6B7280" }}>Total Deductions:</Text>
              <Text style={{ fontSize: 9, color: "#EF4444", fontFamily: "Helvetica-Bold" }}>-{formatINR(totalDeductions)}</Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1.5, borderTopColor: "#1A1A2E", paddingTop: 6, marginTop: 4 }}>
              <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold" }}>TOTAL REFUND AMOUNT:</Text>
              <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#22C55E" }}>{formatINR(refundAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Tenant Bank Details */}
        {tenantBankDetails && (
          <View style={[s.bankDetails, { marginTop: 16 }]}>
            <Text style={s.bankTitle}>TENANT BANK DETAILS (for refund)</Text>
            <View style={s.bankRow}><Text style={s.bankLabel}>Name:</Text><Text style={s.bankValue}>{tenantBankDetails.name}</Text></View>
            <View style={s.bankRow}><Text style={s.bankLabel}>Bank:</Text><Text style={s.bankValue}>{tenantBankDetails.bank}</Text></View>
            <View style={s.bankRow}><Text style={s.bankLabel}>A/C:</Text><Text style={s.bankValue}>{tenantBankDetails.accountNo}</Text></View>
            <View style={s.bankRow}><Text style={s.bankLabel}>IFSC:</Text><Text style={s.bankValue}>{tenantBankDetails.ifsc}</Text></View>
          </View>
        )}

        <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}

function toRoman(num: number): string {
  const map: [number, string][] = [
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let result = "";
  let remaining = num;
  for (const [value, symbol] of map) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }
  return result;
}
