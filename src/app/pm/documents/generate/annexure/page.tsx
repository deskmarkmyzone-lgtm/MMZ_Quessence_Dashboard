import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AnnexureContent } from "./annexure-content";

export default async function FlatAnnexureGenerator() {
  const supabase = createClient();

  // Fetch occupied flats with active tenant and owner info
  const { data: flatsData } = await supabase
    .from("flats")
    .select(
      "id, flat_number, bhk_type, carpet_area_sft, owner_id, owner:owners(name), tenants(id, name, phone, email, tenant_type, occupation_type, company_name, business_name, family_member_count, bachelor_occupant_count, bachelor_gender, lease_start_date, lease_end_date, security_deposit, monthly_rent, monthly_maintenance, monthly_inclusive_rent, is_active)"
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
        carpet_area_sft: f.carpet_area_sft ?? null,
        owner_id: f.owner_id,
        owner_name: f.owner?.name ?? "-",
        tenant_id: activeTenant.id,
        tenant_name: activeTenant.name,
        tenant_phone: activeTenant.phone ?? null,
        tenant_email: activeTenant.email ?? null,
        tenant_type: activeTenant.tenant_type ?? null,
        occupation_type: activeTenant.occupation_type ?? null,
        company_name: activeTenant.company_name ?? null,
        business_name: activeTenant.business_name ?? null,
        family_member_count: activeTenant.family_member_count ?? null,
        bachelor_occupant_count: activeTenant.bachelor_occupant_count ?? null,
        bachelor_gender: activeTenant.bachelor_gender ?? null,
        lease_start_date: activeTenant.lease_start_date ?? null,
        lease_end_date: activeTenant.lease_end_date ?? null,
        security_deposit: activeTenant.security_deposit ?? 0,
        monthly_rent: activeTenant.monthly_rent ?? 0,
        monthly_maintenance: activeTenant.monthly_maintenance ?? 0,
        monthly_inclusive_rent: activeTenant.monthly_inclusive_rent ?? 0,
      };
    })
    .filter(Boolean) as {
    id: string;
    flat_number: string;
    bhk_type: string;
    carpet_area_sft: number | null;
    owner_id: string;
    owner_name: string;
    tenant_id: string;
    tenant_name: string;
    tenant_phone: string | null;
    tenant_email: string | null;
    tenant_type: string | null;
    occupation_type: string | null;
    company_name: string | null;
    business_name: string | null;
    family_member_count: number | null;
    bachelor_occupant_count: number | null;
    bachelor_gender: string | null;
    lease_start_date: string | null;
    lease_end_date: string | null;
    security_deposit: number;
    monthly_rent: number;
    monthly_maintenance: number;
    monthly_inclusive_rent: number;
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
