import { createClient } from "@/lib/supabase/server";

export async function getFlats(filters?: {
  search?: string;
  communityId?: string;
  ownerId?: string;
  status?: string;
  bhkType?: string;
}) {
  const supabase = createClient();

  let query = supabase
    .from("flats")
    .select(
      "*, community:communities(id, name), owner:owners(id, name), active_tenant:tenants(id, name, tenant_type)"
    )
    .eq("is_active", true)
    .eq("active_tenant.is_active", true)
    .order("flat_number");

  if (filters?.search) {
    query = query.or(`flat_number.ilike.%${filters.search}%`);
  }

  if (filters?.communityId) {
    query = query.eq("community_id", filters.communityId);
  }

  if (filters?.ownerId) {
    query = query.eq("owner_id", filters.ownerId);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.bhkType) {
    query = query.eq("bhk_type", filters.bhkType);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data ?? [];
}

export async function getFlatById(id: string) {
  const supabase = createClient();

  // Get flat with community, owner, and active tenant
  const { data: flat, error: flatError } = await supabase
    .from("flats")
    .select(
      "*, community:communities(*), owner:owners(*), active_tenant:tenants(*)"
    )
    .eq("id", id)
    .eq("active_tenant.is_active", true)
    .single();

  if (flatError) throw flatError;

  // Get recent rent payments (last 12)
  const { data: rentPayments } = await supabase
    .from("rent_payments")
    .select("*")
    .eq("flat_id", id)
    .order("payment_month", { ascending: false })
    .limit(12);

  // Get recent expenses
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("flat_id", id)
    .order("expense_date", { ascending: false })
    .limit(20);

  return {
    ...flat,
    rent_payments: rentPayments ?? [],
    expenses: expenses ?? [],
  };
}

export async function getFlatsList() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("flats")
    .select("id, flat_number, community_id, owner_id, status, inclusive_rent")
    .eq("is_active", true)
    .order("flat_number");

  if (error) throw error;
  return data ?? [];
}

export async function getRentRevisions(flatId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("rent_revisions")
    .select("*")
    .eq("flat_id", flatId)
    .order("revision_date", { ascending: false });
  return data ?? [];
}

export async function getOccupiedFlatsForRentRecording() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("flats")
    .select(
      "*, community:communities(id, name), owner:owners(id, name), active_tenant:tenants(id, name)"
    )
    .eq("is_active", true)
    .eq("status", "occupied")
    .eq("active_tenant.is_active", true)
    .order("flat_number");

  if (error) throw error;
  return data ?? [];
}
