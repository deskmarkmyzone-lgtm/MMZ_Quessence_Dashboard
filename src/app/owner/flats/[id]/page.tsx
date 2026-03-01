import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { FlatDetailContent } from "./flat-detail-content";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  gpay: "GPay",
  phonepe: "PhonePe",
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  upi: "UPI",
  cheque: "Cheque",
  other: "Other",
};

export default async function OwnerFlatDetailPage({
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

  // Fetch the flat (ensuring it belongs to this owner)
  const { data: flatData } = await supabase
    .from("flats")
    .select(
      "id, flat_number, bhk_type, carpet_area_sft, inclusive_rent, base_rent, maintenance_amount, status, community:communities(name), tenants(name, tenant_type, is_active, lease_start_date, lease_end_date)"
    )
    .eq("id", params.id)
    .eq("owner_id", owner.id)
    .eq("is_active", true)
    .single();

  if (!flatData) notFound();

  const activeTenant = Array.isArray(flatData.tenants)
    ? (flatData as any).tenants.find((t: any) => t.is_active)
    : null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const flat = {
    id: flatData.id,
    flat_number: flatData.flat_number,
    community: (flatData as any).community?.name ?? "-",
    bhk: flatData.bhk_type ?? "-",
    sqft: flatData.carpet_area_sft ?? 0,
    status: flatData.status as "occupied" | "vacant" | "under_maintenance",
    tenant_name: activeTenant?.name ?? null,
    tenant_type: activeTenant?.tenant_type ?? null,
    lease_start: formatDate(activeTenant?.lease_start_date ?? null),
    lease_end: formatDate(activeTenant?.lease_end_date ?? null),
    rent: flatData.inclusive_rent ?? 0,
    base_rent: flatData.base_rent ?? 0,
    maintenance: flatData.maintenance_amount ?? 0,
  };

  // Fetch rent history for this flat
  const { data: rentData } = await supabase
    .from("rent_payments")
    .select("id, amount, payment_date, payment_month, payment_method, payment_status, proof_file_ids")
    .eq("flat_id", params.id)
    .order("payment_month", { ascending: false })
    .limit(24);

  const rentHistory = (rentData ?? []).map((r: any) => {
    const monthDate = new Date(r.payment_month);
    const monthLabel = monthDate.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
    const dateLabel = new Date(r.payment_date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // Build proof URLs from file IDs
    const proofUrls: string[] = [];
    if (r.proof_file_ids && Array.isArray(r.proof_file_ids)) {
      for (const path of r.proof_file_ids) {
        // If the stored value is already a full URL (e.g. migrated data), use it directly
        if (path.startsWith("http")) {
          proofUrls.push(path);
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage.from("mmz-files").getPublicUrl(path);
          proofUrls.push(publicUrl);
        }
      }
    }

    return {
      id: r.id,
      month: monthLabel,
      amount: r.amount ?? 0,
      date: dateLabel,
      status: r.payment_status === "full" ? "paid" : r.payment_status ?? "unpaid",
      method: PAYMENT_METHOD_LABELS[r.payment_method] ?? r.payment_method ?? "-",
      proof_urls: proofUrls,
    };
  });

  // Fetch expenses for this flat
  const { data: expenseData } = await supabase
    .from("expenses")
    .select("id, expense_date, category, description, amount, receipt_file_ids")
    .eq("flat_id", params.id)
    .order("expense_date", { ascending: false });

  const expenses = (expenseData ?? []).map((e: any) => {
    const dateLabel = new Date(e.expense_date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // Build receipt URLs from file IDs
    const receiptUrls: string[] = [];
    if (e.receipt_file_ids && Array.isArray(e.receipt_file_ids)) {
      for (const path of e.receipt_file_ids) {
        // If the stored value is already a full URL (e.g. migrated data), use it directly
        if (path.startsWith("http")) {
          receiptUrls.push(path);
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage.from("mmz-files").getPublicUrl(path);
          receiptUrls.push(publicUrl);
        }
      }
    }

    // Capitalize category
    const categoryLabel = (e.category ?? "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

    return {
      id: e.id,
      date: dateLabel,
      category: categoryLabel,
      description: e.description ?? "",
      amount: e.amount ?? 0,
      receipt_urls: receiptUrls,
    };
  });

  return (
    <FlatDetailContent
      flat={flat}
      rentHistory={rentHistory}
      expenses={expenses}
    />
  );
}
