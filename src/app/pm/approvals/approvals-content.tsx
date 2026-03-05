"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Eye, FileText, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { approveDocument, rejectDocument } from "@/lib/actions";
import type { DocumentType, UserRole } from "@/types";

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  brokerage_invoice: "Brokerage Invoice",
  expenses_bill: "Expenses Bill",
  maintenance_tracker: "Maintenance Tracker",
  rental_credit_report: "Rental Credit Report",
  flat_annexure: "Flat Annexure",
};

interface ApprovalRow {
  id: string;
  document_number: string;
  document_type: DocumentType;
  owner_name: string;
  period_label: string;
  grand_total: number | null;
  submitted_by: string;
  submitted_at: string;
}

interface ApprovalsContentProps {
  approvals: ApprovalRow[];
  canApprove: boolean;
  userRole: UserRole;
}

export function ApprovalsContent({ approvals: initialApprovals, canApprove: hasApprovalPermission, userRole }: ApprovalsContentProps) {
  const router = useRouter();
  const [approvals, setApprovals] = useState(initialApprovals);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    try {
      const result = await approveDocument(id);
      if (result.success) {
        setApprovals(approvals.filter(a => a.id !== id));
        toast.success("Document approved successfully");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to approve document");
      }
    } catch {
      toast.error("Failed to approve document");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setLoadingId(id);
    try {
      const result = await rejectDocument(id, "Rejected from approvals page");
      if (result.success) {
        setApprovals(approvals.filter(a => a.id !== id));
        toast.error("Document rejected");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to reject document");
      }
    } catch {
      toast.error("Failed to reject document");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Approvals"
        description={`${approvals.length} documents pending approval`}
      />

      {!hasApprovalPermission && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 mb-6 flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-warning shrink-0" />
          <p className="text-body-sm text-text-secondary">
            You are viewing as <span className="font-medium text-text-primary capitalize">{userRole}</span>. Only admins and super admins can approve or reject documents.
          </p>
        </div>
      )}

      {approvals.length === 0 ? (
        <div className="text-center py-12 bg-bg-card border border-border-primary rounded-lg">
          <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
          <p className="text-body-sm text-text-secondary">All caught up! No pending approvals.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <div
              key={approval.id}
              className="bg-bg-card border border-border-primary rounded-lg p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-body-sm text-text-primary font-mono font-semibold">
                        {approval.document_number}
                      </span>
                      <span className="text-caption bg-bg-elevated px-2 py-0.5 rounded text-text-primary">
                        {DOC_TYPE_LABELS[approval.document_type]}
                      </span>
                      <StatusBadge status="pending" />
                    </div>
                    <p className="text-body-sm text-text-primary mt-1">
                      {approval.owner_name} · {approval.period_label}
                    </p>
                    <p className="text-caption text-text-muted mt-0.5">
                      Submitted by {approval.submitted_by} on {approval.submitted_at}
                    </p>
                    {approval.grand_total && (
                      <p className="text-body-sm text-accent font-medium mt-1">
                        ₹{approval.grand_total.toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/pm/documents/${approval.id}`)}
                    className="border-border-primary text-text-secondary"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  {hasApprovalPermission && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(approval.id)}
                        disabled={loadingId === approval.id}
                        className="border-danger text-danger hover:bg-danger/10"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(approval.id)}
                        disabled={loadingId === approval.id}
                        className="bg-success hover:bg-success/90 text-white"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
