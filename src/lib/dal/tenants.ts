import { createClient } from "@/lib/supabase/server";

export async function getActiveTenantByFlatId(flatId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("flat_id", flatId)
    .eq("is_active", true)
    .single();

  if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found
  return data;
}

export async function getTenantById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*, bachelor_occupants:bachelor_occupants(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getPastTenantsByFlatId(flatId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("flat_id", flatId)
    .eq("is_active", false)
    .order("exit_date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
