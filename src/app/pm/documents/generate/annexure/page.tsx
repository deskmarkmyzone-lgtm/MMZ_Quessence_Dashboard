import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AnnexureContent } from "./annexure-content";

export default async function FlatAnnexureGenerator() {
  const supabase = createClient();

  // Fetch occupied flats with active tenant and owner info
  const { data: flatsData } = await supabase
    .from("flats")
    .select(
      "id, flat_number, bhk_type, owner_id, owner:owners(name), tenants(id, name, is_active, security_deposit)"
    )
    .eq("is_active", true)
    .eq("status", "occupied");

  const flats = (flatsData ?? [])
    .map((f: any) => {
      const activeTenant = Array.isArray(f.tenants)
        ? f.tenants.find((t: any) => t.is_active)
        : null;
      if (!activeTenant) return null;
      return {
        id: f.id,
        flat_number: f.flat_number,
        bhk_type: f.bhk_type ?? "-",
        owner_id: f.owner_id,
        owner_name: f.owner?.name ?? "-",
        tenant_id: activeTenant.id,
        tenant_name: activeTenant.name,
        security_deposit: activeTenant.security_deposit ?? 0,
      };
    })
    .filter(Boolean) as {
    id: string;
    flat_number: string;
    bhk_type: string;
    owner_id: string;
    owner_name: string;
    tenant_id: string;
    tenant_name: string;
    security_deposit: number;
  }[];

  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-8 bg-bg-elevated rounded w-64 mb-6" />
          <div className="h-48 bg-bg-elevated rounded-lg mb-6" />
          <div className="h-64 bg-bg-elevated rounded-lg" />
        </div>
      }
    >
      <AnnexureContent flats={flats} />
    </Suspense>
  );
}
