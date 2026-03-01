import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles as s, formatINR } from "./shared-styles";

export interface BrokerageLineItem {
  slNo: number;
  flatOwner: string;
  tenant: string;
  tower: number;
  flatNo: string;
  bhk: string;
  areaSft: number;
  rentalStart: string;
  flatRental: number;
  brokerage: number;
  tds: number;
  netAmount: number;
}

interface BrokerageInvoiceProps {
  invoiceNo: string;
  date: string;
  ownerName: string;
  ownerAddress: string;
  communityName: string;
  lineItems: BrokerageLineItem[];
  grandTotalBrokerage: number;
  grandTotalTDS: number;
  grandTotalNet: number;
  bankDetails: {
    name: string;
    bank: string;
    accountNo: string;
    ifsc: string;
    branch: string;
    pan: string;
  };
}

export function BrokerageInvoicePDF({
  invoiceNo,
  date,
  ownerName,
  ownerAddress,
  communityName,
  lineItems,
  grandTotalBrokerage,
  grandTotalTDS,
  grandTotalNet,
  bankDetails,
}: BrokerageInvoiceProps) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.companyName}>MARK MY ZONE</Text>
          <Text style={s.documentTitle}>RENTAL INVOICE</Text>
          <View style={s.headerRow}>
            <View>
              <Text style={s.headerLabel}>Invoice No</Text>
              <Text style={s.headerValue}>{invoiceNo}</Text>
            </View>
            <View>
              <Text style={s.headerLabel}>Date</Text>
              <Text style={s.headerValue}>{date}</Text>
            </View>
          </View>
        </View>

        {/* Recipient */}
        <View style={s.recipient}>
          <Text style={s.recipientLabel}>To,</Text>
          <Text style={s.recipientName}>{ownerName}</Text>
          {ownerAddress && <Text style={s.recipientAddress}>{ownerAddress}</Text>}
        </View>

        <Text style={s.subject}>
          Dear Sir, {"\n"}Sub: {communityName} Rental Payment Invoice
        </Text>

        {/* Table */}
        <View style={s.table}>
          {/* Header */}
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: 25 }]}>Sl</Text>
            <Text style={[s.tableHeaderCell, { width: 70 }]}>Flat Owner</Text>
            <Text style={[s.tableHeaderCell, { width: 65 }]}>Tenant</Text>
            <Text style={[s.tableHeaderCell, { width: 25 }]}>T</Text>
            <Text style={[s.tableHeaderCell, { width: 35 }]}>Flat</Text>
            <Text style={[s.tableHeaderCell, { width: 28 }]}>BHK</Text>
            <Text style={[s.tableHeaderCell, { width: 35 }]}>SFT</Text>
            <Text style={[s.tableHeaderCell, { width: 55 }]}>Start</Text>
            <Text style={[s.tableHeaderCell, { width: 55, textAlign: "right" }]}>Rental</Text>
            <Text style={[s.tableHeaderCell, { width: 55, textAlign: "right" }]}>Brokerage</Text>
            <Text style={[s.tableHeaderCell, { width: 40, textAlign: "right" }]}>TDS 2%</Text>
            <Text style={[s.tableHeaderCell, { width: 55, textAlign: "right" }]}>Net Amt</Text>
          </View>

          {/* Rows */}
          {lineItems.map((item, idx) => (
            <View key={idx} style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}>
              <Text style={[s.tableCell, { width: 25 }]}>{item.slNo}</Text>
              <Text style={[s.tableCell, { width: 70 }]}>{item.flatOwner}</Text>
              <Text style={[s.tableCell, { width: 65 }]}>{item.tenant}</Text>
              <Text style={[s.tableCell, { width: 25 }]}>{item.tower}</Text>
              <Text style={[s.tableCell, { width: 35 }]}>{item.flatNo}</Text>
              <Text style={[s.tableCell, { width: 28 }]}>{item.bhk}</Text>
              <Text style={[s.tableCell, { width: 35 }]}>{item.areaSft}</Text>
              <Text style={[s.tableCell, { width: 55 }]}>{item.rentalStart}</Text>
              <Text style={[s.tableCellRight, { width: 55 }]}>{formatINR(item.flatRental)}</Text>
              <Text style={[s.tableCellRight, { width: 55 }]}>{formatINR(item.brokerage)}</Text>
              <Text style={[s.tableCellRight, { width: 40 }]}>{formatINR(item.tds)}</Text>
              <Text style={[s.tableCellRight, { width: 55 }]}>{formatINR(item.netAmount)}</Text>
            </View>
          ))}

          {/* Grand Total */}
          <View style={s.totalsRow}>
            <Text style={[s.totalLabel, { flex: 1 }]}>GRAND TOTAL</Text>
            <Text style={[s.totalValue, { width: 55 }]}>{formatINR(grandTotalBrokerage)}</Text>
            <Text style={[s.totalValue, { width: 40 }]}>{formatINR(grandTotalTDS)}</Text>
            <Text style={[s.totalValue, { width: 55 }]}>{formatINR(grandTotalNet)}</Text>
          </View>
        </View>

        {/* Bank Details */}
        <View style={s.bankDetails}>
          <Text style={s.bankTitle}>BANK DETAILS</Text>
          <View style={s.bankRow}>
            <Text style={s.bankLabel}>Name:</Text>
            <Text style={s.bankValue}>{bankDetails.name}</Text>
          </View>
          <View style={s.bankRow}>
            <Text style={s.bankLabel}>Bank:</Text>
            <Text style={s.bankValue}>{bankDetails.bank}</Text>
          </View>
          <View style={s.bankRow}>
            <Text style={s.bankLabel}>Acc No:</Text>
            <Text style={s.bankValue}>{bankDetails.accountNo}</Text>
          </View>
          <View style={s.bankRow}>
            <Text style={s.bankLabel}>IFSC:</Text>
            <Text style={s.bankValue}>{bankDetails.ifsc}</Text>
          </View>
          <View style={s.bankRow}>
            <Text style={s.bankLabel}>Branch:</Text>
            <Text style={s.bankValue}>{bankDetails.branch}</Text>
          </View>
          <View style={s.bankRow}>
            <Text style={s.bankLabel}>PAN:</Text>
            <Text style={s.bankValue}>{bankDetails.pan}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerNote}>Kindly release the payment at the earliest.</Text>
          <Text style={s.signatory}>AUTHORISED SIGNATORY</Text>
        </View>

        <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
