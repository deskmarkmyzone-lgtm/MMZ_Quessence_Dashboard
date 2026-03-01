import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { BrokerageContent } from "./brokerage-content";

export default async function BrokerageInvoiceGenerator() {
  const supabase = createClient();

  // Fetch active owners with brokerage fields
  const { data: ownersData } = await supabase
    .from("owners")
    .select(
      "id, name, email, brokerage_calc_method, brokerage_days, brokerage_percentage, brokerage_fixed_amount, gst_applicable, family_group_name"
    )
    .eq("is_active", true);

  const owners = (ownersData ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    brokerage_calc_method: row.brokerage_calc_method,
    brokerage_days: row.brokerage_days,
    brokerage_percentage: row.brokerage_percentage,
    brokerage_fixed_amount: row.brokerage_fixed_amount,
    gst_applicable: row.gst_applicable,
    family_group_name: row.family_group_name,
  }));

  // Fetch active tenants with flat details (eligible for brokerage)
  const { data: tenantsData } = await supabase
    .from("tenants")
    .select(
      "id, name, flat:flats(id, flat_number, bhk_type, carpet_area_sft, inclusive_rent, owner_id, tower, floor), lease_start_date"
    )
    .eq("is_active", true);

  const eligibleTenants = (tenantsData ?? [])
    .filter((row: any) => row.flat && row.lease_start_date)
    .map((row: any) => {
      const flat = row.flat;
      return {
        id: row.id,
        owner_id: flat.owner_id,
        tenant_name: row.name,
        flat_number: flat.flat_number,
        tower: flat.tower ?? parseInt(flat.flat_number[0]),
        bhk_type: flat.bhk_type,
        carpet_area_sft: flat.carpet_area_sft ?? 0,
        inclusive_rent: flat.inclusive_rent,
        lease_start: row.lease_start_date,
      };
    });

  // Fetch MMZ bank details from settings
  const { data: settingsData } = await supabase
    .from("mmz_settings")
    .select("*")
    .maybeSingle();

  const bankDetails = {
    account_name: settingsData?.account_name ?? "Mark My Zone",
    bank_name: settingsData?.bank_name ?? "",
    account_number: settingsData?.account_number ?? "",
    ifsc: settingsData?.ifsc ?? "",
    branch: settingsData?.branch ?? "",
    pan: settingsData?.pan ?? "",
  };

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
      <BrokerageContent
        owners={owners}
        eligibleTenants={eligibleTenants}
        bankDetails={bankDetails}
      />
    </Suspense>
  );
}
