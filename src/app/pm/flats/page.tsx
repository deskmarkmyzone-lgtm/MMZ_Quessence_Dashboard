import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { FlatsContent } from "./flats-content";

export default async function FlatsPage() {
  const supabase = createClient();

  // Fetch flats with joins
  const { data: flatsData } = await supabase
    .from("flats")
    .select("*, community:communities(id, name), owner:owners(id, name)")
    .eq("is_active", true)
    .order("flat_number");

  // Fetch active tenants to determine tenant name per flat
  const { data: tenantsData } = await supabase
    .from("tenants")
    .select("id, flat_id, name, tenant_type")
    .eq("is_active", true);

  // Build tenant map: flat_id -> tenant
  const tenantMap = new Map<string, { id: string; name: string; tenant_type: string }>();
  for (const tenant of tenantsData ?? []) {
    tenantMap.set(tenant.flat_id, tenant);
  }

  // Fetch communities for filter dropdown
  const { data: communities } = await supabase
    .from("communities")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  // Fetch owners for filter dropdown
  const { data: owners } = await supabase
    .from("owners")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  // Build flat items with tenant info attached
  const flats = (flatsData ?? []).map((flat) => {
    const tenant = tenantMap.get(flat.id);
    return {
      id: flat.id,
      flat_number: flat.flat_number,
      bhk_type: flat.bhk_type,
      carpet_area_sft: flat.carpet_area_sft,
      base_rent: flat.base_rent,
      maintenance_amount: flat.maintenance_amount,
      inclusive_rent: flat.inclusive_rent,
      status: flat.status as "occupied" | "vacant" | "under_maintenance",
      tenant_name: tenant?.name ?? null,
      tenant_type: tenant?.tenant_type ?? null,
      owner_name: flat.owner?.name ?? "",
      community_name: flat.community?.name ?? "",
      rent_due_day: flat.rent_due_day,
    };
  });

  return (
    <Suspense
      fallback={
        <div className="w-full animate-pulse">
          <div className="h-8 bg-bg-elevated rounded w-48 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-40 bg-bg-elevated rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <FlatsContent
        flats={flats}
        communities={communities ?? []}
        owners={owners ?? []}
      />
    </Suspense>
  );
}
