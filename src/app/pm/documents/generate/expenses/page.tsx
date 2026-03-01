import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ExpensesContent } from "./expenses-content";

export default async function ExpensesBillGenerator() {
  const supabase = createClient();

  // Fetch active owners (id, name)
  const { data: ownersData } = await supabase
    .from("owners")
    .select("id, name")
    .eq("is_active", true);

  const owners = (ownersData ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
  }));

  // Fetch active flats with owner_id
  const { data: flatsData } = await supabase
    .from("flats")
    .select("id, flat_number, bhk_type, carpet_area_sft, owner_id")
    .eq("is_active", true);

  const flats = (flatsData ?? []).map((row: any) => ({
    id: row.id,
    flat_number: row.flat_number,
    bhk_type: row.bhk_type,
    carpet_area_sft: row.carpet_area_sft ?? 0,
    owner_id: row.owner_id,
  }));

  // Fetch PM-paid expenses with pending recovery
  const { data: expensesData } = await supabase
    .from("expenses")
    .select(
      "id, flat_id, category, description, amount, expense_date, vendor_name"
    )
    .eq("paid_by", "pm")
    .eq("recovery_status", "pending");

  const expenses = (expensesData ?? []).map((row: any) => ({
    id: row.id,
    flat_id: row.flat_id,
    category: row.category,
    description: row.description,
    amount: row.amount,
    expense_date: row.expense_date,
    vendor_name: row.vendor_name,
  }));

  // Fetch MMZ bank details from settings
  const { data: settingsData } = await supabase
    .from("mmz_settings")
    .select("*")
    .maybeSingle();

  const bankDetails = {
    account_name: settingsData?.account_name ?? "Mark My Zone",
    bank_name: settingsData?.bank_name ?? "",
    account_number: settingsData?.account_number ?? "",
    ifsc: settingsData?.ifsc ?? "",
    branch: settingsData?.branch ?? "",
    pan: settingsData?.pan ?? "",
  };

  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto animate-pulse">
          <div className="h-8 bg-bg-elevated rounded w-64 mb-6" />
          <div className="h-48 bg-bg-elevated rounded-lg mb-6" />
          <div className="h-64 bg-bg-elevated rounded-lg" />
        </div>
      }
    >
      <ExpensesContent
        owners={owners}
        flats={flats}
        expenses={expenses}
        bankDetails={bankDetails}
      />
    </Suspense>
  );
}
