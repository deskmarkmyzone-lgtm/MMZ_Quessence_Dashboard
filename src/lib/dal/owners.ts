import { createClient } from "@/lib/supabase/server";

export async function getOwners(filters?: {
  search?: string;
  communityId?: string;
}) {
  const supabase = createClient();

  let query = supabase
    .from("owners")
    .select("*, flats(id)")
    .eq("is_active", true)
    .order("name");

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    );
  }

  if (filters?.communityId) {
    query = query.eq("flats.community_id", filters.communityId);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Map to include flat_count
  const owners = (data ?? []).map((owner) => {
    const { flats, ...rest } = owner;
    return {
      ...rest,
      flat_count: Array.isArray(flats) ? flats.length : 0,
    };
  });

  // If filtering by communityId, only return owners who actually have flats in that community
  if (filters?.communityId) {
    return owners.filter((o) => o.flat_count > 0);
  }

  return owners;
}

export async function getOwnerById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("owners")
    .select("*, flats(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getOwnersList() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("owners")
    .select("id, name, email")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data ?? [];
}
