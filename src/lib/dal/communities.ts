import { createClient } from "@/lib/supabase/server";

export async function getCommunities() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getCommunityById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getCommunityWithStats(id: string) {
  const supabase = createClient();

  // Get the community
  const { data: community, error: communityError } = await supabase
    .from("communities")
    .select("*")
    .eq("id", id)
    .single();

  if (communityError) throw communityError;

  // Get flat counts by status
  const { data: flats, error: flatsError } = await supabase
    .from("flats")
    .select("id, status, owner_id")
    .eq("community_id", id)
    .eq("is_active", true);

  if (flatsError) throw flatsError;

  const totalFlats = flats?.length ?? 0;
  const occupiedFlats = flats?.filter((f) => f.status === "occupied").length ?? 0;
  const vacantFlats = flats?.filter((f) => f.status === "vacant").length ?? 0;
  const uniqueOwners = new Set(flats?.map((f) => f.owner_id)).size;

  return {
    ...community,
    stats: {
      totalFlats,
      occupiedFlats,
      vacantFlats,
      uniqueOwners,
    },
  };
}
