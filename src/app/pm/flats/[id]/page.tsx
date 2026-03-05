import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { FlatDetailContent } from "./flat-detail-content";
import { getRentRevisions } from "@/lib/dal/flats";
import { getCurrentPmUserWithRole, canApprove } from "@/lib/dal/auth";
import type { Note } from "@/lib/actions/notes";

export default async function FlatDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  // Fetch flat with relations
  const { data: flat, error } = await supabase
    .from("flats")
    .select("*, community:communities(id, name), owner:owners(id, name)")
    .eq("id", params.id)
    .single();

  if (error || !flat) {
    notFound();
  }

  // Fetch active tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("flat_id", params.id)
    .eq("is_active", true)
    .maybeSingle();

  // Fetch rent history
  const { data: rentHistory } = await supabase
    .from("rent_payments")
    .select("*")
    .eq("flat_id", params.id)
    .order("payment_date", { ascending: false })
    .limit(20);

  // Resolve a storage path or full URL to a public URL
  const resolveFileUrl = (pathOrUrl: string): string => {
    if (pathOrUrl.startsWith("http")) return pathOrUrl;
    const { data: { publicUrl } } = supabase.storage.from("mmz-files").getPublicUrl(pathOrUrl);
    return publicUrl;
  };

  // Build proof URLs for rent payments
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rentWithProofs = (rentHistory ?? []).map((r: any) => {
    const proofUrls: string[] = [];
    if (Array.isArray(r.proof_file_ids)) {
      for (const path of r.proof_file_ids) {
        proofUrls.push(resolveFileUrl(path));
      }
    }
    return { ...r, proof_urls: proofUrls };
  });

  // Fetch expenses
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("flat_id", params.id)
    .order("expense_date", { ascending: false })
    .limit(20);

  // Fetch rent revisions
  const rentRevisions = await getRentRevisions(params.id);

  // Build receipt URLs for expenses
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expensesWithReceipts = (expenses ?? []).map((e: any) => {
    const receiptUrls: string[] = [];
    if (Array.isArray(e.receipt_file_ids)) {
      for (const path of e.receipt_file_ids) {
        receiptUrls.push(resolveFileUrl(path));
      }
    }
    return { ...e, receipt_urls: receiptUrls };
  });

  // Fetch notes for this flat
  const { data: notesData } = await supabase
    .from("notes")
    .select("id, content, is_internal, author_name, author_type, created_at")
    .eq("entity_type", "flat")
    .eq("entity_id", params.id)
    .order("created_at", { ascending: false });

  // Fetch flat annexures
  const { data: annexures } = await supabase
    .from("flat_annexures")
    .select("id, annexure_type, annexure_date, security_deposit, total_deductions, refund_amount, is_completed, created_at")
    .eq("flat_id", params.id)
    .order("created_at", { ascending: false });

  // If flat is vacant, fetch the last exited tenant for undo capability
  let lastExitedTenant: { id: string; name: string; exit_date: string; exit_reason: string } | null = null;
  if (flat.status === "vacant") {
    const { data: exitedTenant } = await supabase
      .from("tenants")
      .select("id, name, exit_date, exit_reason")
      .eq("flat_id", params.id)
      .eq("is_active", false)
      .order("exit_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (exitedTenant?.exit_date) {
      lastExitedTenant = {
        id: exitedTenant.id,
        name: exitedTenant.name,
        exit_date: exitedTenant.exit_date,
        exit_reason: exitedTenant.exit_reason ?? "",
      };
    }
  }

  // Check if user has admin/super_admin role (for undo exit)
  const pmUser = await getCurrentPmUserWithRole();
  const userCanApprove = pmUser ? canApprove(pmUser.role) : false;

  // Build agreement file URL if tenant has one
  let agreementUrl: string | null = null;
  if (tenant?.agreement_file_id) {
    agreementUrl = resolveFileUrl(tenant.agreement_file_id);
  }

  return (
    <FlatDetailContent
      flat={flat}
      tenant={tenant ?? null}
      lastExitedTenant={lastExitedTenant}
      canUndoExit={userCanApprove}
      rentHistory={rentWithProofs}
      expenses={expensesWithReceipts}
      rentRevisions={rentRevisions}
      notes={(notesData as Note[]) ?? []}
      agreementUrl={agreementUrl}
      annexures={(annexures ?? []).map((a: any) => ({
        id: a.id,
        type: a.annexure_type as "move_in" | "move_out",
        date: a.annexure_date,
        securityDeposit: a.security_deposit,
        totalDeductions: a.total_deductions,
        refundAmount: a.refund_amount,
        isCompleted: a.is_completed,
        createdAt: a.created_at,
      }))}
    />
  );
}
