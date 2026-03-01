import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { checkLeaseExpirations } from "@/lib/actions/lease-alerts";
import { checkRentOverdue } from "@/lib/actions/rent-overdue";
import { DashboardContent } from "./dashboard-content";

const CATEGORY_LABELS: Record<string, string> = {
  deep_cleaning: "Deep Cleaning",
  paint: "Paint Touch Up",
  electrical: "Electrical",
  plumbing: "Plumbing",
  ac: "AC Servicing",
  geyser: "Geyser Repair",
  carpentry: "Carpentry",
  pest_control: "Pest Control",
  chimney: "Chimney",
  other: "Other",
};

export default async function PMDashboardPage() {
  const supabase = createClient();

  // Fire-and-forget: check for expiring leases and overdue rent, create notifications
  checkLeaseExpirations().catch(() => {});
  checkRentOverdue().catch(() => {});

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split("T")[0];
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().split("T")[0];

  // ─── Parallel data fetching ───
  const [
    { data: flatsWithTenants },
    { count: totalOwners },
    { data: rentData6m },
    { data: vacantFlatsData },
    { data: outstandingDocs },
    { data: expensesData },
  ] = await Promise.all([
    // Flats with tenant names (for KPIs + punctuality)
    supabase
      .from("flats")
      .select("id, flat_number, status, inclusive_rent, rent_due_day, owner_id, updated_at, owner:owners(name), tenants(name, is_active)")
      .eq("is_active", true),
    // Owner count
    supabase
      .from("owners")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    // Rent payments for last 6 months (covers current month too)
    supabase
      .from("rent_payments")
      .select("flat_id, amount, payment_date, payment_month")
      .gte("payment_month", sixMonthsAgoStr)
      .order("payment_month", { ascending: true }),
    // Vacant flats with details
    supabase
      .from("flats")
      .select("id, flat_number, bhk_type, inclusive_rent, updated_at, owner:owners(name)")
      .eq("is_active", true)
      .eq("status", "vacant"),
    // Outstanding invoices
    supabase
      .from("documents")
      .select("id, document_number, owner:owners(name), grand_total, published_at, status")
      .in("status", ["published", "approved"])
      .not("grand_total", "is", null)
      .order("published_at", { ascending: false })
      .limit(5),
    // Expenses (for repair categories)
    supabase
      .from("expenses")
      .select("category, amount"),
  ]);

  const allFlats = flatsWithTenants ?? [];
  const totalFlats = allFlats.length;
  const occupiedCount = allFlats.filter((f: any) => f.status === "occupied").length;
  const vacantCount = allFlats.filter((f: any) => f.status === "vacant").length;
  const maintenanceCount = allFlats.filter((f: any) => f.status === "under_maintenance").length;
  const payments = rentData6m ?? [];

  // ─── Dashboard KPIs ───
  const currentMonthPayments = payments.filter((p: any) => {
    const pm = new Date(p.payment_month);
    return pm >= new Date(monthStart) && pm < new Date(nextMonthStart);
  });
  const rentCollected = currentMonthPayments.reduce((sum: number, r: any) => sum + (r.amount ?? 0), 0);
  const rentExpected = allFlats
    .filter((f: any) => f.status === "occupied")
    .reduce((sum: number, f: any) => sum + (f.inclusive_rent ?? 0), 0);

  const paidFlatIdsSet = new Set(currentMonthPayments.map((r: any) => r.flat_id));
  const pendingRents = allFlats.filter((f: any) => f.status === "occupied" && !paidFlatIdsSet.has(f.id)).length;

  // ─── Vacant flats detail ───
  const vacantFlats = (vacantFlatsData ?? []).map((f: any) => {
    const vacantSince = f.updated_at ? new Date(f.updated_at) : new Date();
    const daysVacant = Math.floor((now.getTime() - vacantSince.getTime()) / (1000 * 60 * 60 * 24));
    return {
      flat: f.flat_number,
      owner: f.owner?.name ?? "-",
      bhk: f.bhk_type ?? "-",
      vacantSince: vacantSince.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      daysVacant,
      expectedRent: f.inclusive_rent ?? 0,
      revenueLost: (f.inclusive_rent ?? 0) * Math.max(1, Math.ceil(daysVacant / 30)),
      id: f.id,
    };
  });

  // ─── Outstanding invoices ───
  const pendingInvoices = (outstandingDocs ?? []).map((d: any) => {
    const issuedDate = d.published_at ? new Date(d.published_at) : new Date();
    const daysOutstanding = Math.floor((now.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24));
    return {
      id: d.id,
      number: d.document_number ?? "-",
      owner: d.owner?.name ?? "-",
      amount: d.grand_total ?? 0,
      issuedDate: issuedDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      daysOutstanding,
      status: daysOutstanding > 30 ? "overdue" as const : "pending" as const,
    };
  });

  // ─── Analytics: Occupancy data (for pie chart) ───
  const occupancyData = [
    { name: "Occupied", value: occupiedCount, color: "#22C55E" },
    { name: "Vacant", value: vacantCount, color: "#EF4444" },
    { name: "Under Maint.", value: maintenanceCount, color: "#F59E0B" },
  ].filter((d) => d.value > 0);

  // ─── Analytics: Monthly rent collection (last 6 months) ───
  const monthlyMap = new Map<string, { collected: number; expected: number }>();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, { collected: 0, expected: rentExpected });
  }
  for (const p of payments) {
    const pm = new Date(p.payment_month);
    const key = `${pm.getFullYear()}-${String(pm.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthlyMap.get(key);
    if (entry) entry.collected += p.amount ?? 0;
  }
  const monthlyRentCollection = Array.from(monthlyMap.entries()).map(([key]) => {
    const [y, m] = key.split("-");
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    const val = monthlyMap.get(key)!;
    return {
      month: d.toLocaleDateString("en-IN", { month: "short" }),
      collected: val.collected,
      expected: val.expected,
    };
  });

  // ─── Analytics: Top repair categories ───
  const expenses = expensesData ?? [];
  const categoryMap = new Map<string, { count: number; amount: number }>();
  for (const e of expenses) {
    const cat = (e as any).category ?? "other";
    const existing = categoryMap.get(cat) ?? { count: 0, amount: 0 };
    existing.count += 1;
    existing.amount += (e as any).amount ?? 0;
    categoryMap.set(cat, existing);
  }
  const topRepairs = Array.from(categoryMap.entries())
    .map(([cat, val]) => ({
      category: CATEGORY_LABELS[cat] ?? cat,
      count: val.count,
      amount: val.amount,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  // ─── Analytics: Rent punctuality per flat (last 6 months) ───
  const paymentsByFlat = new Map<string, typeof payments>();
  for (const p of payments) {
    const list = paymentsByFlat.get(p.flat_id) ?? [];
    list.push(p);
    paymentsByFlat.set(p.flat_id, list);
  }

  const rentPunctuality = allFlats
    .filter((f: any) => f.status === "occupied")
    .map((f: any) => {
      const activeTenant = Array.isArray(f.tenants) ? f.tenants.find((t: any) => t.is_active) : null;
      const flatPayments = paymentsByFlat.get(f.id) ?? [];
      const dueDay = f.rent_due_day ?? 1;

      let onTime = 0;
      let late = 0;
      const paidMonths = new Set<string>();

      for (const p of flatPayments) {
        const payDate = new Date(p.payment_date);
        const payMonth = new Date(p.payment_month);
        const monthKey = `${payMonth.getFullYear()}-${payMonth.getMonth()}`;
        paidMonths.add(monthKey);
        if (payDate.getDate() <= dueDay + 3) {
          onTime++;
        } else {
          late++;
        }
      }

      let unpaid = 0;
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!paidMonths.has(key)) unpaid++;
      }

      const total = onTime + late + unpaid;
      const score = total > 0 ? Math.round((onTime / total) * 100) : 0;

      return { flat: f.flat_number, tenant: activeTenant?.name ?? "-", onTime, late, unpaid, score };
    });

  // ─── Analytics: Vacancy revenue impact ───
  const vacancyImpact = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - 4 + i, 0);
    const monthLabel = d.toLocaleDateString("en-IN", { month: "short" });
    const vacantInMonth = (vacantFlatsData ?? []).filter((f: any) => {
      const vacantSince = f.updated_at ? new Date(f.updated_at) : new Date();
      return vacantSince <= monthEnd;
    });
    vacancyImpact.push({
      month: monthLabel,
      revenueLost: vacantInMonth.reduce((sum: number, f: any) => sum + (f.inclusive_rent ?? 0), 0),
      vacantCount: vacantInMonth.length,
    });
  }

  const kpis = {
    totalFlats,
    occupied: occupiedCount,
    vacant: vacantCount,
    underMaintenance: maintenanceCount,
    rentCollected,
    rentExpected,
    pendingRents,
    totalOwners: totalOwners ?? 0,
  };

  const analytics = {
    occupancyData,
    monthlyRentCollection,
    topRepairs,
    rentPunctuality,
    vacancyImpact,
  };

  return (
    <Suspense
      fallback={
        <div className="w-full animate-pulse space-y-6">
          <div className="h-16 bg-bg-elevated rounded-lg" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 bg-bg-elevated rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <DashboardContent
        kpis={kpis}
        vacantFlats={vacantFlats}
        pendingInvoices={pendingInvoices}
        analytics={analytics}
      />
    </Suspense>
  );
}
