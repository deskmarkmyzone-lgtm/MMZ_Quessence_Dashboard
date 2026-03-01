import { createClient } from "@/lib/supabase/server";

export async function getDocuments(filters?: {
  type?: string;
  status?: string;
  search?: string;
}) {
  const supabase = createClient();

  let query = supabase
    .from("documents")
    .select("*, owner:owners(id, name)")
    .order("created_at", { ascending: false });

  if (filters?.type) {
    query = query.eq("document_type", filters.type);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    query = query.or(
      `document_number.ilike.%${filters.search}%,period_label.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) throw error;
  return data ?? [];
}

export async function getDocumentById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*, owner:owners(*), community:communities(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getPendingApprovals() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*, owner:owners(id, name)")
    .eq("status", "pending_approval")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
