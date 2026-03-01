import { createClient } from "@/lib/supabase/server";

export async function getCurrentAuthUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getPmUser(authUserId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("pm_users")
    .select("*")
    .eq("auth_user_id", authUserId)
    .eq("is_active", true)
    .single();
  return data;
}

export async function getOwnerByAuthId(authUserId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("owners")
    .select("*")
    .eq("auth_user_id", authUserId)
    .eq("is_active", true)
    .single();
  return data;
}

export async function getOwnerByEmail(email: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("owners")
    .select("*")
    .eq("email", email)
    .eq("is_active", true)
    .single();
  return data;
}
