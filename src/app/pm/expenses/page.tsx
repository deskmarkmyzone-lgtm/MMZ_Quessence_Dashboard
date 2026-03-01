import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ExpensesContent } from "./expenses-content";

export default async function ExpensesPage() {
  const supabase = createClient();

  const { data: expensesData } = await supabase
    .from("expenses")
    .select("*, flat:flats(id, flat_number, community:communities(name), owner:owners(name))")
    .order("expense_date", { ascending: false })
    .limit(100);

  const expenses = (expensesData ?? []).map((e: any) => ({
    id: e.id,
    flat_number: e.flat?.flat_number ?? "-",
    category: e.category,
    description: e.description,
    amount: e.amount,
    date: e.expense_date,
    vendor: e.vendor_name ?? "-",
    paid_by: e.paid_by,
    recovery: e.recovery_status,
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
      <ExpensesContent expenses={expenses} />
    </Suspense>
  );
}
