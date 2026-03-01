import { createClient } from "@/lib/supabase/server";
import { MonthlyRentContent } from "./monthly-rent-content";

export default async function MonthlyRentGridPage() {
  const supabase = createClient();

  // Generate last 6 months in YYYY-MM format
  const now = new Date();
  const allMonths: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    allMonths.push(d.toISOString().slice(0, 7));
  }

  // Fetch all active flats (occupied + vacant) with owner & tenant data
  const { data: flatsData } = await supabase
    .from("flats")
    .select(
      "id, flat_number, inclusive_rent, status, bhk_type, community:communities(id, name), owner:owners(id, name), active_tenant:tenants(id, name)"
    )
    .eq("is_active", true)
    .eq("active_tenant.is_active", true)
    .order("flat_number");

  // Fetch rent payments for the 6-month window
  const { data: paymentsData } = await supabase
    .from("rent_payments")
    .select("id, flat_id, amount, payment_date, payment_month, payment_status")
    .gte("payment_month", allMonths[0])
    .lte("payment_month", allMonths[allMonths.length - 1]);

  // Build flat data with tenant info
  const flats = (flatsData ?? []).map((f: any) => ({
    id: f.id,
    flat_number: f.flat_number,
    inclusive_rent: f.inclusive_rent ?? 0,
    status: f.status as string,
    tenant_name: Array.isArray(f.active_tenant)
      ? f.active_tenant[0]?.name ?? null
      : f.active_tenant?.name ?? null,
    owner_name: f.owner?.name ?? "-",
    owner_id: f.owner?.id ?? null,
  }));

  // Build payment grid: flat_id -> month -> payment data
  const rentGrid: Record<
    string,
    Record<string, { status: string; amount: number; date?: string }>
  > = {};

  for (const payment of paymentsData ?? []) {
    if (!rentGrid[payment.flat_id]) {
      rentGrid[payment.flat_id] = {};
    }
    const dateStr = payment.payment_date
      ? new Date(payment.payment_date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        })
      : undefined;

    // Map payment_status to display status
    let displayStatus = "unpaid";
    if (payment.payment_status === "full") displayStatus = "paid";
    else if (payment.payment_status === "partial") displayStatus = "partial";

    rentGrid[payment.flat_id][payment.payment_month] = {
      status: displayStatus,
      amount: payment.amount,
      date: dateStr,
    };
  }

  // Derive unique owners for the filter
  const owners = Array.from(
    new Map(
      flats
        .filter((f: any) => f.owner_id)
        .map((f: any) => [f.owner_id, f.owner_name])
    ).entries()
  ).map(([id, name]) => ({ id: id as string, name: name as string }));

  return (
    <MonthlyRentContent
      flats={flats}
      rentGrid={rentGrid}
      allMonths={allMonths}
      owners={owners}
    />
  );
}
