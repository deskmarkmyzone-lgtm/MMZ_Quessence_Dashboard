import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FlatsContent } from "./flats-content";

export default async function OwnerFlatsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: owner } = await supabase
    .from("owners")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!owner) redirect("/access-denied");

  // Fetch owner's flats with community and active tenants
  const { data: flatsData } = await supabase
    .from("flats")
    .select(
      "id, flat_number, bhk_type, carpet_area_sft, inclusive_rent, status, community:communities(name), tenants(name, tenant_type, is_active)"
    )
    .eq("owner_id", owner.id)
    .eq("is_active", true)
    .order("flat_number", { ascending: true });

  const flats = (flatsData ?? []).map((f: any) => {
    const activeTenant = Array.isArray(f.tenants)
      ? f.tenants.find((t: any) => t.is_active)
      : null;
    return {
      id: f.id,
      flat_number: f.flat_number,
      bhk: f.bhk_type ?? "-",
      sqft: f.carpet_area_sft ?? 0,
      status: f.status as "occupied" | "vacant" | "under_maintenance",
      tenant_name: activeTenant?.name ?? null,
      tenant_type: activeTenant?.tenant_type ?? null,
      rent: f.inclusive_rent ?? 0,
    };
  });

  // Collect unique community names
  const communityNames = Array.from(
    new Set(
      (flatsData ?? [])
        .map((f: any) => f.community?.name)
        .filter(Boolean) as string[]
    )
  );

  return <FlatsContent flats={flats} communityNames={communityNames} />;
}
