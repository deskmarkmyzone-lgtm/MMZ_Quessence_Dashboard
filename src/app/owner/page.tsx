import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardContent } from "./dashboard-content";

export default async function OwnerDashboardPage() {
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

  // Fetch owner's flats with community and active tenant info
  const { data: flatsData } = await supabase
    .from("flats")
    .select("id, flat_number, bhk_type, carpet_area_sft, inclusive_rent, base_rent, maintenance_amount, status, community:communities(name), tenants(name, tenant_type, is_active)")
    .eq("owner_id", owner.id)
    .eq("is_active", true);

  const flats = flatsData ?? [];
  const flatIds = flats.map((f: any) => f.id);

  // Fetch rent payments for current month to determine paid/unpaid status
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    .toISOString()
    .split("T")[0];

  const currentMonthLabel = now.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });

  let currentMonthPayments: any[] = [];
  if (flatIds.length > 0) {
    const { data: paymentsData } = await supabase
      .from("rent_payments")
      .select("flat_id, amount")
      .in("flat_id", flatIds)
      .gte("payment_month", monthStart)
      .lt("payment_month", nextMonthStart);
    currentMonthPayments = paymentsData ?? [];
  }

  const paidFlatIds = new Set(currentMonthPayments.map((p: any) => p.flat_id));

  const ownerFlats = flats.map((f: any) => {
    const activeTenant = Array.isArray(f.tenants)
      ? f.tenants.find((t: any) => t.is_active)
      : null;
    return {
      id: f.id,
      flat_number: f.flat_number,
      community: f.community?.name ?? "-",
      bhk: f.bhk_type ?? "-",
      sqft: f.carpet_area_sft ?? 0,
      status: f.status as "occupied" | "vacant" | "under_maintenance",
      tenant_type: activeTenant?.tenant_type ?? null,
      tenant_name: activeTenant?.name ?? null,
      rent: f.inclusive_rent ?? 0,
      rent_status: (f.status === "occupied" && paidFlatIds.has(f.id)
        ? "paid"
        : f.status === "occupied"
          ? "unpaid"
          : "paid") as "paid" | "unpaid",
      rent_month: currentMonthLabel,
    };
  });

  // Recent rent payments (last 10)
  let recentPayments: any[] = [];
  if (flatIds.length > 0) {
    const { data: recentPaymentsData } = await supabase
      .from("rent_payments")
      .select("id, amount, payment_date, flat:flats(flat_number)")
      .in("flat_id", flatIds)
      .order("payment_date", { ascending: false })
      .limit(10);
    recentPayments = recentPaymentsData ?? [];
  }

  // Recent expenses (last 5)
  let recentExpenses: any[] = [];
  if (flatIds.length > 0) {
    const { data: recentExpensesData } = await supabase
      .from("expenses")
      .select("id, amount, expense_date, description, category, flat:flats(flat_number)")
      .in("flat_id", flatIds)
      .order("expense_date", { ascending: false })
      .limit(5);
    recentExpenses = recentExpensesData ?? [];
  }

  // Unread notification count
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_type", "owner")
    .eq("recipient_id", owner.id)
    .eq("is_read", false);

  // Build activity list from payments and expenses
  const activity: {
    id: string;
    message: string;
    date: string;
    type: "rent" | "expense" | "document";
  }[] = [];

  for (const p of recentPayments) {
    const flatNum = p.flat?.flat_number ?? "?";
    activity.push({
      id: `rent-${p.id}`,
      message: `Rent recorded for Flat ${flatNum} — ₹${Number(p.amount).toLocaleString("en-IN")}`,
      date: new Date(p.payment_date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      type: "rent",
    });
  }

  for (const e of recentExpenses) {
    const flatNum = e.flat?.flat_number ?? "?";
    activity.push({
      id: `expense-${e.id}`,
      message: `Expense: ${e.description ?? e.category} ₹${Number(e.amount).toLocaleString("en-IN")} for Flat ${flatNum}`,
      date: new Date(e.expense_date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      type: "expense",
    });
  }

  // Sort by date descending and take first 10
  activity.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const recentActivity = activity.slice(0, 10);

  return (
    <DashboardContent
      ownerName={owner.name}
      flats={ownerFlats}
      recentActivity={recentActivity}
      unreadNotificationCount={unreadCount ?? 0}
    />
  );
}
