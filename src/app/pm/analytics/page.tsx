import { createClient } from "@/lib/supabase/server";
import { AnalyticsContent } from "./analytics-content";

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

export default async function AnalyticsPage() {
  const supabase = createClient();

  // 1. Fetch all active flats with status
  const { data: flatsData } = await supabase
    .from("flats")
    .select("id, flat_number, status, inclusive_rent, rent_due_day, tenants(name, is_active)")
    .eq("is_active", true);

  const flats = flatsData ?? [];
  const totalFlats = flats.length;
  const occupiedFlats = flats.filter((f: any) => f.status === "occupied").length;
  const vacantFlats = flats.filter((f: any) => f.status === "vacant").length;
  const maintenanceFlats = flats.filter((f: any) => f.status === "under_maintenance").length;

  const occupancyData = [
    { name: "Occupied", value: occupiedFlats, color: "#22C55E" },
    { name: "Vacant", value: vacantFlats, color: "#EF4444" },
    { name: "Under Maint.", value: maintenanceFlats, color: "#F59E0B" },
  ].filter((d) => d.value > 0);

  // 2. Fetch rent payments for the last 6 months
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().split("T")[0];

  const { data: paymentsData } = await supabase
    .from("rent_payments")
    .select("flat_id, amount, payment_date, payment_month, payment_status")
    .gte("payment_month", sixMonthsAgoStr)
    .order("payment_month", { ascending: true });

  const payments = paymentsData ?? [];

  // Build monthly rent collection chart data
  const monthlyMap = new Map<string, { collected: number; expected: number }>();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const expectedRent = flats
      .filter((f: any) => f.status === "occupied")
      .reduce((sum: number, f: any) => sum + (f.inclusive_rent ?? 0), 0);
    monthlyMap.set(key, { collected: 0, expected: expectedRent });
  }

  for (const p of payments) {
    const pm = new Date(p.payment_month);
    const key = `${pm.getFullYear()}-${String(pm.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthlyMap.get(key);
    if (entry) {
      entry.collected += p.amount ?? 0;
    }
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

  // 3. Fetch all expenses for top repair categories
  const { data: expensesData } = await supabase
    .from("expenses")
    .select("category, amount");

  const expenses = expensesData ?? [];
  const categoryMap = new Map<string, { count: number; amount: number }>();
  for (const e of expenses) {
    const cat = e.category ?? "other";
    const existing = categoryMap.get(cat) ?? { count: 0, amount: 0 };
    existing.count += 1;
    existing.amount += e.amount ?? 0;
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

  // 4. Compute rent punctuality per flat
  // Group payments by flat_id
  const paymentsByFlat = new Map<string, typeof payments>();
  for (const p of payments) {
    const list = paymentsByFlat.get(p.flat_id) ?? [];
    list.push(p);
    paymentsByFlat.set(p.flat_id, list);
  }

  const rentPunctuality = flats
    .filter((f: any) => f.status === "occupied")
    .map((f: any) => {
      const activeTenant = Array.isArray(f.tenants)
        ? f.tenants.find((t: any) => t.is_active)
        : null;
      const flatPayments = paymentsByFlat.get(f.id) ?? [];
      const dueDay = f.rent_due_day ?? 1;

      let onTime = 0;
      let late = 0;

      // Check each payment
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

      // Count unpaid months
      let unpaid = 0;
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!paidMonths.has(key)) {
          unpaid++;
        }
      }

      const total = onTime + late + unpaid;
      const score = total > 0 ? Math.round((onTime / total) * 100) : 0;

      return {
        flat: f.flat_number,
        tenant: activeTenant?.name ?? "-",
        onTime,
        late,
        unpaid,
        score,
      };
    });

  // 5. Compute vacancy revenue impact per month
  // For each of the last 6 months, count how many flats were vacant and estimate lost revenue
  const { data: vacantFlatsData } = await supabase
    .from("flats")
    .select("id, inclusive_rent, status, updated_at")
    .eq("is_active", true)
    .eq("status", "vacant");

  const vacancyImpact = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - 4 + i, 0);
    const monthLabel = d.toLocaleDateString("en-IN", { month: "short" });

    // Count flats that were already vacant by this month
    // (updated_at <= monthEnd means status was set before or during that month)
    const vacantInMonth = (vacantFlatsData ?? []).filter((f: any) => {
      const vacantSince = f.updated_at ? new Date(f.updated_at) : new Date();
      return vacantSince <= monthEnd;
    });

    const revenueLost = vacantInMonth.reduce(
      (sum: number, f: any) => sum + (f.inclusive_rent ?? 0),
      0
    );

    vacancyImpact.push({
      month: monthLabel,
      revenueLost,
      vacantCount: vacantInMonth.length,
    });
  }

  return (
    <AnalyticsContent
      rentPunctuality={rentPunctuality}
      topRepairs={topRepairs}
      monthlyRentCollection={monthlyRentCollection}
      occupancyData={occupancyData}
      vacancyImpact={vacancyImpact}
      totalFlats={totalFlats}
      occupiedFlats={occupiedFlats}
    />
  );
}
