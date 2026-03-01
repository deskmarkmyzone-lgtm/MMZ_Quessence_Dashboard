import { createClient } from "@/lib/supabase/server";

/**
 * Fetch all expenses with flat info, ordered by flat and date.
 * Used to analyze repair patterns per flat and category.
 */
export async function getExpensesForPrediction() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("expenses")
    .select(
      "id, flat_id, category, description, amount, expense_date, flat:flats(id, flat_number, bhk_type, carpet_area_sft, status, owner:owners(id, name))"
    )
    .order("expense_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Fetch all active flats with their latest tenant info.
 */
export async function getActiveFlatsForPrediction() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("flats")
    .select(
      "id, flat_number, bhk_type, carpet_area_sft, status, inclusive_rent, owner:owners(id, name), tenant:tenants(id, name, tenant_type, lease_start_date, is_active)"
    )
    .eq("is_active", true);

  if (error) throw error;
  return data ?? [];
}
