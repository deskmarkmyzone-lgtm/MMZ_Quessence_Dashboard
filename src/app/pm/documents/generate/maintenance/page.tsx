import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { MaintenanceTrackerContent } from "./maintenance-tracker-content";

export default async function MaintenanceTrackerPage() {
  const supabase = createClient();

  const { data: ownersData } = await supabase
    .from("owners")
    .select("id, name")
    .eq("is_active", true);

  const { data: maintenanceData } = await supabase
    .from("community_maintenance")
    .select(
      "id, flat_id, quarter, maintenance_amount, previous_pending, total_amount, flat:flats(flat_number, bhk_type, carpet_area_sft, owner_id)"
    )
    .order("period_start", { ascending: false });

  const { data: settingsData } = await supabase
    .from("mmz_settings")
    .select("*")
    .maybeSingle();

  const owners = (ownersData ?? []).map((o: any) => ({
    id: o.id,
    name: o.name,
  }));

  const maintenanceRecords = (maintenanceData ?? []).map((m: any) => ({
    id: m.id,
    flat_id: m.flat_id,
    quarter: m.quarter,
    maintenance_amount: m.maintenance_amount ?? 0,
    previous_pending: m.previous_pending ?? 0,
    total_amount: m.total_amount ?? (m.maintenance_amount + (m.previous_pending ?? 0)),
    flat_number: m.flat?.flat_number ?? "-",
    bhk_type: m.flat?.bhk_type ?? "-",
    carpet_area_sft: m.flat?.carpet_area_sft ?? 0,
    owner_id: m.flat?.owner_id ?? "",
  }));

  const bankDetails = settingsData
    ? {
        bank_name: settingsData.bank_name,
        account_number: settingsData.account_number,
        ifsc_code: settingsData.ifsc_code,
        branch_name: settingsData.branch_name,
        account_holder_name: settingsData.account_holder_name,
      }
    : null;

  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto animate-pulse">
          <div className="h-8 bg-bg-elevated rounded w-64 mb-6" />
          <div className="h-48 bg-bg-elevated rounded-lg mb-6" />
          <div className="h-64 bg-bg-elevated rounded-lg" />
        </div>
      }
    >
      <MaintenanceTrackerContent
        owners={owners}
        maintenanceRecords={maintenanceRecords}
        bankDetails={bankDetails}
      />
    </Suspense>
  );
}
