import { PageHeader } from "@/components/shared/page-header";
import { RentPaymentForm } from "@/components/forms/rent-payment-form";
import { createClient } from "@/lib/supabase/server";

export default async function RecordRentPage() {
  const supabase = createClient();

  // Fetch occupied flats with active tenants for the flat selector
  const { data: flats } = await supabase
    .from("flats")
    .select(
      "id, flat_number, inclusive_rent, base_rent, maintenance_amount, community:communities(name), owner:owners(name), active_tenant:tenants(id, name)"
    )
    .eq("status", "occupied")
    .eq("is_active", true)
    .eq("active_tenant.is_active", true)
    .order("flat_number");

  // Normalize the tenant join key from "active_tenant" to "tenant"
  const normalizedFlats = (flats ?? []).map((flat: any) => ({
    id: flat.id,
    flat_number: flat.flat_number,
    inclusive_rent: flat.inclusive_rent,
    base_rent: flat.base_rent,
    maintenance_amount: flat.maintenance_amount,
    community: flat.community,
    owner: flat.owner,
    tenant: Array.isArray(flat.active_tenant)
      ? flat.active_tenant[0] ?? null
      : flat.active_tenant,
  }));

  return (
    <div className="w-full">
      <PageHeader
        title="Record Rent Payment"
        description="Record a rent payment with proof"
        backHref="/pm/rent"
      />
      <RentPaymentForm flats={normalizedFlats} />
    </div>
  );
}
