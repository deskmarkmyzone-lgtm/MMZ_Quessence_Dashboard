import { createClient } from "@/lib/supabase/server";
import { ReportsContent } from "./reports-content";

export interface OwnerReportRow {
  owner_id: string;
  owner_name: string;
  flat_count: number;
  rent_collected: number;
  expense_total: number;
  brokerage_earned: number;
  tds_deducted: number;
  net: number;
  flats: {
    flat_id: string;
    flat_number: string;
    rent_collected: number;
    expense_total: number;
  }[];
}

export interface ReportsSummary {
  total_rent: number;
  total_expenses: number;
  total_brokerage: number;
  total_tds: number;
  net_revenue: number;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { year?: string; owner?: string };
}) {
  const supabase = createClient();

  const currentYear = new Date().getFullYear();
  const selectedYear = searchParams.year
    ? parseInt(searchParams.year, 10)
    : currentYear;
  const selectedOwnerId = searchParams.owner ?? "all";

  const yearStart = `${selectedYear}-01-01`;
  const yearEnd = `${selectedYear}-12-31`;

  // 1. Fetch all active owners
  const { data: ownersData } = await supabase
    .from("owners")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  const owners = ownersData ?? [];

  // 2. Fetch all active flats with owner relationship
  const { data: flatsData } = await supabase
    .from("flats")
    .select("id, flat_number, owner_id, status")
    .eq("is_active", true);

  const flats = flatsData ?? [];

  // Build flat_id -> owner_id map & flat_id -> flat_number map
  const flatOwnerMap = new Map<string, string>();
  const flatNumberMap = new Map<string, string>();
  for (const f of flats) {
    flatOwnerMap.set(f.id, f.owner_id);
    flatNumberMap.set(f.id, f.flat_number);
  }

  // 3. Fetch rent payments for the selected year
  const { data: paymentsData } = await supabase
    .from("rent_payments")
    .select("flat_id, amount")
    .gte("payment_month", yearStart)
    .lte("payment_month", yearEnd);

  const payments = paymentsData ?? [];

  // 4. Fetch expenses for the selected year
  const { data: expensesData } = await supabase
    .from("expenses")
    .select("flat_id, amount")
    .gte("expense_date", yearStart)
    .lte("expense_date", yearEnd);

  const expenses = expensesData ?? [];

  // 5. Fetch brokerage documents (payment_received=true, brokerage_invoice type) for the year
  const { data: brokerageDocsData } = await supabase
    .from("documents")
    .select("owner_id, grand_total, tds_amount")
    .eq("document_type", "brokerage_invoice")
    .eq("payment_received", true)
    .gte("created_at", `${yearStart}T00:00:00`)
    .lte("created_at", `${yearEnd}T23:59:59`);

  const brokerageDocs = brokerageDocsData ?? [];

  // 6. Compute per-owner data
  // Per owner: rent, expenses, brokerage, tds
  const ownerRentMap = new Map<string, number>();
  const ownerExpenseMap = new Map<string, number>();
  const ownerBrokerageMap = new Map<string, number>();
  const ownerTDSMap = new Map<string, number>();
  const ownerFlatsMap = new Map<string, Set<string>>();

  // Per flat: rent, expenses (for expandable rows)
  const flatRentMap = new Map<string, number>();
  const flatExpenseMap = new Map<string, number>();

  // Process rent payments
  for (const p of payments) {
    const ownerId = flatOwnerMap.get(p.flat_id);
    if (!ownerId) continue;
    ownerRentMap.set(ownerId, (ownerRentMap.get(ownerId) ?? 0) + (p.amount ?? 0));
    flatRentMap.set(p.flat_id, (flatRentMap.get(p.flat_id) ?? 0) + (p.amount ?? 0));
    if (!ownerFlatsMap.has(ownerId)) ownerFlatsMap.set(ownerId, new Set());
    ownerFlatsMap.get(ownerId)!.add(p.flat_id);
  }

  // Process expenses
  for (const e of expenses) {
    const ownerId = flatOwnerMap.get(e.flat_id);
    if (!ownerId) continue;
    ownerExpenseMap.set(ownerId, (ownerExpenseMap.get(ownerId) ?? 0) + (e.amount ?? 0));
    flatExpenseMap.set(e.flat_id, (flatExpenseMap.get(e.flat_id) ?? 0) + (e.amount ?? 0));
    if (!ownerFlatsMap.has(ownerId)) ownerFlatsMap.set(ownerId, new Set());
    ownerFlatsMap.get(ownerId)!.add(e.flat_id);
  }

  // Process brokerage documents
  for (const d of brokerageDocs) {
    ownerBrokerageMap.set(
      d.owner_id,
      (ownerBrokerageMap.get(d.owner_id) ?? 0) + (d.grand_total ?? 0)
    );
    ownerTDSMap.set(
      d.owner_id,
      (ownerTDSMap.get(d.owner_id) ?? 0) + (d.tds_amount ?? 0)
    );
  }

  // Also track all owner flat counts (even if no payments/expenses)
  for (const f of flats) {
    if (!ownerFlatsMap.has(f.owner_id)) ownerFlatsMap.set(f.owner_id, new Set());
    ownerFlatsMap.get(f.owner_id)!.add(f.id);
  }

  // Build per-owner report rows
  let ownerRows: OwnerReportRow[] = owners.map((owner) => {
    const rentCollected = ownerRentMap.get(owner.id) ?? 0;
    const expenseTotal = ownerExpenseMap.get(owner.id) ?? 0;
    const brokerageEarned = ownerBrokerageMap.get(owner.id) ?? 0;
    const tdsDeducted = ownerTDSMap.get(owner.id) ?? 0;
    const ownerFlatIds = ownerFlatsMap.get(owner.id) ?? new Set<string>();

    const flatBreakdown = Array.from(ownerFlatIds).map((flatId) => ({
      flat_id: flatId,
      flat_number: flatNumberMap.get(flatId) ?? "-",
      rent_collected: flatRentMap.get(flatId) ?? 0,
      expense_total: flatExpenseMap.get(flatId) ?? 0,
    }));

    return {
      owner_id: owner.id,
      owner_name: owner.name,
      flat_count: ownerFlatIds.size,
      rent_collected: rentCollected,
      expense_total: expenseTotal,
      brokerage_earned: brokerageEarned,
      tds_deducted: tdsDeducted,
      net: rentCollected - expenseTotal + brokerageEarned - tdsDeducted,
      flats: flatBreakdown,
    };
  });

  // Filter by owner if selected
  if (selectedOwnerId !== "all") {
    ownerRows = ownerRows.filter((r) => r.owner_id === selectedOwnerId);
  }

  // Compute summary
  const summary: ReportsSummary = {
    total_rent: ownerRows.reduce((s, r) => s + r.rent_collected, 0),
    total_expenses: ownerRows.reduce((s, r) => s + r.expense_total, 0),
    total_brokerage: ownerRows.reduce((s, r) => s + r.brokerage_earned, 0),
    total_tds: ownerRows.reduce((s, r) => s + r.tds_deducted, 0),
    net_revenue: ownerRows.reduce((s, r) => s + r.net, 0),
  };

  return (
    <ReportsContent
      ownerRows={ownerRows}
      summary={summary}
      owners={owners}
      selectedYear={selectedYear}
      selectedOwnerId={selectedOwnerId}
    />
  );
}
