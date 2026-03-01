import { createClient } from "@/lib/supabase/server";

export async function getNotifications(
  recipientType: string,
  recipientId: string,
  filters?: { type?: string; unreadOnly?: boolean }
) {
  const supabase = createClient();

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("recipient_type", recipientType)
    .eq("recipient_id", recipientId)
    .order("created_at", { ascending: false });

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }

  if (filters?.unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data ?? [];
}

export async function getUnreadCount(
  recipientType: string,
  recipientId: string
) {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_type", recipientType)
    .eq("recipient_id", recipientId)
    .eq("is_read", false);

  if (error) throw error;
  return count ?? 0;
}
