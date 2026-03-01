"use client";

import { createElement, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileText, Eye, Loader2, Search, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { DocumentType } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { downloadPDF } from "@/lib/pdf/download";
import { usePersistedView } from "@/lib/hooks/use-persisted-view";
import {
  BrokerageInvoicePDF,
  ExpensesBillPDF,
  MaintenanceTrackerPDF,
  RentalCreditReportPDF,
  FlatAnnexurePDF,
} from "@/lib/pdf";

interface StatementItem {
  id: string;
  document_type: DocumentType;
  document_number: string;
  period_label: string;
  grand_total: number;
  published_at: string;
}

interface StatementsContentProps {
  statements: StatementItem[];
}

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  brokerage_invoice: "Brokerage Invoice",
  expenses_bill: "Expenses Bill",
  maintenance_tracker: "Maintenance Tracker",
  rental_credit_report: "Rental Credit Report",
  flat_annexure: "Flat Annexure",
};

export function StatementsContent({ statements }: StatementsContentProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = usePersistedView("owner-statements", "card");
  const [search, setSearch] = useState("");

  const filtered = statements.filter((doc) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      doc.document_number.toLowerCase().includes(q) ||
      doc.period_label.toLowerCase().includes(q) ||
      (DOC_TYPE_LABELS[doc.document_type] ?? "").toLowerCase().includes(q)
    );
  });

  const handleDownloadPDF = async (docSummary: StatementItem) => {
    setDownloadingId(docSummary.id);
    try {
      const supabase = createClient();
      const { data: docData, error } = await supabase
        .from("documents")
        .select(
          "id, document_type, document_number, period_label, subtotal, tds_amount, grand_total, published_at, line_items, bank_details, community:communities(name)"
        )
        .eq("id", docSummary.id)
        .single();

      if (error || !docData) {
        toast.error("Failed to fetch document data.");
        setDownloadingId(null);
        return;
      }

      const rawLineItems = Array.isArray(docData.line_items)
        ? docData.line_items
        : [];
      const lineItems = rawLineItems.map((item: any) => ({
        flat: item.flat ?? item.flat_number ?? "-",
        tenant: item.tenant ?? item.tenant_name ?? "-",
        bhk: item.bhk ?? item.bhk_type ?? "-",
        sqft: item.sqft ?? item.carpet_area_sft ?? 0,
        rent: item.rent ?? item.inclusive_rent ?? 0,
        brokerage: item.brokerage ?? item.amount ?? 0,
        tds: item.tds ?? item.tds_amount ?? 0,
        net: item.net ?? item.net_amount ?? 0,
      }));

      const bankRaw = docData.bank_details as any;
      const bankDetailsForPDF =
        bankRaw && typeof bankRaw === "object" && bankRaw.name
          ? {
              name: bankRaw.name ?? "",
              bank: bankRaw.bank ?? "",
              accountNo: bankRaw.account ?? "",
              ifsc: bankRaw.ifsc ?? "",
              branch: bankRaw.branch ?? "",
              pan: bankRaw.pan ?? "",
            }
          : {
              name: "",
              bank: "",
              accountNo: "",
              ifsc: "",
              branch: "",
              pan: "",
            };

      const community = (docData as any).community?.name ?? "-";
      const periodLabel = docData.period_label ?? "-";
      const publishedAt = docData.published_at
        ? new Date(docData.published_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "-";
      const documentNumber = docData.document_number ?? "-";
      const filename = `${documentNumber}_${periodLabel}`.replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );

      let pdfElement: React.ReactElement | null = null;

      switch (docData.document_type) {
        case "brokerage_invoice":
          pdfElement = createElement(BrokerageInvoicePDF, {
            invoiceNo: documentNumber,
            date: publishedAt,
            ownerName: "",
            ownerAddress: "",
            communityName: community,
            lineItems: lineItems.map((item: any, idx: number) => ({
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
            grandTotalBrokerage: docData.subtotal ?? 0,
            grandTotalTDS: docData.tds_amount ?? 0,
            grandTotalNet: docData.grand_total ?? 0,
            bankDetails: bankDetailsForPDF,
          });
          break;

        case "expenses_bill":
          pdfElement = createElement(ExpensesBillPDF, {
            date: publishedAt,
            ownerName: "",
            periodLabel,
            lineItems: lineItems.map((item: any, idx: number) => ({
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
              anyOther: lineItems.reduce(
                (s: number, i: any) => s + i.brokerage,
                0
              ),
            },
            grandTotal: docData.grand_total ?? 0,
            bankDetails: bankDetailsForPDF,
          });
          break;

        case "maintenance_tracker":
          pdfElement = createElement(MaintenanceTrackerPDF, {
            date: publishedAt,
            ownerName: "",
            lineItems: lineItems.map((item: any, idx: number) => ({
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
            grandTotal: docData.grand_total ?? 0,
          });
          break;

        case "rental_credit_report":
          pdfElement = createElement(RentalCreditReportPDF, {
            flatNo: lineItems[0]?.flat ?? "-",
            ownerName: "",
            tenantName: lineItems[0]?.tenant ?? "-",
            bhk: lineItems[0]?.bhk ?? "-",
            aorStart: "",
            aorEnd: "",
            lineItems: lineItems.map((item: any) => ({
              rentReceivedDate: "",
              rent: item.rent,
              maintenance: item.brokerage,
              incMaintRent: item.net,
              remarks: "",
            })),
            totalRent: lineItems.reduce((s: number, i: any) => s + i.rent, 0),
            totalMaintenance: lineItems.reduce(
              (s: number, i: any) => s + i.brokerage,
              0
            ),
            totalInclusive: docData.grand_total ?? 0,
          });
          break;

        case "flat_annexure":
          pdfElement = createElement(FlatAnnexurePDF, {
            flatNo: lineItems[0]?.flat ?? "-",
            ownerName: "",
            tenantName: lineItems[0]?.tenant ?? "-",
            moveOutDate: publishedAt,
            rooms: [],
            securityDeposit: 0,
            deductions: [],
            totalDeductions: 0,
            refundAmount: docData.grand_total ?? 0,
          });
          break;

        default:
          toast.error("PDF template not available for this document type.");
          setDownloadingId(null);
          return;
      }

      await downloadPDF(pdfElement, filename);
      toast.success("PDF downloaded successfully.");
    } catch (err) {
      console.error("PDF download failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-h2 text-text-primary">Statements & Invoices</h2>
        <p className="text-body text-text-secondary mt-1">
          {statements.length} published documents
        </p>
      </div>

      {/* Search + View Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search statements..."
            className="pl-9 bg-bg-card border-border-primary"
          />
        </div>
        <div className="flex items-center gap-1 bg-bg-card border border-border-primary rounded-md p-0.5 ml-auto">
          <button
            type="button"
            className={`h-7 w-7 inline-flex items-center justify-center rounded transition-colors ${
              viewMode === "card"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
            }`}
            onClick={() => setViewMode("card")}
            aria-label="Card view"
            aria-pressed={viewMode === "card"}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className={`h-7 w-7 inline-flex items-center justify-center rounded transition-colors ${
              viewMode === "list"
                ? "bg-accent text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
            }`}
            onClick={() => setViewMode("list")}
            aria-label="List view"
            aria-pressed={viewMode === "list"}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {search && (
        <p className="text-caption text-text-muted">
          Showing {filtered.length} of {statements.length} statements
        </p>
      )}

      {/* Card View */}
      {viewMode === "card" ? (
        <div className="space-y-3">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="bg-bg-card border border-border-primary rounded-lg p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-body-sm text-text-primary font-mono font-semibold">
                        {doc.document_number}
                      </span>
                      <span className="text-caption bg-bg-elevated px-2 py-0.5 rounded text-text-primary">
                        {DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                      </span>
                    </div>
                    <p className="text-caption text-text-secondary mt-1">
                      {doc.period_label} · Published {doc.published_at}
                    </p>
                    <p className="text-body-sm text-accent font-medium mt-1">
                      ₹{doc.grand_total.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/owner/statements/${doc.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border-primary text-text-secondary"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-accent text-accent hover:bg-accent/10"
                    onClick={() => handleDownloadPDF(doc)}
                    disabled={downloadingId === doc.id}
                  >
                    {downloadingId === doc.id ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-1" />
                    )}
                    {downloadingId === doc.id ? "..." : "PDF"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List/Table View */
        <div className="bg-bg-card border border-border-primary rounded-lg overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border-primary">
                <th className="text-left text-caption text-text-muted font-medium px-4 py-3">
                  Document
                </th>
                <th className="text-left text-caption text-text-muted font-medium px-4 py-3">
                  Type
                </th>
                <th className="text-left text-caption text-text-muted font-medium px-4 py-3">
                  Period
                </th>
                <th className="text-right text-caption text-text-muted font-medium px-4 py-3">
                  Amount
                </th>
                <th className="text-left text-caption text-text-muted font-medium px-4 py-3">
                  Published
                </th>
                <th className="text-right text-caption text-text-muted font-medium px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-border-primary last:border-0 hover:bg-bg-hover transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-body-sm text-text-primary font-mono font-semibold">
                      {doc.document_number}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-caption bg-bg-elevated px-2 py-0.5 rounded text-text-primary">
                      {DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-body-sm text-text-secondary">
                    {doc.period_label}
                  </td>
                  <td className="px-4 py-3 text-right text-body-sm text-accent font-medium">
                    ₹{doc.grand_total.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-body-sm text-text-muted">
                    {doc.published_at}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={`/owner/statements/${doc.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-text-secondary"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-accent"
                        onClick={() => handleDownloadPDF(doc)}
                        disabled={downloadingId === doc.id}
                      >
                        {downloadingId === doc.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-bg-card border border-border-primary rounded-lg">
          <FileText className="h-8 w-8 text-text-muted mx-auto mb-2" />
          <p className="text-body-sm text-text-secondary">
            {search ? "No statements match your search" : "No published statements yet"}
          </p>
        </div>
      )}
    </div>
  );
}
