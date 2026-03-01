"use client";

import { createElement, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Download,
  Share2,
  FileText,
  Calendar,
  IndianRupee,
  Building2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { DocumentType } from "@/types";
import { downloadPDF } from "@/lib/pdf/download";
import {
  BrokerageInvoicePDF,
  ExpensesBillPDF,
  MaintenanceTrackerPDF,
  RentalCreditReportPDF,
  FlatAnnexurePDF,
} from "@/lib/pdf";

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  brokerage_invoice: "Brokerage Invoice",
  expenses_bill: "Expenses Bill",
  maintenance_tracker: "Maintenance Tracker",
  rental_credit_report: "Rental Credit Report",
  flat_annexure: "Flat Annexure",
};

interface LineItem {
  flat: string;
  tenant: string;
  bhk: string;
  sqft: number;
  rent: number;
  brokerage: number;
  tds: number;
  net: number;
}

interface StatementDetail {
  id: string;
  document_type: DocumentType;
  document_number: string;
  period_label: string;
  community: string;
  subtotal: number;
  tds_amount: number;
  grand_total: number;
  published_at: string;
  line_items: LineItem[];
  bank_details: {
    name: string;
    bank: string;
    account: string;
    ifsc: string;
    branch: string;
    pan: string;
  } | null;
}

interface StatementDetailContentProps {
  doc: StatementDetail | null;
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
      <div>
        <p className="text-caption text-text-muted">{label}</p>
        <p className="text-body-sm text-text-primary">{value}</p>
      </div>
    </div>
  );
}

export function StatementDetailContent({ doc }: StatementDetailContentProps) {
  const [downloading, setDownloading] = useState(false);

  if (!doc) {
    return (
      <div className="space-y-4">
        <Link
          href="/owner/statements"
          className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Statements
        </Link>
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-text-muted mx-auto mb-3" />
          <h2 className="text-h3 text-text-primary mb-1">
            Statement not found
          </h2>
          <p className="text-body text-text-muted">
            This document may not exist or is no longer available.
          </p>
        </div>
      </div>
    );
  }

  const isBrokerage = doc.document_type === "brokerage_invoice";
  const isMaintenance = doc.document_type === "maintenance_tracker";
  const isExpenses = doc.document_type === "expenses_bill";

  const handleDownloadPDF = async () => {
    if (!doc) return;
    setDownloading(true);
    try {
      let pdfElement: React.ReactElement | null = null;
      const filename = `${doc.document_number}_${doc.period_label}`.replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );

      const bankDetailsForPDF = doc.bank_details
        ? {
            name: doc.bank_details.name,
            bank: doc.bank_details.bank,
            accountNo: doc.bank_details.account,
            ifsc: doc.bank_details.ifsc,
            branch: doc.bank_details.branch,
            pan: doc.bank_details.pan,
          }
        : {
            name: "",
            bank: "",
            accountNo: "",
            ifsc: "",
            branch: "",
            pan: "",
          };

      switch (doc.document_type) {
        case "brokerage_invoice":
          pdfElement = createElement(BrokerageInvoicePDF, {
            invoiceNo: doc.document_number,
            date: doc.published_at,
            ownerName: "",
            ownerAddress: "",
            communityName: doc.community,
            lineItems: doc.line_items.map((item, idx) => ({
              slNo: idx + 1,
              flatOwner: "",
              tenant: item.tenant,
              tower: 0,
              flatNo: item.flat,
              bhk: item.bhk,
              areaSft: item.sqft,
              rentalStart: "",
              flatRental: item.rent,
              brokerage: item.brokerage,
              tds: item.tds,
              netAmount: item.net,
            })),
            grandTotalBrokerage: doc.subtotal,
            grandTotalTDS: doc.tds_amount,
            grandTotalNet: doc.grand_total,
            bankDetails: bankDetailsForPDF,
          });
          break;

        case "expenses_bill":
          pdfElement = createElement(ExpensesBillPDF, {
            date: doc.published_at,
            ownerName: "",
            periodLabel: doc.period_label,
            lineItems: doc.line_items.map((item, idx) => ({
              slNo: idx + 1,
              flatNo: item.flat,
              bhk: item.bhk,
              sft: item.sqft,
              deepCleaning: 0,
              paintTouchUp: 0,
              acs: 0,
              geysers: 0,
              anyOther: item.brokerage,
              remarks: "",
            })),
            totals: {
              deepCleaning: 0,
              paintTouchUp: 0,
              acs: 0,
              geysers: 0,
              anyOther: doc.line_items.reduce((s, i) => s + i.brokerage, 0),
            },
            grandTotal: doc.grand_total,
            bankDetails: bankDetailsForPDF,
          });
          break;

        case "maintenance_tracker":
          pdfElement = createElement(MaintenanceTrackerPDF, {
            date: doc.published_at,
            ownerName: "",
            lineItems: doc.line_items.map((item, idx) => ({
              slNo: idx + 1,
              flatNo: item.flat,
              bhk: item.bhk,
              sft: item.sqft,
              maintenance: item.brokerage,
              q2: 0,
              q3: 0,
              previousPending: 0,
              totalAmount: item.net,
            })),
            grandTotal: doc.grand_total,
          });
          break;

        case "rental_credit_report":
          pdfElement = createElement(RentalCreditReportPDF, {
            flatNo: doc.line_items[0]?.flat ?? "-",
            ownerName: "",
            tenantName: doc.line_items[0]?.tenant ?? "-",
            bhk: doc.line_items[0]?.bhk ?? "-",
            aorStart: "",
            aorEnd: "",
            lineItems: doc.line_items.map((item) => ({
              rentReceivedDate: "",
              rent: item.rent,
              maintenance: item.brokerage,
              incMaintRent: item.net,
              remarks: "",
            })),
            totalRent: doc.line_items.reduce((s, i) => s + i.rent, 0),
            totalMaintenance: doc.line_items.reduce(
              (s, i) => s + i.brokerage,
              0
            ),
            totalInclusive: doc.grand_total,
          });
          break;

        case "flat_annexure":
          pdfElement = createElement(FlatAnnexurePDF, {
            flatNo: doc.line_items[0]?.flat ?? "-",
            ownerName: "",
            tenantName: doc.line_items[0]?.tenant ?? "-",
            moveOutDate: doc.published_at,
            rooms: [],
            securityDeposit: 0,
            deductions: [],
            totalDeductions: 0,
            refundAmount: doc.grand_total,
          });
          break;

        default:
          toast.error("PDF template not available for this document type.");
          setDownloading(false);
          return;
      }

      await downloadPDF(pdfElement, filename);
      toast.success("PDF downloaded successfully.");
    } catch (err) {
      console.error("PDF download failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/owner/statements"
          className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Statements
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-border-primary gap-1.5"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button
            size="sm"
            className="bg-accent hover:bg-accent/90 text-white gap-1.5"
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {downloading ? "Generating..." : "Download PDF"}
            </span>
          </Button>
        </div>
      </div>

      {/* Document header */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-caption bg-accent/10 text-accent px-2.5 py-0.5 rounded-full font-medium">
                {DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type}
              </span>
              <span className="text-caption bg-success/10 text-success px-2.5 py-0.5 rounded-full font-medium">
                Published
              </span>
            </div>
            <h2 className="text-h2 text-text-primary font-mono">
              {doc.document_number}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-caption text-text-muted">Grand Total</p>
            <p className="text-h2 text-accent font-bold">
              ₹{doc.grand_total.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-border-primary">
          <DetailItem icon={Building2} label="Community" value={doc.community} />
          <DetailItem icon={Calendar} label="Period" value={doc.period_label} />
          <DetailItem
            icon={Calendar}
            label="Published"
            value={doc.published_at}
          />
          <DetailItem
            icon={IndianRupee}
            label="Document #"
            value={doc.document_number}
          />
        </div>

        {/* Line items table */}
        <div className="mt-6">
          <h3 className="text-body text-text-primary font-semibold mb-4">
            Line Items
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-primary">
                  <th className="text-left text-caption text-text-muted font-medium px-3 py-2">
                    Flat
                  </th>
                  {!isExpenses && (
                    <th className="text-left text-caption text-text-muted font-medium px-3 py-2">
                      Tenant
                    </th>
                  )}
                  <th className="text-left text-caption text-text-muted font-medium px-3 py-2">
                    BHK
                  </th>
                  <th className="text-right text-caption text-text-muted font-medium px-3 py-2">
                    SFT
                  </th>
                  {isBrokerage && (
                    <th className="text-right text-caption text-text-muted font-medium px-3 py-2">
                      Rent
                    </th>
                  )}
                  <th className="text-right text-caption text-text-muted font-medium px-3 py-2">
                    {isBrokerage
                      ? "Brokerage"
                      : isMaintenance
                        ? "Maintenance"
                        : "Amount"}
                  </th>
                  {isBrokerage && (
                    <th className="text-right text-caption text-text-muted font-medium px-3 py-2">
                      TDS (2%)
                    </th>
                  )}
                  <th className="text-right text-caption text-text-muted font-medium px-3 py-2">
                    {isBrokerage ? "Net" : "Total"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {doc.line_items.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border-primary last:border-0"
                  >
                    <td className="px-3 py-3">
                      <span className="text-body-sm text-text-primary font-mono font-semibold">
                        {item.flat}
                      </span>
                    </td>
                    {!isExpenses && (
                      <td className="px-3 py-3 text-body-sm text-text-primary">
                        {item.tenant}
                      </td>
                    )}
                    <td className="px-3 py-3 text-body-sm text-text-secondary">
                      {item.bhk}
                    </td>
                    <td className="px-3 py-3 text-right text-body-sm text-text-secondary">
                      {item.sqft.toLocaleString("en-IN")}
                    </td>
                    {isBrokerage && (
                      <td className="px-3 py-3 text-right text-body-sm text-text-secondary">
                        ₹{item.rent.toLocaleString("en-IN")}
                      </td>
                    )}
                    <td className="px-3 py-3 text-right text-body-sm text-text-primary">
                      ₹{item.brokerage.toLocaleString("en-IN")}
                    </td>
                    {isBrokerage && (
                      <td className="px-3 py-3 text-right text-body-sm text-danger">
                        ₹{item.tds.toLocaleString("en-IN")}
                      </td>
                    )}
                    <td className="px-3 py-3 text-right text-body-sm text-text-primary font-medium">
                      ₹{item.net.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-bg-elevated">
                  <td
                    colSpan={
                      isBrokerage ? 4 : isExpenses ? 3 : 3
                    }
                    className="px-3 py-3 text-body-sm text-text-primary font-semibold text-right"
                  >
                    {isBrokerage ? "Grand Total" : "Total"}
                  </td>
                  {isBrokerage && (
                    <td className="px-3 py-3 text-right text-body-sm text-text-primary">
                      ₹{doc.subtotal.toLocaleString("en-IN")}
                    </td>
                  )}
                  <td className="px-3 py-3 text-right text-body-sm text-text-primary">
                    ₹
                    {doc.line_items
                      .reduce((s, i) => s + i.brokerage, 0)
                      .toLocaleString("en-IN")}
                  </td>
                  {isBrokerage && (
                    <td className="px-3 py-3 text-right text-body-sm text-danger font-medium">
                      ₹{doc.tds_amount.toLocaleString("en-IN")}
                    </td>
                  )}
                  <td className="px-3 py-3 text-right text-body-sm text-accent font-bold">
                    ₹{doc.grand_total.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Bank details */}
        {isBrokerage && doc.bank_details && (
          <div className="mt-6 pt-6 border-t border-border-primary">
            <h3 className="text-body text-text-primary font-semibold mb-3">
              Bank Details for Payment
            </h3>
            <div className="bg-bg-elevated rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-sm">
                <div>
                  <span className="text-text-muted">Name:</span>{" "}
                  <span className="text-text-primary">
                    {doc.bank_details.name}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">Bank:</span>{" "}
                  <span className="text-text-primary">
                    {doc.bank_details.bank}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">Account:</span>{" "}
                  <span className="text-text-primary font-mono">
                    {doc.bank_details.account}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">IFSC:</span>{" "}
                  <span className="text-text-primary font-mono">
                    {doc.bank_details.ifsc}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">Branch:</span>{" "}
                  <span className="text-text-primary">
                    {doc.bank_details.branch}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">PAN:</span>{" "}
                  <span className="text-text-primary font-mono">
                    {doc.bank_details.pan}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
