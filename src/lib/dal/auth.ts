import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

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

/** Get the current PM user with their role. Returns null if not logged in or not a PM user. */
export async function getCurrentPmUserWithRole(): Promise<{
  id: string;
  role: UserRole;
  name: string;
} | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("pm_users")
    .select("id, role, name")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .single();

  return data as { id: string; role: UserRole; name: string } | null;
}

/** Check if a role can approve/reject documents and perform admin actions */
export function canApprove(role: UserRole): boolean {
  return role === "super_admin" || role === "admin";
}

/** Check if a role can delete records */
export function canDelete(role: UserRole): boolean {
  return role === "super_admin" || role === "admin";
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
