import { createClient } from "@/lib/supabase/server";

export async function getAuditLog(filters?: {
  search?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
}) {
  const supabase = createClient();

  let query = supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters?.action) {
    query = query.eq("action", filters.action);
  }

  if (filters?.entityType) {
    query = query.eq("entity_type", filters.entityType);
  }

  if (filters?.entityId) {
    query = query.eq("entity_id", filters.entityId);
  }

  if (filters?.search) {
    query = query.or(
      `description.ilike.%${filters.search}%,entity_type.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) throw error;
  return data ?? [];
}
