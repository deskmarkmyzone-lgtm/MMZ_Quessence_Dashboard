import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { OwnersContent } from "./owners-content";

export default async function OwnersPage() {
  const supabase = createClient();

  // Get owners
  const { data: owners } = await supabase
    .from("owners")
    .select("*")
    .eq("is_active", true)
    .order("name");

  // Get flat counts per owner (with community info)
  const { data: flats } = await supabase
    .from("flats")
    .select("id, owner_id, status, community_id, community:communities(name)")
    .eq("is_active", true);

  // Fetch communities for filter dropdown
  const { data: communitiesData } = await supabase
    .from("communities")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  // Compute stats per owner + track which communities each owner has flats in
  const statsMap = new Map<string, { flat_count: number; occupied: number; vacant: number; total_rent: number; communities: Set<string> }>();
  for (const flat of flats ?? []) {
    if (!statsMap.has(flat.owner_id)) {
      statsMap.set(flat.owner_id, { flat_count: 0, occupied: 0, vacant: 0, total_rent: 0, communities: new Set() });
    }
    const s = statsMap.get(flat.owner_id)!;
    s.flat_count++;
    if (flat.status === "occupied") s.occupied++;
    if (flat.status === "vacant") s.vacant++;
    const communityName = (flat.community as any)?.name;
    if (communityName) s.communities.add(communityName);
  }

  // Build enriched owners list
  const enrichedOwners = (owners ?? []).map((owner) => {
    const stats = statsMap.get(owner.id) ?? { flat_count: 0, occupied: 0, vacant: 0, total_rent: 0, communities: new Set<string>() };
    return {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      brokerage_calc_method: owner.brokerage_calc_method as "days_of_rent" | "percentage" | "fixed_amount",
      brokerage_days: owner.brokerage_days,
      brokerage_percentage: owner.brokerage_percentage,
      onboarding_completed: owner.onboarding_completed,
      flat_count: stats.flat_count,
      occupied: stats.occupied,
      vacant: stats.vacant,
      total_rent: stats.total_rent,
      community_names: Array.from(stats.communities),
    };
  });

  return (
    <Suspense fallback={<div className="w-full animate-pulse"><div className="h-8 bg-bg-elevated rounded w-48 mb-6" /><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-48 bg-bg-elevated rounded-lg" />)}</div></div>}>
      <OwnersContent owners={enrichedOwners} communities={communitiesData ?? []} />
    </Suspense>
  );
}
