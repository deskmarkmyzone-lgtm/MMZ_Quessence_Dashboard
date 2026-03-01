import { createClient } from "@/lib/supabase/server";

export async function getExpenses(filters?: {
  search?: string;
  category?: string;
  recoveryStatus?: string;
  flatId?: string;
}) {
  const supabase = createClient();

  let query = supabase
    .from("expenses")
    .select(
      "*, flat:flats(id, flat_number, owner:owners(id, name))"
    )
    .order("expense_date", { ascending: false });

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  if (filters?.recoveryStatus) {
    query = query.eq("recovery_status", filters.recoveryStatus);
  }

  if (filters?.flatId) {
    query = query.eq("flat_id", filters.flatId);
  }

  if (filters?.search) {
    query = query.or(
      `description.ilike.%${filters.search}%,vendor_name.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) throw error;
  return data ?? [];
}

export async function getExpensesByFlatId(flatId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("flat_id", flatId)
    .order("expense_date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
