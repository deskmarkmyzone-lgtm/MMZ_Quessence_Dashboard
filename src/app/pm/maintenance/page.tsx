import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { MaintenanceContent } from "./maintenance-content";

export default async function MaintenancePage() {
  const supabase = createClient();

  const [{ data: maintenanceData }, { data: flatsData }] = await Promise.all([
    supabase
      .from("community_maintenance")
      .select("*, flat:flats(id, flat_number, bhk_type, carpet_area_sft, owner:owners(name))")
      .order("period_start", { ascending: false })
      .limit(100),
    supabase
      .from("flats")
      .select("id, flat_number, owner:owners(name)")
      .eq("is_active", true)
      .order("flat_number"),
  ]);

  const records = (maintenanceData ?? []).map((m: any) => ({
    id: m.id,
    flat_number: m.flat?.flat_number ?? "-",
    bhk: m.flat?.bhk_type ?? "-",
    sqft: m.flat?.carpet_area_sft ?? 0,
    quarter: m.quarter,
    amount: m.maintenance_amount,
    pending: m.previous_pending ?? 0,
    total: m.total_amount ?? (m.maintenance_amount + (m.previous_pending ?? 0)),
    paid: m.is_paid,
    owner: m.flat?.owner?.name ?? "-",
  }));

  const flats = (flatsData ?? []).map((f: any) => ({
    id: f.id,
    flat_number: f.flat_number,
    owner: f.owner?.name ?? "-",
  }));

  return (
    <Suspense
      fallback={
        <div className="w-full animate-pulse">
          <div className="h-8 bg-bg-elevated rounded w-48 mb-6" />
          <div className="h-64 bg-bg-elevated rounded-lg" />
        </div>
      }
    >
      <MaintenanceContent records={records} flats={flats} />
    </Suspense>
  );
}
