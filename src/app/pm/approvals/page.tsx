import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ApprovalsContent } from "./approvals-content";
import { getCurrentPmUserWithRole, canApprove } from "@/lib/dal/auth";

export default async function ApprovalsPage() {
  const supabase = createClient();

  const pmUser = await getCurrentPmUserWithRole();
  const userCanApprove = pmUser ? canApprove(pmUser.role) : false;

  const { data: pendingDocs } = await supabase
    .from("documents")
    .select("*, owner:owners(name), submitter:pm_users!submitted_by(name)")
    .eq("status", "pending_approval")
    .order("submitted_at", { ascending: false });

  const approvals = (pendingDocs ?? []).map((d: any) => ({
    id: d.id,
    document_number: d.document_number ?? "-",
    document_type: d.document_type,
    owner_name: d.owner?.name ?? "-",
    period_label: d.period_label ?? "-",
    grand_total: d.grand_total,
    submitted_by: d.submitter?.name ?? "-",
    submitted_at: d.submitted_at
      ? new Date(d.submitted_at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "-",
  }));

  return (
    <Suspense
      fallback={
        <div className="w-full animate-pulse">
          <div className="h-8 bg-bg-elevated rounded w-48 mb-6" />
          <div className="h-64 bg-bg-elevated rounded-lg" />
        </div>
      }
    >
      <ApprovalsContent
        approvals={approvals}
        canApprove={userCanApprove}
        userRole={pmUser?.role ?? "manager"}
      />
    </Suspense>
  );
}
