import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { DocumentsContent } from "./documents-content";

export default async function DocumentsPage() {
  const supabase = createClient();

  const { data: docsData } = await supabase
    .from("documents")
    .select("*, owner:owners(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const documents = (docsData ?? []).map((d: any) => ({
    id: d.id,
    document_type: d.document_type,
    document_number: d.document_number ?? "-",
    owner_name: d.owner?.name ?? "-",
    period_label: d.period_label ?? "-",
    grand_total: d.grand_total,
    status: d.status,
    payment_received: d.payment_received ?? false,
    created_at: d.created_at
      ? new Date(d.created_at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "-",
    published_at: d.published_at
      ? new Date(d.published_at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null,
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
      <DocumentsContent documents={documents} />
    </Suspense>
  );
}
