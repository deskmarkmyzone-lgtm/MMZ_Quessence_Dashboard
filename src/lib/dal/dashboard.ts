import { createClient } from "@/lib/supabase/server";

export async function getDashboardKPIs(communityId?: string) {
  const supabase = createClient();

  // Get all flats (optionally filtered by community)
  let flatsQuery = supabase
    .from("flats")
    .select("id, status, owner_id, inclusive_rent")
    .eq("is_active", true);

  if (communityId) {
    flatsQuery = flatsQuery.eq("community_id", communityId);
  }

  const { data: flats, error: flatsError } = await flatsQuery;
  if (flatsError) throw flatsError;

  const allFlats = flats ?? [];
  const totalFlats = allFlats.length;
  const occupiedFlats = allFlats.filter((f) => f.status === "occupied");
  const vacantFlats = allFlats.filter((f) => f.status === "vacant");
  const occupiedCount = occupiedFlats.length;
  const vacantCount = vacantFlats.length;
  const expectedRent = occupiedFlats.reduce(
    (sum, f) => sum + (f.inclusive_rent ?? 0),
    0
  );
  const totalOwners = new Set(allFlats.map((f) => f.owner_id)).size;

  // Get current month rent payments
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  let paymentsQuery = supabase
    .from("rent_payments")
    .select("amount, flat_id")
    .eq("payment_month", currentMonth);

  if (communityId) {
    // Filter payments by flats in this community
    const flatIds = allFlats.map((f) => f.id);
    if (flatIds.length > 0) {
      paymentsQuery = paymentsQuery.in("flat_id", flatIds);
    }
  }

  const { data: payments, error: paymentsError } = await paymentsQuery;
  if (paymentsError) throw paymentsError;

  const currentMonthRent = (payments ?? []).reduce(
    (sum, p) => sum + (p.amount ?? 0),
    0
  );

  // Pending verifications
  const { count: pendingVerifications } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending_approval");

  return {
    totalFlats,
    occupiedCount,
    vacantCount,
    currentMonthRent,
    expectedRent,
    totalOwners,
    pendingVerifications: pendingVerifications ?? 0,
  };
}

export async function getRecentActivity(limit: number = 10) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getVacantFlats(communityId?: string) {
  const supabase = createClient();

  let query = supabase
    .from("flats")
    .select(
      "*, owner:owners(id, name), community:communities(id, name)"
    )
    .eq("is_active", true)
    .eq("status", "vacant");

  if (communityId) {
    query = query.eq("community_id", communityId);
  }

  const { data: flats, error: flatsError } = await query;
  if (flatsError) throw flatsError;

  // For each vacant flat, find the last tenant exit date to calculate days_vacant
  const flatIds = (flats ?? []).map((f) => f.id);

  if (flatIds.length === 0) return [];

  const { data: lastTenants } = await supabase
    .from("tenants")
    .select("flat_id, exit_date")
    .in("flat_id", flatIds)
    .eq("is_active", false)
    .order("exit_date", { ascending: false });

  // Build map of flat_id -> most recent exit_date
  const exitDateMap = new Map<string, string>();
  for (const t of lastTenants ?? []) {
    if (!exitDateMap.has(t.flat_id)) {
      exitDateMap.set(t.flat_id, t.exit_date ?? "");
    }
  }

  const today = new Date();
  return (flats ?? []).map((flat) => {
    const exitDate = exitDateMap.get(flat.id);
    let daysVacant = 0;
    if (exitDate) {
      const exit = new Date(exitDate);
      daysVacant = Math.floor(
        (today.getTime() - exit.getTime()) / (1000 * 60 * 60 * 24)
      );
    }
    return {
      ...flat,
      days_vacant: daysVacant,
      last_tenant_exit: exitDate ?? null,
    };
  });
}

export async function getAlerts() {
  const supabase = createClient();

  // 1. Overdue rents: occupied flats with no payment this month past due day
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const currentDay = now.getDate();

  const { data: occupiedFlats } = await supabase
    .from("flats")
    .select(
      "id, flat_number, rent_due_day, inclusive_rent, community:communities(id, name), owner:owners(id, name)"
    )
    .eq("is_active", true)
    .eq("status", "occupied");

  const { data: thisMonthPayments } = await supabase
    .from("rent_payments")
    .select("flat_id")
    .eq("payment_month", currentMonth);

  const paidFlatIds = new Set(
    (thisMonthPayments ?? []).map((p) => p.flat_id)
  );

  const overdueRents = (occupiedFlats ?? []).filter(
    (f) => !paidFlatIds.has(f.id) && f.rent_due_day <= currentDay
  );

  // 2. Expiring leases: tenants where lease_end_date is within 60 days
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
  const sixtyDaysStr = sixtyDaysFromNow.toISOString().split("T")[0];
  const todayStr = now.toISOString().split("T")[0];

  const { data: expiringLeases } = await supabase
    .from("tenants")
    .select("*, flat:flats(id, flat_number, community:communities(id, name))")
    .eq("is_active", true)
    .not("lease_end_date", "is", null)
    .lte("lease_end_date", sixtyDaysStr)
    .gte("lease_end_date", todayStr);

  // 3. Pending approvals count
  const { count: pendingApprovals } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending_approval");

  return {
    overdueRents: overdueRents ?? [],
    expiringLeases: expiringLeases ?? [],
    pendingApprovals: pendingApprovals ?? 0,
  };
}
