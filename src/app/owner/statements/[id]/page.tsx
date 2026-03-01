import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatementDetailContent } from "./statement-detail-content";

export default async function OwnerStatementDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: owner } = await supabase
    .from("owners")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!owner) redirect("/access-denied");

  // Fetch the document (ensuring it belongs to this owner and is published)
  const { data: docData } = await supabase
    .from("documents")
    .select(
      "id, document_type, document_number, period_label, subtotal, tds_amount, grand_total, published_at, line_items, bank_details, community:communities(name)"
    )
    .eq("id", params.id)
    .eq("owner_id", owner.id)
    .eq("status", "published")
    .single();

  if (!docData) {
    return <StatementDetailContent doc={null} />;
  }

  // Parse line_items from the JSON column
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

  // Parse bank_details from JSON column
  const bankRaw = docData.bank_details as any;
  const bankDetails =
    bankRaw && typeof bankRaw === "object" && bankRaw.name
      ? {
          name: bankRaw.name ?? "",
          bank: bankRaw.bank ?? "",
          account: bankRaw.account ?? "",
          ifsc: bankRaw.ifsc ?? "",
          branch: bankRaw.branch ?? "",
          pan: bankRaw.pan ?? "",
        }
      : null;

  const doc = {
    id: docData.id,
    document_type: docData.document_type as any,
    document_number: docData.document_number ?? "-",
    period_label: docData.period_label ?? "-",
    community: (docData as any).community?.name ?? "-",
    subtotal: docData.subtotal ?? 0,
    tds_amount: docData.tds_amount ?? 0,
    grand_total: docData.grand_total ?? 0,
    published_at: docData.published_at
      ? new Date(docData.published_at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "-",
    line_items: lineItems,
    bank_details: bankDetails,
  };

  return <StatementDetailContent doc={doc} />;
}
