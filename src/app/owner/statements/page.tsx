import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatementsContent } from "./statements-content";

export default async function OwnerStatementsPage() {
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

  // Fetch published documents for this owner
  const { data: documentsData } = await supabase
    .from("documents")
    .select(
      "id, document_type, document_number, period_label, grand_total, published_at"
    )
    .eq("owner_id", owner.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const statements = (documentsData ?? []).map((d: any) => ({
    id: d.id,
    document_type: d.document_type,
    document_number: d.document_number ?? "-",
    period_label: d.period_label ?? "-",
    grand_total: d.grand_total ?? 0,
    published_at: d.published_at
      ? new Date(d.published_at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "-",
  }));

  return <StatementsContent statements={statements} />;
}
