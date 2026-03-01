import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { FlatForm } from "@/components/forms/flat-form";

export default async function NewFlatPage() {
  const supabase = createClient();

  // Fetch communities for selector
  const { data: communities } = await supabase
    .from("communities")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  // Fetch owners for selector
  const { data: owners } = await supabase
    .from("owners")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  // Fetch maintenance rate from settings
  const { data: settings } = await supabase
    .from("mmz_settings")
    .select("maintenance_rate_per_sqft")
    .limit(1)
    .maybeSingle();

  const maintenanceRate = settings?.maintenance_rate_per_sqft ?? undefined;

  return (
    <div className="w-full">
      <PageHeader
        title="Add Flat"
        description="Create a new flat"
        backHref="/pm/flats"
      />
      <FlatForm
        communities={communities ?? []}
        owners={owners ?? []}
        maintenanceRate={maintenanceRate}
      />
    </div>
  );
}
