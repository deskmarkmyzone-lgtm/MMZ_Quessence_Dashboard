import React from "react";
import { BrokerageInvoicePDF } from "./brokerage-invoice";
import { ExpensesBillPDF } from "./expenses-bill";
import { MaintenanceTrackerPDF } from "./maintenance-tracker";
import { RentalCreditReportPDF } from "./rental-credit-report";
import { FlatAnnexurePDF } from "./flat-annexure";
import { downloadPDF } from "./download";
import type { DocumentType } from "@/types";

interface DocumentData {
  document_type: DocumentType;
  document_number: string | null;
  owner_name: string;
  owner_email: string;
  community_name: string | null;
  period_label: string | null;
  subtotal: number | null;
  tds_amount: number | null;
  gst_amount: number | null;
  grand_total: number | null;
  line_items: any[];
  created_at: string;
  published_at: string | null;
}

interface BankDetails {
  name: string;
  bank: string;
  account: string;
  ifsc: string;
  branch: string;
  pan: string;
}

function mapBankDetails(bd: BankDetails) {
  return {
    name: bd.name,
    bank: bd.bank,
    accountNo: bd.account,
    ifsc: bd.ifsc,
    branch: bd.branch,
    pan: bd.pan,
  };
}

function getDocumentDate(doc: DocumentData): string {
  const raw = doc.published_at ?? doc.created_at;
  try {
    return new Date(raw).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return raw.split(",")[0] ?? raw;
  }
}

function buildBrokerageElement(doc: DocumentData, bankDetails: BankDetails) {
  const lineItems = doc.line_items.map((item: any, i: number) => ({
    slNo: i + 1,
    flatOwner: item.flat_owner ?? item.flatOwner ?? doc.owner_name,
    tenant: item.tenant ?? item.tenant_name ?? item.tenantName ?? "-",
    tower: item.tower ?? 0,
    flatNo: item.flat ?? item.flat_number ?? item.flatNo ?? "-",
    bhk: item.bhk ?? item.bhk_type ?? "-",
    areaSft: item.area_sft ?? item.areaSft ?? item.carpet_area_sft ?? 0,
    rentalStart: item.rental_start ?? item.rentalStart ?? item.lease_start ?? "-",
    flatRental: item.rent ?? item.monthly_rent ?? item.flatRental ?? item.flat_rental ?? 0,
    brokerage: item.brokerage ?? item.brokerage_amount ?? 0,
    tds: item.tds ?? item.tds_amount ?? 0,
    netAmount: item.net ?? item.net_amount ?? item.netAmount ?? 0,
  }));

  return (
    <BrokerageInvoicePDF
      invoiceNo={doc.document_number ?? "DRAFT"}
      date={getDocumentDate(doc)}
      ownerName={doc.owner_name}
      ownerAddress={doc.owner_email}
      communityName={doc.community_name ?? ""}
      lineItems={lineItems}
      grandTotalBrokerage={doc.subtotal ?? 0}
      grandTotalTDS={doc.tds_amount ?? 0}
      grandTotalNet={doc.grand_total ?? 0}
      bankDetails={mapBankDetails(bankDetails)}
    />
  );
}

function buildExpensesBillElement(doc: DocumentData, bankDetails: BankDetails) {
  const lineItems = doc.line_items.map((item: any, i: number) => ({
    slNo: i + 1,
    flatNo: item.flat_no ?? item.flat_number ?? item.flatNo ?? "-",
    bhk: item.bhk ?? item.bhk_type ?? "-",
    sft: item.sft ?? item.carpet_area_sft ?? item.areaSft ?? 0,
    deepCleaning: item.deep_cleaning ?? item.deepCleaning ?? 0,
    paintTouchUp: item.paint_touch_up ?? item.paintTouchUp ?? item.paint ?? 0,
    acs: item.acs ?? item.ac ?? item.ac_servicing ?? 0,
    geysers: item.geysers ?? item.geyser ?? item.geyser_servicing ?? 0,
    anyOther: item.any_other ?? item.anyOther ?? item.other ?? 0,
    remarks: item.remarks ?? item.description ?? "",
  }));

  const totals = lineItems.reduce(
    (acc: any, item: any) => ({
      deepCleaning: acc.deepCleaning + item.deepCleaning,
      paintTouchUp: acc.paintTouchUp + item.paintTouchUp,
      acs: acc.acs + item.acs,
      geysers: acc.geysers + item.geysers,
      anyOther: acc.anyOther + item.anyOther,
    }),
    { deepCleaning: 0, paintTouchUp: 0, acs: 0, geysers: 0, anyOther: 0 }
  );

  return (
    <ExpensesBillPDF
      date={getDocumentDate(doc)}
      ownerName={doc.owner_name}
      periodLabel={doc.period_label ?? ""}
      lineItems={lineItems}
      totals={totals}
      grandTotal={doc.grand_total ?? 0}
      bankDetails={mapBankDetails(bankDetails)}
    />
  );
}

function buildMaintenanceElement(doc: DocumentData) {
  const lineItems = doc.line_items.map((item: any, i: number) => ({
    slNo: i + 1,
    flatNo: item.flat_no ?? item.flat_number ?? item.flatNo ?? "-",
    bhk: item.bhk ?? item.bhk_type ?? "-",
    sft: item.sft ?? item.carpet_area_sft ?? 0,
    maintenance: item.maintenance ?? item.maintenance_amount ?? 0,
    q2: item.q2 ?? item.quarter_2 ?? 0,
    q3: item.q3 ?? item.quarter_3 ?? 0,
    previousPending: item.previous_pending ?? item.previousPending ?? 0,
    totalAmount: item.total_amount ?? item.totalAmount ?? item.total ?? 0,
  }));

  return (
    <MaintenanceTrackerPDF
      date={getDocumentDate(doc)}
      ownerName={doc.owner_name}
      lineItems={lineItems}
      grandTotal={doc.grand_total ?? 0}
    />
  );
}

function buildRentalCreditElement(doc: DocumentData) {
  const firstItem = doc.line_items[0];
  const lineItems = doc.line_items.map((item: any) => ({
    aorStartDate: item.aor_start_date ?? item.aorStartDate,
    rentReceivedDate: item.rent_received_date ?? item.rentReceivedDate ?? item.payment_date ?? "-",
    rent: item.rent ?? item.base_rent ?? 0,
    maintenance: item.maintenance ?? item.maintenance_amount ?? 0,
    incMaintRent: item.inc_maint_rent ?? item.incMaintRent ?? item.inclusive_rent ?? item.amount ?? 0,
    remarks: item.remarks ?? "",
    aorLastDate: item.aor_last_date ?? item.aorLastDate,
  }));

  const totalRent = lineItems.reduce((s: number, i: any) => s + (i.rent || 0), 0);
  const totalMaintenance = lineItems.reduce((s: number, i: any) => s + (i.maintenance || 0), 0);
  const totalInclusive = lineItems.reduce((s: number, i: any) => s + (i.incMaintRent || 0), 0);

  return (
    <RentalCreditReportPDF
      flatNo={firstItem?.flat_no ?? firstItem?.flat_number ?? "-"}
      ownerName={doc.owner_name}
      tenantName={firstItem?.tenant ?? firstItem?.tenant_name ?? "-"}
      bhk={firstItem?.bhk ?? firstItem?.bhk_type ?? "-"}
      aorStart={firstItem?.aor_start_date ?? firstItem?.lease_start ?? "-"}
      aorEnd={firstItem?.aor_last_date ?? firstItem?.lease_end ?? "-"}
      lineItems={lineItems}
      totalRent={totalRent}
      totalMaintenance={totalMaintenance}
      totalInclusive={totalInclusive}
    />
  );
}

function buildAnnexureElement(doc: DocumentData) {
  const firstItem = doc.line_items[0];
  const rooms = (firstItem?.rooms ?? doc.line_items.filter((i: any) => i.room_name || i.name)).map(
    (room: any) => ({
      name: room.room_name ?? room.name ?? "Room",
      items: (room.items ?? []).map((item: any) => ({
        description: item.description ?? "",
        quantity: item.quantity ?? 1,
        condition: item.condition ?? item.condition_move_out ?? item.condition_move_in,
      })),
    })
  );

  const deductions = (firstItem?.deductions ?? doc.line_items.filter((i: any) => i.deduction_description)).map(
    (d: any) => ({
      description: d.deduction_description ?? d.description ?? "",
      amount: d.amount ?? 0,
    })
  );

  const totalDeductions = deductions.reduce((s: number, d: any) => s + d.amount, 0);

  return (
    <FlatAnnexurePDF
      flatNo={firstItem?.flat_no ?? firstItem?.flat_number ?? "-"}
      ownerName={doc.owner_name}
      tenantName={firstItem?.tenant ?? firstItem?.tenant_name ?? "-"}
      moveOutDate={firstItem?.move_out_date ?? getDocumentDate(doc)}
      rooms={rooms}
      securityDeposit={firstItem?.security_deposit ?? 0}
      deductions={deductions}
      totalDeductions={totalDeductions}
      refundAmount={(firstItem?.security_deposit ?? 0) - totalDeductions}
      tenantBankDetails={firstItem?.tenant_bank_details}
    />
  );
}

export async function downloadDocumentPDF(
  doc: DocumentData,
  bankDetails: BankDetails | null
) {
  const defaultBank: BankDetails = {
    name: "-",
    bank: "-",
    account: "-",
    ifsc: "-",
    branch: "-",
    pan: "-",
  };
  const bd = bankDetails ?? defaultBank;

  let element: React.ReactElement;

  switch (doc.document_type) {
    case "brokerage_invoice":
      element = buildBrokerageElement(doc, bd);
      break;
    case "expenses_bill":
      element = buildExpensesBillElement(doc, bd);
      break;
    case "maintenance_tracker":
      element = buildMaintenanceElement(doc);
      break;
    case "rental_credit_report":
      element = buildRentalCreditElement(doc);
      break;
    case "flat_annexure":
      element = buildAnnexureElement(doc);
      break;
    default:
      throw new Error(`Unknown document type: ${doc.document_type}`);
  }

  const filename = `${doc.document_number ?? doc.document_type}_${doc.owner_name.replace(/\s+/g, "_")}`;
  await downloadPDF(element, filename);
}
