import { createClient } from "@/lib/supabase/server";

export async function getMaintenance(filters?: {
  quarter?: string;
  flatId?: string;
}) {
  const supabase = createClient();

  let query = supabase
    .from("community_maintenance")
    .select(
      "*, flat:flats(id, flat_number, owner:owners(id, name))"
    )
    .order("period_start", { ascending: false });

  if (filters?.quarter) {
    query = query.eq("quarter", filters.quarter);
  }

  if (filters?.flatId) {
    query = query.eq("flat_id", filters.flatId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data ?? [];
}

export async function getMaintenanceByFlatId(flatId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("community_maintenance")
    .select("*")
    .eq("flat_id", flatId)
    .order("period_start", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
