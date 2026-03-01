import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDocumentById } from "@/lib/dal/documents";
import { getSettings } from "@/lib/dal/settings";
import { getAuditLog } from "@/lib/dal/audit-log";
import { DocumentDetailContent } from "./document-detail-content";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }) +
    ", " +
    d.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
}

async function DocumentDetail({ id }: { id: string }) {
  // Fetch document, settings, and pm_users in parallel
  let doc;
  try {
    doc = await getDocumentById(id);
  } catch {
    notFound();
  }

  if (!doc) {
    notFound();
  }

  const supabase = createClient();

  const [settings, { data: pmUsers }, auditEntries] = await Promise.all([
    getSettings().catch(() => null),
    supabase.from("pm_users").select("id, name, role"),
    getAuditLog({ entityType: "document", entityId: id }).catch(() => []),
  ]);

  // Resolve pm_user UUID to "Name (Role)" string
  const resolveUser = (userId: string | null): string | null => {
    if (!userId) return null;
    const u = pmUsers?.find((p: { id: string; name: string; role: string }) => p.id === userId);
    return u ? `${u.name} (${u.role})` : null;
  };

  // Build bank details: prefer document-level snapshot, fall back to mmz_settings
  const docBank = doc.bank_details as Record<string, string> | null;
  const bankDetails =
    docBank && docBank.name
      ? {
          name: docBank.name ?? "",
          bank: docBank.bank ?? "",
          account: docBank.account ?? "",
          ifsc: docBank.ifsc ?? "",
          branch: docBank.branch ?? "",
          pan: docBank.pan ?? "",
        }
      : settings
        ? {
            name: settings.bank_account_name ?? "",
            bank: settings.bank_name ?? "",
            account: settings.bank_account_number ?? "",
            ifsc: settings.bank_ifsc ?? "",
            branch: settings.bank_branch ?? "",
            pan: settings.pan_number ?? "",
          }
        : null;

  // Build serializable props for the client component
  const owner = doc.owner as { id: string; name: string; email: string } | null;
  const community = doc.community as { id: string; name: string } | null;

  const documentProps = {
    id: doc.id,
    document_type: doc.document_type,
    document_number: doc.document_number ?? null,
    owner_name: owner?.name ?? "Unknown Owner",
    owner_email: owner?.email ?? "",
    community_name: community?.name ?? null,
    period_label: doc.period_label ?? null,
    subtotal: doc.subtotal ?? null,
    tds_amount: doc.tds_amount ?? null,
    gst_amount: doc.gst_amount ?? null,
    grand_total: doc.grand_total ?? null,
    line_items: Array.isArray(doc.line_items) ? doc.line_items : [],
    status: doc.status,
    created_at: formatDate(doc.created_at) ?? doc.created_at,
    created_by_name: resolveUser(doc.created_by),
    submitted_at: formatDate(doc.submitted_at),
    submitted_by_name: resolveUser(doc.submitted_by),
    approved_at: formatDate(doc.approved_at),
    approved_by_name: resolveUser(doc.approved_by),
    rejected_at: null as string | null,
    rejected_by_name: null as string | null,
    rejection_reason: doc.rejection_reason ?? null,
    published_at: formatDate(doc.published_at),
    published_by_name: resolveUser(doc.published_by),
    payment_received: doc.payment_received ?? false,
    payment_received_amount: doc.payment_received_amount ?? null,
    payment_received_date: doc.payment_received_date ?? null,
    payment_received_method: doc.payment_received_method ?? null,
    payment_received_reference: doc.payment_received_reference ?? null,
    payment_received_by_name: resolveUser(doc.payment_received_by),
  };

  const auditHistory = auditEntries.map((entry: any) => ({
    id: entry.id,
    action: entry.action,
    description: entry.description,
    actor_name: entry.actor_name ?? "System",
    actor_role: entry.actor_role,
    changes: entry.changes,
    created_at: formatDate(entry.created_at) ?? entry.created_at,
  }));

  return (
    <DocumentDetailContent document={documentProps} bankDetails={bankDetails} auditHistory={auditHistory} />
  );
}

export default async function DocumentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  return (
    <Suspense
      fallback={
        <div className="w-full animate-pulse">
          <div className="h-4 bg-bg-elevated rounded w-32 mb-3" />
          <div className="h-8 bg-bg-elevated rounded w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-bg-elevated rounded-lg" />
            <div className="h-64 bg-bg-elevated rounded-lg" />
          </div>
        </div>
      }
    >
      <DocumentDetail id={id} />
    </Suspense>
  );
}
