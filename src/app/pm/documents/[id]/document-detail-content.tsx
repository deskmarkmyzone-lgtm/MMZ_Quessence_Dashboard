"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Send,
  Download,
  Share2,
  Clock,
  User,
  FileText,
  Loader2,
  AlertCircle,
  IndianRupee,
  CalendarDays,
  CreditCard,
  Hash,
  MessageCircle,
  Undo2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  submitForApproval,
  approveDocument,
  rejectDocument,
  publishDocument,
  recordDocumentPayment,
  reactivateTenant,
} from "@/lib/actions";
import { exportToExcel } from "@/lib/excel/export";
import type { DocumentType, DocumentStatus } from "@/types";

// ===== Constants =====

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  brokerage_invoice: "Brokerage Invoice",
  expenses_bill: "Expenses Bill",
  maintenance_tracker: "Maintenance Tracker",
  rental_credit_report: "Rental Credit Report",
  flat_annexure: "Flat Annexure",
};

const DOC_STATUS_MAP: Record<
  DocumentStatus,
  "draft" | "pending" | "approved" | "published" | "rejected"
> = {
  draft: "draft",
  pending_approval: "pending",
  approved: "approved",
  published: "published",
  rejected: "rejected",
};

// ===== Types =====

interface DocumentDetailProps {
  document: {
    id: string;
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
    status: DocumentStatus;
    created_at: string;
    created_by_name: string | null;
    submitted_at: string | null;
    submitted_by_name: string | null;
    approved_at: string | null;
    approved_by_name: string | null;
    rejected_at: string | null;
    rejected_by_name: string | null;
    rejection_reason: string | null;
    published_at: string | null;
    published_by_name: string | null;
    payment_received: boolean;
    payment_received_amount: number | null;
    payment_received_date: string | null;
    payment_received_method: string | null;
    payment_received_reference: string | null;
    payment_received_by_name: string | null;
  };
  bankDetails: {
    name: string;
    bank: string;
    account: string;
    ifsc: string;
    branch: string;
    pan: string;
  } | null;
  auditHistory?: {
    id: string;
    action: string;
    description: string;
    actor_name: string;
    actor_role: string | null;
    changes: Record<string, any> | null;
    created_at: string;
  }[];
  /** For flat_annexure move-out docs: tenant ID to undo the exit */
  moveOutTenantId?: string | null;
  /** For flat_annexure move-out docs: flat number for display */
  moveOutFlatNumber?: string | null;
  /** Whether the current user can undo exits (admin/super_admin) */
  canUndoExit?: boolean;
}

// ===== Helpers =====

function formatCurrency(value: number | null): string {
  if (value == null) return "-";
  return `\u20B9${value.toLocaleString("en-IN")}`;
}

// ===== Component =====

export function DocumentDetailContent({ document: doc, bankDetails, auditHistory, moveOutTenantId, moveOutFlatNumber, canUndoExit }: DocumentDetailProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [exitUndone, setExitUndone] = useState(false);

  const handleSubmitForApproval = async () => {
    setLoadingAction("submit");
    try {
      const result = await submitForApproval(doc.id);
      if (result.success) {
        toast.success("Document submitted for approval");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to submit for approval");
      }
    } catch {
      toast.error("Failed to submit for approval");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleApprove = async () => {
    setLoadingAction("approve");
    try {
      const result = await approveDocument(doc.id);
      if (result.success) {
        toast.success("Document approved");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to approve document");
      }
    } catch {
      toast.error("Failed to approve document");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt("Please provide a reason for rejection:");
    if (!reason) return;

    setLoadingAction("reject");
    try {
      const result = await rejectDocument(doc.id, reason);
      if (result.success) {
        toast.success("Document rejected");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to reject document");
      }
    } catch {
      toast.error("Failed to reject document");
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePublish = async () => {
    setLoadingAction("publish");
    try {
      const result = await publishDocument(doc.id);
      if (result.success) {
        toast.success("Document published to owner");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to publish document");
      }
    } catch {
      toast.error("Failed to publish document");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUndoExit = async () => {
    if (!moveOutTenantId) return;
    setLoadingAction("undo");
    try {
      const result = await reactivateTenant(moveOutTenantId);
      if (result.success) {
        setExitUndone(true);
        toast.success(`Undo successful — Flat ${moveOutFlatNumber} is occupied again`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to undo tenant exit");
      }
    } catch {
      toast.error("Failed to undo tenant exit");
    } finally {
      setLoadingAction(null);
    }
  };

  const isLoading = loadingAction !== null;

  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(
    doc.grand_total?.toString() ?? ""
  );
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const handleRecordPayment = async () => {
    if (!paymentAmount || !paymentDate || !paymentMethod) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoadingAction("payment");
    try {
      const result = await recordDocumentPayment(doc.id, {
        amount: parseFloat(paymentAmount),
        date: paymentDate,
        method: paymentMethod,
        reference: paymentReference || undefined,
      });
      if (result.success) {
        toast.success("Payment recorded successfully");
        setPaymentDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to record payment");
      }
    } catch {
      toast.error("Failed to record payment");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDownloadPDF = async () => {
    setLoadingAction("pdf");
    try {
      const { downloadDocumentPDF } = await import("@/lib/pdf/document-pdf");
      await downloadDocumentPDF(doc, bankDetails);
      toast.success("PDF downloaded");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportExcel = () => {
    const keys = doc.line_items.length > 0
      ? Object.keys(doc.line_items[0]).filter((k) => !["id", "created_at", "updated_at"].includes(k))
      : [];

    const columns = keys.map((key) => ({
      key,
      label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      format: (v: unknown) => {
        if (typeof v === "number") return v;
        return String(v ?? "");
      },
    }));

    exportToExcel(doc.line_items, columns, {
      filename: `${doc.document_number ?? doc.document_type}_${doc.owner_name.replace(/\s+/g, "_")}`,
      sheetName: DOC_TYPE_LABELS[doc.document_type],
    });
    toast.success("Excel downloaded");
  };

  const PAYMENT_METHOD_LABELS: Record<string, string> = {
    bank_transfer: "Bank Transfer",
    cheque: "Cheque",
    upi: "UPI",
    cash: "Cash",
  };

  return (
    <div className="w-full">
      {/* Back + Header */}
      <div className="mb-6">
        <Link
          href="/pm/documents"
          className="inline-flex items-center gap-1.5 text-caption text-text-secondary hover:text-text-primary mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Documents
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-h2 text-text-primary font-bold">
                {doc.document_number ?? "Draft"}
              </h1>
              <StatusBadge status={DOC_STATUS_MAP[doc.status]} />
            </div>
            <p className="text-body-sm text-text-secondary">
              {DOC_TYPE_LABELS[doc.document_type]} &middot; {doc.owner_name}
              {doc.period_label ? ` \u00B7 ${doc.period_label}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Workflow actions based on status */}
            {doc.status === "draft" && (
              <Button
                className="gap-1.5 bg-accent text-white hover:bg-accent/90"
                onClick={handleSubmitForApproval}
                disabled={isLoading}
              >
                {loadingAction === "submit" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Submit for Approval
              </Button>
            )}
            {doc.status === "pending_approval" && (
              <>
                <Button
                  variant="outline"
                  className="gap-1.5 text-danger border-danger/30 hover:bg-danger/10"
                  onClick={handleReject}
                  disabled={isLoading}
                >
                  {loadingAction === "reject" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Reject
                </Button>
                <Button
                  className="gap-1.5 bg-success text-white hover:bg-success/90"
                  onClick={handleApprove}
                  disabled={isLoading}
                >
                  {loadingAction === "approve" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Approve
                </Button>
              </>
            )}
            {doc.status === "approved" && (
              <Button
                className="gap-1.5 bg-accent text-white hover:bg-accent/90"
                onClick={handlePublish}
                disabled={isLoading}
              >
                {loadingAction === "publish" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Publish to Owner
              </Button>
            )}
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={handleExportExcel}
              disabled={isLoading || doc.line_items.length === 0}
            >
              <FileText className="h-4 w-4" />
              Excel
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={handleDownloadPDF}
              disabled={isLoading}
            >
              {loadingAction === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              PDF
            </Button>
            <Button
              variant="outline"
              className="gap-1.5 text-success border-success/30 hover:bg-success/10"
              onClick={() => {
                const text = `${DOC_TYPE_LABELS[doc.document_type]} — ${doc.document_number ?? "Draft"}\nOwner: ${doc.owner_name}\nAmount: ${formatCurrency(doc.grand_total)}\n\nView: ${window.location.href}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
              }}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          </div>
        </div>
      </div>

      {/* Rejection Banner */}
      {doc.status === "rejected" && doc.rejection_reason && (
        <div className="mb-6 bg-danger/10 border border-danger/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-body-sm font-medium text-danger">Document Rejected</p>
            <p className="text-caption text-text-secondary mt-0.5">
              Reason: {doc.rejection_reason}
            </p>
          </div>
        </div>
      )}

      {/* Undo Exit Banner — for flat_annexure move-out documents */}
      {doc.document_type === "flat_annexure" && doc.period_label?.startsWith("Move-Out") && moveOutTenantId && !exitUndone && (
        <div className="mb-6 bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
          <div>
            <p className="text-body-sm text-text-primary font-medium">
              Tenant exit was completed for Flat {moveOutFlatNumber}
            </p>
            <p className="text-caption text-text-secondary">
              {canUndoExit
                ? "If this was done by mistake, you can undo the exit to reactivate the tenant."
                : "Contact an admin to undo this exit if needed."}
            </p>
          </div>
          {canUndoExit && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndoExit}
              disabled={isLoading}
              className="border-warning text-warning hover:bg-warning/10 shrink-0"
            >
              {loadingAction === "undo" ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Undo2 className="h-4 w-4 mr-1.5" />
              )}
              {loadingAction === "undo" ? "Undoing..." : "Undo Exit"}
            </Button>
          )}
        </div>
      )}
      {exitUndone && (
        <div className="mb-6 bg-success/10 border border-success/30 rounded-lg px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <p className="text-body-sm text-success font-medium">
            Tenant exit undone — Flat {moveOutFlatNumber} is occupied again
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Preview -- 2/3 width */}
        <div className="lg:col-span-2">
          <div className="bg-bg-card border border-border-primary rounded-lg p-8">
            {/* Invoice Preview */}
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center border-b border-border-primary pb-4">
                <h2 className="text-h2 font-bold text-text-primary tracking-wide">
                  MARK MY ZONE
                </h2>
                <p className="text-caption text-text-secondary mt-1">
                  {DOC_TYPE_LABELS[doc.document_type].toUpperCase()}
                </p>
              </div>

              {/* Document Info */}
              <div className="flex justify-between text-body-sm">
                <div>
                  <p className="text-text-muted text-caption">To,</p>
                  <p className="text-text-primary font-medium">{doc.owner_name}</p>
                  <p className="text-text-secondary">{doc.owner_email}</p>
                </div>
                <div className="text-right">
                  <p className="text-text-secondary">
                    <span className="text-text-muted">Invoice No:</span>{" "}
                    <span className="font-mono font-medium text-text-primary">
                      {doc.document_number ?? "-"}
                    </span>
                  </p>
                  <p className="text-text-secondary">
                    <span className="text-text-muted">Date:</span>{" "}
                    {doc.published_at?.split(",")[0] || doc.created_at.split(",")[0]}
                  </p>
                  {doc.period_label && (
                    <p className="text-text-secondary">
                      <span className="text-text-muted">Period:</span> {doc.period_label}
                    </p>
                  )}
                </div>
              </div>

              {doc.community_name && (
                <p className="text-body-sm text-text-secondary">
                  Sub: {doc.community_name} &mdash; {DOC_TYPE_LABELS[doc.document_type]}
                </p>
              )}

              {/* Line Items Table */}
              {doc.document_type === "brokerage_invoice" && doc.line_items.length > 0 && (
                <BrokerageTable
                  lineItems={doc.line_items}
                  subtotal={doc.subtotal}
                  tdsAmount={doc.tds_amount}
                  grandTotal={doc.grand_total}
                />
              )}

              {/* Generic line items for other document types */}
              {doc.document_type !== "brokerage_invoice" && doc.line_items.length > 0 && (
                <GenericLineItems lineItems={doc.line_items} />
              )}

              {/* Totals for non-brokerage docs (if they have amounts but no table) */}
              {doc.document_type !== "brokerage_invoice" && doc.grand_total != null && (
                <div className="border border-border-primary rounded-lg p-4">
                  <div className="space-y-2 text-body-sm">
                    {doc.subtotal != null && (
                      <div className="flex justify-between">
                        <span className="text-text-muted">Subtotal</span>
                        <span className="text-text-primary font-medium">
                          {formatCurrency(doc.subtotal)}
                        </span>
                      </div>
                    )}
                    {doc.tds_amount != null && doc.tds_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-text-muted">TDS</span>
                        <span className="text-text-secondary">
                          {formatCurrency(doc.tds_amount)}
                        </span>
                      </div>
                    )}
                    {doc.gst_amount != null && doc.gst_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-text-muted">GST</span>
                        <span className="text-text-secondary">
                          {formatCurrency(doc.gst_amount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-border-primary pt-2">
                      <span className="text-text-primary font-semibold">Grand Total</span>
                      <span className="text-accent font-bold">
                        {formatCurrency(doc.grand_total)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Details */}
              {bankDetails && (
                <div className="bg-bg-elevated rounded-lg p-4 text-body-sm">
                  <p className="font-semibold text-text-primary mb-2">Bank Details</p>
                  <div className="grid grid-cols-2 gap-y-1 text-caption">
                    <span className="text-text-muted">Account Name:</span>
                    <span className="text-text-primary">{bankDetails.name}</span>
                    <span className="text-text-muted">Bank:</span>
                    <span className="text-text-primary">{bankDetails.bank}</span>
                    <span className="text-text-muted">Account No:</span>
                    <span className="text-text-primary font-mono">{bankDetails.account}</span>
                    <span className="text-text-muted">IFSC:</span>
                    <span className="text-text-primary font-mono">{bankDetails.ifsc}</span>
                    <span className="text-text-muted">Branch:</span>
                    <span className="text-text-primary">{bankDetails.branch}</span>
                    <span className="text-text-muted">PAN:</span>
                    <span className="text-text-primary font-mono">{bankDetails.pan}</span>
                  </div>
                </div>
              )}

              <div className="text-center text-caption text-text-muted pt-4 border-t border-border-primary">
                <p>Kindly release the payment at the earliest.</p>
                <p className="mt-4 font-semibold text-text-secondary">AUTHORISED SIGNATORY</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar -- Version History & Details */}
        <div className="space-y-6">
          {/* Document Details */}
          <div className="bg-bg-card border border-border-primary rounded-lg p-5">
            <h3 className="text-h3 text-text-primary mb-4">Details</h3>
            <div className="space-y-3 text-body-sm">
              <DetailRow label="Type" value={DOC_TYPE_LABELS[doc.document_type]} />
              <DetailRow label="Owner" value={doc.owner_name} />
              {doc.community_name && (
                <DetailRow label="Community" value={doc.community_name} />
              )}
              {doc.period_label && (
                <DetailRow label="Period" value={doc.period_label} />
              )}
              {doc.subtotal != null && (
                <DetailRow label="Brokerage" value={formatCurrency(doc.subtotal)} />
              )}
              {doc.tds_amount != null && (
                <DetailRow label="TDS (2%)" value={formatCurrency(doc.tds_amount)} />
              )}
              {doc.grand_total != null && (
                <DetailRow
                  label="Net Payable"
                  value={formatCurrency(doc.grand_total)}
                  highlight
                />
              )}
            </div>
          </div>

          {/* Payment Status */}
          {(doc.status === "published" || doc.payment_received) && (
            <div className="bg-bg-card border border-border-primary rounded-lg p-5">
              <h3 className="text-h3 text-text-primary mb-4">Payment Status</h3>

              {doc.payment_received ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-caption font-medium text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Payment Received
                    </span>
                  </div>
                  <div className="space-y-2 text-body-sm">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <IndianRupee className="h-3.5 w-3.5 text-text-muted" />
                      <span className="text-text-muted">Amount:</span>
                      <span className="text-text-primary font-medium">
                        {doc.payment_received_amount != null
                          ? formatCurrency(doc.payment_received_amount)
                          : "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <CalendarDays className="h-3.5 w-3.5 text-text-muted" />
                      <span className="text-text-muted">Date:</span>
                      <span className="text-text-primary">
                        {doc.payment_received_date
                          ? new Date(doc.payment_received_date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <CreditCard className="h-3.5 w-3.5 text-text-muted" />
                      <span className="text-text-muted">Method:</span>
                      <span className="text-text-primary">
                        {doc.payment_received_method
                          ? PAYMENT_METHOD_LABELS[doc.payment_received_method] ?? doc.payment_received_method
                          : "-"}
                      </span>
                    </div>
                    {doc.payment_received_reference && (
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Hash className="h-3.5 w-3.5 text-text-muted" />
                        <span className="text-text-muted">Reference:</span>
                        <span className="text-text-primary font-mono text-caption">
                          {doc.payment_received_reference}
                        </span>
                      </div>
                    )}
                    {doc.payment_received_by_name && (
                      <div className="flex items-center gap-2 text-text-secondary">
                        <User className="h-3.5 w-3.5 text-text-muted" />
                        <span className="text-text-muted">Recorded by:</span>
                        <span className="text-text-primary">
                          {doc.payment_received_by_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-0.5 text-caption font-medium text-warning">
                      <Clock className="h-3.5 w-3.5" />
                      Payment Pending
                    </span>
                  </div>
                  {doc.grand_total != null && (
                    <p className="text-body-sm text-text-secondary">
                      Amount due: <span className="font-medium text-text-primary">{formatCurrency(doc.grand_total)}</span>
                    </p>
                  )}
                  <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full gap-1.5 bg-success text-white hover:bg-success/90">
                        <IndianRupee className="h-4 w-4" />
                        Record Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>
                          Record the payment received from the owner for this document.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="payment-amount">Amount *</Label>
                          <Input
                            id="payment-amount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="Enter amount"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="payment-date">Date *</Label>
                          <Input
                            id="payment-date"
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="payment-method">Method *</Label>
                          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger id="payment-method">
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                              <SelectItem value="upi">UPI</SelectItem>
                              <SelectItem value="cash">Cash</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="payment-reference">Reference / Transaction ID</Label>
                          <Input
                            id="payment-reference"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            placeholder="e.g. UTR number, cheque number"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setPaymentDialogOpen(false)}
                          disabled={loadingAction === "payment"}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="gap-1.5 bg-success text-white hover:bg-success/90"
                          onClick={handleRecordPayment}
                          disabled={loadingAction === "payment"}
                        >
                          {loadingAction === "payment" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Confirm Payment
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          )}

          {/* Version History / Audit Trail */}
          <div className="bg-bg-card border border-border-primary rounded-lg p-5">
            <h3 className="text-h3 text-text-primary mb-4">Version History</h3>
            <div className="space-y-0">
              {doc.published_at && (
                <TimelineItem
                  icon={<Send className="h-3.5 w-3.5" />}
                  label="Published"
                  actor={doc.published_by_name ?? "System"}
                  time={doc.published_at}
                  color="text-accent"
                />
              )}
              {doc.status === "rejected" && (
                <TimelineItem
                  icon={<XCircle className="h-3.5 w-3.5" />}
                  label="Rejected"
                  actor={doc.rejected_by_name ?? "Admin"}
                  time={doc.rejected_at ?? doc.submitted_at ?? doc.created_at}
                  color="text-danger"
                />
              )}
              {doc.approved_at && (
                <TimelineItem
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                  label="Approved"
                  actor={doc.approved_by_name ?? "System"}
                  time={doc.approved_at}
                  color="text-success"
                />
              )}
              {doc.submitted_at && (
                <TimelineItem
                  icon={<Send className="h-3.5 w-3.5" />}
                  label="Submitted for approval"
                  actor={doc.submitted_by_name ?? "System"}
                  time={doc.submitted_at}
                  color="text-info"
                />
              )}
              <TimelineItem
                icon={<FileText className="h-3.5 w-3.5" />}
                label="Created"
                actor={doc.created_by_name ?? "System"}
                time={doc.created_at}
                color="text-text-muted"
                isLast
              />
            </div>

            {/* Detailed Activity Log */}
            {auditHistory && auditHistory.length > 0 && (
              <>
                <div className="border-t border-border-primary my-4" />
                <h4 className="text-caption text-text-muted uppercase tracking-wide mb-3">Activity Log</h4>
                <div className="space-y-2">
                  {auditHistory.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-2 text-caption py-1">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        entry.action === 'create' ? 'bg-text-muted' :
                        entry.action === 'approve' ? 'bg-success' :
                        entry.action === 'reject' ? 'bg-danger' :
                        entry.action === 'publish' ? 'bg-accent' :
                        entry.action === 'export' ? 'bg-info' :
                        'bg-warning'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-text-secondary">{entry.description}</p>
                        <p className="text-text-muted">
                          {entry.actor_name}{entry.actor_role ? ` (${entry.actor_role})` : ''} &middot; {entry.created_at}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Sub-components =====

function BrokerageTable({
  lineItems,
  subtotal,
  tdsAmount,
  grandTotal,
}: {
  lineItems: any[];
  subtotal: number | null;
  tdsAmount: number | null;
  grandTotal: number | null;
}) {
  return (
    <div className="border border-border-primary rounded-lg overflow-hidden">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="bg-bg-elevated border-b border-border-primary">
            <th className="text-left font-medium text-text-muted px-3 py-2 text-caption">
              #
            </th>
            <th className="text-left font-medium text-text-muted px-3 py-2 text-caption">
              Flat
            </th>
            <th className="text-left font-medium text-text-muted px-3 py-2 text-caption">
              Tenant
            </th>
            <th className="text-right font-medium text-text-muted px-3 py-2 text-caption">
              Rent
            </th>
            <th className="text-right font-medium text-text-muted px-3 py-2 text-caption">
              Brokerage
            </th>
            <th className="text-right font-medium text-text-muted px-3 py-2 text-caption">
              TDS (2%)
            </th>
            <th className="text-right font-medium text-text-muted px-3 py-2 text-caption">
              Net Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item: any, i: number) => (
            <tr key={i} className="border-b border-border-primary last:border-0">
              <td className="px-3 py-2 text-text-muted">{i + 1}</td>
              <td className="px-3 py-2 font-mono font-semibold text-text-primary">
                {item.flat ?? item.flat_number ?? "-"}
              </td>
              <td className="px-3 py-2 text-text-primary">
                {item.tenant ?? item.tenant_name ?? "-"}
              </td>
              <td className="px-3 py-2 text-right text-text-secondary">
                {formatCurrency(item.rent ?? item.monthly_rent)}
              </td>
              <td className="px-3 py-2 text-right text-text-primary font-medium">
                {formatCurrency(item.brokerage ?? item.brokerage_amount)}
              </td>
              <td className="px-3 py-2 text-right text-text-secondary">
                {formatCurrency(item.tds ?? item.tds_amount)}
              </td>
              <td className="px-3 py-2 text-right text-text-primary font-semibold">
                {formatCurrency(item.net ?? item.net_amount)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-bg-elevated border-t border-border-primary">
            <td
              colSpan={4}
              className="px-3 py-2 text-right font-semibold text-text-primary"
            >
              Grand Total
            </td>
            <td className="px-3 py-2 text-right font-semibold text-text-primary">
              {formatCurrency(subtotal)}
            </td>
            <td className="px-3 py-2 text-right font-semibold text-text-secondary">
              {formatCurrency(tdsAmount)}
            </td>
            <td className="px-3 py-2 text-right font-bold text-accent text-body-sm">
              {formatCurrency(grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function GenericLineItems({ lineItems }: { lineItems: any[] }) {
  if (lineItems.length === 0) return null;

  // Determine columns from the first item's keys
  const keys = Object.keys(lineItems[0]).filter(
    (k) => !["id", "created_at", "updated_at"].includes(k)
  );

  return (
    <div className="border border-border-primary rounded-lg overflow-hidden">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="bg-bg-elevated border-b border-border-primary">
            <th className="text-left font-medium text-text-muted px-3 py-2 text-caption">
              #
            </th>
            {keys.map((key) => (
              <th
                key={key}
                className="text-left font-medium text-text-muted px-3 py-2 text-caption capitalize"
              >
                {key.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item: any, i: number) => (
            <tr key={i} className="border-b border-border-primary last:border-0">
              <td className="px-3 py-2 text-text-muted">{i + 1}</td>
              {keys.map((key) => (
                <td key={key} className="px-3 py-2 text-text-primary">
                  {typeof item[key] === "number"
                    ? formatCurrency(item[key])
                    : String(item[key] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-text-muted">{label}</span>
      <span
        className={
          highlight
            ? "font-bold text-accent"
            : "text-text-primary font-medium"
        }
      >
        {value}
      </span>
    </div>
  );
}

function TimelineItem({
  icon,
  label,
  actor,
  time,
  color,
  isLast = false,
}: {
  icon: React.ReactNode;
  label: string;
  actor: string;
  time: string;
  color: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div
          className={`flex items-center justify-center w-7 h-7 rounded-full bg-bg-elevated ${color}`}
        >
          {icon}
        </div>
        {!isLast && (
          <div className="w-px h-full min-h-[24px] bg-border-primary" />
        )}
      </div>
      {/* Content */}
      <div className="pb-4">
        <p className="text-body-sm text-text-primary font-medium">{label}</p>
        <div className="flex items-center gap-1.5 text-caption text-text-muted mt-0.5">
          <User className="h-3 w-3" />
          <span>{actor}</span>
        </div>
        <div className="flex items-center gap-1.5 text-caption text-text-muted mt-0.5">
          <Clock className="h-3 w-3" />
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
}
