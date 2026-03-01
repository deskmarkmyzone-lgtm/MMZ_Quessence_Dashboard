import { createClient } from "@/lib/supabase/server";

export async function getSettings() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mmz_settings")
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getTeamMembers() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pm_users")
    .select("*")
    .order("role")
    .order("name");

  if (error) throw error;
  return data ?? [];
}
